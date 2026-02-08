// src/components/public/checkout/CustomerCheckoutModal.mobile.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../../../contexts/AuthContext';
import { useUI } from '../../../../../contexts/UIContext';
import { Modal } from '../../../../ui/Modal';
import { FormField } from '../../../../ui/FormField';
import { 
    Loader, Lock, Mail, Phone, User, Home, Bike, 
    ShoppingBag, CreditCard, DollarSign, MapPin, 
    Plus, ChevronLeft, Check, X
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

    // Header com progresso
    const steps = ['identify', 'orderType', 'deliveryDetails', 'payment'] as const;
    const currentStepIndex = steps.indexOf(step as any);

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
            showAlert("Pedido finalizado!", "success");
            onOrderFinalized();
            onClose();
        } catch (err: any) {
            setError(err.message || "Erro ao finalizar pedido.");
        } finally {
            setLoading(false);
        }
    };

    const renderProgressBar = () => (
        <div className="px-4 py-3 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-2">
                <button 
                    onClick={() => {
                        if (step === 'orderType') setStep('identify');
                        else if (step === 'deliveryDetails' || step === 'pickupDetails') setStep('orderType');
                        else if (step === 'payment') setStep(orderType === 'delivery' ? 'deliveryDetails' : 'pickupDetails');
                    }}
                    className="p-1 text-gray-600"
                    disabled={step === 'identify'}
                >
                    <ChevronLeft size={24} />
                </button>
                <span className="text-sm font-medium text-gray-600">
                    Passo {currentStepIndex + 1} de {steps.length}
                </span>
                <button onClick={onClose} className="p-1 text-gray-600">
                    <X size={24} />
                </button>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                />
            </div>
        </div>
    );

    const renderStep = () => {
        switch (step) {
            case 'identify':
                return (
                    <div className="p-4 space-y-6">
                        <div className="text-center">
                            <Phone className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900">Seu WhatsApp</h3>
                            <p className="text-gray-600 mt-2">Digite seu número para continuar</p>
                        </div>
                        
                        <FormField label={''} >
                            <input
                                type="tel"
                                placeholder="(85) 91234-5678"
                                value={formattedWhatsapp}
                                onChange={handleWhatsappChange}
                                maxLength={15}
                                className="w-full p-4 border border-gray-300 rounded-xl text-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </FormField>
                        
                        {error && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</p>}
                        
                        <button 
                            onClick={handleSearchUser} 
                            disabled={loading || !whatsapp}
                            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl text-lg disabled:bg-gray-400 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader className="w-5 h-5 animate-spin" /> : "Continuar"}
                        </button>
                    </div>
                );

            case 'authenticate':
                return (
                    <div className="p-4 space-y-6">
                        <div className="text-center">
                            <Lock className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900">Olá, {foundUser?.displayName}!</h3>
                            <p className="text-gray-600 mt-2">Digite sua senha</p>
                        </div>
                        
                        <FormField label={''} >
                            <input 
                                type="password" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)}
                                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Sua senha"
                            />
                        </FormField>
                        
                        {error && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</p>}
                        
                        <button 
                            onClick={handleAuthenticate} 
                            disabled={loading || !password}
                            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl text-lg disabled:bg-gray-400 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader className="w-5 h-5 animate-spin" /> : "Entrar"}
                        </button>
                    </div>
                );

            case 'register':
                return (
                    <div className="p-4 space-y-4">
                        <div className="text-center">
                            <User className="w-16 h-16 text-green-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900">Criar Conta</h3>
                            <p className="text-gray-600">WhatsApp: {formattedWhatsapp}</p>
                        </div>
                        
                        <FormField label={''} >
                            <input 
                                type="text" 
                                value={name} 
                                onChange={e => setName(e.target.value)}
                                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Seu nome completo"
                            />
                        </FormField>
                        
                        <FormField label={''} >
                            <input 
                                type="email" 
                                value={email} 
                                onChange={e => setEmail(e.target.value)}
                                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="seu@email.com"
                            />
                        </FormField>
                        
                        <FormField label={''} >
                            <input 
                                type="password" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)}
                                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Senha (6+ caracteres)"
                            />
                        </FormField>
                        
                        {error && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</p>}
                        
                        <button 
                            onClick={handleRegister} 
                            disabled={loading || !name || !email || !password}
                            className="w-full bg-green-600 text-white font-bold py-4 rounded-xl text-lg disabled:bg-gray-400 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader className="w-5 h-5 animate-spin" /> : "Criar Conta"}
                        </button>
                    </div>
                );

            case 'orderType':
                return (
                    <div className="p-4 space-y-6">
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-gray-900">Como prefere?</h3>
                        </div>
                        
                        <div className="space-y-3">
                            <button 
                                onClick={() => {
                                    setOrderType('delivery');
                                    setStep('deliveryDetails');
                                }} 
                                className="w-full p-4 border-2 border-blue-500 bg-blue-50 rounded-xl flex items-center gap-4"
                            >
                                <Bike className="w-8 h-8 text-blue-600" />
                                <div className="text-left">
                                    <div className="font-semibold text-blue-700">Entrega</div>
                                    <div className="text-sm text-blue-600">Receba em casa</div>
                                </div>
                            </button>
                            
                            <button 
                                onClick={() => {
                                    setOrderType('pickup');
                                    setStep('pickupDetails');
                                }} 
                                className="w-full p-4 border-2 border-gray-300 bg-white rounded-xl flex items-center gap-4"
                            >
                                <ShoppingBag className="w-8 h-8 text-gray-600" />
                                <div className="text-left">
                                    <div className="font-semibold text-gray-700">Retirada</div>
                                    <div className="text-sm text-gray-600">Busque no local</div>
                                </div>
                            </button>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-4">
                            <h4 className="font-semibold mb-3">Seu Pedido</h4>
                            {cart.map(item => (
                                <div key={item.id} className="flex justify-between text-sm py-1">
                                    <span>{item.qty}x {item.name}</span>
                                    <span>{formatCurrency(item.salePrice * item.qty)}</span>
                                </div>
                            ))}
                            <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                                <span>Total:</span>
                                <span>{formatCurrency(totalCartValue)}</span>
                            </div>
                        </div>
                    </div>
                );

            case 'deliveryDetails':
                return (
                    <div className="p-4 space-y-6">
                        <div className="text-center">
                            <MapPin className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900">Endereço</h3>
                        </div>

                        {!isAddingNewAddress ? (
                            <>
                                {userAddresses.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="font-semibold">Endereços Salvos</h4>
                                        {userAddresses.map(address => (
                                            <div 
                                                key={address.id}
                                                onClick={() => setSelectedAddress(address)}
                                                className={`p-4 border-2 rounded-xl ${
                                                    selectedAddress?.id === address.id 
                                                        ? 'border-blue-500 bg-blue-50' 
                                                        : 'border-gray-300'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                                        selectedAddress?.id === address.id 
                                                            ? 'bg-blue-500 border-blue-500' 
                                                            : 'border-gray-400'
                                                    }`}>
                                                        {selectedAddress?.id === address.id && <Check size={14} className="text-white" />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-semibold">{address.street}, {address.number}</p>
                                                        <p className="text-sm text-gray-600">{address.neighborhood}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button 
                                    onClick={() => setIsAddingNewAddress(true)}
                                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center gap-2 text-gray-600"
                                >
                                    <Plus size={20} />
                                    Novo Endereço
                                </button>

                                {selectedAddress && (
                                    <button 
                                        onClick={() => setStep('payment')}
                                        className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl text-lg"
                                    >
                                        Continuar
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className="space-y-4">
                                <h4 className="font-semibold">Novo Endereço</h4>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <FormField label={''} >
                                        <input 
                                            type="text" 
                                            value={newAddress.street}
                                            onChange={e => setNewAddress({...newAddress, street: e.target.value})}
                                            className="w-full p-3 border border-gray-300 rounded-lg"
                                            placeholder="Rua"
                                        />
                                    </FormField>
                                    
                                    <FormField label={''} >
                                        <input 
                                            type="text" 
                                            value={newAddress.number}
                                            onChange={e => setNewAddress({...newAddress, number: e.target.value})}
                                            className="w-full p-3 border border-gray-300 rounded-lg"
                                            placeholder="Número"
                                        />
                                    </FormField>
                                </div>
                                
                                <FormField label={''} >
                                    <input 
                                        type="text" 
                                        value={newAddress.complement}
                                        onChange={e => setNewAddress({...newAddress, complement: e.target.value})}
                                        className="w-full p-3 border border-gray-300 rounded-lg"
                                        placeholder="Complemento"
                                    />
                                </FormField>
                                
                                <FormField label={''} >
                                    <input 
                                        type="text" 
                                        value={newAddress.neighborhood}
                                        onChange={e => setNewAddress({...newAddress, neighborhood: e.target.value})}
                                        className="w-full p-3 border border-gray-300 rounded-lg"
                                        placeholder="Bairro"
                                    />
                                </FormField>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <FormField label={''} >
                                        <input 
                                            type="text" 
                                            value={newAddress.city}
                                            onChange={e => setNewAddress({...newAddress, city: e.target.value})}
                                            className="w-full p-3 border border-gray-300 rounded-lg"
                                            placeholder="Cidade"
                                        />
                                    </FormField>
                                    
                                    <FormField label={''} >
                                        <input 
                                            type="text" 
                                            value={newAddress.state}
                                            onChange={e => setNewAddress({...newAddress, state: e.target.value})}
                                            className="w-full p-3 border border-gray-300 rounded-lg"
                                            placeholder="UF"
                                            maxLength={2}
                                        />
                                    </FormField>
                                </div>

                                {error && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</p>}
                                
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setIsAddingNewAddress(false)}
                                        className="flex-1 bg-gray-500 text-white font-bold py-3 rounded-lg"
                                    >
                                        Voltar
                                    </button>
                                    <button 
                                        onClick={handleSaveAddress}
                                        className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-lg"
                                    >
                                        Salvar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 'pickupDetails':
                return (
                    <div className="p-4 space-y-6">
                        <div className="text-center">
                            <ShoppingBag className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900">Retirada</h3>
                            <p className="text-gray-600">Você buscará no local</p>
                        </div>
                        
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                            <p className="text-sm text-yellow-800 text-center">
                                Aguarde a confirmação de que seu pedido está pronto para retirada.
                            </p>
                        </div>
                        
                        <button 
                            onClick={() => setStep('payment')}
                            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl text-lg"
                        >
                            Continuar
                        </button>
                    </div>
                );

            case 'payment':
                return (
                    <div className="p-4 space-y-6">
                        <div className="text-center">
                            <CreditCard className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900">Pagamento</h3>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-semibold">Forma de Pagamento</h4>
                            
                            <div className="space-y-3">
                                <button 
                                    onClick={() => setPaymentMethod('dinheiro')}
                                    className={`w-full p-4 border-2 rounded-xl flex items-center gap-4 ${
                                        paymentMethod === 'dinheiro' 
                                            ? 'border-blue-500 bg-blue-50' 
                                            : 'border-gray-300'
                                    }`}
                                >
                                    <DollarSign className="w-6 h-6" />
                                    <span className="font-semibold">Dinheiro</span>
                                </button>
                                
                                <button 
                                    onClick={() => setPaymentMethod('cartao')}
                                    className={`w-full p-4 border-2 rounded-xl flex items-center gap-4 ${
                                        paymentMethod === 'cartao' 
                                            ? 'border-blue-500 bg-blue-50' 
                                            : 'border-gray-300'
                                    }`}
                                >
                                    <CreditCard className="w-6 h-6" />
                                    <span className="font-semibold">Cartão</span>
                                </button>
                            </div>

                            {paymentMethod === 'dinheiro' && (
                                <FormField label={''} >
                                    <input 
                                        type="number" 
                                        value={changeFor}
                                        onChange={e => setChangeFor(e.target.value)}
                                        className="w-full p-4 border border-gray-300 rounded-xl"
                                        placeholder={`Troco para quanto? (Mín: ${formatCurrency(totalCartValue)})`}
                                        min={totalCartValue}
                                        step="0.01"
                                    />
                                </FormField>
                            )}
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                            <h4 className="font-semibold">Resumo</h4>
                            <div className="flex justify-between text-sm">
                                <span>Tipo:</span>
                                <span>{orderType === 'delivery' ? 'Entrega' : 'Retirada'}</span>
                            </div>
                            {orderType === 'delivery' && selectedAddress && (
                                <div className="flex justify-between text-sm">
                                    <span>Endereço:</span>
                                    <span className="text-right">{selectedAddress.street}, {selectedAddress.number}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm">
                                <span>Pagamento:</span>
                                <span>{paymentMethod === 'dinheiro' ? 'Dinheiro' : 'Cartão'}</span>
                            </div>
                            <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                                <span>Total:</span>
                                <span>{formatCurrency(totalCartValue)}</span>
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</p>}

                        <button 
                            onClick={handleFinalizeOrder}
                            disabled={loading || (paymentMethod === 'dinheiro' && (!changeFor || parseFloat(changeFor) < totalCartValue))}
                            className="w-full bg-green-600 text-white font-bold py-4 rounded-xl text-lg disabled:bg-gray-400 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader className="w-5 h-5 animate-spin" /> : `Finalizar - ${formatCurrency(totalCartValue)}`}
                        </button>
                    </div>
                );
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose}
            hideCloseButton
            className="h-full max-h-full w-full max-w-full m-0 rounded-none"
            overlayClassName="fixed inset-0 z-50"
        >
            <div className="h-full flex flex-col bg-white">
                {renderProgressBar()}
                <div className="flex-1 overflow-y-auto">
                    {renderStep()}
                </div>
            </div>
        </Modal>
    );
};