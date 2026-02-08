import React from 'react';
import { Modal } from '../../../ui/Modal';
import { StatCard } from '../../../ui/StatCard';
import { formatCurrency } from '../../../../utils/formatters';
import { Eye, Zap, TrendingUp, DollarSign } from 'lucide-react';

// Este é o modal que exibirá as métricas de performance de uma campanha. É um componente reutilizável.

interface CampaignAnalyticsModalProps {
    isOpen: boolean;
    onClose: () => void;
    campaign: any;
}

export const CampaignAnalyticsModal: React.FC<CampaignAnalyticsModalProps> = ({ isOpen, onClose, campaign }) => {
    if (!isOpen || !campaign) return null;

    const summary = campaign.analyticsSummary || { totalImpressions: 0, totalClicks: 0, ctr: 0 };
    const budgetSpent = campaign.budget - (campaign.remainingBudget || campaign.budget);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Análise da Campanha: ${campaign.title}`} size="4xl">
            <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Visualizações" value={summary.totalImpressions.toLocaleString('pt-BR')} icon={<Eye />} color="bg-blue-500" />
                    <StatCard title="Cliques" value={summary.totalClicks.toLocaleString('pt-BR')} icon={<Zap />} color="bg-green-500" />
                    <StatCard title="Taxa de Cliques (CTR)" value={`${summary.ctr}%`} icon={<TrendingUp />} color="bg-yellow-500" />
                    <StatCard title="Orçamento Gasto" value={formatCurrency(budgetSpent)} icon={<DollarSign />} color="bg-red-500" />
                </div>
                <div className="bg-gray-50 p-6 rounded-lg text-center">
                    <p className="text-gray-600">Gráficos de performance e análise de público estarão disponíveis aqui em breve.</p>
                </div>
            </div>
        </Modal>
    );
};