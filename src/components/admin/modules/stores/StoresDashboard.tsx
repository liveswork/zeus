import React from 'react';
import { 
    Store, ShoppingBag, Utensils, TrendingUp, 
    AlertTriangle, Server, Activity, Database 
} from 'lucide-react';

export const StoresDashboard: React.FC = () => {
    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Ecossistema de Lojas</h1>
                    <p className="text-slate-500">Monitoramento em tempo real de {142} estabelecimentos ativos.</p>
                </div>
                <span className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm font-bold">
                    <Activity size={16} /> Status do Sistema: Operacional (99.9% Uptime)
                </span>
            </div>

            {/* BIG NUMBERS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between mb-4">
                        <div className="p-3 bg-blue-50 rounded-xl"><Store className="text-blue-600" /></div>
                        <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">+12 este mês</span>
                    </div>
                    <p className="text-slate-500 text-sm">Total de Lojas</p>
                    <h3 className="text-3xl font-bold text-slate-800">142</h3>
                    <div className="mt-2 text-xs text-slate-400 flex gap-2">
                        <span>🛍️ 85 Varejo</span>
                        <span>🍔 57 Food</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between mb-4">
                        <div className="p-3 bg-purple-50 rounded-xl"><Database className="text-purple-600" /></div>
                        <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded">2.4 TB Total</span>
                    </div>
                    <p className="text-slate-500 text-sm">Dados Processados</p>
                    <h3 className="text-3xl font-bold text-slate-800">850 GB</h3>
                    <p className="text-xs text-slate-400 mt-2">Média de 6GB por loja (Alta densidade)</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between mb-4">
                        <div className="p-3 bg-green-50 rounded-xl"><TrendingUp className="text-green-600" /></div>
                    </div>
                    <p className="text-slate-500 text-sm">Volume de Vendas (GMV)</p>
                    <h3 className="text-3xl font-bold text-slate-800">R$ 4.2M</h3>
                    <p className="text-xs text-slate-400 mt-2">Processados na plataforma este mês</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-red-500">
                    <div className="flex justify-between mb-4">
                        <div className="p-3 bg-red-50 rounded-xl"><AlertTriangle className="text-red-600" /></div>
                        <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded">Ação Necessária</span>
                    </div>
                    <p className="text-slate-500 text-sm">Lojas em Risco (Churn)</p>
                    <h3 className="text-3xl font-bold text-slate-800">8</h3>
                    <p className="text-xs text-slate-400 mt-2">Baixa atividade detectada '{'>'}' 7 dias</p>
                </div>
            </div>

            {/* SEGMENTAÇÃO VISUAL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
                    <div className="absolute right-0 top-0 opacity-10 transform translate-x-10 -translate-y-10">
                        <ShoppingBag size={200} />
                    </div>
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <ShoppingBag className="text-blue-400"/> Performance Varejo
                    </h3>
                    <div className="space-y-4 relative z-10">
                        <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                            <span>Top Seller</span>
                            <span className="font-bold text-blue-300">Moda Center (R$ 120k/mês)</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                            <span>Produtos Cadastrados</span>
                            <span className="font-bold">45.200 SKUs</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                            <span>Plano Mais Usado</span>
                            <span className="font-bold text-green-400">Plano PRO (65%)</span>
                        </div>
                    </div>
                </div>

                <div className="bg-indigo-900 rounded-2xl p-6 text-white relative overflow-hidden">
                    <div className="absolute right-0 top-0 opacity-10 transform translate-x-10 -translate-y-10">
                        <Utensils size={200} />
                    </div>
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Utensils className="text-orange-400"/> Performance Food
                    </h3>
                    <div className="space-y-4 relative z-10">
                        <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                            <span>Top Seller</span>
                            <span className="font-bold text-orange-300">Pizzaria Express (R$ 85k/mês)</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                            <span>Pedidos Delivery</span>
                            <span className="font-bold">12.500 / mês</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                            <span>Uso de Disco</span>
                            <span className="font-bold text-red-400">Alto (Imagens HD)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};