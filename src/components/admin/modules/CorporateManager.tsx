import React, { useState } from 'react';
import { 
    Briefcase, DollarSign, Megaphone, 
    Activity, LayoutGrid, Settings 
} from 'lucide-react';

// Importação dos Sub-Módulos
import { HRManager } from '../modules/corporate/HRManager';
import { FinanceManager } from '../modules/corporate/FinanceManager';
import { MarketingManager } from '../modules/corporate/MarketingManager';
import { IntelligenceManager } from '../modules/corporate/IntelligenceManager';

export const CorporateManager: React.FC = () => {
    const [activeModule, setActiveModule] = useState<'intelligence' | 'hr' | 'finance' | 'marketing'>('intelligence');

    return (
        <div className="flex h-[calc(100vh-6rem)] bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-xl">
            {/* Sidebar Corporativa (Menu Lateral Escuro estilo Enterprise) */}
            <aside className="w-72 bg-slate-900 text-white flex flex-col">
                <div className="p-6 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/30">
                            <LayoutGrid size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold tracking-tight">Nexus HQ</h2>
                            <p className="text-xs text-slate-400 font-medium">Enterprise Edition</p>
                        </div>
                    </div>
                </div>
                
                <nav className="flex-1 p-4 space-y-2">
                    <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Visão Estratégica</p>
                    
                    <button 
                        onClick={() => setActiveModule('intelligence')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                            activeModule === 'intelligence' 
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                        <Activity size={20} className={activeModule === 'intelligence' ? 'animate-pulse' : ''} />
                        <span className="font-medium">Intelligence (BI)</span>
                    </button>

                    <div className="my-4 border-t border-slate-800 mx-4"></div>
                    <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Departamentos</p>

                    <button 
                        onClick={() => setActiveModule('hr')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                            activeModule === 'hr' ? 'bg-slate-800 text-white border-l-4 border-blue-500' : 'text-slate-400 hover:bg-slate-800'
                        }`}
                    >
                        <Briefcase size={20} className="text-blue-400" />
                        <span className="font-medium">Nexus HR</span>
                    </button>

                    <button 
                        onClick={() => setActiveModule('finance')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                            activeModule === 'finance' ? 'bg-slate-800 text-white border-l-4 border-green-500' : 'text-slate-400 hover:bg-slate-800'
                        }`}
                    >
                        <DollarSign size={20} className="text-green-400" />
                        <span className="font-medium">Nexus Finance</span>
                    </button>

                    <button 
                        onClick={() => setActiveModule('marketing')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                            activeModule === 'marketing' ? 'bg-slate-800 text-white border-l-4 border-purple-500' : 'text-slate-400 hover:bg-slate-800'
                        }`}
                    >
                        <Megaphone size={20} className="text-purple-400" />
                        <span className="font-medium">Nexus Marketing</span>
                    </button>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button className="flex items-center gap-2 text-slate-500 hover:text-white text-sm transition-colors w-full px-4 py-2 rounded-lg hover:bg-slate-800">
                        <Settings size={16} /> Configurações Globais
                    </button>
                </div>
            </aside>

            {/* Área de Conteúdo */}
            <main className="flex-1 overflow-y-auto bg-slate-50 scrollbar-hide">
                {activeModule === 'intelligence' && <IntelligenceManager />}
                {activeModule === 'hr' && <HRManager />}
                {activeModule === 'finance' && <FinanceManager />}
                {activeModule === 'marketing' && <MarketingManager />}
            </main>
        </div>
    );
};