// src/components/business/modules/delivery/OrderCreationModal.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, MapPin, DollarSign, Package, X, Edit3, Pizza, Trash2 } from 'lucide-react';
import { useBusiness } from '../../../../contexts/BusinessContext';
import { Modal } from '../../../ui/Modal';
import { FormField } from '../../../ui/FormField';
import { useUI } from '../../../../contexts/UIContext';
import { formatCurrency } from '../../../../utils/formatters';
import { CombinationFlowModal } from '../../food/modules/balcao/CombinationFlowModal';
import { NexusUpsellWidget } from '../../../ai/NexusUpsellWidget';
import { ProductCustomizationModal } from '../common/ProductCustomizationModal';
import { MobileOrderCreation } from './MobileOrderCreation';

interface OrderCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerData: any;
  customerAddresses: any[];
  deliveryFees: any[];
  onOrderCreated: (orderData: any) => void;
  initialOrderData?: any | null;
}

export const OrderCreationModal: React.FC<OrderCreationModalProps> = ({
  isOpen,
  onClose,
  customerData,
  customerAddresses,
  deliveryFees,
  onOrderCreated,
  initialOrderData = null
}) => {
  const { products } = useBusiness();
  const { showAlert } = useUI();
  const isEditing = !!initialOrderData;

  interface CartItem {
    id: string;
    name: string;
    salePrice: number;
    qty: number;
    observation?: string;
    isCombined?: boolean;
    halves?: any[];
    costPrice?: number;
    cartItemId?: number;
    [key: string]: any;
  }

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [observations, setObservations] = useState('');
  const [isCombinationModalOpen, setIsCombinationModalOpen] = useState(false);
  const [isCustomizationModalOpen, setIsCustomizationModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showUpsellWidget, setShowUpsellWidget] = useState(false);
  const [lastAddedProduct, setLastAddedProduct] = useState<any | null>(null);

  // --- EFEITO ATUALIZADO PARA CARREGAR DADOS DE EDIÇÃO ---
  useEffect(() => {
    if (isOpen) {
      if (isEditing && initialOrderData) {
        // Modo Edição: Preenche o formulário com os dados do pedido existente
        setCart(initialOrderData.items || []);
        
        // CORREÇÃO: Buscar o ID do endereço exato usado no pedido original
        const findOriginalAddressId = () => {
          if (!initialOrderData.addressDetails?.id) {
            // Se não tem ID no addressDetails, tenta encontrar pelo endereço completo
            const matchingAddress = customerAddresses.find(addr => 
              addr.fullAddress === initialOrderData.deliveryAddress
            );
            return matchingAddress?.id || customerAddresses[0]?.id || '';
          }
          
          // Busca pelo ID exato do endereço salvo no pedido
          const originalAddress = customerAddresses.find(addr => 
            addr.id === initialOrderData.addressDetails.id
          );
          
          return originalAddress?.id || customerAddresses[0]?.id || '';
        };
        
        setSelectedAddressId(findOriginalAddressId());
        setDeliveryFee(initialOrderData.deliveryFee || 0);
        setObservations(initialOrderData.observations || '');
      } else {
        // Modo Criação: Reseta o formulário
        setCart([]);
        setSelectedAddressId(customerAddresses.length > 0 ? customerAddresses[0].id : '');
        setDeliveryFee(0);
        setSearchTerm('');
        setActiveCategory('Todos');
        setObservations('');
      }
    }
  }, [isOpen, initialOrderData, isEditing, customerAddresses]);

  // Detectar se é mobile
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const categories = useMemo(() =>
    ['Todos', ...new Set(products.map(p => p.category).filter(Boolean))],
    [products]
  );

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const categoryMatch = activeCategory === 'Todos' || p.category === activeCategory;
      const searchMatch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      return categoryMatch && searchMatch && p.showInCatalog;
    });
  }, [products, activeCategory, searchTerm]);

  const subtotal = useMemo(() =>
    cart.reduce((total, item) => total + (item.salePrice * item.qty), 0),
    [cart]
  );

  const total = subtotal + deliveryFee;

  // Auto-calcular taxa quando endereço é selecionado
  useEffect(() => {
    if (selectedAddressId) {
      const selectedAddress = customerAddresses.find(addr => addr.id === selectedAddressId);
      if (selectedAddress) {
        const fee = selectedAddress.deliveryFee ||
          deliveryFees.find(df => df.neighborhood.toLowerCase() === selectedAddress.neighborhood?.toLowerCase())?.fee ||
          0;
        setDeliveryFee(fee);
      }
    }
  }, [selectedAddressId, customerAddresses, deliveryFees]);

  const handleConfirmCombination = (combinedItem: any) => {
    setCart(prevCart => [...prevCart, { ...combinedItem, cartItemId: Date.now() + Math.random() }]);
    setIsCombinationModalOpen(false);
  };

  // FUNÇÃO DE SELEÇÃO DE PRODUTO COM FLUXO DE UPSELL
  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    setIsCustomizationModalOpen(true);
  };

  // NOVA FUNÇÃO: Handler para produto personalizado com trigger de upsell
  const handleConfirmCustomization = (customizedProduct: any) => {
    // Adiciona o produto ao carrinho
    setCart(prev => [...prev, customizedProduct]);
    
    // Prepara dados para o upsell
    setLastAddedProduct({
      product: customizedProduct,
      customer: customerData,
      currentCart: cart,
      orderContext: {
        subtotal,
        deliveryFee,
        total,
        itemCount: cart.length + 1
      }
    });
    
    // Fecha o modal de personalização
    setIsCustomizationModalOpen(false);
    setSelectedProduct(null);
    
    // Trigger para mostrar o widget de upsell (apenas se não estiver editando)
    if (!isEditing) {
      setTimeout(() => {
        setShowUpsellWidget(true);
      }, 500);
    }
  };

  // FUNÇÃO PARA ADICIONAR SUGESTÃO DO UPSELL AO CARRINHO
  const handleUpsellAddToCart = (upsellProduct: any) => {
    const productToAdd = {
      ...upsellProduct,
      qty: 1,
      cartItemId: Date.now() + Math.random(),
      observation: 'Sugerido pela IA'
    };
    
    setCart(prev => [...prev, productToAdd]);
    setShowUpsellWidget(false);
    
    showAlert('Produto sugerido adicionado com sucesso!', 'success');
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

  // --- FUNÇÃO DE SALVAR ATUALIZADA ---
  const handleSaveOrder = () => {
    if (cart.length === 0) {
      showAlert('Adicione produtos ao pedido', 'error');
      return;
    }

    if (!selectedAddressId) {
      showAlert('Selecione um endereço de entrega', 'error');
      return;
    }

    const selectedAddress = customerAddresses.find(addr => addr.id === selectedAddressId);

    const orderData = {
      // Se estiver editando, mantém o ID original e outros dados importantes
      ...(isEditing && { 
        id: initialOrderData.id,
        orderNumber: initialOrderData.orderNumber,
        createdAt: initialOrderData.createdAt,
        // Mantém o status atual do pedido
        status: initialOrderData.status, 
        paymentDetails: initialOrderData.paymentDetails
      }),
      
      items: cart.map(item => ({
        ...item,
        productId: item.id,
        name: item.name,
        qty: item.qty,
        salePrice: item.salePrice,
        costPrice: item.costPrice || 0,
        observation: item.observation || (item.isCombined ?
          item.halves?.map((h: any) => h.observation ? `½ ${h.name}: ${h.observation}` : '').filter(Boolean).join('; ')
          : '')
      })),
      totalAmount: subtotal,
      deliveryFee,
      finalAmount: total,
      deliveryAddress: selectedAddress.fullAddress,
      addressDetails: selectedAddress,
      observations,
      origin: 'delivery',
      orderType: 'delivery',
      customerId: customerData?.uid || customerData?.id,
      customerName: customerData?.displayName || customerData?.name,
      customerPhone: customerData?.phone || customerData?.profile?.whatsapp
    };

    onOrderCreated(orderData);
  };

  // Se for mobile, renderiza a nova experiência Nexus Flow™
  if (isMobile) {
    return (
      <MobileOrderCreation
        isOpen={isOpen}
        onClose={onClose}
        customerData={customerData}
        products={products}
        customerAddresses={customerAddresses}
        deliveryFees={deliveryFees}
        onOrderCreated={onOrderCreated}
        initialOrderData={initialOrderData}
      />
    );
  }

  return (
    <>
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={isEditing ? `Editando Pedido #${initialOrderData?.orderNumber}` : "Lançamento de Pedido"} 
        maxWidth="max-w-7xl" // <--- MUDANÇA AQUI (Deixa bem largo)
      >
        <div className="flex h-[80vh] gap-6 font-sans">

          {/* Coluna Esquerda: Centro de Comando do Pedido */}
          <div className="w-1/3 bg-gray-50 rounded-lg p-6 flex flex-col overflow-hidden">

            {/* Card do Cliente */}
            <div className="border-b pb-4 mb-4">
              <p className="text-sm text-gray-500">Pedido para</p>
              <h3 className="text-2xl font-bold text-gray-900">{customerData?.displayName || customerData?.name}</h3>
              {((customerData?.orderCount || 0) === 0) && !isEditing && (
                <div className="mt-2 inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                  Este é o 1º pedido deste cliente!
                </div>
              )}
              {isEditing && (
                <div className="mt-2 inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                  Editando pedido existente
                </div>
              )}
            </div>

            {/* Card de Entrega */}
            <div className="space-y-4">
              <FormField label="Endereço de Entrega">
                <select 
                  value={selectedAddressId} 
                  onChange={(e) => setSelectedAddressId(e.target.value)} 
                  className="w-full p-3 border rounded-lg bg-white" 
                  required
                >
                  <option value="" disabled>Selecione um endereço</option>
                  {customerAddresses
                    .filter(addr => addr && addr.id && addr.fullAddress) // Filtra para garantir que o endereço é válido
                    .map((address) => (
                      <option key={address.id} value={address.id}>
                        {address.fullAddress}
                      </option>
                  ))}
                </select>
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Taxa de Entrega">
                  <input 
                    type="number" 
                    step="0.01" 
                    value={deliveryFee} 
                    onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)} 
                    className="w-full p-3 border rounded-lg bg-white" 
                  />
                </FormField>
                <FormField label="Observações">
                  <input 
                    type="text" 
                    value={observations} 
                    onChange={(e) => setObservations(e.target.value)} 
                    placeholder="Observações do pedido..."
                    className="w-full p-3 border rounded-lg bg-white" 
                  />
                </FormField>
              </div>
            </div>

            {/* CARRINHO EXPANSIVO */}
            <div className="flex-grow mt-6 pt-6 border-t flex flex-col min-h-0">
              <h4 className="text-lg font-semibold mb-2 text-gray-800 flex-shrink-0">
                Itens do Pedido {isEditing && `(${cart.length} itens)`}
              </h4>
              <div className="flex-grow overflow-y-auto pr-2 -mr-2">
                {cart.length > 0 ? (
                  <div className="space-y-3">
                    {cart.map((item, index) => (
                      <div
                        key={item.cartItemId || item.id || index}
                        className="bg-white p-3 rounded-lg flex items-center gap-3 shadow-sm"
                      >
                        <div className="flex-grow">
                          <p className="font-semibold text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500">{formatCurrency(item.salePrice)}</p>
                          {item.observation && (
                            <p className="text-xs text-gray-400 mt-1">{item.observation}</p>
                          )}
                          {item.observation?.includes('Sugerido pela IA') && (
                            <span className="inline-block mt-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                              IA
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <button 
                            onClick={() => updateCartQty(item.cartItemId!, -1)} 
                            className="p-1 rounded-full hover:bg-gray-200"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="font-bold w-6 text-center">{item.qty}</span>
                          <button 
                            onClick={() => updateCartQty(item.cartItemId!, 1)} 
                            className="p-1 rounded-full hover:bg-gray-200"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <p className="font-bold w-20 text-right">{formatCurrency(item.salePrice * item.qty)}</p>
                        <button 
                          onClick={() => updateCartQty(item.cartItemId!, -item.qty)} 
                          className="text-red-400 hover:text-red-600 p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-center text-gray-400">
                    <div>
                      <ShoppingCart size={32} className="mx-auto" />
                      <p className="mt-2 text-sm">Carrinho vazio</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Totais Fixos na Base */}
            <div className="flex-shrink-0 border-t pt-4 mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Taxa de Entrega</span>
                <span>{formatCurrency(deliveryFee)}</span>
              </div>
              <div className="flex justify-between font-bold text-xl">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Seleção de Produtos */}
          <div className="w-2/3 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <input 
                type="text" 
                placeholder="Buscar produto..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="w-full p-3 border rounded-lg" 
              />
              <button 
                onClick={() => setIsCombinationModalOpen(true)} 
                className="ml-4 flex-shrink-0 flex items-center gap-2 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
              >
                <Pizza size={16} /> Meio a Meio
              </button>
            </div>
            
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {categories.map((cat, index) => (
                <button 
                  key={`${cat}-${index}`} 
                  onClick={() => setActiveCategory(cat as string)} 
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-full transition-all ${activeCategory === cat ? 'bg-orange-500 text-white' : 'bg-white hover:bg-orange-100'}`}
                >
                  {cat as string}
                </button>
              ))}
            </div>
            
            <div className="flex-grow overflow-y-auto p-2 bg-gray-100 rounded-lg">
              <div className="grid grid-cols-4 gap-4">
                {filteredProducts.map(product => (
                  <button 
                    key={product.id} 
                    onClick={() => handleProductSelect(product)} 
                    className="group bg-white rounded-lg shadow-sm p-3 text-left hover:shadow-md hover:border-orange-500 border-2 border-transparent transition h-40 flex flex-col justify-between"
                  >
                    <h4 className="font-semibold text-gray-800 text-sm line-clamp-3">{product.name}</h4>
                    <p className="font-bold text-orange-600 mt-2">{formatCurrency(product.salePrice)}</p>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="pt-4 mt-auto">
              <div className="flex gap-4">
                <button 
                  onClick={onClose} 
                  className="w-1/3 bg-gray-200 text-gray-800 font-bold py-4 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveOrder} 
                  disabled={cart.length === 0 || !selectedAddressId} 
                  className="w-2/3 bg-green-600 text-white font-bold py-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  {isEditing ? 'Salvar Alterações' : 'Continuar Pedido'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL DE PERSONALIZAÇÃO UNIFICADO */}
      {selectedProduct && (
        <ProductCustomizationModal
          isOpen={isCustomizationModalOpen}
          onClose={() => setIsCustomizationModalOpen(false)}
          product={selectedProduct}
          onConfirm={handleConfirmCustomization}
        />
      )}

      {/* Modal de Combinação */}
      <CombinationFlowModal
        isOpen={isCombinationModalOpen}
        onClose={() => setIsCombinationModalOpen(false)}
        onConfirm={handleConfirmCombination}
        products={products}
      />

      {/* WIDGET DE UPSELL DA IA NEXUS */}
      {showUpsellWidget && lastAddedProduct && (
        <NexusUpsellWidget
          isOpen={showUpsellWidget}
          onClose={() => setShowUpsellWidget(false)}
          context={{
            addedProduct: lastAddedProduct.product,
            customer: customerData,
            currentCart: cart,
            orderContext: {
              subtotal,
              deliveryFee,
              total,
              itemCount: cart.length
            }
          }}
          onAddToCart={handleUpsellAddToCart}
          products={products}
        />
      )}
    </>
  );
};