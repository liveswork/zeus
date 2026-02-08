import { writeBatch, doc, collection, updateDoc, deleteDoc } from "firebase/firestore";
import { PlusCircle, AlertTriangle } from "lucide-react";
import { useState, useMemo, SetStateAction, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from "react";
import { db } from "../../../../config/firebase";
import { useBusiness } from "../../../../contexts/BusinessContext";
import { useUI } from "../../../../contexts/UIContext";
import { formatCurrency } from "../../../../utils/formatters";
import { generateInstallments } from "../../../../utils/generateInstallments";
import { FormField } from "../../../ui/FormField";
import { Modal } from "../../../ui/Modal";
import { StatCard } from "../../../ui/StatCard";
import { DebtDetailModal } from "./DebtDetailModal";
//import { formatDateForInput, round2 } from "../../../../utils/helpers";

export const DebtsManager = () => {
    const { debts, suppliers, businessId, sales } = useBusiness();
    const { showAlert, showConfirmation } = useUI();

    const [filters, setFilters] = useState({ status: 'ativa', creditor: '', dateRangeStart: '', dateRangeEnd: '' });
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [isDetailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedDebt, setSelectedDebt] = useState(null);
    const [originalRefinancedDebtId, setOriginalRefinancedDebtId] = useState(null);
    const initialFormData = {
        creditorName: '',
        description: '',
        initialAmount: 0,
        category: 'Fornecedor',
        status: 'ativa',
        installmentMethod: 'interval',
        numInstallments: 1,
        startDate: formatDateForInput(new Date()),
        intervalDays: 30,
        fixedDay: new Date().getDate(),
        manualInstallments: [{ dueDate: '', amount: 0 }],
        interestRate: 20,
        loanTermDays: 30,
        paymentFrequency: 'diario'
    };
    const [formData, setFormData] = useState(initialFormData);

    // Filtragem com range de datas para prox. vencimento (igual ao original)
    const filteredDebts = useMemo(() => {
        return (debts || []).filter((debt: { installments: any; status: string; creditorName: string; }) => {
            // find next pending installment
            const nextInstallment = (debt.installments || []).filter((p: { status: string; }) => p.status === 'pendente')
                .sort((a: { dueDate: string | number | Date; }, b: { dueDate: string | number | Date; }) => new Date(a.dueDate) - new Date(b.dueDate))[0];
            const dueDate = nextInstallment ? new Date(nextInstallment.dueDate + 'T00:00:00') : null;
            if (filters.status && filters.status !== '' && debt.status !== filters.status) return false;
            if (filters.creditor && filters.creditor !== '' && debt.creditorName !== filters.creditor) return false;
            if (filters.dateRangeStart && (!dueDate || dueDate < new Date(filters.dateRangeStart + 'T00:00:00'))) return false;
            if (filters.dateRangeEnd && (!dueDate || dueDate > new Date(filters.dateRangeEnd + 'T23:59:59'))) return false;
            return true;
        });
    }, [debts, filters]);

    // Projeções (hoje, semana, mês) — igual ao original
    const paymentProjections = useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        // endOfWeek = domingo? Vamos calcular até próximo domingo inclusive
        const endOfWeek = new Date(startOfToday);
        endOfWeek.setDate(startOfToday.getDate() + (7 - startOfToday.getDay()));
        let daily = 0, weekly = 0, monthly = 0;
        const pendingInstallments = (debts || []).filter((d: { status: string; }) => d.status === 'ativa').flatMap((d: { installments: any; }) => d.installments || []).filter((i: { status: string; }) => i.status === 'pendente');
        pendingInstallments.forEach((inst: { dueDate: string; amount: number; }) => {
            const dueDate = new Date(inst.dueDate + 'T00:00:00');
            if (dueDate >= startOfToday && dueDate < startOfTomorrow) { daily += inst.amount; }
            if (dueDate >= startOfToday && dueDate < endOfWeek) { weekly += inst.amount; }
            if (dueDate.getFullYear() === now.getFullYear() && dueDate.getMonth() === now.getMonth()) { monthly += inst.amount; }
        });
        return { daily: round2(daily), weekly: round2(weekly), monthly: round2(monthly) };
    }, [debts]);

    // filtros
    const handleFilterChange = (e: { target: { name: any; value: any; }; }) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    // abrir modal criar (com refinance)
    const handleOpenCreateModal = (refinanceData = null) => {
        if (refinanceData) {
            setOriginalRefinancedDebtId(refinanceData.id);
            setFormData({
                ...initialFormData,
                initialAmount: refinanceData.balance ?? refinanceData.currentBalance ?? 0,
                creditorName: refinanceData.creditorName,
                description: `Refinanciamento de: ${refinanceData.description || ''}`,
                category: refinanceData.category
            });
        } else {
            setOriginalRefinancedDebtId(null);
            setFormData(initialFormData);
        }
        setCreateModalOpen(true);
    };

    const handleOpenDetailModal = (debt: SetStateAction<null>) => { setSelectedDebt(debt); setDetailModalOpen(true); };
    const handleCloseCreateModal = () => { setCreateModalOpen(false); setOriginalRefinancedDebtId(null); setFormData(initialFormData); };

    const handleChange = (e: { target: { name: any; value: any; type: any; }; }) => {
        const { name, value, type } = e.target;
        let finalValue = value;
        if (type === 'number') finalValue = value === '' ? '' : (value.includes('.') ? parseFloat(value) : parseInt(value, 10));
        const newFormData = { ...formData, [name]: finalValue };

        // ajustar manualInstallments quando numInstallments muda e método manual ativo
        if (name === 'numInstallments' && newFormData.installmentMethod === 'manual') {
            const num = parseInt(value, 10) || 1;
            const currentManual = Array.isArray(newFormData.manualInstallments) ? newFormData.manualInstallments : [];
            if (num > currentManual.length) {
                const diff = num - currentManual.length;
                const newItems = Array(diff).fill({ dueDate: '', amount: 0 });
                newFormData.manualInstallments = [...currentManual, ...newItems];
            } else {
                newFormData.manualInstallments = currentManual.slice(0, num);
            }
        }

        // se trocar para método manual e manualInstallments vazio, inicializa
        if (name === 'installmentMethod' && value === 'manual' && (!newFormData.manualInstallments || newFormData.manualInstallments.length === 0)) {
            newFormData.manualInstallments = [{ dueDate: '', amount: 0 }];
        }

        setFormData(newFormData);
    };

    const handleManualInstallmentFieldChange = (index: number, field: string, value: string) => {
        const updated = Array.isArray(formData.manualInstallments) ? [...formData.manualInstallments] : [];
        const val = field === 'amount' ? (value === '' ? 0 : parseFloat(value)) : value;
        updated[index] = { ...updated[index], [field]: val };
        setFormData(prev => ({ ...prev, manualInstallments: updated }));
    };

    // ----------------------- CRUD / ações -----------------------
    const handleSubmitNewDebt = async (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        const generatedInstallments = generateInstallments(formData, Number(formData.initialAmount || 0), showAlert);
        if (!generatedInstallments || generatedInstallments.length === 0) return;
        const totalAmount = generatedInstallments.reduce((sum, inst) => sum + Number(inst.amount || 0), 0);

        const newDebt = {
            ...formData,
            installments: generatedInstallments,
            currentBalance: round2(totalAmount),
            status: 'ativa',
            createdAt: new Date().toISOString(),
            businessId: businessId
        };

        try {
            const batch = writeBatch(db);
            const newDebtRef = doc(collection(db, "debts"));
            batch.set(newDebtRef, newDebt);
            if (originalRefinancedDebtId) {
                const oldDebtRef = doc(db, 'debts', originalRefinancedDebtId);
                batch.update(oldDebtRef, { status: 'refinanciada' });
            }
            await batch.commit();
            showAlert(originalRefinancedDebtId ? "Dívida refinanciada com sucesso!" : "Dívida criada com sucesso!");
            handleCloseCreateModal();
        } catch (error) {
            console.error("Erro ao salvar dívida: ", error);
            showAlert("Não foi possível salvar a dívida.");
        }
    };

    const handleMarkAsPaid = async (debtId: string, installmentId: any) => {
        const debtToUpdate = (debts || []).find((d: { id: any; }) => d.id === debtId);
        if (!debtToUpdate) return;
        const installmentToPay = (debtToUpdate.installments || []).find((p: { id: any; }) => p.id === installmentId);
        if (!installmentToPay) return;

        const updatedInstallments = (debtToUpdate.installments || []).map((p: { id: any; }) => 
            p.id === installmentId ? { ...p, status: 'paga', paidDate: formatDateForInput(new Date()) } : p
        );
        const newCurrentBalance = round2(Number(debtToUpdate.currentBalance || 0) - Number(installmentToPay.amount || 0));
        const debtStatus = newCurrentBalance > 0.005 ? 'ativa' : 'paga';

        try {
            await updateDoc(doc(db, 'debts', debtId), { installments: updatedInstallments, currentBalance: newCurrentBalance, status: debtStatus });
            showAlert("Parcela marcada como paga!");
            if (selectedDebt && selectedDebt.id === debtId) {
                setSelectedDebt(prev => ({ ...prev, installments: updatedInstallments, currentBalance: newCurrentBalance, status: debtStatus }));
            }
        } catch (error) {
            console.error("Erro ao pagar parcela:", error);
            showAlert("Erro ao atualizar a parcela.");
        }
    };

    const handleUpdateDebt = async (debtId: string, data: null) => {
        try {
            await updateDoc(doc(db, 'debts', debtId), data);
            showAlert("Dívida atualizada com sucesso!");
            if (selectedDebt && selectedDebt.id === debtId) {
                setSelectedDebt(prev => ({ ...prev, ...data }));
            }
        } catch (e) {
            console.error("Erro ao atualizar dívida:", e);
            showAlert("Falha ao atualizar a dívida.");
        }
    };

    const handleDelete = (id: string) => {
        showConfirmation('Tem certeza que deseja excluir esta dívida e todo o seu histórico?', async () => {
            try {
                await deleteDoc(doc(db, 'debts', id));
                showAlert("Dívida deletada com sucesso.");
                setDetailModalOpen(false);
            } catch (error) {
                console.error("Erro ao deletar dívida: ", error);
                showAlert("Não foi possível deletar a dívida.");
            }
        });
    };

    const handleRefinance = (debt: { currentBalance: number; id: any; creditorName: any; description: any; category: any; }) => {
        showConfirmation(`Deseja refinanciar o saldo de ${formatCurrency(debt.currentBalance)}? A dívida atual será marcada como 'refinanciada' e uma nova será criada com este valor.`, () => {
            setDetailModalOpen(false);
            handleOpenCreateModal({ id: debt.id, balance: debt.currentBalance, creditorName: debt.creditorName, description: debt.description, category: debt.category });
        });
    };

    const getStatusClass = (status: string) => {
        if (status === 'paga') return 'bg-green-100 text-green-800';
        if (status === 'refinanciada') return 'bg-blue-100 text-blue-800';
        if (status === 'ativa') return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    };

    const nextInstallmentDate = (debt: { status: string; installments: any; }) => {
        if (debt.status !== 'ativa') return 'N/A';
        const next = (debt.installments || []).filter((p: { status: string; }) => p.status === 'pendente').sort((a: { dueDate: string | number | Date; }, b: { dueDate: string | number | Date; }) => new Date(a.dueDate) - new Date(b.dueDate))[0];
        return next ? new Date(next.dueDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Quitada';
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Gerenciador de Dívidas</h1>
                <button onClick={() => handleOpenCreateModal()} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center hover:bg-blue-700 transition">
                    <PlusCircle size={20} className="mr-2" /> Nova Dívida
                </button>
            </div>

            {/* Alerts financeiros (ex.: se você calcula financialAlerts a partir de sales) */}
            {/* Se você já possui financialAlerts, pode manter a exibição original. */}
            {false && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded-md shadow-md">
                    <div className="flex items-center">
                        <AlertTriangle size={24} className="mr-3" />
                        <div>
                            <p className="font-bold">Alerta de Saúde Financeira!</p>
                            <p className="text-sm">Seus pagamentos estão consumindo uma alta porcentagem de suas vendas.</p>
                        </div>
                    </div>
                </div>
            )}

            <div>
                <h2 className="text-xl font-bold text-gray-700 mb-4">Projeções de Pagamentos</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard title="A Pagar Hoje" value={formatCurrency(paymentProjections.daily)} icon={<AlertTriangle size={20} className="text-white" />} color="bg-red-500" />
                    <StatCard title="A Pagar nesta Semana" value={formatCurrency(paymentProjections.weekly)} icon={<AlertTriangle size={20} className="text-white" />} color="bg-orange-500" />
                    <StatCard title="A Pagar neste Mês" value={formatCurrency(paymentProjections.monthly)} icon={<AlertTriangle size={20} className="text-white" />} color="bg-yellow-500" />
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField label="Filtrar por Status">
                        <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full p-2 border rounded bg-white">
                            <option value="">Todos</option>
                            <option value="ativa">Ativa</option>
                            <option value="paga">Paga</option>
                            <option value="refinanciada">Refinanciada</option>
                        </select>
                    </FormField>
                    <FormField label="Filtrar por Credor">
                        <select name="creditor" value={filters.creditor} onChange={handleFilterChange} className="w-full p-2 border rounded bg-white">
                            <option value="">Todos</option>
                            {(suppliers || []).map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                    </FormField>
                    <FormField label="Vencimento De">
                        <input type="date" name="dateRangeStart" value={filters.dateRangeStart} onChange={handleFilterChange} className="w-full p-2 border rounded" />
                    </FormField>
                    <FormField label="Vencimento Até">
                        <input type="date" name="dateRangeEnd" value={filters.dateRangeEnd} onChange={handleFilterChange} className="w-full p-2 border rounded" />
                    </FormField>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">Credor / Descrição</th>
                                <th className="px-6 py-3">Saldo Devedor</th>
                                <th className="px-6 py-3">Próx. Venc.</th>
                                <th className="px-6 py-3 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDebts.map((debt: { id: Key | null | undefined; creditorName: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | Iterable<ReactNode> | null | undefined; description: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | Iterable<ReactNode> | null | undefined; currentBalance: number; status: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | Iterable<ReactNode> | null | undefined; }) => (
                                <tr key={debt.id} className="bg-white border-b hover:bg-gray-50 cursor-pointer" onClick={() => handleOpenDetailModal(debt)}>
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        {debt.creditorName}
                                        <p className="text-xs text-gray-500">{debt.description}</p>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-red-600">{formatCurrency(debt.currentBalance)}</td>
                                    <td className="px-6 py-4">{nextInstallmentDate(debt)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(debt.status)}`}>{debt.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isDetailModalOpen && selectedDebt && (
                <DebtDetailModal
                    isOpen={isDetailModalOpen}
                    onClose={() => setDetailModalOpen(false)}
                    debt={selectedDebt}
                    onMarkAsPaid={handleMarkAsPaid}
                    onDelete={handleDelete}
                    onRefinance={handleRefinance}
                    onUpdate={handleUpdateDebt}
                    suppliers={suppliers}
                />
            )}

            {isCreateModalOpen && (
                <Modal isOpen={isCreateModalOpen} onClose={handleCloseCreateModal} title={originalRefinancedDebtId ? 'Refinanciar Dívida' : 'Adicionar Nova Dívida'} size="4xl">
                    <form onSubmit={handleSubmitNewDebt} className="space-y-6">
                        <div className="p-4 border rounded-lg bg-white">
                            <h3 className="font-bold text-lg mb-4 text-gray-700">1. Informações da Dívida</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField label="Credor">
                                    <select name="creditorName" value={formData.creditorName} onChange={handleChange} className="w-full p-2 border rounded bg-white" required>
                                        <option value="" disabled>Selecione um fornecedor</option>
                                        {(suppliers || []).map(supplier => (<option key={supplier.id} value={supplier.name}>{supplier.name}</option>))}
                                    </select>
                                </FormField>
                                <FormField label="Descrição">
                                    <input name="description" value={formData.description} onChange={handleChange} className="w-full p-2 border rounded" required />
                                </FormField>
                                <FormField label="Categoria">
                                    <select name="category" value={formData.category} onChange={handleChange} className="w-full p-2 border rounded bg-white">
                                        <option value="Fornecedor">Fornecedor</option>
                                        <option value="Agiota">Crédito Facilitado</option>
                                        <option value="Banco">Banco</option>
                                        <option value="Aluguel">Aluguel</option>
                                        <option value="Outros">Outros</option>
                                    </select>
                                </FormField>
                                <FormField label="Data de Início">
                                    <input name="startDate" type="date" value={formData.startDate} onChange={handleChange} className="w-full p-2 border rounded" />
                                </FormField>
                            </div>
                        </div>

                        <div className="p-4 border rounded-lg bg-white">
                            <h3 className="font-bold text-lg mb-4 text-gray-700">2. Detalhes de Pagamento</h3>

                            {formData.category === 'Agiota' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-red-50 p-4 rounded-lg">
                                    <FormField label="Valor Empréstimo">
                                        <input name="initialAmount" type="number" value={formData.initialAmount} onChange={handleChange} className="w-full p-2 border rounded" />
                                    </FormField>
                                    <FormField label="Juros (%)">
                                        <input name="interestRate" type="number" value={formData.interestRate} onChange={handleChange} className="w-full p-2 border rounded" />
                                    </FormField>
                                    <FormField label="Prazo (dias)">
                                        <input name="loanTermDays" type="number" value={formData.loanTermDays} onChange={handleChange} className="w-full p-2 border rounded" />
                                    </FormField>
                                    <FormField label="Frequência">
                                        <select name="paymentFrequency" value={formData.paymentFrequency} onChange={handleChange} className="w-full p-2 border rounded bg-white">
                                            <option value="diario">Diário</option>
                                            <option value="semanal">Semanal</option>
                                            <option value="mensal">Mensal</option>
                                        </select>
                                    </FormField>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <FormField label="Valor Total da Dívida">
                                        <input name="initialAmount" type="number" step="0.01" value={formData.initialAmount} onChange={handleChange} className="w-full md:w-1/2 p-2 border rounded" required />
                                    </FormField>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <FormField label="Nº de Parcelas">
                                            <input name="numInstallments" type="number" min="1" value={formData.numInstallments} onChange={handleChange} className="w-full p-2 border rounded" />
                                        </FormField>
                                        <FormField label="Método Venc.">
                                            <select name="installmentMethod" value={formData.installmentMethod} onChange={handleChange} className="w-full p-2 border rounded bg-white">
                                                <option value="interval">Intervalo de Dias</option>
                                                <option value="fixedDay">Dia Fixo no Mês</option>
                                                <option value="manual">Manual</option>
                                            </select>
                                        </FormField>
                                        {formData.installmentMethod === 'interval' && <FormField label="Intervalo (dias)"><input name="intervalDays" type="number" min="1" value={formData.intervalDays} onChange={handleChange} className="w-full p-2 border rounded" /></FormField>}
                                        {formData.installmentMethod === 'fixedDay' && <FormField label="Dia Fixo"><input name="fixedDay" type="number" min="1" max="31" value={formData.fixedDay} onChange={handleChange} className="w-full p-2 border rounded" /></FormField>}
                                    </div>

                                    {formData.installmentMethod === 'manual' && (
                                        <div className="mt-4 border-t pt-4">
                                            <h4 className="font-semibold text-md mb-2">Definir Parcelas Manualmente</h4>
                                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                                {formData.manualInstallments.map((inst, index) => (
                                                    <div key={index} className="grid grid-cols-10 gap-2 items-center">
                                                        <span className="font-bold col-span-2">Parcela {index + 1}</span>
                                                        <div className="col-span-4">
                                                            <input type="date" value={inst.dueDate} onChange={(e) => handleManualInstallmentFieldChange(index, 'dueDate', e.target.value)} className="w-full p-2 border rounded" />
                                                        </div>
                                                        <div className="col-span-4">
                                                            <input type="number" step="0.01" placeholder="Valor" value={inst.amount || ''} onChange={(e) => handleManualInstallmentFieldChange(index, 'amount', e.target.value)} className="w-full p-2 border rounded" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end space-x-4 pt-4">
                            <button type="button" onClick={handleCloseCreateModal} className="bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-400">Cancelar</button>
                            <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">Salvar Dívida</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};
