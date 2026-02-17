import React, { useState, useEffect } from 'react';
import { 
    FileText, CreditCard, Box, Megaphone, 
    Download, AlertCircle, CheckCircle, Clock,
    Loader, Star, Shield
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { useAuth } from '../../../../contexts/AuthContext';
import { useUI } from '../../../../contexts/UIContext';

// --- SUB-COMPONENTES ---

// 1. Lista de Faturas (Mock por enquanto, foco no Plano)
const InvoicesTab = () => (
    <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed">
        <FileText size={48} className="mx-auto text-gray-300 mb-3"/>
        <p className="text-gray-500">Nenhuma fatura gerada ainda.</p>
    </div>
);

// 2. Componente de Seleção de Plano (Vitrine)
const PlanSelectionView = ({ onSelectPlan }: { onSelectPlan: (plan: any) => void }) => {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const q = query(collection(db, 'plans'), where('active', '==', true), orderBy('price', 'asc'));
                const snapshot = await getDocs(q);
                setPlans(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (error) { console.error(error); } finally { setLoading(false); }
        };
        fetchPlans();
    }, []);

    if (loading) return <div className="p-10 text-center"><Loader className="animate-spin inline text-blue-600"/> Carregando planos...</div>;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800">Escolha seu Plano</h2>
                <p className="text-gray-500">Selecione um plano para desbloquear todos os recursos.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
                {plans.map(plan => (
                    <div key={plan.id} className={`border-2 rounded-xl p-6 flex flex-col ${plan.recommended ? 'border-blue-600 shadow-lg ring-1 ring-blue-100' : 'border-gray-200 bg-white'}`}>
                        {plan.recommended && <div className="text-xs font-bold text-blue-600 uppercase mb-2 flex items-center gap-1"><Star size={12}/> Recomendado</div>}
                        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                        <p className="text-3xl font-extrabold text-gray-900 my-4">R$ {plan.price}<span className="text-sm text-gray-500 font-normal">/mês</span></p>
                        <ul className="space-y-2 mb-6 flex-1">
                            {plan.features?.map((f: string, i: number) => (
                                <li key={i} className="flex gap-2 text-sm text-gray-600"><CheckCircle size={16} className="text-green-500 flex-shrink-0"/> {f}</li>
                            ))}
                        </ul>
                        <button 
                            onClick={() => onSelectPlan(plan)}
                            className={`w-full py-3 rounded-lg font-bold transition-all ${plan.recommended ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            Escolher {plan.name}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 3. Detalhes do Plano Ativo
const ActivePlanView = ({ planData }: { planData: any }) => (
    <div className="bg-white p-8 rounded-2xl border-2 border-blue-100 shadow-sm relative overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl shadow-sm">ATIVO</div>
        <div className="flex justify-between items-start mb-6">
            <div>
                <h3 className="text-gray-500 font-medium text-sm uppercase tracking-wide mb-1">Seu Plano Atual</h3>
                <h2 className="text-4xl font-extrabold text-gray-800">{planData.name}</h2>
                <p className="text-xl text-blue-600 font-bold mt-1">R$ {planData.price}/mês</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-full"><Shield size={32} className="text-blue-600"/></div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
                <h4 className="font-bold text-gray-800 mb-3">Recursos Inclusos:</h4>
                <ul className="space-y-2">
                    {planData.features?.map((f: string, i: number) => (
                        <li key={i} className="flex items-center gap-2 text-gray-600 text-sm"><CheckCircle size={16} className="text-green-500"/> {f}</li>
                    ))}
                </ul>
            </div>
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                <h4 className="font-bold text-gray-800 mb-2">Próxima Renovação</h4>
                <p className="text-sm text-gray-600 mb-4">Sua assinatura renovará automaticamente em:</p>
                <div className="flex items-center gap-2 text-lg font-bold text-gray-700">
                    <Clock size={20} className="text-blue-500"/> 15 de Março de 2026
                </div>
                <button className="mt-4 w-full py-2 border border-red-200 text-red-600 text-sm font-bold rounded-lg hover:bg-red-50">Cancelar Assinatura</button>
            </div>
        </div>
    </div>
);

// --- COMPONENTE PRINCIPAL ---
export const FinancialPage: React.FC = () => {
    const { userProfile } = useAuth();
    const { showAlert } = useUI();
    const [activeTab, setActiveTab] = useState<'invoices' | 'plan' | 'extras' | 'ads'>('plan');
    
    // Estado do Plano Real
    const [currentPlan, setCurrentPlan] = useState<any>(null);
    const [loadingPlan, setLoadingPlan] = useState(true);

    // Buscar dados do plano atual do usuário
    useEffect(() => {
        const fetchCurrentPlan = async () => {
            const planId = userProfile?.subscription?.planId;
            const status = userProfile?.subscription?.status;

            // Se não tem plano ou não está ativo (exceto trial), considera null
            if (!planId || (status !== 'active' && status !== 'trial') || planId === 'free') {
                setCurrentPlan(null);
                setLoadingPlan(false);
                return;
            }

            try {
                // Busca detalhes reais do plano no Firestore
                const planRef = doc(db, 'plans', planId);
                const planSnap = await getDoc(planRef);
                
                if (planSnap.exists()) {
                    setCurrentPlan(planSnap.data());
                } else {
                    setCurrentPlan(null); // Plano antigo deletado?
                }
            } catch (error) {
                console.error("Erro ao buscar plano:", error);
            } finally {
                setLoadingPlan(false);
            }
        };

        fetchCurrentPlan();
    }, [userProfile]);

    const handleSelectPlan = (plan: any) => {
        // AQUI INTEGRARIA COM O GATEWAY (MERCADO PAGO)
        // Como fizemos antes, chamaria a Cloud Function
        showAlert(`Iniciando checkout para: ${plan.name}`, 'info');
        console.log("Checkout Plan:", plan);
    };

    return (
        <div className="p-6 md:p-8 max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Financeiro & Assinatura</h1>
                <p className="text-gray-500">Gerencie suas faturas, plano e histórico de pagamentos.</p>
            </div>

            <div className="flex flex-wrap border-b border-gray-200 mb-8 bg-white rounded-t-xl px-2 shadow-sm">
                <button onClick={() => setActiveTab('invoices')} className={`flex items-center gap-2 px-6 py-4 font-medium text-sm border-b-2 ${activeTab === 'invoices' ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><FileText size={18} /> Minhas Faturas</button>
                <button onClick={() => setActiveTab('plan')} className={`flex items-center gap-2 px-6 py-4 font-medium text-sm border-b-2 ${activeTab === 'plan' ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><CreditCard size={18} /> Meu Plano</button>
                <button onClick={() => setActiveTab('extras')} className={`flex items-center gap-2 px-6 py-4 font-medium text-sm border-b-2 ${activeTab === 'extras' ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><Box size={18} /> Extras</button>
                <button onClick={() => setActiveTab('ads')} className={`flex items-center gap-2 px-6 py-4 font-medium text-sm border-b-2 ${activeTab === 'ads' ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><Megaphone size={18} /> Ads</button>
            </div>

            <div className="min-h-[400px]">
                {activeTab === 'invoices' && <InvoicesTab />}
                
                {activeTab === 'plan' && (
                    loadingPlan ? <div className="p-10 text-center"><Loader className="animate-spin inline"/> Verificando assinatura...</div> :
                    currentPlan ? <ActivePlanView planData={currentPlan} /> : <PlanSelectionView onSelectPlan={handleSelectPlan} />
                )}

                {activeTab === 'extras' && <div className="text-center py-10 text-gray-400">Nenhum extra contratado.</div>}
                {activeTab === 'ads' && <div className="text-center py-10 text-gray-400">Nenhuma campanha ativa.</div>}
            </div>
        </div>
    );
};