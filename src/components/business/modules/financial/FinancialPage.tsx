import React, { useState } from 'react';
import { 
    FileText, CreditCard, Box, Megaphone, 
    Download, AlertCircle, CheckCircle, Clock 
} from 'lucide-react';

// Sub-componentes (Vamos defini-los no mesmo arquivo para facilitar sua cópia, 
// mas em produção idealmente ficariam separados)

// --- TAB 1: FATURAS ---
const InvoicesTab = () => {
    // Mock Data - Simula dados vindos do Firebase
    const invoices = [
        { id: 'FAT-2026-003', date: '10/02/2026', desc: 'Assinatura Plano Pro (Mensal)', amount: 99.90, status: 'open', dueDate: '15/02/2026' },
        { id: 'FAT-2026-002', date: '10/01/2026', desc: 'Assinatura Plano Pro (Mensal)', amount: 99.90, status: 'paid', paidDate: '12/01/2026' },
        { id: 'FAT-EXT-001', date: '05/01/2026', desc: 'Compra: Tema Dark Premium', amount: 49.90, status: 'paid', paidDate: '05/01/2026' },
        { id: 'FAT-2025-12', date: '10/12/2025', desc: 'Assinatura Plano Pro (Mensal)', amount: 99.90, status: 'paid', paidDate: '10/12/2025' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border shadow-sm border-l-4 border-l-blue-500">
                    <p className="text-gray-500 text-xs font-bold uppercase">Próxima Fatura</p>
                    <h3 className="text-2xl font-bold text-gray-800">R$ 99,90</h3>
                    <p className="text-sm text-blue-600 font-medium mt-1">Vence em 15/02</p>
                </div>
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                    <p className="text-gray-500 text-xs font-bold uppercase">Status da Conta</p>
                    <h3 className="text-2xl font-bold text-green-600 flex items-center gap-2">
                        <CheckCircle size={24} /> Em dia
                    </h3>
                </div>
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase">
                        <tr>
                            <th className="p-4">Fatura</th>
                            <th className="p-4">Descrição</th>
                            <th className="p-4">Vencimento</th>
                            <th className="p-4">Valor</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-center">Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.map(inv => (
                            <tr key={inv.id} className="border-t hover:bg-gray-50">
                                <td className="p-4 font-mono text-xs font-bold text-gray-600">{inv.id}</td>
                                <td className="p-4 text-sm font-medium text-gray-800">{inv.desc}</td>
                                <td className="p-4 text-sm text-gray-600">{inv.dueDate || inv.paidDate}</td>
                                <td className="p-4 font-bold text-gray-800">R$ {inv.amount.toFixed(2).replace('.', ',')}</td>
                                <td className="p-4">
                                    {inv.status === 'paid' && <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex items-center w-fit gap-1"><CheckCircle size={12}/> Pago</span>}
                                    {inv.status === 'open' && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold flex items-center w-fit gap-1"><Clock size={12}/> Aberto</span>}
                                    {inv.status === 'overdue' && <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold flex items-center w-fit gap-1"><AlertCircle size={12}/> Atrasado</span>}
                                </td>
                                <td className="p-4 text-center">
                                    <button className="text-gray-400 hover:text-blue-600 transition-colors" title="Baixar PDF">
                                        <Download size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- TAB 2: MEU PLANO ---
const MyPlanTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
        <div className="bg-white p-8 rounded-2xl border-2 border-blue-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">ATIVO</div>
            <h3 className="text-gray-500 font-medium mb-1">Seu Plano Atual</h3>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Nexus Pro</h2>
            
            <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-gray-600"><CheckCircle size={16} className="text-green-500"/> Pedidos Ilimitados</li>
                <li className="flex items-center gap-2 text-gray-600"><CheckCircle size={16} className="text-green-500"/> 3 Usuários</li>
                <li className="flex items-center gap-2 text-gray-600"><CheckCircle size={16} className="text-green-500"/> Financeiro Completo</li>
            </ul>

            <div className="flex gap-3">
                <button className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition">Gerenciar Assinatura</button>
                <button className="px-4 py-2 border border-gray-300 text-gray-600 font-bold rounded-lg hover:bg-gray-50">Mudar Plano</button>
            </div>
        </div>

        <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><CreditCard size={18}/> Método de Pagamento</h4>
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center font-bold text-gray-500 text-xs">VISA</div>
                    <div>
                        <p className="font-bold text-sm text-gray-800">•••• •••• •••• 4242</p>
                        <p className="text-xs text-gray-500">Expira em 12/28</p>
                    </div>
                </div>
                <button className="text-blue-600 text-sm font-bold hover:underline">Alterar cartão</button>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h4 className="font-bold text-gray-800 mb-2">Ciclo de Faturamento</h4>
                <p className="text-sm text-gray-600 mb-1">Próxima renovação automática:</p>
                <p className="font-bold text-gray-800">15 de Fevereiro de 2026</p>
            </div>
        </div>
    </div>
);

// --- TAB 3: EXTRAS & EXTENSÕES ---
const ExtrasTab = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4">
        <h3 className="font-bold text-gray-800 mb-4">Extensões Ativas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-lg"><Box className="text-purple-600" /></div>
                    <div>
                        <h4 className="font-bold text-gray-800">Tema Dark Premium</h4>
                        <p className="text-xs text-gray-500">Compra única</p>
                    </div>
                </div>
                <span className="text-sm font-bold text-gray-800">Pago</span>
            </div>

            <div className="bg-white p-4 rounded-xl border shadow-sm flex justify-between items-center opacity-60">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-100 rounded-lg"><Box className="text-gray-500" /></div>
                    <div>
                        <h4 className="font-bold text-gray-800">Domínio Personalizado</h4>
                        <p className="text-xs text-gray-500">Expirado</p>
                    </div>
                </div>
                <button className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold">Renovar</button>
            </div>
        </div>
    </div>
);

// --- TAB 4: ADS & PUBLICIDADE ---
const AdsTab = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white mb-8">
            <h3 className="text-2xl font-bold mb-2">Impulso Marketing</h3>
            <p className="opacity-90 mb-6">Acelere suas vendas promovendo sua loja no app do consumidor.</p>
            <div className="flex gap-4">
                <div>
                    <p className="text-xs opacity-70 uppercase font-bold">Investido este mês</p>
                    <p className="text-3xl font-bold">R$ 150,00</p>
                </div>
                <div className="h-12 w-px bg-white/20"></div>
                <div>
                    <p className="text-xs opacity-70 uppercase font-bold">Cliques gerados</p>
                    <p className="text-3xl font-bold">842</p>
                </div>
            </div>
        </div>

        <h4 className="font-bold text-gray-800 mb-4">Histórico de Cobrança (Ads)</h4>
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase">
                    <tr>
                        <th className="p-4">Campanha</th>
                        <th className="p-4">Período</th>
                        <th className="p-4">Valor</th>
                        <th className="p-4">Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="border-t">
                        <td className="p-4 font-medium">Promoção Carnaval</td>
                        <td className="p-4 text-sm text-gray-500">01/02 - 05/02</td>
                        <td className="p-4 font-bold">R$ 50,00</td>
                        <td className="p-4"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-bold">Processando</span></td>
                    </tr>
                    <tr className="border-t">
                        <td className="p-4 font-medium">Oferta Relâmpago</td>
                        <td className="p-4 text-sm text-gray-500">15/01 - 16/01</td>
                        <td className="p-4 font-bold">R$ 100,00</td>
                        <td className="p-4"><span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded font-bold">Pago</span></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
);

// --- COMPONENTE PRINCIPAL ---
export const FinancialPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'invoices' | 'plan' | 'extras' | 'ads'>('invoices');

    return (
        <div className="p-6 md:p-8 max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Financeiro & Assinatura</h1>
                <p className="text-gray-500">Gerencie suas faturas, plano e histórico de pagamentos.</p>
            </div>

            {/* Navegação Horizontal */}
            <div className="flex flex-wrap border-b border-gray-200 mb-8 bg-white rounded-t-xl px-2 shadow-sm">
                <button 
                    onClick={() => setActiveTab('invoices')}
                    className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all border-b-2 ${activeTab === 'invoices' ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                >
                    <FileText size={18} /> Minhas Faturas
                </button>
                <button 
                    onClick={() => setActiveTab('plan')}
                    className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all border-b-2 ${activeTab === 'plan' ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                >
                    <CreditCard size={18} /> Meu Plano
                </button>
                <button 
                    onClick={() => setActiveTab('extras')}
                    className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all border-b-2 ${activeTab === 'extras' ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                >
                    <Box size={18} /> Extensões & Extras
                </button>
                <button 
                    onClick={() => setActiveTab('ads')}
                    className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all border-b-2 ${activeTab === 'ads' ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                >
                    <Megaphone size={18} /> Ads & Publicidade
                </button>
            </div>

            {/* Conteúdo Dinâmico */}
            <div className="min-h-[400px]">
                {activeTab === 'invoices' && <InvoicesTab />}
                {activeTab === 'plan' && <MyPlanTab />}
                {activeTab === 'extras' && <ExtrasTab />}
                {activeTab === 'ads' && <AdsTab />}
            </div>
        </div>
    );
};