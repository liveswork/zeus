import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs, limit } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { useAuth } from '../../../../contexts/AuthContext';
import { useUI } from '../../../../contexts/UIContext';
import { formatCurrency } from '../../../../utils/formatters';
import { StatCard } from '../../../ui/StatCard';
import { DollarSign, Award } from 'lucide-react';

// Este é o painel principal do afiliado, onde ele vê seu saldo e as campanhas disponíveis.

// Simplesmente importando para este exemplo, mas idealmente seria um componente compartilhado
import { businessCampaignObjectives, supplierCampaignObjectives } from '../../../business/modules/marketing/AdvancedCampaignFormModal';

// O AffiliateHub será simples por enquanto, apenas listando campanhas
export const AffiliateHub: React.FC = () => {
    const { userProfile } = useAuth();
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                const businessCampaignsQuery = query(collection(db, 'campaigns'), where("status", "==", "active"), limit(10));
                const supplierCampaignsQuery = query(collection(db, 'supplierCampaigns'), where("status", "==", "active"), limit(10));

                const [businessSnapshot, supplierSnapshot] = await Promise.all([
                    getDocs(businessCampaignsQuery),
                    getDocs(supplierCampaignsQuery)
                ]);

                const businessCampaigns = businessSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'business' }));
                const supplierCampaigns = supplierSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'supplier' }));

                setCampaigns([...businessCampaigns, ...supplierCampaigns]);
            } catch (error) {
                console.error("Erro ao buscar campanhas:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCampaigns();
    }, []);


    if (loading) {
        return <p>Carregando campanhas...</p>
    }

    return (
        <div className="space-y-6">
             <h1 className="text-3xl font-bold text-gray-800">Painel do Impulsionador</h1>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <StatCard title="Seu Saldo Atual" value={formatCurrency(userProfile?.affiliateBalance || 0)} icon={<DollarSign />} color="bg-green-500" />
                 <StatCard title="Seu Score" value={userProfile?.impulsionadorScore?.final || 10} icon={<Award />} color="bg-yellow-500" />
                 <button className="bg-blue-500 text-white p-6 rounded-lg shadow-md flex items-center justify-center font-bold text-lg hover:bg-blue-600">
                     Solicitar Saque
                 </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-700 mb-4">Campanhas Disponíveis</h3>
                 {campaigns.length === 0 ? (
                    <p className="text-center py-8 text-gray-500">Nenhuma campanha disponível no momento.</p>
                 ) : (
                    <div className="space-y-4">
                        {campaigns.map(campaign => (
                            <div key={campaign.id} className="p-4 border rounded-lg">
                                <p className="font-bold text-lg">{campaign.title}</p>
                                <p className="text-sm text-gray-500">de {campaign.businessName || campaign.supplierName}</p>
                                <button className="mt-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg text-sm">
                                    Copiar Link de Divulgação
                                </button>
                            </div>
                        ))}
                    </div>
                 )}
            </div>
        </div>
    );
};