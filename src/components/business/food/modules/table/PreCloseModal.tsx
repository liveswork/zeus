import React, { useState, useMemo, useEffect } from 'react';
import { Modal } from '../../../../ui/Modal';
import { Users } from 'lucide-react';
import { formatCurrency } from '../../../../../utils/formatters';
import { Order } from '../../../../../types';

interface PreCloseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPrint: (printData: any) => void;
    order: Order | null; // A prop pode ser nula
}

export const PreCloseModal: React.FC<PreCloseModalProps> = ({ isOpen, onClose, onPrint, order }) => {
    // Os hooks agora são sempre chamados, respeitando as regras do React.
    const [people, setPeople] = useState(1);
    const [includeServiceFee, setIncludeServiceFee] = useState(true);

    useEffect(() => {
        // Reseta o estado interno quando o modal é aberto
        if (isOpen) {
            setPeople(1);
            setIncludeServiceFee(true);
        }
    }, [isOpen]);

    // --- CORREÇÃO APLICADA AQUI ---
    // Os cálculos agora verificam se 'order' existe antes de tentar acessá-lo.
    const serviceFee = useMemo(() => {
        if (!order) return 0;
        return includeServiceFee ? (order.totalAmount || 0) * 0.10 : 0;
    }, [includeServiceFee, order]);

    const finalTotal = (order?.totalAmount || 0) + serviceFee;
    const totalPerPerson = people > 0 ? finalTotal / people : 0;

    const handlePrint = () => {
        if (!order) return; // Guarda de segurança
        const printData = {
            ...order,
            serviceFee,
            finalAmount: finalTotal
        };
        onPrint(printData);
        onClose();
    };
    
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                handlePrint();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, order, people, includeServiceFee]); // Adicionando dependências para garantir que a função use os valores mais recentes

    // O componente Modal já lida com a renderização condicional baseada em `isOpen`.
    // Não precisamos retornar `null` aqui.
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Pré-Fechamento - ${order?.tableName || ''}`} size="lg">
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pessoas na mesa</label>
                        <div className="relative">
                             <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                             <input type="number" value={people} onChange={e => setPeople(Math.max(1, Number(e.target.value)))} className="w-full pl-10 p-3 border rounded-lg text-center font-bold text-xl" autoFocus />
                        </div>
                    </div>
                     <div className="flex items-end pb-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                             <input type="checkbox" checked={includeServiceFee} onChange={e => setIncludeServiceFee(e.target.checked)} className="h-5 w-5 rounded text-blue-600" />
                             <span className="font-semibold">Incluir 10% de serviço?</span>
                        </label>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-2 border">
                    <div className="flex justify-between"><span className="text-gray-600">Subtotal Produtos:</span> <span className="font-semibold">{formatCurrency(order?.totalAmount || 0)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Taxa de Serviço (10%):</span> <span className="font-semibold">{formatCurrency(serviceFee)}</span></div>
                    <div className="flex justify-between text-2xl font-bold border-t pt-2 mt-2"><span className="text-gray-800">Total:</span> <span className="text-blue-600">{formatCurrency(finalTotal)}</span></div>
                    {people > 1 && <div className="flex justify-between text-lg font-semibold text-green-600"><span >Total por Pessoa:</span> <span>{formatCurrency(totalPerPerson)}</span></div>}
                </div>

                <div className="flex justify-end pt-4 border-t">
                    <button onClick={handlePrint} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700">Imprimir Conta (Enter)</button>
                </div>
            </div>
        </Modal>
    );
};