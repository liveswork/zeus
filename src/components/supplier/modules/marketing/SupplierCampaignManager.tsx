import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { useAuth } from '../../../../contexts/AuthContext';
import { useUI } from '../../../../contexts/UIContext';
import { formatCurrency } from '../../../../utils/formatters';
import { PlusCircle, TrendingUp, BarChart2, DollarSign, Eye, Edit } from 'lucide-react';
import { StatCard } from '../../../ui/StatCard';
import { AdvancedCampaignFormModal, supplierCampaignObjectives } from '../../../business/modules/marketing/AdvancedCampaignFormModal';
import { SupplierCampaignFormModal } from './SupplierCampaignFormModal';
import { CampaignAnalyticsModal } from './CampaignAnalyticsModal';

// Este será o painel principal onde o fornecedor gerencia suas campanhas de marketing.

export const SupplierCampaignManager: React.FC = () => {
    const { userProfile } = useAuth();
    const { showAlert, showConfirmation } = useUI();

    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isObjectiveModalOpen, setIsObjectiveModalOpen] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
    const [currentCampaign, setCurrentCampaign] = useState<any | null>(null);
    const [selectedCampaignForAnalytics, setSelectedCampaignForAnalytics] = useState<any | null>(null);
    
    const supplierId = userProfile?.supplierId;

    useEffect(() => {
        if (!supplierId) return;
        const q = query(collection(db, 'supplierCampaigns'), where("supplierId", "==", supplierId), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setCampaigns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        }, (error) => {
            console.error("Erro ao carregar campanhas de fornecedor:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [supplierId]);

    const handleOpenModal = (campaign = null) => {
        setCurrentCampaign(campaign);
        if (campaign) {
            setIsFormModalOpen(true);
        } else {
            setIsObjectiveModalOpen(true);
        }
    };
    
    const handleObjectiveSelected = (objectiveKey: string) => {
        const initialData = { campaignObjective: objectiveKey, billingModel: objectiveKey === 'low_stock_alert' ? 'cpc' : 'cpm' };
        setCurrentCampaign(initialData);
        setIsObjectiveModalOpen(false);
        setIsFormModalOpen(true);
    };

    const handleSaveCampaign = async (formData: any) => {
        if (!supplierId || !userProfile?.companyName) {
            showAlert("Perfil do fornecedor incompleto.", "error");
            return;
        }

        const campaignData = {
            ...formData,
            supplierId: supplierId,
            supplierName: userProfile.companyName,
            status: 'active',
            remainingBudget: formData.budget,
            analyticsSummary: { totalImpressions: 0, uniqueImpressions: 0, totalClicks: 0, uniqueClicks: 0, ctr: 0 }
        };

        try {
            if (currentCampaign?.id) {
                const campaignRef = doc(db, 'supplierCampaigns', currentCampaign.id);
                await updateDoc(campaignRef, formData);
                showAlert("Campanha atualizada com sucesso!");
            } else {
                await addDoc(collection(db, 'supplierCampaigns'), {
                    ...campaignData,
                    createdAt: serverTimestamp(),
                });
                showAlert("Sua campanha de marketing foi ativada com sucesso!");
            }
            setIsFormModalOpen(false);
        } catch (error) {
            console.error("Erro ao salvar campanha:", error);
            showAlert("Ocorreu um erro ao salvar a campanha.", "error");
        }
    };

    const handleOpenAnalytics = (campaign: any) => {
        setSelectedCampaignForAnalytics(campaign);
        setIsAnalyticsModalOpen(true);
    };

    if (loading) {
        return <div>Carregando...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Impulso Marketing (Fornecedor)</h1>
                    <p className="text-gray-600 mt-1">Anuncie seus produtos para o ecossistema FoodPDV.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-purple-600 text-white font-bold py-3 px-6 rounded-lg flex items-center hover:bg-purple-700 transition shadow-lg"
                >
                    <PlusCircle size={20} className="mr-2" /> Nova Campanha
                </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                 <h3 className="text-xl font-bold text-gray-700 mb-4">Suas Campanhas</h3>
                 {campaigns.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Nenhuma campanha criada.</p>
                    </div>
                 ) : (
                    <div className="space-y-4">
                        {campaigns.map(campaign => (
                            <div key={campaign.id} className="p-4 border rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-lg text-gray-800">{campaign.title}</p>
                                    <p className="text-sm text-gray-500">Orçamento Restante: {formatCurrency(campaign.remainingBudget || 0)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleOpenAnalytics(campaign)} className="text-blue-600 p-2 hover:bg-blue-50 rounded-full"><BarChart2 size={18} /></button>
                                    <button onClick={() => handleOpenModal(campaign)} className="text-gray-600 p-2 hover:bg-gray-100 rounded-full"><Edit size={18} /></button>
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
                    objectives={supplierCampaignObjectives}
                    entityType="supplier"
                />
            )}

            {isFormModalOpen && (
                <SupplierCampaignFormModal
                    isOpen={isFormModalOpen}
                    onClose={() => setIsFormModalOpen(false)}
                    onSave={handleSaveCampaign}
                    initialData={currentCampaign}
                    showAlert={showAlert}
                />
            )}

            {isAnalyticsModalOpen && (
                 <CampaignAnalyticsModal
                    isOpen={isAnalyticsModalOpen}
                    onClose={() => setIsAnalyticsModalOpen(false)}
                    campaign={selectedCampaignForAnalytics}
                />
            )}
        </div>
    );
};