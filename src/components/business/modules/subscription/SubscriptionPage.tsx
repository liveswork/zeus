import React, { useState, useEffect } from 'react';
import { 
    Check, Star, Shield, Zap, CreditCard, QrCode, Loader 
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, functions } from '../../../../config/firebase';
import { useAuth } from '../../../../contexts/AuthContext';
import { useUI } from '../../../../contexts/UIContext';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';
import { httpsCallable } from 'firebase/functions';

// --- CONFIGURAÇÃO DO MERCADO PAGO ---
// Idealmente, mova isso para uma variável de ambiente (.env)
const MERCADOPAGO_PUBLIC_KEY = "TEST-fb173216-031a-4829-ab71-d51b0a13a2acI"; 
initMercadoPago(MERCADOPAGO_PUBLIC_KEY, { locale: 'pt-BR' });

const createPreferenceCallable = httpsCallable(functions, 'createPreference');

interface Plan {
    id: string;
    name: string;
    description: string;
    price: number;
    interval: 'monthly' | 'yearly';
    features: string[];
    recommended: boolean;
    type: string;
}

export const SubscriptionPage: React.FC = () => {
    const { userProfile } = useAuth();
    const { showAlert } = useUI();
    
    // Estados de Dados
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    // Estados de Pagamento
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [preferenceId, setPreferenceId] = useState<string | null>(null);
    const [pixData, setPixData] = useState<any>(null);
    const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'pix'>('wallet');

    // Detecta o tipo de negócio
    const businessType = userProfile?.businessProfile?.type || 'retail';
    const planCategory = ['food_service', 'pizzaria', 'restaurant'].includes(businessType) ? 'food' : 'retail';

    // --- 1. BUSCAR PLANOS DO FIREBASE ---
    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const q = query(
                    collection(db, 'plans'), 
                    where('active', '==', true),
                    orderBy('price', 'asc')
                );
                
                const snapshot = await getDocs(q);
                const fetchedPlans = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Plan[];

                const filteredPlans = fetchedPlans.filter(p => 
                    p.type === planCategory || p.type === 'enterprise'
                );

                setPlans(filteredPlans);
            } catch (error) {
                console.error("Erro ao carregar planos:", error);
                showAlert("Erro ao carregar planos de assinatura.", "error");
            } finally {
                setLoadingPlans(false);
            }
        };

        fetchPlans();
    }, [planCategory]);

    // --- 2. INICIAR PAGAMENTO (INTEGRAÇÃO MERCADO PAGO) ---
    const handleSubscribe = async (plan: Plan, method: 'wallet' | 'pix') => {
        setProcessingPayment(true);
        setSelectedPlanId(plan.id);
        setPaymentMethod(method);
        setPreferenceId(null);
        setPixData(null);

        showAlert(`Gerando pagamento via ${method === 'pix' ? 'PIX' : 'Mercado Pago'}...`, "info");

        try {
            // Chama a Cloud Function com os dados do plano REAL do Firestore
            const result = await createPreferenceCallable({ 
                planId: plan.id, 
                title: `Assinatura Nexus OS - ${plan.name}`, // Passa título dinâmico
                price: plan.price, // Passa preço dinâmico
                paymentMethod: method 
            });
            
            const data = result.data as any;

            if (method === 'wallet' && data.preferenceId) {
                setPreferenceId(data.preferenceId);
            } else if (method === 'pix' && data.qr_code_base64) {
                setPixData(data);
            } else {
                throw new Error("Resposta inválida do servidor de pagamento.");
            }

        } catch (error: any) {
            console.error("Erro no pagamento:", error);
            showAlert(error.message || "Falha ao iniciar pagamento.", "error");
            setSelectedPlanId(null); // Reseta seleção em caso de erro
        } finally {
            setProcessingPayment(false);
        }
    };

    // Componente Visual do PIX
    const PixPaymentSection = ({ data }: { data: any }) => (
        <div className="mt-6 p-6 border-2 border-green-500 rounded-xl bg-green-50 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
                <QrCode className="text-green-600" /> Pagamento PIX Gerado
            </h3>
            
            <div className="bg-white p-2 rounded-lg border border-gray-200 w-fit mx-auto shadow-sm">
                <img 
                    src={`data:image/png;base64,${data.qr_code_base64}`} 
                    alt="QR Code PIX" 
                    className="w-48 h-48 object-contain"
                />
            </div>
            
            <p className="text-sm text-center mt-4 text-green-800 font-medium">
                Copie e cole o código abaixo no seu app de banco:
            </p>
            
            <div className="bg-white p-3 rounded mt-2 border border-green-200 relative group cursor-pointer"
                 onClick={() => {
                    navigator.clipboard.writeText(data.copy_paste);
                    showAlert("Código PIX copiado!", "success");
                 }}>
                <code className="text-xs break-all font-mono text-gray-600 block line-clamp-2 group-hover:text-black">
                    {data.copy_paste}
                </code>
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded transition-opacity">
                    <span className="text-xs font-bold bg-white px-2 py-1 rounded shadow">Clique para copiar</span>
                </div>
            </div>
            
            <p className="text-xs text-center mt-4 text-green-700">
                <Loader className="inline w-3 h-3 animate-spin mr-1"/>
                Aguardando confirmação... Sua assinatura será ativada automaticamente.
            </p>
        </div>
    );

    if (loadingPlans) {
        return <div className="flex justify-center items-center h-96"><Loader className="animate-spin text-blue-600 w-10 h-10" /></div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Planos e Assinatura</h1>
                <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                    Potencialize o seu negócio com o Nexus OS.
                </p>

                {/* Toggle Mensal/Anual */}
                <div className="mt-8 flex justify-center items-center gap-4">
                    <span className={`text-sm font-bold ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>Mensal</span>
                    <button 
                        onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
                        className={`relative w-14 h-8 flex items-center rounded-full p-1 transition-colors ${billingCycle === 'yearly' ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                        <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${billingCycle === 'yearly' ? 'translate-x-6' : ''}`} />
                    </button>
                    <span className={`text-sm font-bold ${billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
                        Anual <span className="text-green-600 text-xs ml-1">(-20%)</span>
                    </span>
                </div>
            </div>

            {/* Grid de Planos */}
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
                {plans.filter(p => p.interval === billingCycle).map((plan) => {
                    // Verifica se é o plano que está sendo pago agora
                    const isPayingThis = selectedPlanId === plan.id;
                    const isCurrentPlan = userProfile?.subscription?.planId === plan.id;

                    return (
                        <div 
                            key={plan.id} 
                            className={`relative rounded-2xl border-2 p-6 shadow-xl flex flex-col transition-all ${
                                plan.recommended 
                                    ? 'border-blue-600 bg-white ring-4 ring-blue-50 z-10 scale-105' 
                                    : 'border-gray-100 bg-white hover:border-blue-200'
                            }`}
                        >
                            {plan.recommended && (
                                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg">
                                    <Star size={14} fill="white" /> RECOMENDADO
                                </div>
                            )}

                            <div className="mb-4 text-center">
                                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                                <div className="flex items-center justify-center mt-4">
                                    <span className="text-4xl font-extrabold text-gray-900">R$ {plan.price}</span>
                                    <span className="text-gray-500 ml-1">/{billingCycle === 'monthly' ? 'mês' : 'ano'}</span>
                                </div>
                                <p className="text-gray-500 text-sm mt-3">{plan.description}</p>
                            </div>

                            <ul className="space-y-3 mb-8 flex-1">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start">
                                        <Check size={18} className="text-green-500 mr-2 flex-shrink-0" />
                                        <span className="text-gray-600 text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* ÁREA DE AÇÃO (Botões ou Pagamento) */}
                            <div className="mt-auto space-y-3">
                                {isCurrentPlan ? (
                                    <button disabled className="w-full py-3 bg-green-100 text-green-700 font-bold rounded-xl cursor-default border border-green-200">
                                        Seu Plano Atual
                                    </button>
                                ) : isPayingThis ? (
                                    // MODO PAGAMENTO ATIVO
                                    <div className="animate-in fade-in zoom-in duration-300">
                                        {processingPayment ? (
                                            <button disabled className="w-full py-3 bg-gray-100 text-gray-500 font-bold rounded-xl flex justify-center items-center gap-2">
                                                <Loader className="animate-spin" size={18} /> Processando...
                                            </button>
                                        ) : preferenceId && paymentMethod === 'wallet' ? (
                                            // Botão Oficial do Mercado Pago
                                            <div className="custom-wallet-container">
                                                <Wallet initialization={{ preferenceId }} customization={{ texts: { valueProp: 'security_safety' } }} />
                                                <button 
                                                    onClick={() => setSelectedPlanId(null)} 
                                                    className="w-full mt-2 text-xs text-gray-500 hover:text-red-500 underline"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        ) : pixData && paymentMethod === 'pix' ? (
                                            // QR Code do Pix
                                            <>
                                                <PixPaymentSection data={pixData} />
                                                <button 
                                                    onClick={() => setSelectedPlanId(null)} 
                                                    className="w-full mt-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                                                >
                                                    Fechar / Escolher Outro
                                                </button>
                                            </>
                                        ) : (
                                            // Fallback de erro
                                            <button onClick={() => setSelectedPlanId(null)} className="text-red-500 text-sm w-full text-center">
                                                Erro. Tentar novamente.
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    // BOTÕES DE ESCOLHA INICIAIS
                                    <>
                                        <button 
                                            onClick={() => handleSubscribe(plan, 'wallet')}
                                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex justify-center items-center gap-2"
                                        >
                                            <CreditCard size={18} /> Cartão
                                        </button>
                                        <button 
                                            onClick={() => handleSubscribe(plan, 'pix')}
                                            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex justify-center items-center gap-2"
                                        >
                                            <QrCode size={18} /> PIX
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}

                {plans.length === 0 && (
                    <div className="col-span-3 text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <Shield className="mx-auto text-gray-300 mb-4" size={48} />
                        <h3 className="text-lg font-bold text-gray-600">Nenhum plano disponível</h3>
                        <p className="text-gray-500">O administrador ainda não cadastrou planos para o seu segmento.</p>
                    </div>
                )}
            </div>
            
            {/* Footer de Confiança */}
            <div className="mt-16 border-t pt-8 text-center text-gray-400 text-sm">
                <p className="flex justify-center items-center gap-2">
                    <Shield size={14} /> Pagamentos processados via Mercado Pago com segurança SSL.
                </p>
            </div>
        </div>
    );
};