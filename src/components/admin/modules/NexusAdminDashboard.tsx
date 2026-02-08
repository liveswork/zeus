// src/components/admin/modules/NexusAdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { functions } from '../../../config/firebase';
import { httpsCallable } from 'firebase/functions';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Zap, CheckCircle, XCircle, DollarSign, TrendingUp } from 'lucide-react';
import { StatCard } from '../../ui/StatCard';
import { formatCurrency } from '../../../utils/formatters';

const getNexusDashboardStats = httpsCallable(functions, 'getNexusDashboardStats');

export const NexusAdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const result = await getNexusDashboardStats();
                setStats(result.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div>Carregando painel Nexus...</div>;
    if (error) return <div className="text-red-500">Erro: {error}</div>;

    const conversionData = [
        { name: 'Aprovados', count: stats.totalApproved, fill: '#10B981' },
        { name: 'Dispensados', count: stats.totalDismissed, fill: '#EF4444' },
    ];

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Observatório Nexus</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Sugestões em Aberto" value={stats.totalDrafts} icon={<Zap />} color="bg-purple-500" />
                <StatCard title="Conversão de Sugestões" value={`${stats.conversionRate.toFixed(1)}%`} icon={<TrendingUp />} color="bg-blue-500" />
                <StatCard title="Total Aprovado" value={stats.totalApproved} icon={<CheckCircle />} color="bg-green-500" />
                <StatCard title="Valor Gerado via Nexus" value={formatCurrency(stats.totalValueGenerated)} icon={<DollarSign />} color="bg-yellow-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="font-bold text-lg mb-4">Aprovados vs. Dispensados</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={conversionData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="name" width={100} />
                            <Tooltip formatter={(value) => `${value} sugestões`} />
                            <Bar dataKey="count" barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="font-bold text-lg mb-4">Campanhas de Estoque Baixo Mais Aprovadas</h3>
                    <div className="space-y-3">
                        {stats.topCampaigns.map(campaign => (
                            <div key={campaign.id} className="p-3 bg-gray-50 rounded-md">
                                <p className="font-semibold">{campaign.title}</p>
                                <p className="text-sm text-gray-500">{campaign.supplierName}</p>
                                <div className="flex justify-between items-center mt-1 text-sm">
                                    <span className="font-bold text-green-600">{campaign.approvals} aprovações</span>
                                    <span className="text-blue-600">{formatCurrency(campaign.totalValue)} gerados</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};