import React, { useState } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Crown, Star, CheckCircle, QrCode, CreditCard } from 'lucide-react';
import { useUI } from '../../../../contexts/UIContext';
import { functions } from '../../../../config/firebase';

const MERCADOPAGO_PUBLIC_KEY = "TEST-fb173216-031a-4829-ab71-d51b0a13a2acI"; 
initMercadoPago(MERCADOPAGO_PUBLIC_KEY, { locale: 'pt-BR' });

const createPreferenceCallable = httpsCallable(functions, 'createPreference');

export const SubscriptionPage: React.FC = () => {
    const { userProfile } = useAuth();
    const { showAlert } = useUI();
    const [preferenceId, setPreferenceId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [paymentData, setPaymentData] = useState<any>(null);
    const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'pix'>('wallet');

    const handleSubscribe = async (planId: string, method: 'wallet' | 'pix' = 'wallet') => {
        setIsLoading(true);
        setSelectedPlan(planId);
        setPaymentMethod(method);
        setPreferenceId(null);
        setPaymentData(null);
        
        showAlert(`Preparando pagamento via ${method === 'pix' ? 'PIX' : 'Mercado Pago'}...`, "info");
        
        try {
            const result = await createPreferenceCallable({ 
                planId, 
                paymentMethod: method 
            });
            const data = result.data as any;
            
            if (method === 'wallet' && data.preferenceId) {
                setPreferenceId(data.preferenceId);
            } else if (method === 'pix' && data.paymentId) {
                setPaymentData(data);
            } else {
                showAlert("Não foi possível processar o pagamento. Tente novamente.", "error");
            }
        } catch (error: any) {
            console.error(error);
            showAlert(error.message || "Ocorreu um erro ao iniciar a assinatura.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // Componente para mostrar o PIX
    const PixPaymentSection = ({ data }: { data: any }) => (
        <div className="mt-4 p-4 border border-green-400 rounded-lg bg-green-50">
            <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
                <QrCode size={20} /> PIX Gerado!
            </h3>
            
            <img 
                src={`data:image/png;base64,${data.qr_code_base64}`} 
                alt="QR Code PIX" 
                className="w-48 h-48 mx-auto border rounded"
            />
            
            <p className="text-sm text-center mt-3 text-green-700">
                Escaneie o QR Code ou use o código abaixo:
            </p>
            
            <div className="bg-white p-3 rounded mt-2 border">
                <code className="text-xs break-all font-mono">
                    {data.copy_paste}
                </code>
            </div>
            
            <button 
                onClick={() => {
                    navigator.clipboard.writeText(data.copy_paste);
                    showAlert("Código PIX copiado!", "success");
                }}
                className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white py-2 rounded"
            >
                Copiar Código PIX
            </button>
            
            <p className="text-xs text-center mt-3 text-green-600">
                Após o pagamento, sua assinatura será ativada automaticamente em até 2 minutos.
            </p>
        </div>
    );

    // Componente interno para renderizar cada cartão de plano
    const PlanCard = ({ planId, name, price, features, icon, isCurrent, isRecommended = false }: any) => (
        <div className={`border-2 rounded-lg p-6 flex flex-col relative ${isCurrent ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white'}`}>
            {isRecommended && <div className="absolute -top-3 right-4 bg-yellow-400 text-black font-bold text-xs px-3 py-1 rounded-full uppercase">Recomendado</div>}
            
            <div className="flex items-center gap-3 mb-4">
                {icon}
                <h3 className="text-2xl font-bold">{name}</h3>
            </div>
            
            <p className="text-4xl font-light mb-6">{price}<span className="text-lg text-gray-500">/mês</span></p>
            
            <ul className="space-y-3 mb-8 flex-grow text-gray-600">
                {features.map((f: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                        <CheckCircle size={18} className="text-green-500 mt-1 flex-shrink-0" />
                        <span>{f}</span>
                    </li>
                ))}
            </ul>
            
            {/* Lógica dos Botões */}
            {isCurrent ? (
                <button className="w-full bg-green-500 text-white font-bold py-3 rounded-lg mt-auto cursor-default">
                    Seu Plano Atual
                </button>
            ) : (
                <>
                    {selectedPlan === planId && isLoading ? (
                        <button disabled className="w-full bg-gray-400 text-white font-bold py-3 rounded-lg mt-auto">
                            Aguarde...
                        </button>
                    ) : selectedPlan === planId && preferenceId && paymentMethod === 'wallet' ? (
                        <Wallet initialization={{ preferenceId }} />
                    ) : selectedPlan === planId && paymentData && paymentMethod === 'pix' ? (
                        <PixPaymentSection data={paymentData} />
                    ) : (
                        <div className="space-y-2 mt-auto">
                            <button 
                                onClick={() => handleSubscribe(planId, 'wallet')}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <CreditCard size={18} />
                                Cartão ou Boleto
                            </button>
                            
                            <button 
                                onClick={() => handleSubscribe(planId, 'pix')}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <QrCode size={18} />
                                Pagar com PIX
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
    
    const currentPlanId = userProfile?.subscription?.planId || 'free';

    return (
        <div className="space-y-8">
            <div className="text-center">
                 <h1 className="text-4xl font-bold text-gray-800">Planos e Assinatura</h1>
                 <p className="text-lg text-gray-600 mt-2">Escolha o plano que melhor se adapta ao crescimento do seu negócio.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 items-stretch">
                {/* Seus PlanCards aqui (mantenha como estão) */}
                <PlanCard 
                    planId="free"
                    name="Plano Grátis"
                    price="R$ 0"
                    icon={<Star size={24} className="text-gray-500" />}
                    isCurrent={currentPlanId === 'free'}
                    features={[
                        "Até 200 pedidos/mês",
                        "1 Usuário (Admin)",
                        "1 Impressora (Caixa)",
                        "Controle de Mesas, Balcão e Delivery",
                        "Suporte Básico por E-mail"
                    ]}
                />
                
                <PlanCard 
                    planId="pro_1pc"
                    name="Plano Pro"
                    price="R$ 99,90"
                    icon={<Crown size={24} className="text-blue-500" />}
                    isCurrent={currentPlanId === 'pro_1pc'}
                    isRecommended={true}
                    features={[
                        "Pedidos ILIMITADOS",
                        "Até 3 Usuários com permissões",
                        "2 Impressoras (Caixa e Cozinha)",
                        "Programas de Fidelidade e Cupons",
                        "Relatórios Avançados",
                        "Inteligência de Negocio",
                        "Suporte Premium (WhatsApp & Telefone)"
                    ]}
                />
                
                <PlanCard 
                    planId="ultra_network"
                    name="Plano Ultra"
                    price="R$ 149,90"
                    icon={<Crown size={24} className="text-purple-500" />}
                    isCurrent={currentPlanId === 'ultra_network'}
                    features={[
                        "TODOS os recursos do Plano Pro",
                        "Uso em REDE (PCs ilimitados)",
                        "Módulo de Marketing Avançado",
                        "Suporte Completo (Plantão de Fim de Semana)",
                    ]}
                />
            </div>
        </div>
    );
};