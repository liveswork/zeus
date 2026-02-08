import { useState, useMemo, useEffect } from 'react';
import { X, Search, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../../../utils/formatters';


// ✅ Importe o novo componente de observação
// import { ObservationInput } from '../common/ObservationInput';

import { NexusScribeAI } from '../common/ObservationInput';

// Componente para os cards de produto
const ProductCard = ({ product, onSelect }: any) => (
    <div onClick={() => onSelect(product)} className="bg-white rounded-xl shadow-sm text-left overflow-hidden transform hover:scale-105 active:scale-95 transition-transform duration-200">
        <div className="h-24 bg-gray-200 flex items-center justify-center">
            {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" /> : <span className="text-gray-400 text-xs">Sem Imagem</span>}
        </div>
        <div className="p-3">
            <h4 className="font-semibold text-gray-800 text-sm truncate">{product.name}</h4>
            <p className="font-bold text-lg text-black mt-1">{formatCurrency(product.salePrice)}</p>
        </div>
    </div>
);

// O NOVO FLUXO DE LANÇAMENTO MOBILE
export const MobileOrderCreation = ({ 
    isOpen, 
    onClose, 
    customerData, 
    products, 
    onOrderCreated,
    customerAddresses, 
    deliveryFees,
}: any) => {


    const [step, setStep] = useState(1); // 1: Produtos, 2: Comanda
    const [cart, setCart] = useState<any[]>([]);
    const [activeCategory, setActiveCategory] = useState('Todos');

    // ✅ Novo estado para as observações gerais do pedido
    const [generalObservations, setGeneralObservations] = useState('');

    // ✅ ESTADOS PARA ENDEREÇO E TAXA
    const [selectedAddressId, setSelectedAddressId] = useState('');
    const [deliveryFee, setDeliveryFee] = useState(0);

    // ✅ LÓGICA DE AUTO-SELEÇÃO E CÁLCULO DE TAXA
    useEffect(() => {
        if (isOpen && customerAddresses && customerAddresses.length > 0) {
            setSelectedAddressId(customerAddresses[0].id);
        }
    }, [isOpen, customerAddresses]);

    useEffect(() => {
        if (selectedAddressId && customerAddresses.length > 0) {
            const selectedAddress = customerAddresses.find((addr: any) => addr.id === selectedAddressId);
            if (selectedAddress) {
                const fee = selectedAddress.deliveryFee || 
                            deliveryFees.find((df: any) => df.neighborhood?.toLowerCase() === selectedAddress.neighborhood?.toLowerCase())?.fee || 
                            0;
                setDeliveryFee(fee);
            }
        }
    }, [selectedAddressId, customerAddresses, deliveryFees]);

    const categories = useMemo(() =>
        products ? ['Todos', ...new Set(products.map((p: any) => p.category).filter(Boolean))] : ['Todos'],
        [products]);

    const filteredProducts = useMemo(() => {
        return products.filter((p: any) => activeCategory === 'Todos' || p.category === activeCategory);
    }, [products, activeCategory]);

    const addToCart = (product: any, observation: string = '') => {
        setCart(prev => {
            // Lógica para adicionar ao carrinho, agora com observação
            const newItem = { ...product, qty: 1, observation };
            return [...prev, newItem];
        });
    };
    // ✅ NOVA FUNÇÃO: Adiciona ou atualiza a observação geral do pedido
    const handleSaveObservation = (observation: string) => {
        setGeneralObservations(prev => prev ? `${prev}; ${observation}` : observation);
    };

    const addMultipleToCart = (commands: { product: any, quantity: number, observation: string }[]) => {
        setCart(prevCart => {
            const newCart = [...prevCart];
            commands.forEach(cmd => {
                const existingIndex = newCart.findIndex(item => item.id === cmd.product.id);
                if (existingIndex > -1) {
                    newCart[existingIndex].qty += cmd.quantity;
                    newCart[existingIndex].observation = `${newCart[existingIndex].observation} ${cmd.observation}`.trim();
                } else {
                    newCart.push({ ...cmd.product, qty: cmd.quantity, observation: cmd.observation });
                }
            });
            return newCart;
        });
    };

    const total = useMemo(() => {
        const itemsTotal = cart.reduce((sum, item) => sum + item.salePrice * item.qty, 0);
        return itemsTotal + deliveryFee;
    }, [cart, deliveryFee]);

    const handleCreateOrder = () => {
        if (cart.length === 0 || !selectedAddressId) {
            alert(cart.length === 0 ? 'O carrinho está vazio.' : 'Selecione um endereço de entrega.');
            return;
        }
        const selectedAddress = customerAddresses.find((addr: any) => addr.id === selectedAddressId);
        onOrderCreated({
            items: cart,
            totalAmount: total - deliveryFee,
            finalAmount: total,
            deliveryFee,
            deliveryAddress: selectedAddress.fullAddress,
            addressDetails: selectedAddress,
            observations: generalObservations,
            origin: 'delivery',
            orderType: 'delivery',
        });
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-white z-[100] flex flex-col font-sans">
            {/* Header */}
            <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-100">
                <div>
                    <p className="text-sm text-gray-500">Pedido para</p>
                    <h2 className="font-bold text-lg text-black">{customerData.displayName}</h2>
                </div>
                <button onClick={onClose} className="p-2 text-gray-400 hover:text-black"><X size={24} /></button>
            </header>

            {/* Corpo Principal */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Abas de Navegação (Produtos / Comanda) */}
                <div className="flex-shrink-0 flex border-b border-gray-100">
                    <button onClick={() => setStep(1)} className={`flex-1 py-3 text-center font-semibold ${step === 1 ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-400'}`}>Produtos</button>
                    <button onClick={() => setStep(2)} className={`flex-1 py-3 text-center font-semibold ${step === 2 ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-400'}`}>
                        Comanda ({cart.length})
                    </button>
                </div>

                {/* Conteúdo da Aba de Produtos */}
                {step === 1 && (
                    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
                        <div className="p-4">
                            <div className="relative">
                                <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="text" placeholder="Buscar produto..." className="w-full pl-10 pr-4 py-3 border-gray-200 border rounded-xl" />
                            </div>
                        </div>
                        <div className="flex-shrink-0 px-4 pb-2">
                            <div className="flex gap-2 overflow-x-auto">
                                {categories.map(cat => (
                                    <button key={String(cat)} onClick={() => setActiveCategory(String(cat))} className={`px-4 py-1.5 text-sm font-medium whitespace-nowrap rounded-full ${activeCategory === cat ? 'bg-black text-white' : 'bg-white text-black'}`}>{String(cat)}</button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="grid grid-cols-2 gap-4">
                                {filteredProducts.map((p: any) => <ProductCard key={p.id} product={p} onSelect={addToCart} />)}
                            </div>
                        </div>
                    </div>
                )}

                {/* Conteúdo da Aba de Comanda */}
                {step === 2 && (
                    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
                        <div className="p-4 border-b border-gray-200 bg-white">
                            <label className="text-sm font-semibold text-gray-700">Entregar em:</label>
                            <select value={selectedAddressId} onChange={(e) => setSelectedAddressId(e.target.value)} className="w-full mt-1 p-3 border-gray-200 border rounded-xl">
                                {/* ✅ CORREÇÃO: Adicionada verificação de segurança para 'customerAddresses' */}
                                {customerAddresses && customerAddresses.map((addr: any) => (
                                    <option key={addr.id} value={addr.id}>{addr.fullAddress}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {cart.map(item => (
                                <div key={item.id} className="flex items-center bg-white p-3 rounded-lg">
                                    <div className="flex-1"><p className="font-semibold">{item.name}</p><p className="text-sm text-gray-500">{formatCurrency(item.salePrice)}</p></div>
                                    <div className="flex items-center gap-3"><span className="font-bold text-lg">{item.qty}x</span></div>
                                    <p className="font-bold w-24 text-right text-lg">{formatCurrency(item.qty * item.salePrice)}</p>
                                </div>
                            ))}
                        </div>
                        <div className="p-4">
                            <NexusScribeAI 
                                products={products} 
                                onMultiCommand={addMultipleToCart} 
                            />
                        </div>
                    </div>
                )}
            </main>

            {/* Footer Fixo */}
            <footer className="flex-shrink-0 p-4 bg-white border-t border-gray-100">
                <div className="flex justify-between items-center mb-1 text-sm">
                    <span className="text-gray-500">Taxa de Entrega</span>
                    <span className="font-semibold">{formatCurrency(deliveryFee)}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-500">Total do Pedido</span>
                    <span className="font-bold text-2xl text-black">{formatCurrency(total)}</span>
                </div>
                <button onClick={handleCreateOrder} className="w-full py-4 bg-orange-500 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                    Continuar <ArrowRight size={20} />
                </button>
            </footer>
        </div>
    );
};