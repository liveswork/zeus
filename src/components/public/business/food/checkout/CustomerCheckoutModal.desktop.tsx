// src/components/public/checkout/CustomerCheckoutModal.desktop.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../../../contexts/AuthContext';
import { useUI } from '../../../../../contexts/UIContext';
import { Modal } from '../../../../ui/Modal';
import { FormField } from '../../../../ui/FormField';
import { 
    Loader, Lock, Mail, Phone, User, Home, Bike, 
    ShoppingBag, CreditCard, DollarSign, MapPin, 
    Plus, CheckCircle, Clock, X, Trash2, Minus, Plus as PlusIcon,
    MessageCircle
} from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, functions } from '../../../../../config/firebase';
import { httpsCallable } from 'firebase/functions';
import { formatCurrency } from '../../../../../utils/formatters';
import { Product } from '../../../../../types';

interface CustomerCheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    cart: (Product & { qty: number })[];
    restaurantId: string;
    onOrderFinalized: () => void;
}

interface Address {
    id?: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    reference?: string;
}

const searchUserByWhatsapp = httpsCallable(functions, 'searchUserByWhatsapp');
const createPublicUser = httpsCallable(functions, 'createPublicUser');
const finalizeSale = httpsCallable(functions, 'finalizeSale');

export const CustomerCheckoutModal: React.FC<CustomerCheckoutModalProps> = ({ 
    isOpen, onClose, cart, restaurantId, onOrderFinalized 
}) => {
    const { userProfile } = useAuth();
    const { showAlert } = useUI();

    const [step, setStep] = useState<'identify' | 'authenticate' | 'register' | 'orderType' | 'deliveryDetails' | 'pickupDetails' | 'payment'>('identify');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formattedWhatsapp, setFormattedWhatsapp] = useState('');

    // Dados do formulário
    const [whatsapp, setWhatsapp] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [foundUser, setFoundUser] = useState<any>(null);

    // Dados do Pedido
    const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
    const [userAddresses, setUserAddresses] = useState<Address[]>([]);
    const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
    const [newAddress, setNewAddress] = useState<Address>({
        street: '', number: '', complement: '', neighborhood: '',
        city: '', state: '', zipCode: '', reference: ''
    });
    const [paymentMethod, setPaymentMethod] = useState('dinheiro');
    const [changeFor, setChangeFor] = useState('');

    const totalCartValue = useMemo(() => {
        return cart.reduce((total, item) => total + (item.salePrice * item.qty), 0);
    }, [cart]);

    const steps = [
        { key: 'identify', label: 'Identificação', icon: Phone },
        { key: 'orderType', label: 'Tipo de Pedido', icon: ShoppingBag },
        { key: 'deliveryDetails', label: 'Endereço', icon: MapPin },
        { key: 'payment', label: 'Pagamento', icon: CreditCard }
    ];

    const currentStepIndex = steps.findIndex(s => s.key === step);

    useEffect(() => {
        if (isOpen) {
            if (userProfile) {
                setStep('orderType');
                if (userProfile.profile?.addresses) {
                    setUserAddresses(userProfile.profile.addresses);
                }
            } else {
                setStep('identify');
                resetForm();
            }
        }
    }, [isOpen, userProfile]);

    const resetForm = () => {
        setWhatsapp(''); setFormattedWhatsapp(''); setPassword(''); 
        setName(''); setEmail(''); setError(''); setFoundUser(null);
        setOrderType('delivery'); setSelectedAddress(null); 
        setIsAddingNewAddress(false); setPaymentMethod('dinheiro'); 
        setChangeFor('');
    };

    const formatPhoneNumber = (value: string): string => {
        const cleaned = value.replace(/\D/g, '').slice(0, 11);
        if (cleaned.length <= 2) return cleaned;
        if (cleaned.length <= 6) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
        if (cleaned.length <= 10) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    };

    const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        const formatted = formatPhoneNumber(inputValue);
        const cleanNumber = formatted.replace(/\D/g, '');
        setWhatsapp(cleanNumber);
        setFormattedWhatsapp(formatted);
    };

    const handleSearchUser = async () => {
        setLoading(true); setError('');
        if (!whatsapp || whatsapp.length !== 11) {
            setError("Número inválido. Digite DDD + 9 dígitos.");
            setLoading(false);
            return;
        }
        try {
            const result = await searchUserByWhatsapp({ whatsapp });
            const data = result.data as any;
            if (data.exists) {
                setFoundUser(data.userProfile);
                setStep('authenticate');
            } else {
                setStep('register');
            }
        } catch (error: any) {
            setError(error.message || "Erro ao buscar usuário");
        } finally {
            setLoading(false);
        }
    };

    const handleAuthenticate = async () => {
        setLoading(true); setError('');
        try {
            await signInWithEmailAndPassword(auth, foundUser.email, password);
        } catch (err) {
            setError("Senha incorreta. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        setLoading(true); setError('');
        if (!name || !email || !password) {
            setError("Preencha todos os campos.");
            setLoading(false);
            return;
        }
        if (password.length < 6) {
            setError("Senha deve ter 6+ caracteres.");
            setLoading(false);
            return;
        }
        try {
            await createPublicUser({ name, email, password, whatsapp });
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            setError(err.message || "Erro ao criar conta.");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAddress = () => {
        if (!newAddress.street || !newAddress.number || !newAddress.neighborhood || !newAddress.city || !newAddress.state) {
            setError("Preencha os campos obrigatórios.");
            return;
        }
        const addressToSave: Address = { ...newAddress, id: Date.now().toString() };
        setSelectedAddress(addressToSave);
        setIsAddingNewAddress(false);
        setStep('payment');
    };

    const handleFinalizeOrder = async () => {
        setLoading(true); setError('');
        if (orderType === 'delivery' && !selectedAddress) {
            setError("Selecione um endereço para entrega.");
            setLoading(false);
            return;
        }
        if (paymentMethod === 'dinheiro' && (!changeFor || parseFloat(changeFor) < totalCartValue)) {
            setError(`Troco mínimo: ${formatCurrency(totalCartValue)}`);
            setLoading(false);
            return;
        }

        const finalOrderData = {
            businessId: restaurantId,
            customerId: userProfile?.uid,
            customerName: userProfile?.displayName || name,
            customerPhone: userProfile?.profile?.whatsapp || whatsapp,
            items: cart.map(item => ({
                productId: item.id, name: item.name, salePrice: item.salePrice, qty: item.qty, notes: item.notes
            })),
            totalAmount: totalCartValue,
            origin: orderType,
            paymentDetails: [{
                method: paymentMethod,
                amountPaid: paymentMethod === 'dinheiro' ? parseFloat(changeFor) : totalCartValue,
                change: paymentMethod === 'dinheiro' ? (parseFloat(changeFor) - totalCartValue) : 0
            }],
            addressDetails: orderType === 'delivery' ? selectedAddress : null,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        try {
            await finalizeSale({ orderData: finalOrderData });
            showAlert("Pedido finalizado com sucesso!", "success");
            onOrderFinalized();
            onClose();
        } catch (err: any) {
            setError(err.message || "Erro ao finalizar pedido.");
        } finally {
            setLoading(false);
        }
    };

    const handleWhatsAppOrder = () => {
        // Montar mensagem para WhatsApp
        const itemsText = cart.map(item => 
            `${item.qty}x ${item.name} - ${formatCurrency(item.salePrice * item.qty)}`
        ).join('%0A');

        const addressText = orderType === 'delivery' && selectedAddress ? 
            `%0A%0A*Endereço de Entrega:*%0A${selectedAddress.street}, ${selectedAddress.number}${selectedAddress.complement ? `, ${selectedAddress.complement}` : ''}%0A${selectedAddress.neighborhood}, ${selectedAddress.city}-${selectedAddress.state}` : 
            '%0A%0A*Retirada no Local*';

        const paymentText = `%0A%0A*Pagamento:* ${paymentMethod === 'dinheiro' ? 'Dinheiro' : 'Cartão'}`;
        const changeText = paymentMethod === 'dinheiro' && changeFor ? 
            `%0A*Troco para:* ${formatCurrency(parseFloat(changeFor))}` : '';

        const message = `*NOVO PEDIDO*%0A%0A*Itens:*%0A${itemsText}${addressText}${paymentText}${changeText}%0A%0A*Total: ${formatCurrency(totalCartValue)}*`;

        // Abrir WhatsApp
        window.open(`https://wa.me/55${restaurantId}?text=${message}`, '_blank');
        
        showAlert("Pedido enviado para o WhatsApp!", "success");
        onOrderFinalized();
        onClose();
    };

    const renderCartSidebar = () => (
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
            {/* Header do Carrinho */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Seu Pedido</h3>
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                        {cart.reduce((total, item) => total + item.qty, 0)} itens
                    </span>
                </div>
            </div>

            {/* Lista de Itens */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                    {cart.map((item) => (
                        <div key={item.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                            {item.imageUrl && (
                                <img 
                                    src={item.imageUrl} 
                                    alt={item.name}
                                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                                />
                            )}
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                    {formatCurrency(item.salePrice)} cada
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center gap-2">
                                        <button className="p-1 text-gray-500 hover:text-gray-700">
                                            <Minus size={16} />
                                        </button>
                                        <span className="text-sm font-medium w-8 text-center">
                                            {item.qty}
                                        </span>
                                        <button className="p-1 text-gray-500 hover:text-gray-700">
                                            <PlusIcon size={16} />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-900">
                                            {formatCurrency(item.salePrice * item.qty)}
                                        </span>
                                        <button className="p-1 text-red-500 hover:text-red-700">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {cart.length === 0 && (
                    <div className="text-center py-12">
                        <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Seu carrinho está vazio</p>
                    </div>
                )}
            </div>

            {/* Resumo e Botões */}
            <div className="border-t border-gray-200 p-6 space-y-4">
                {/* Resumo de Valores */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span>{formatCurrency(totalCartValue)}</span>
                    </div>
                    {orderType === 'delivery' && (
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Taxa de entrega</span>
                            <span className="text-green-600">Grátis</span>
                        </div>
                    )}
                    <div className="border-t pt-2 flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>{formatCurrency(totalCartValue)}</span>
                    </div>
                </div>

                {/* Botões de Ação */}
                <div className="space-y-3">
                    <button
                        onClick={handleFinalizeOrder}
                        disabled={loading || cart.length === 0 || (step !== 'payment')}
                        className="w-full bg-green-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <Loader className="w-5 h-5 animate-spin" />
                        ) : (
                            <CreditCard className="w-5 h-5" />
                        )}
                        {loading ? "Processando..." : `Finalizar Pedido`}
                    </button>

                    <button
                        onClick={handleWhatsAppOrder}
                        disabled={cart.length === 0 || (step !== 'payment')}
                        className="w-full bg-green-500 text-white font-semibold py-3 px-4 rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                        <MessageCircle className="w-5 h-5" />
                        Pedir pelo WhatsApp
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full bg-white text-gray-700 font-semibold py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Continuar Comprando
                    </button>
                </div>

                {/* Informações de Segurança */}
                <div className="text-center">
                    <p className="text-xs text-gray-500">
                        ✔️ Pagamento 100% seguro<br />
                        ✔️ Seus dados protegidos
                    </p>
                </div>
            </div>
        </div>
    );

    const renderSidebar = () => (
        <div className="w-80 bg-gradient-to-b from-blue-600 to-blue-700 text-white p-8">
            <div className="space-y-8">
                <div>
                    <h2 className="text-2xl font-bold mb-2">Finalizar Pedido</h2>
                    <p className="text-blue-100">Complete as informações para finalizar sua compra</p>
                </div>

                <div className="space-y-6">
                    {steps.map((stepItem, index) => {
                        const Icon = stepItem.icon;
                        const isCompleted = index < currentStepIndex;
                        const isCurrent = index === currentStepIndex;
                        
                        return (
                            <div key={stepItem.key} className="flex items-center gap-4">
                                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                                    isCompleted ? 'bg-green-500' : 
                                    isCurrent ? 'bg-white text-blue-600' : 'bg-blue-500'
                                }`}>
                                    {isCompleted ? (
                                        <CheckCircle size={20} />
                                    ) : (
                                        <Icon size={20} />
                                    )}
                                </div>
                                <div>
                                    <div className={`font-semibold ${
                                        isCurrent ? 'text-white' : 'text-blue-200'
                                    }`}>
                                        {stepItem.label}
                                    </div>
                                    <div className="text-sm text-blue-200">
                                        {isCompleted ? 'Concluído' : 
                                         isCurrent ? 'Em andamento' : 'Pendente'}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="bg-blue-500 rounded-xl p-4">
                    <h4 className="font-semibold mb-3">Resumo do Pedido</h4>
                    <div className="space-y-2 text-sm">
                        {cart.slice(0, 3).map(item => (
                            <div key={item.id} className="flex justify-between">
                                <span className="text-blue-100">{item.qty}x {item.name}</span>
                                <span>{formatCurrency(item.salePrice * item.qty)}</span>
                            </div>
                        ))}
                        {cart.length > 3 && (
                            <div className="text-blue-200 text-xs">
                                +{cart.length - 3} itens
                            </div>
                        )}
                        <div className="border-t border-blue-400 pt-2 mt-2 flex justify-between font-bold text-lg">
                            <span>Total:</span>
                            <span>{formatCurrency(totalCartValue)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStep = () => {
        switch (step) {
            case 'identify':
                return (
                    <div className="p-8 space-y-6">
                        <div className="text-center max-w-md mx-auto">
                            <Phone className="w-20 h-20 text-blue-600 mx-auto mb-6" />
                            <h3 className="text-2xl font-bold text-gray-900">Identificação</h3>
                            <p className="text-gray-600 mt-2 text-lg">Digite seu WhatsApp para continuar com o pedido</p>
                        </div>
                        
                        <div className="max-w-sm mx-auto space-y-6">
                            <FormField label="Número do WhatsApp">
                                <input
                                    type="tel"
                                    placeholder="(85) 91234-5678"
                                    value={formattedWhatsapp}
                                    onChange={handleWhatsappChange}
                                    maxLength={15}
                                    className="w-full p-4 border border-gray-300 rounded-xl text-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </FormField>
                            
                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                    <p className="text-red-600 text-center">{error}</p>
                                </div>
                            )}
                            
                            <button 
                                onClick={handleSearchUser} 
                                disabled={loading || !whatsapp}
                                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl text-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
                            >
                                {loading ? <Loader className="w-5 h-5 animate-spin" /> : null}
                                {loading ? "Buscando..." : "Continuar"}
                            </button>
                        </div>
                    </div>
                );

            case 'authenticate':
                return (
                    <div className="p-8 space-y-6">
                        <div className="text-center max-w-md mx-auto">
                            <Lock className="w-20 h-20 text-blue-600 mx-auto mb-6" />
                            <h3 className="text-2xl font-bold text-gray-900">Bem-vindo de volta!</h3>
                            <p className="text-gray-600 mt-2">Olá, <strong>{foundUser?.displayName}</strong>. Digite sua senha para continuar.</p>
                        </div>
                        
                        <div className="max-w-sm mx-auto space-y-6">
                            <FormField label="Senha">
                                <input 
                                    type="password" 
                                    value={password} 
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Sua senha"
                                />
                            </FormField>
                            
                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                    <p className="text-red-600 text-center">{error}</p>
                                </div>
                            )}
                            
                            <button 
                                onClick={handleAuthenticate} 
                                disabled={loading || !password}
                                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl text-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-3"
                            >
                                {loading ? <Loader className="w-5 h-5 animate-spin" /> : null}
                                {loading ? "Entrando..." : "Entrar"}
                            </button>
                        </div>
                    </div>
                );

            case 'register':
                return (
                    <div className="p-8 space-y-6">
                        <div className="text-center max-w-md mx-auto">
                            <User className="w-20 h-20 text-green-600 mx-auto mb-6" />
                            <h3 className="text-2xl font-bold text-gray-900">Criar Nova Conta</h3>
                            <p className="text-gray-600 mt-2">Preencha seus dados para criar sua conta</p>
                            <p className="text-sm text-gray-500 mt-1">WhatsApp: <strong>{formattedWhatsapp}</strong></p>
                        </div>
                        
                        <div className="max-w-md mx-auto space-y-4">
                            <FormField label="Nome Completo">
                                <input 
                                    type="text" 
                                    value={name} 
                                    onChange={e => setName(e.target.value)}
                                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Seu nome completo"
                                />
                            </FormField>
                            
                            <FormField label="E-mail">
                                <input 
                                    type="email" 
                                    value={email} 
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="seu@email.com"
                                />
                            </FormField>
                            
                            <FormField label="Senha">
                                <input 
                                    type="password" 
                                    value={password} 
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Mínimo 6 caracteres"
                                />
                            </FormField>
                            
                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                    <p className="text-red-600 text-center">{error}</p>
                                </div>
                            )}
                            
                            <button 
                                onClick={handleRegister} 
                                disabled={loading || !name || !email || !password}
                                className="w-full bg-green-600 text-white font-bold py-4 rounded-xl text-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-3"
                            >
                                {loading ? <Loader className="w-5 h-5 animate-spin" /> : null}
                                {loading ? "Criando conta..." : "Criar Conta"}
                            </button>
                        </div>
                    </div>
                );

            case 'orderType':
                return (
                    <div className="p-8 space-y-8">
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-gray-900">Tipo de Pedido</h3>
                            <p className="text-gray-600 mt-2 text-lg">Como você prefere receber seu pedido?</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto">
                            <button 
                                onClick={() => {
                                    setOrderType('delivery');
                                    setStep('deliveryDetails');
                                }} 
                                className={`p-8 border-2 rounded-2xl flex flex-col items-center justify-center gap-4 transition-all ${
                                    orderType === 'delivery' 
                                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-lg' 
                                        : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300 hover:shadow-md'
                                }`}
                            >
                                <Bike className="w-16 h-16" />
                                <div className="text-center">
                                    <div className="font-bold text-xl">Entrega</div>
                                    <div className="text-gray-600 mt-1">Receba no conforto da sua casa</div>
                                </div>
                            </button>
                            
                            <button 
                                onClick={() => {
                                    setOrderType('pickup');
                                    setStep('pickupDetails');
                                }} 
                                className={`p-8 border-2 rounded-2xl flex flex-col items-center justify-center gap-4 transition-all ${
                                    orderType === 'pickup' 
                                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-lg' 
                                        : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300 hover:shadow-md'
                                }`}
                            >
                                <ShoppingBag className="w-16 h-16" />
                                <div className="text-center">
                                    <div className="font-bold text-xl">Retirada</div>
                                    <div className="text-gray-600 mt-1">Busque no estabelecimento</div>
                                </div>
                            </button>
                        </div>
                    </div>
                );

            case 'deliveryDetails':
                return (
                    <div className="p-8 space-y-8">
                        <div className="text-center">
                            <MapPin className="w-20 h-20 text-blue-600 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-gray-900">Endereço de Entrega</h3>
                            <p className="text-gray-600 mt-2">Para onde devemos entregar seu pedido?</p>
                        </div>

                        {!isAddingNewAddress ? (
                            <div className="max-w-4xl mx-auto space-y-6">
                                {userAddresses.length > 0 && (
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-lg text-gray-900">Seus endereços salvos:</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            {userAddresses.map(address => (
                                                <div 
                                                    key={address.id}
                                                    onClick={() => setSelectedAddress(address)}
                                                    className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                                                        selectedAddress?.id === address.id 
                                                            ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200' 
                                                            : 'bg-white border-gray-300 hover:border-blue-300'
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                                                            selectedAddress?.id === address.id 
                                                                ? 'bg-blue-500 border-blue-500' 
                                                                : 'border-gray-400'
                                                        }`}>
                                                            {selectedAddress?.id === address.id && <CheckCircle size={14} className="text-white" />}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-gray-900">{address.street}, {address.number}</p>
                                                            {address.complement && <p className="text-gray-600">Complemento: {address.complement}</p>}
                                                            <p className="text-gray-600">{address.neighborhood}, {address.city} - {address.state}</p>
                                                            {address.reference && <p className="text-gray-500 text-sm">Ref: {address.reference}</p>}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button 
                                    onClick={() => setIsAddingNewAddress(true)}
                                    className="w-full max-w-md mx-auto bg-white border-2 border-dashed border-gray-300 rounded-xl p-6 flex items-center justify-center gap-3 text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
                                >
                                    <Plus size={24} />
                                    <span className="font-semibold">Adicionar Novo Endereço</span>
                                </button>

                                {selectedAddress && (
                                    <div className="text-center">
                                        <button 
                                            onClick={() => setStep('payment')}
                                            className="bg-blue-600 text-white font-bold py-4 px-8 rounded-xl text-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Continuar para Pagamento
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="max-w-2xl mx-auto space-y-6">
                                <h4 className="font-semibold text-xl text-gray-900 text-center">Adicionar Novo Endereço</h4>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Rua *">
                                        <input 
                                            type="text" 
                                            value={newAddress.street}
                                            onChange={e => setNewAddress({...newAddress, street: e.target.value})}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Nome da rua"
                                        />
                                    </FormField>
                                    
                                    <FormField label="Número *">
                                        <input 
                                            type="text" 
                                            value={newAddress.number}
                                            onChange={e => setNewAddress({...newAddress, number: e.target.value})}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Número"
                                        />
                                    </FormField>
                                </div>
                                
                                <FormField label="Complemento">
                                        <input 
                                            type="text" 
                                            value={newAddress.complement}
                                            onChange={e => setNewAddress({...newAddress, complement: e.target.value})}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Apartamento, bloco, etc."
                                        />
                                </FormField>
                                
                                <FormField label="Bairro *">
                                        <input 
                                            type="text" 
                                            value={newAddress.neighborhood}
                                            onChange={e => setNewAddress({...newAddress, neighborhood: e.target.value})}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Nome do bairro"
                                        />
                                </FormField>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Cidade *">
                                        <input 
                                            type="text" 
                                            value={newAddress.city}
                                            onChange={e => setNewAddress({...newAddress, city: e.target.value})}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Cidade"
                                        />
                                    </FormField>
                                    
                                    <FormField label="Estado *">
                                        <input 
                                            type="text" 
                                            value={newAddress.state}
                                            onChange={e => setNewAddress({...newAddress, state: e.target.value})}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="UF"
                                            maxLength={2}
                                        />
                                    </FormField>
                                </div>

                                {error && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <p className="text-red-600 text-center">{error}</p>
                                    </div>
                                )}
                                
                                <div className="flex gap-4 justify-center">
                                    <button 
                                        onClick={() => setIsAddingNewAddress(false)}
                                        className="bg-gray-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-gray-600 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        onClick={handleSaveAddress}
                                        className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Salvar Endereço
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 'pickupDetails':
                return (
                    <div className="p-8 space-y-8">
                        <div className="text-center">
                            <ShoppingBag className="w-20 h-20 text-blue-600 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-gray-900">Retirada no Local</h3>
                            <p className="text-gray-600 mt-2 text-lg">Você retirará seu pedido no estabelecimento</p>
                        </div>
                        
                        <div className="max-w-2xl mx-auto">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <Clock className="w-8 h-8 text-yellow-600" />
                                    <h4 className="font-semibold text-yellow-800 text-lg">Informações para Retirada</h4>
                                </div>
                                <ul className="space-y-2 text-yellow-700">
                                    <li>• Após confirmar o pedido, aguarde a notificação de preparo</li>
                                    <li>• O tempo de preparo varia conforme o pedido</li>
                                    <li>• Apresente o número do pedido no balcão</li>
                                    <li>• Esteja no local no horário combinado</li>
                                </ul>
                            </div>
                            
                            <div className="text-center mt-8">
                                <button 
                                    onClick={() => setStep('payment')}
                                    className="bg-blue-600 text-white font-bold py-4 px-8 rounded-xl text-lg hover:bg-blue-700 transition-colors"
                                >
                                    Continuar para Pagamento
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case 'payment':
                return (
                    <div className="p-8 space-y-8">
                        <div className="text-center">
                            <CreditCard className="w-20 h-20 text-blue-600 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-gray-900">Pagamento</h3>
                            <p className="text-gray-600 mt-2">Escolha a forma de pagamento</p>
                        </div>

                        <div className="max-w-2xl mx-auto space-y-8">
                            <div className="space-y-6">
                                <h4 className="font-semibold text-xl text-gray-900 text-center">Método de Pagamento</h4>
                                
                                <div className="grid grid-cols-2 gap-6">
                                    <button 
                                        onClick={() => setPaymentMethod('dinheiro')}
                                        className={`p-6 border-2 rounded-xl flex flex-col items-center gap-4 transition-all ${
                                            paymentMethod === 'dinheiro' 
                                                ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-lg' 
                                                : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300 hover:shadow-md'
                                        }`}
                                    >
                                        <DollarSign className="w-12 h-12" />
                                        <span className="font-bold text-lg">Dinheiro</span>
                                    </button>
                                    
                                    <button 
                                        onClick={() => setPaymentMethod('cartao')}
                                        className={`p-6 border-2 rounded-xl flex flex-col items-center gap-4 transition-all ${
                                            paymentMethod === 'cartao' 
                                                ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-lg' 
                                                : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300 hover:shadow-md'
                                        }`}
                                    >
                                        <CreditCard className="w-12 h-12" />
                                        <span className="font-bold text-lg">Cartão</span>
                                    </button>
                                </div>

                                {paymentMethod === 'dinheiro' && (
                                    <div className="max-w-md mx-auto">
                                        <FormField label={`Valor para troco (Total: ${formatCurrency(totalCartValue)})`}>
                                            <input 
                                                type="number" 
                                                value={changeFor}
                                                onChange={e => setChangeFor(e.target.value)}
                                                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-center"
                                                placeholder={`Mínimo ${formatCurrency(totalCartValue)}`}
                                                min={totalCartValue}
                                                step="0.01"
                                            />
                                        </FormField>
                                    </div>
                                )}
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-6">
                                <h4 className="font-semibold text-lg text-gray-900 mb-4 text-center">Resumo Final do Pedido</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Tipo de pedido:</span>
                                            <span className="font-semibold">
                                                {orderType === 'delivery' ? 'Entrega' : 'Retirada'}
                                            </span>
                                        </div>
                                        {orderType === 'delivery' && selectedAddress && (
                                            <div>
                                                <div className="text-gray-600 mb-1">Endereço:</div>
                                                <div className="font-semibold text-gray-900">
                                                    {selectedAddress.street}, {selectedAddress.number}
                                                    {selectedAddress.complement && `, ${selectedAddress.complement}`}
                                                </div>
                                                <div className="text-gray-600 text-sm">
                                                    {selectedAddress.neighborhood}, {selectedAddress.city}-{selectedAddress.state}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Pagamento:</span>
                                            <span className="font-semibold">
                                                {paymentMethod === 'dinheiro' ? 'Dinheiro' : 'Cartão'}
                                            </span>
                                        </div>
                                        {paymentMethod === 'dinheiro' && changeFor && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Troco para:</span>
                                                <span className="font-semibold">{formatCurrency(parseFloat(changeFor))}</span>
                                            </div>
                                        )}
                                        <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                                            <span>Total:</span>
                                            <span>{formatCurrency(totalCartValue)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                    <p className="text-red-600 text-center">{error}</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            size="7xl"
            className="max-w-[1400px] h-[90vh]"
            hideCloseButton
        >
            <div className="flex h-full">
                {/* Sidebar de Navegação */}
                {renderSidebar()}
                
                {/* Conteúdo Principal */}
                <div className="flex-1 flex">
                    <div className="flex-1 overflow-y-auto">
                        {/* Header */}
                        <div className="border-b border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Finalizar Pedido</h1>
                                    <p className="text-gray-600 mt-1">
                                        {steps[currentStepIndex]?.label} • Passo {currentStepIndex + 1} de {steps.length}
                                    </p>
                                </div>
                                <button 
                                    onClick={onClose}
                                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Conteúdo do Step */}
                        <div className="p-8">
                            {renderStep()}
                        </div>
                    </div>

                    {/* Carrinho Lateral */}
                    {renderCartSidebar()}
                </div>
            </div>
        </Modal>
    );
};