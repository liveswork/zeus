import React, { useState, useEffect } from 'react';
import { 
    Plus, Edit, Trash2, Check, X, Star, 
    Shield, Zap, Layout, Loader 
} from 'lucide-react';
import { 
    collection, addDoc, getDocs, updateDoc, 
    deleteDoc, doc, query, orderBy 
} from 'firebase/firestore';
import { db } from '../../../config/firebase'; // Ajuste o caminho se necessário
import { Modal } from '../../../components/ui/Modal'; // Reutilizando seu Modal
import { FormField } from '../../../components/ui/FormField'; // Reutilizando seu FormField

// Tipagem do Plano
interface Plan {
    id?: string;
    name: string;
    description: string;
    price: number;
    interval: 'monthly' | 'yearly';
    features: string[];
    active: boolean;
    recommended: boolean;
    type: 'retail' | 'food' | 'enterprise'; // Segmento alvo
}

export const PlansManager: React.FC = () => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [processing, setProcessing] = useState(false);

    // Estado do Formulário
    const [formData, setFormData] = useState<Plan>({
        name: '',
        description: '',
        price: 0,
        interval: 'monthly',
        features: [],
        active: true,
        recommended: false,
        type: 'retail'
    });

    // Estado para adicionar nova feature no form
    const [newFeature, setNewFeature] = useState('');

    // --- CARREGAR PLANOS (READ) ---
    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'plans'), orderBy('price', 'asc'));
            const snapshot = await getDocs(q);
            const plansData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Plan[];
            setPlans(plansData);
        } catch (error) {
            console.error("Erro ao buscar planos:", error);
            alert("Erro ao carregar planos. Verifique o console.");
        } finally {
            setLoading(false);
        }
    };

    // --- MANIPULAÇÃO DO FORMULÁRIO ---
    const handleOpenModal = (plan?: Plan) => {
        if (plan) {
            setEditingPlan(plan);
            setFormData(plan);
        } else {
            setEditingPlan(null);
            setFormData({
                name: '',
                description: '',
                price: 0,
                interval: 'monthly',
                features: [],
                active: true,
                recommended: false,
                type: 'retail'
            });
        }
        setIsModalOpen(true);
    };

    const handleAddFeature = () => {
        if (newFeature.trim()) {
            setFormData(prev => ({
                ...prev,
                features: [...prev.features, newFeature.trim()]
            }));
            setNewFeature('');
        }
    };

    const handleRemoveFeature = (index: number) => {
        setFormData(prev => ({
            ...prev,
            features: prev.features.filter((_, i) => i !== index)
        }));
    };

    // --- SALVAR (CREATE / UPDATE) ---
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        try {
            if (editingPlan && editingPlan.id) {
                // Update
                const planRef = doc(db, 'plans', editingPlan.id);
                await updateDoc(planRef, { ...formData });
            } else {
                // Create
                await addDoc(collection(db, 'plans'), formData);
            }
            setIsModalOpen(false);
            fetchPlans(); // Recarrega a lista
        } catch (error) {
            console.error("Erro ao salvar plano:", error);
            alert("Erro ao salvar.");
        } finally {
            setProcessing(false);
        }
    };

    // --- DELETAR ---
    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este plano?")) return;
        
        try {
            await deleteDoc(doc(db, 'plans', id));
            setPlans(plans.filter(p => p.id !== id));
        } catch (error) {
            console.error("Erro ao deletar:", error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Planos de Assinatura</h1>
                    <p className="text-gray-500">Configure os pacotes disponíveis no Nexus OS</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()} 
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center hover:bg-blue-700 transition"
                >
                    <Plus size={20} className="mr-2" /> Novo Plano
                </button>
            </div>

            {/* Lista de Planos (Grid) */}
            {loading ? (
                <div className="flex justify-center py-20"><Loader className="animate-spin text-blue-600" size={40} /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {plans.map(plan => (
                        <div key={plan.id} className={`bg-white border-2 rounded-xl p-6 relative flex flex-col ${plan.recommended ? 'border-purple-500 shadow-lg' : 'border-gray-100 shadow-sm'}`}>
                            {plan.recommended && (
                                <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg flex items-center gap-1">
                                    <Star size={12} fill="white" /> RECOMENDADO
                                </div>
                            )}

                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-gray-800">{plan.name}</h3>
                                <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${plan.type === 'food' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {plan.type}
                                </span>
                            </div>

                            <div className="mb-6">
                                <div className="flex items-end">
                                    <span className="text-3xl font-bold text-gray-900">R$ {plan.price}</span>
                                    <span className="text-gray-500 mb-1 ml-1">/ {plan.interval === 'monthly' ? 'mês' : 'ano'}</span>
                                </div>
                                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{plan.description}</p>
                            </div>

                            <div className="flex-1 space-y-3 mb-6">
                                {plan.features.slice(0, 5).map((feature, idx) => (
                                    <div key={idx} className="flex items-start text-sm text-gray-600">
                                        <Check size={16} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                        <span>{feature}</span>
                                    </div>
                                ))}
                                {plan.features.length > 5 && (
                                    <p className="text-xs text-gray-400 pl-6">+ {plan.features.length - 5} benefícios</p>
                                )}
                            </div>

                            <div className="flex gap-2 mt-auto pt-4 border-t border-gray-100">
                                <button 
                                    onClick={() => handleOpenModal(plan)}
                                    className="flex-1 py-2 bg-gray-50 text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition border border-gray-200"
                                >
                                    Editar
                                </button>
                                <button 
                                    onClick={() => plan.id && handleDelete(plan.id)}
                                    className="p-2 bg-white text-red-500 border border-red-100 rounded-lg hover:bg-red-50 transition"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Criação/Edição */}
            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                title={editingPlan ? "Editar Plano" : "Criar Novo Plano"}
                maxWidth="max-w-2xl"
            >
                <form onSubmit={handleSave} className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Nome do Plano">
                            <input 
                                className="w-full border p-2 rounded-lg" 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                placeholder="Ex: Premium Varejo" 
                                required 
                            />
                        </FormField>
                        <FormField label="Segmento">
                            <select 
                                className="w-full border p-2 rounded-lg" 
                                value={formData.type} 
                                onChange={e => setFormData({...formData, type: e.target.value as any})}
                            >
                                <option value="retail">Varejo / Loja</option>
                                <option value="food">Alimentação / Food</option>
                                <option value="enterprise">Corporativo</option>
                            </select>
                        </FormField>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Preço (R$)">
                            <input 
                                type="number" 
                                step="0.01"
                                className="w-full border p-2 rounded-lg font-bold" 
                                value={formData.price} 
                                onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                                required 
                            />
                        </FormField>
                        <FormField label="Cobrança">
                            <select 
                                className="w-full border p-2 rounded-lg" 
                                value={formData.interval} 
                                onChange={e => setFormData({...formData, interval: e.target.value as any})}
                            >
                                <option value="monthly">Mensal</option>
                                <option value="yearly">Anual</option>
                            </select>
                        </FormField>
                    </div>

                    <FormField label="Descrição Curta">
                        <textarea 
                            className="w-full border p-2 rounded-lg h-20 resize-none" 
                            value={formData.description} 
                            onChange={e => setFormData({...formData, description: e.target.value})}
                            placeholder="Resumo do plano..."
                        />
                    </FormField>

                    {/* Gestão de Features */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Lista de Benefícios</label>
                        <div className="flex gap-2 mb-4">
                            <input 
                                className="flex-1 border p-2 rounded-lg" 
                                value={newFeature} 
                                onChange={e => setNewFeature(e.target.value)}
                                placeholder="Ex: Suporte 24h, 5 Usuários..."
                                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                            />
                            <button 
                                type="button" 
                                onClick={handleAddFeature}
                                className="bg-green-600 text-white px-4 rounded-lg font-bold"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                        <ul className="space-y-2 max-h-40 overflow-y-auto">
                            {formData.features.map((feat, idx) => (
                                <li key={idx} className="flex justify-between items-center bg-white p-2 rounded border shadow-sm text-sm">
                                    <span className="flex items-center gap-2"><Check size={14} className="text-green-500"/> {feat}</span>
                                    <button type="button" onClick={() => handleRemoveFeature(idx)} className="text-red-500 hover:text-red-700"><X size={16}/></button>
                                </li>
                            ))}
                            {formData.features.length === 0 && <li className="text-gray-400 text-sm text-center italic">Nenhum benefício adicionado.</li>}
                        </ul>
                    </div>

                    {/* Toggles */}
                    <div className="flex gap-6">
                        <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-4 py-2 rounded-lg border">
                            <input 
                                type="checkbox" 
                                checked={formData.active} 
                                onChange={e => setFormData({...formData, active: e.target.checked})}
                                className="w-5 h-5 text-blue-600 rounded"
                            />
                            <span className="font-bold text-gray-700">Plano Ativo</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer bg-purple-50 px-4 py-2 rounded-lg border border-purple-200">
                            <input 
                                type="checkbox" 
                                checked={formData.recommended} 
                                onChange={e => setFormData({...formData, recommended: e.target.checked})}
                                className="w-5 h-5 text-purple-600 rounded"
                            />
                            <span className="font-bold text-purple-700 flex items-center gap-1"><Star size={16} fill="currentColor" /> Recomendado</span>
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button 
                            type="button" 
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            disabled={processing}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2"
                        >
                            {processing && <Loader className="animate-spin" size={18} />}
                            Salvar Plano
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};