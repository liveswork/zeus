// src/components/admin/modules/PlansManager.tsx
import React, { useState, useEffect } from 'react';
import { db } from '../../../config/firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { Modal } from '../../ui/Modal';
import { FormField } from '../../ui/FormField';
import { PlusCircle, Edit, Trash2, CheckCircle } from 'lucide-react';
import { useUI } from '../../../contexts/UIContext';
import { formatCurrency } from '../../../utils/formatters';

export const PlansManager: React.FC = () => {
    const { showAlert, showConfirmation } = useUI();
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPlan, setCurrentPlan] = useState<any | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'plans'), orderBy('priceMonthly'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setPlans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleOpenModal = (plan = null) => {
        setCurrentPlan(plan);
        setIsModalOpen(true);
    };

    const handleSavePlan = async (formData: any) => {
        try {
            if (currentPlan) {
                await updateDoc(doc(db, 'plans', currentPlan.id), formData);
                showAlert("Plano atualizado com sucesso!");
            } else {
                await addDoc(collection(db, 'plans'), formData);
                showAlert("Plano criado com sucesso!");
            }
            setIsModalOpen(false);
        } catch (error) {
            showAlert("Erro ao salvar o plano.", 'error');
        }
    };

    const handleDeletePlan = (planId: string) => {
        showConfirmation("Tem certeza que deseja excluir este plano?", async () => {
            await deleteDoc(doc(db, 'plans', planId));
            showAlert("Plano excluído.");
        });
    };

    if (loading) return <p>Carregando planos...</p>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Gerenciar Planos</h1>
                <button onClick={() => handleOpenModal()} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center">
                    <PlusCircle size={20} className="mr-2" /> Novo Plano
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map(plan => (
                    <div key={plan.id} className="bg-white p-6 rounded-lg shadow-md border-t-4 border-blue-500">
                        <h3 className="text-2xl font-bold">{plan.name}</h3>
                        <p className="text-4xl font-light my-4">{formatCurrency(plan.priceMonthly)}<span className="text-lg">/mês</span></p>
                        <ul className="space-y-2 text-sm">
                            {plan.features?.map((f: string, i: number) => <li key={i} className="flex items-center"><CheckCircle size={16} className="text-green-500 mr-2"/>{f}</li>)}
                        </ul>
                        <div className="mt-6 flex justify-end space-x-2">
                           <button onClick={() => handleOpenModal(plan)} className="text-blue-600"><Edit size={18}/></button>
                           <button onClick={() => handleDeletePlan(plan.id)} className="text-red-600"><Trash2 size={18}/></button>
                        </div>
                    </div>
                ))}
            </div>
            {isModalOpen && <PlanFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSavePlan} initialData={currentPlan} />}
        </div>
    );
};

const PlanFormModal: React.FC<any> = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState({ name: '', priceMonthly: 0, description: '', features: [''], allowedBusinessTypes: [] });

    useEffect(() => {
        if(initialData) setFormData(initialData);
        else setFormData({ name: '', priceMonthly: 0, description: '', features: [''], allowedBusinessTypes: [] });
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'priceMonthly' ? parseFloat(value) : value }));
    };

    const handleFeatureChange = (index: number, value: string) => {
        const newFeatures = [...formData.features];
        newFeatures[index] = value;
        setFormData(prev => ({ ...prev, features: newFeatures }));
    };

    const addFeature = () => setFormData(prev => ({...prev, features: [...prev.features, '']}));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Editar Plano" : "Novo Plano"}>
             <form onSubmit={handleSubmit} className="space-y-4">
                 <FormField label="Nome do Plano"><input name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded" required /></FormField>
                 <FormField label="Preço Mensal (R$)"><input name="priceMonthly" type="number" step="0.01" value={formData.priceMonthly} onChange={handleChange} className="w-full p-2 border rounded" required /></FormField>
                 <FormField label="Descrição"><textarea name="description" value={formData.description} onChange={handleChange} className="w-full p-2 border rounded" rows={3} /></FormField>
                 <FormField label="Recursos">
                     {formData.features.map((feature, index) => (
                         <input key={index} value={feature} onChange={(e) => handleFeatureChange(index, e.target.value)} className="w-full p-2 border rounded mb-2" />
                     ))}
                     <button type="button" onClick={addFeature} className="text-blue-600">+ Adicionar Recurso</button>
                 </FormField>
                 <div className="flex justify-end"><button type="submit" className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">Salvar</button></div>
             </form>
        </Modal>
    )
}