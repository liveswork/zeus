import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { useAuth } from '../../../../contexts/AuthContext';
import { useBusiness } from '../../../../contexts/BusinessContext';
import { useUI } from '../../../../contexts/UIContext';
import { formatCurrency } from '../../../../utils/formatters';
import { PlusCircle, TrendingUp, BarChart2, DollarSign, Eye, Edit, Trash2 } from 'lucide-react';
import { StatCard } from '../../../ui/StatCard';
import { AdvancedCampaignFormModal, businessCampaignObjectives } from './AdvancedCampaignFormModal'; // Criaremos este em seguida

// Este será o painel principal para o dono do negócio (restaurante/loja) criar e gerenciar suas campanhas para atrair clientes e impulsionadores.

export const CampaignManager: React.FC = () => {
    const { userProfile } = useAuth();
    const { businessId } = useBusiness();
    const { showAlert, showConfirmation } = useUI();

    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isObjectiveModalOpen, setIsObjectiveModalOpen] = useState(false);
    
    const businessType = userProfile?.businessProfile?.type === 'retail' ? 'loja' : 'restaurante';

    useEffect(() => {
        if (!businessId) return;
        const q = query(collection(db, 'campaigns'), where("businessId", "==", businessId), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setCampaigns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        }, (error) => {
            console.error("Erro ao carregar campanhas:", error);
            showAlert("Erro ao carregar campanhas.", "error");
            setLoading(false);
        });
        return () => unsubscribe();
    }, [businessId, showAlert]);

    const handleObjectiveSelected = (objectiveKey: string) => {
        // Lógica para abrir o formulário de criação com o objetivo selecionado
        console.log("Objetivo selecionado:", objectiveKey);
        showAlert(`Fluxo para criar campanha com objetivo '${objectiveKey}' a ser implementado.`);
        setIsObjectiveModalOpen(false);
    };

    if (loading) {
        return <div>Carregando campanhas...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Impulso Marketing</h1>
                    <p className="text-gray-600 mt-1">Crie campanhas para atrair clientes e impulsionadores.</p>
                </div>
                <button
                    onClick={() => setIsObjectiveModalOpen(true)}
                    className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg flex items-center hover:bg-blue-700 transition shadow-lg"
                >
                    <PlusCircle size={20} className="mr-2" /> Nova Campanha
                </button>
            </div>

            {/* Cards de estatísticas de marketing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <StatCard title="Campanhas Ativas" value={campaigns.filter(c => c.status === 'active').length} icon={<TrendingUp />} color="bg-green-500" />
                 <StatCard title="Orçamento Gasto (Mês)" value={formatCurrency(0)} icon={<DollarSign />} color="bg-blue-500" />
                 <StatCard title="Vendas Geradas (Mês)" value="0" icon={<BarChart2 />} color="bg-purple-500" />
            </div>

            {/* Lista de campanhas */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                 <h3 className="text-xl font-bold text-gray-700 mb-4">Suas Campanhas</h3>
                 {campaigns.length === 0 ? (
                    <div className="text-center py-12">
                        <TrendingUp size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">Nenhuma campanha criada ainda.</p>
                    </div>
                 ) : (
                    <div className="space-y-4">
                        {campaigns.map(campaign => (
                            <div key={campaign.id} className="p-4 border rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-lg text-gray-800">{campaign.title}</p>
                                    <p className="text-sm text-gray-500">Orçamento: {formatCurrency(campaign.budget)} | Status: <span className="font-semibold">{campaign.status}</span></p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="text-blue-600 p-2 hover:bg-blue-50 rounded-full"><BarChart2 size={18} /></button>
                                    <button className="text-gray-600 p-2 hover:bg-gray-100 rounded-full"><Edit size={18} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                 )}
            </div>

            {isObjectiveModalOpen && (
                <AdvancedCampaignFormModal
                    isOpen={isObjectiveModalOpen}
                    onClose={() => setIsObjectiveModalOpen(false)}
                    onObjectiveSelect={handleObjectiveSelected}
                    objectives={businessCampaignObjectives}
                    entityType={businessType}
                />
            )}
        </div>
    );
};