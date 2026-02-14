import React from 'react';
import { Sparkles, Zap, AlertTriangle, TrendingUp, BrainCircuit } from 'lucide-react';

export const IntelligenceManager: React.FC = () => {
    return (
        <div className="p-8 space-y-8">
             <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2 text-indigo-300 font-medium">
                        <BrainCircuit size={20} /> Nexus AI Insights
                    </div>
                    <h1 className="text-4xl font-bold mb-4">Bom dia, CEO.</h1>
                    <p className="text-slate-300 max-w-2xl text-lg">
                        Cruzei os dados de <strong>Financeiro</strong> e <strong>Marketing</strong>. 
                        Sua eficiência de capital está 12% acima da média do mercado SaaS B2B. 
                        A projeção indica que atingiremos o Break-even em 45 dias se mantivermos o ritmo atual.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Previsão de Churn (IA) */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <AlertTriangle size={100} className="text-orange-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Sparkles size={16} className="text-indigo-500" /> Previsão de Risco (Churn)
                    </h3>
                    <p className="text-sm text-slate-500 mb-6">
                        O algoritmo detectou <strong>12 clientes</strong> com padrão de uso declinante nas últimas 2 semanas. Risco de cancelamento iminente.
                    </p>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
                            <span className="font-bold text-slate-700">Pizzaria Don Juan</span>
                            <span className="text-xs font-bold bg-orange-200 text-orange-800 px-2 py-1 rounded">Risco Alto (89%)</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                            <span className="font-bold text-slate-700">Loja Fashion Mix</span>
                            <span className="text-xs font-bold bg-yellow-200 text-yellow-800 px-2 py-1 rounded">Risco Médio (65%)</span>
                        </div>
                    </div>
                    <button className="mt-4 text-indigo-600 text-sm font-bold hover:underline">Ver todos os 12 clientes de risco &rarr;</button>
                </div>

                {/* Oportunidades de Expansão */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp size={100} className="text-green-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Sparkles size={16} className="text-indigo-500" /> Oportunidades de Upsell
                    </h3>
                    <p className="text-sm text-slate-500 mb-6">
                        Baseado no fluxo de pedidos, estes clientes estão prontos para migrar do plano <strong>PRO</strong> para o <strong>ULTRA</strong>.
                    </p>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                            <span className="font-bold text-slate-700">Burger King (Franquia 02)</span>
                            <span className="text-xs font-bold bg-green-200 text-green-800 px-2 py-1 rounded">+R$ 450/mês potencial</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                            <span className="font-bold text-slate-700">Mercadinho Central</span>
                            <span className="text-xs font-bold bg-green-200 text-green-800 px-2 py-1 rounded">+R$ 200/mês potencial</span>
                        </div>
                    </div>
                    <button className="mt-4 text-indigo-600 text-sm font-bold hover:underline">Notificar time de Vendas &rarr;</button>
                </div>
            </div>
        </div>
    );
};