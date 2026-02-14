import React from 'react';
import { Target, Users, ShoppingCart, Share2, BarChart3, Globe } from 'lucide-react';

export const MarketingManager: React.FC = () => {
    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Marketing & Growth</h1>
                    <p className="text-slate-500">Performance de Campanhas, CAC e LTV</p>
                </div>
                <div className="flex gap-2">
                     <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><Globe size={12}/> Google Ads: ON</span>
                     <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><Share2 size={12}/> Meta Ads: ON</span>
                </div>
            </div>

            {/* Métricas Unitárias (Unit Economics) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-6 rounded-2xl text-white shadow-lg">
                    <p className="text-purple-100 text-sm font-medium mb-1">CAC (Custo Aquisição)</p>
                    <h3 className="text-4xl font-bold mb-4">R$ 145,00</h3>
                    <div className="flex items-center gap-2 text-xs bg-white/20 w-fit px-2 py-1 rounded">
                        <ArrowDownRightIcon className="w-3 h-3" />
                        <span>-15% vs mês anterior</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-sm font-medium mb-1">LTV (Lifetime Value)</p>
                    <h3 className="text-4xl font-bold text-slate-800 mb-4">R$ 3.290</h3>
                    <div className="text-xs text-green-600 font-bold">LTV/CAC Ratio: 22.6x (Excelente)</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-sm font-medium mb-1">ROAS (Retorno Ads)</p>
                    <h3 className="text-4xl font-bold text-slate-800 mb-4">8.4x</h3>
                    <p className="text-xs text-slate-400">Para cada R$ 1 gasto, voltam R$ 8,40</p>
                </div>
            </div>

            {/* Funil de Vendas */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-8 flex items-center gap-2">
                    <Target className="text-red-500" /> Funil de Conversão (Mês Atual)
                </h3>
                
                <div className="space-y-6 relative">
                    {/* Linha conectora */}
                    <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-slate-100 -z-10"></div>

                    {[
                        { label: 'Impressões (Ads)', val: '2.4M', pct: '100%', icon: Globe, color: 'bg-gray-100 text-gray-600' },
                        { label: 'Visitantes no Site', val: '145.000', pct: '6%', icon: Users, color: 'bg-blue-100 text-blue-600' },
                        { label: 'Leads (Cadastro)', val: '12.500', pct: '8.6%', icon: Share2, color: 'bg-purple-100 text-purple-600' },
                        { label: 'Vendas Realizadas', val: '840', pct: '6.7%', icon: ShoppingCart, color: 'bg-green-100 text-green-600' },
                    ].map((step, i) => (
                        <div key={i} className="flex items-center gap-6">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${step.color} z-10 border-4 border-white shadow-sm`}>
                                <step.icon size={20} />
                            </div>
                            <div className="flex-1 bg-slate-50 p-4 rounded-xl flex justify-between items-center border border-slate-100">
                                <div>
                                    <p className="text-sm text-slate-500 font-medium">{step.label}</p>
                                    <h4 className="text-xl font-bold text-slate-800">{step.val}</h4>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-bold text-slate-300">{step.pct}</span>
                                    <p className="text-xs text-slate-400">conversão</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Ícone auxiliar
const ArrowDownRightIcon = ({ className }: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m7 7 10 10"/><path d="M17 7v10H7"/></svg>
);