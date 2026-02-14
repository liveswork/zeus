import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, PieChart, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';

export const FinanceManager: React.FC = () => {
    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Gestão Financeira</h1>
                    <p className="text-slate-500">Fluxo de Caixa, P&L e Projeções</p>
                </div>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Saúde Financeira: Excelente</span>
            </div>

            {/* Cards de KPI Financeiro */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-green-50 rounded-xl"><DollarSign className="text-green-600" /></div>
                        <span className="flex items-center text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded">+12.5%</span>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Receita Mensal (MRR)</p>
                    <h3 className="text-3xl font-bold text-slate-800">R$ 482.500</h3>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-red-50 rounded-xl"><TrendingDown className="text-red-600" /></div>
                        <span className="flex items-center text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded">+2.1%</span>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Custos Operacionais</p>
                    <h3 className="text-3xl font-bold text-slate-800">R$ 124.200</h3>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 rounded-xl"><Wallet className="text-blue-600" /></div>
                        <span className="text-slate-400 text-xs">Atualizado hoje</span>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Caixa Líquido (Runway)</p>
                    <h3 className="text-3xl font-bold text-slate-800">R$ 1.2M</h3>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-50 rounded-xl"><PieChart className="text-purple-600" /></div>
                        <span className="flex items-center text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded">+28%</span>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Margem EBITDA</p>
                    <h3 className="text-3xl font-bold text-slate-800">34.2%</h3>
                </div>
            </div>

            {/* Simulação de Gráfico Avançado (Visual) */}
            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-6">Fluxo de Caixa (Últimos 6 meses)</h3>
                    <div className="h-64 flex items-end gap-4 px-4 border-b border-slate-100 pb-2">
                        {[40, 55, 45, 70, 65, 85].map((h, i) => (
                            <div key={i} className="flex-1 group relative">
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    R$ {h}0k
                                </div>
                                <div style={{ height: `${h}%` }} className="w-full bg-indigo-500 rounded-t-lg hover:bg-indigo-600 transition-colors"></div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mt-2 px-4">
                        <span>Set</span><span>Out</span><span>Nov</span><span>Dez</span><span>Jan</span><span>Fev</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4">Breakdown de Custos</h3>
                    <div className="space-y-4">
                        {[
                            { label: 'Servidores & Cloud', val: '45%', color: 'bg-blue-500' },
                            { label: 'Folha de Pagamento', val: '30%', color: 'bg-green-500' },
                            { label: 'Marketing Ads', val: '15%', color: 'bg-purple-500' },
                            { label: 'Operacional', val: '10%', color: 'bg-gray-300' },
                        ].map((item, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-600">{item.label}</span>
                                    <span className="font-bold text-slate-800">{item.val}</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div className={`h-full ${item.color}`} style={{ width: item.val }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                        <strong className="text-slate-700 block mb-1">Dica do CFO AI:</strong>
                        O custo de Cloud aumentou 12% este mês. Considere otimizar as instâncias do Firebase para reduzir o burn rate.
                    </div>
                </div>
            </div>
        </div>
    );
};