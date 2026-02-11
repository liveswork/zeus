import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Modal } from '../../../../ui/Modal';
import { Search, Plus, Minus, MessageSquare, Utensils, ScanLine, Pizza } from 'lucide-react';
import { formatCurrency } from '../../../../../utils/formatters';
import { useBusiness } from '../../../../../contexts/BusinessContext';
import { ObservationModal } from '../balcao/ObservationModal';
import { ProductSearchModal } from './ProductSearchModal';
import { ComandaScanner } from '../../../modules/composer/ComandaScanner';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../../../config/firebase';
import { CombinationFlowModal } from '../balcao/CombinationFlowModal';
import { ProductCustomizationModal } from '../../../modules/common/ProductCustomizationModal';

const processComandaScan = httpsCallable(functions, 'processComandaScan');

interface OrderModalProps {
    tableStatus: 'livre' | 'ocupada' | 'pagamento';
    isOpen: boolean;
    onClose: () => void;
    order: any;
    onUpdateOrder: (order: any) => void;
    onFinalizeSale: (order: any) => void;
    showAlert: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const OrderModal: React.FC<OrderModalProps> = ({
    isOpen,
    onClose,
    order,
    tableStatus,
    onUpdateOrder,
    onFinalizeSale,
    showAlert
}) => {
    const { products } = useBusiness();
    const [cart, setCart] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Estados simplificados para controle de modais
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
    const [isCustomizationModalOpen, setIsCustomizationModalOpen] = useState(false);
    
    // States para os outros modais
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [itemToObserve, setItemToObserve] = useState<any | null>(null);
    const [isCombinationModalOpen, setIsCombinationModalOpen] = useState(false);

    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setCart(order?.items.map((item: any) => ({ ...item, cartItemId: item.id || Math.random() })) || []);
            setSearchTerm('');
            setSelectedProduct(null);
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    }, [isOpen, order]);

    // Efeito para adicionar os atalhos de teclado
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!isOpen) return;
            
            switch (event.key) {
                case 'F11':
                    event.preventDefault();
                    setIsCombinationModalOpen(true);
                    break;
                case 'F12':
                    event.preventDefault();
                    handleSave();
                    break;
                case 'F6':
                    event.preventDefault();
                    handleFinalize();
                    break;
                case 'Escape':
                    if (isSearchModalOpen || isObservationModalOpen || isScannerOpen || 
                        isCombinationModalOpen || isCustomizationModalOpen) {
                        // Deixa os modais fecharem normalmente
                        return;
                    }
                    event.preventDefault();
                    onClose();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isSearchModalOpen, isObservationModalOpen, isScannerOpen, 
        isCombinationModalOpen, isCustomizationModalOpen, cart]);

    const handleProductLookup = (e: React.FormEvent) => {
        e.preventDefault();
        const value = searchTerm.trim();
        if (value === '') return;

        const isNumeric = /^\d+$/.test(value);
        if (isNumeric) {
            const found = products.find(p => p.sku === value || p.barcode === value);
            if (found) {
                handleProductSelection(found);
            } else {
                showAlert(`Nenhum produto encontrado com o código "${value}"`, 'error');
                setSearchTerm('');
            }
        } else {
            setIsSearchModalOpen(true);
        }
    };

    // Nova função unificada para abrir o modal de personalização
    const handleProductSelection = (product: any) => {
        setSelectedProduct(product);
        setIsCustomizationModalOpen(true);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (!/^\d+$/.test(value) && value.trim() !== '') {
            setIsSearchModalOpen(true);
        } else {
            setIsSearchModalOpen(false);
        }
    };

    const handleConfirmFromSearch = (product: any) => {
        setIsSearchModalOpen(false);
        handleProductSelection(product);
    };

    // Nova função para receber o produto já personalizado
    const handleConfirmCustomization = (customizedProduct: any) => {
        const newItem = {
            ...customizedProduct,
            cartItemId: Date.now() + Math.random()
        };
        setCart(prev => [...prev, newItem]);
        setIsCustomizationModalOpen(false);
        setSelectedProduct(null);
        setSearchTerm('');
        searchInputRef.current?.focus();
        
        // Feedback baseado no tipo de personalização
        if (customizedProduct.isCombination) {
            showAlert('Combinação meio-a-meio adicionada com sucesso!', 'success');
        } else if (customizedProduct.selectedAddons && customizedProduct.selectedAddons.length > 0) {
            showAlert('Produto personalizado adicionado com sucesso!', 'success');
        } else {
            showAlert('Produto adicionado com sucesso!', 'success');
        }
    };

    const handleConfirmCombination = (combinedItem: any) => {
        const newItem = { 
            ...combinedItem, 
            cartItemId: Date.now() + Math.random(),
            isCombination: true
        };
        setCart(prevCart => [...prevCart, newItem]);
        setIsCombinationModalOpen(false);
        searchInputRef.current?.focus();
        showAlert('Combinação meio-a-meio adicionada com sucesso!', 'success');
    };

    const updateCartQty = (cartItemId: number, amount: number) => {
        const updatedCart = cart.map(item => {
            if (item.cartItemId === cartItemId) {
                return { ...item, qty: Math.max(0, item.qty + amount) };
            }
            return item;
        }).filter(item => item.qty > 0);
        setCart(updatedCart);
    };

    const handleOpenObservationModal = (item: any) => {
        setItemToObserve(item);
        setIsObservationModalOpen(true);
    };

    const handleSaveObservation = (text: string) => {
        setCart(cart.map(item =>
            item.cartItemId === itemToObserve.cartItemId ? { ...item, observation: text } : item
        ));
        setItemToObserve(null);
        setIsObservationModalOpen(false);
    };

    const handleSave = () => {
        if (cart.length === 0) {
            showAlert("A comanda está vazia. Adicione itens antes de lançar.", "warning");
            return;
        }
        onUpdateOrder({ ...order, items: cart, totalAmount });
        showAlert("Pedido lançado com sucesso!", "success");
        onClose();
    };

    const handleFinalize = () => {
        if (cart.length === 0) {
            showAlert("A comanda está vazia. Adicione itens antes de fechar.", "warning");
            return;
        }
        onFinalizeSale({ ...order, items: cart, totalAmount });
        showAlert("Comanda enviada para fechamento!", "success");
        onClose();
    };

    const handleScanComplete = async (imageData: string) => {
        showAlert("Analisando comanda com a Nexus Vision AI...", "info");
        try {
            const result: any = await processComandaScan({ imageData, layoutId: 'massa-v1' });

            if (result.data.success && result.data.pedido) {
                const scannedItems = result.data.pedido.items.map((scannedItem: any, index: number) => {
                    const productData = products.find(p => p.name.toLowerCase() === scannedItem.name.toLowerCase());

                    return {
                        ...(productData || {}),
                        id: productData?.id || `scanned_${index}_${Date.now()}`,
                        name: scannedItem.name,
                        qty: scannedItem.quantity,
                        salePrice: scannedItem.price,
                        observation: scannedItem.observation,
                        cartItemId: Date.now() + index,
                        isScanned: true
                    };
                });

                setCart(prevCart => [...prevCart, ...scannedItems]);
                showAlert(`${scannedItems.length} tipos de item adicionados via scan!`, "success");
            } else {
                throw new Error("A IA não conseguiu processar a comanda.");
            }
        } catch (error: any) {
            showAlert(`Erro da IA: ${error.message}`, "error");
        }
    };

    const totalAmount = useMemo(() => cart.reduce((total, item) => total + (item.salePrice * item.qty), 0), [cart]);
    const isLocked = tableStatus === 'pagamento';

    if (!isOpen || !order) return null;

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={`Pedido Mesa - ${order.tableName}`} maxWidth="max-w-7xl">
                <div className="grid grid-cols-12 gap-6 h-[70vh]">
                    {/* Coluna Esquerda */}
                    <div className="col-span-5 flex flex-col">
                        <form onSubmit={handleProductLookup}>
                            <input
                                id="product-search-input"
                                disabled={isLocked}
                                ref={searchInputRef}
                                type="text"
                                placeholder="Código ou nome do produto e tecle Enter"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="w-full p-4 pl-5 text-lg border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                autoComplete="off"
                            />
                        </form>
                        
                        {isLocked && (
                            <div className="text-center p-4 bg-yellow-100 border border-yellow-300 rounded-lg text-yellow-800 mt-4">
                                <p className="font-bold">Mesa em modo de pagamento.</p>
                                <p className="text-sm">Não é possível adicionar novos itens.</p>
                            </div>
                        )}
                        
                        <div className="flex-grow mt-4 overflow-y-auto pr-2">
                            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg">
                                <h4 className="font-bold flex items-center gap-2">
                                    <Utensils size={16} />
                                    Como Lançar:
                                </h4>
                                <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                                    <li>Digite o nome do produto para buscar</li>
                                    <li><b>F11</b> = Montar Meio-a-Meio</li>
                                    <li><b>F12</b> = Lançar Pedido (fecha modal)</li>
                                    <li><b>F6</b> = Fechamento (fecha modal)</li>
                                    <li><b>ESC</b> = Fechar modal</li>
                                </ul>
                            </div>
                            
                            {/* Status rápido do pedido */}
                            <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
                                <h5 className="font-semibold text-gray-700 mb-2">Resumo Rápido</h5>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="text-gray-600">Itens no carrinho:</div>
                                    <div className="font-semibold text-right">{cart.length}</div>
                                    
                                    <div className="text-gray-600">Valor total:</div>
                                    <div className="font-semibold text-right text-green-600">{formatCurrency(totalAmount)}</div>
                                    
                                    <div className="text-gray-600">Status mesa:</div>
                                    <div className={`font-semibold text-right ${
                                        tableStatus === 'livre' ? 'text-green-600' : 
                                        tableStatus === 'ocupada' ? 'text-blue-600' : 
                                        'text-orange-600'
                                    }`}>
                                        {tableStatus.toUpperCase()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Coluna Direita: Comanda */}
                    <div className="col-span-7 bg-gray-50 rounded-lg p-4 flex flex-col border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">
                                Comanda ({cart.length} {cart.length === 1 ? 'item' : 'itens'})
                            </h3>
                            {totalAmount > 0 && (
                                <div className="text-sm text-gray-600">
                                    Subtotal: <span className="font-bold text-green-600">{formatCurrency(totalAmount)}</span>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <Utensils size={48} className="mb-2" />
                                    <p className="font-semibold">Nenhum item na comanda</p>
                                    <p className="text-sm mt-1">Use a busca para adicionar produtos</p>
                                </div>
                            ) : cart.map((item) => (
                                <div key={item.cartItemId} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                                    <div className="flex-1">
                                        <div className="flex items-start gap-2">
                                            {item.isCombination && (
                                                <Pizza size={14} className="text-orange-500 mt-1 flex-shrink-0" />
                                            )}
                                            {item.isScanned && (
                                                <ScanLine size={14} className="text-purple-500 mt-1 flex-shrink-0" />
                                            )}
                                            {item.selectedAddons && item.selectedAddons.length > 0 && (
                                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                                            )}
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-800">{item.name}</p>
                                                {item.observation && (
                                                    <p className="text-xs text-blue-600 italic pl-2 mt-1">↳ {item.observation}</p>
                                                )}
                                                {/* Exibir complementos selecionados */}
                                                {item.selectedAddons && item.selectedAddons.length > 0 && (
                                                    <div className="mt-1 pl-2">
                                                        {item.selectedAddons.map((addon: any, index: number) => (
                                                            <p key={index} className="text-xs text-green-600">
                                                                + {addon.name} {addon.price > 0 && `(+${formatCurrency(addon.price)})`}
                                                            </p>
                                                        ))}
                                                    </div>
                                                )}
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {formatCurrency(item.salePrice)} x {item.qty} = 
                                                    <strong className="ml-1 text-green-600">{formatCurrency(item.salePrice * item.qty)}</strong>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => handleOpenObservationModal(item)} 
                                            className="p-2 rounded-full text-gray-500 hover:bg-gray-200 transition-colors" 
                                            title="Adicionar Observação"
                                        >
                                            <MessageSquare size={18} />
                                        </button>
                                        <button 
                                            onClick={() => updateCartQty(item.cartItemId, -1)} 
                                            className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                            disabled={isLocked}
                                        >
                                            <Minus size={16} />
                                        </button>
                                        <span className="font-bold w-6 text-center text-gray-700">{item.qty}</span>
                                        <button 
                                            onClick={() => updateCartQty(item.cartItemId, 1)} 
                                            className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                                            disabled={isLocked}
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="border-t mt-4 pt-4">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-bold text-gray-800">Total:</span>
                                <span className="text-3xl font-bold text-green-700">{formatCurrency(totalAmount)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer com botões */}
                <footer className="flex justify-between items-center pt-5 mt-4 border-t">
                    <div className="flex space-x-3">
                        <button 
                            onClick={() => setIsCombinationModalOpen(true)} 
                            disabled={isLocked} 
                            className="bg-orange-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            <Pizza size={18}/> Meio-a-Meio (F11)
                        </button>
                        <button 
                            className="bg-gray-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors"
                        >
                            Opções
                        </button>
                        <button 
                            onClick={() => setIsScannerOpen(true)} 
                            disabled={isLocked} 
                            className="bg-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            <ScanLine size={16} /> Scanner
                        </button>
                    </div>
                    <div className="space-x-3">
                        <button 
                            id="finalize-order-button"
                            onClick={handleSave} 
                            disabled={isLocked} 
                            className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            Lançar Pedido (F12)
                        </button>
                        <button 
                            onClick={handleFinalize} 
                            className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Fechamento (F6)
                        </button>
                    </div>
                </footer>
            </Modal>
            
            {/* Modais auxiliares */}
            <ProductSearchModal 
                isOpen={isSearchModalOpen} 
                onClose={() => setIsSearchModalOpen(false)} 
                products={products} 
                initialSearchTerm={searchTerm} 
                onConfirm={handleConfirmFromSearch} 
                onDoubleClick={handleConfirmFromSearch} 
            />
            
            {/* Modal unificado de customização - substitui QuantityModal e ProductAddonsModal */}
            {selectedProduct && (
                <ProductCustomizationModal
                    isOpen={isCustomizationModalOpen}
                    onClose={() => {
                        setIsCustomizationModalOpen(false);
                        setSelectedProduct(null);
                    }}
                    product={selectedProduct}
                    onConfirm={handleConfirmCustomization}
                />
            )}
            
            <ObservationModal 
                isOpen={isObservationModalOpen} 
                onClose={() => setIsObservationModalOpen(false)} 
                onSave={handleSaveObservation}
                initialValue={itemToObserve?.observation || ''} 
            />
            
            <ComandaScanner 
                isOpen={isScannerOpen} 
                onClose={() => setIsScannerOpen(false)} 
                onScan={handleScanComplete} 
            />

            {/* Modal de combinação meio-a-meio */}
            <CombinationFlowModal
                isOpen={isCombinationModalOpen}
                onClose={() => setIsCombinationModalOpen(false)}
                onConfirm={handleConfirmCombination}
                products={products.filter(p => p.allowCombination)}
            />
        </>
    );
};