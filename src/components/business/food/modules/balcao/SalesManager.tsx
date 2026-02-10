import React, { useState, useMemo, useEffect } from 'react';
import { subscriptionGuard } from '../../../../../services/subscriptionGuard';
import { Plus, Minus, ShoppingCart, ArrowLeft, Split, User, Search, X, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../../../../contexts/AuthContext';
import { useBusiness } from '../../../../../contexts/BusinessContext';
import { useUI } from '../../../../../contexts/UIContext';
import { formatCurrency } from '../../../../../utils/formatters';
import { usePrintManager } from '../../../../../hooks/usePrintManager';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../../../config/firebase';

// Modais
import { PaymentModal } from '../../../modules/delivery/PaymentModal';
import { CombinationFlowModal } from './CombinationFlowModal';
import { ProductCustomizationModal } from '../../../modules/common/ProductCustomizationModal';

const createOrderWithSequentialId = httpsCallable(functions, 'createOrderWithSequentialId');

export const SalesManager: React.FC = () => {
  const { products, localCustomers, businessId } = useBusiness();
  const { userProfile } = useAuth();
  const { showAlert } = useUI();
  const { printKitchenOrder, printCustomerBill } = usePrintManager();

  const [cart, setCart] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados para controle de modais
  const [isCustomizationModalOpen, setIsCustomizationModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isCombinationModalOpen, setIsCombinationModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [orderDataForPayment, setOrderDataForPayment] = useState<any | null>(null);

  // Estado para imagem em destaque
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F11') {
        event.preventDefault();
        setIsCombinationModalOpen(true);
      }
      if (event.key === 'Escape' && featuredImage) {
        setFeaturedImage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [featuredImage]);

  const categories = useMemo(() =>
    ['Todos', ...new Set(products.map(p => p.category).filter(Boolean))],
    [products]
  );

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const categoryMatch = activeCategory === 'Todos' || p.category === activeCategory;
      const searchMatch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      return categoryMatch && searchMatch;
    });
  }, [products, activeCategory, searchTerm]);

  const updateCartQty = (cartItemId: string, amount: number) => {
    const updatedCart = cart.map((item: any) => {
      if (item.cartItemId === cartItemId) {
        return { ...item, qty: Math.max(0, item.qty + amount) };
      }
      return item;
    }).filter((item: any) => item.qty > 0);
    setCart(updatedCart);
  };

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    setIsCustomizationModalOpen(true);
  };

  // Adição rápida sem customização
  const handleQuickAdd = (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const existingItemIndex = cart.findIndex((item: any) => 
      item.id === product.id && 
      !item.isCombined && 
      (!item.selectedAddons || item.selectedAddons.length === 0) &&
      !item.observation
    );

    if (existingItemIndex > -1) {
      const newCart = [...cart];
      newCart[existingItemIndex].qty += 1;
      setCart(newCart);
    } else {
      setCart(prev => [...prev, { 
        ...product, 
        qty: 1,
        cartItemId: `${product.id}-${Date.now()}-${Math.random()}` 
      }]);
    }
    
    showAlert(`${product.name} adicionado!`, 'success');
  };

  const handleConfirmCustomization = (customizedProduct: any) => {
    const existingItemIndex = cart.findIndex((item: any) => 
      item.id === customizedProduct.id && 
      !item.isCombined && 
      (!item.selectedAddons || item.selectedAddons.length === 0) &&
      customizedProduct.observation === item.observation
    );

    if (existingItemIndex > -1) {
      const newCart = [...cart];
      newCart[existingItemIndex].qty += customizedProduct.qty;
      setCart(newCart);
    } else {
      setCart(prev => [...prev, { 
        ...customizedProduct, 
        cartItemId: `${customizedProduct.id}-${Date.now()}-${Math.random()}` 
      }]);
    }

    setIsCustomizationModalOpen(false);
    setSelectedProduct(null);
  };

  const handleConfirmCombination = (combinedItem: any) => {
    setCart(prevCart => [...prevCart, { 
      ...combinedItem, 
      cartItemId: `combined-${Date.now()}-${Math.random()}` 
    }]);
    setIsCombinationModalOpen(false);
  };

  const clearCart = () => setCart([]);

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const totalAmount = useMemo(() =>
    cart.reduce((total: number, item: any) => total + (item.salePrice * item.qty), 0),
    [cart]
  );

  const handleInitiateCheckout = () => {
    if (cart.length === 0) {
      showAlert("O carrinho está vazio.");
      return;
    }
    
    const selectedCustomer = localCustomers.find(c => c.id === selectedCustomerId);
    const saleData = {
      items: cart.map((item: any) => ({
        productId: item.id,
        name: item.name,
        qty: item.qty,
        salePrice: item.salePrice,
        costPrice: item.costPrice || 0,
        observation: item.observation || '',
        selectedAddons: item.selectedAddons || []
      })),
      totalAmount: totalAmount,
      finalAmount: totalAmount,
      businessId,
      customerId: selectedCustomer?.id || null,
      customerName: selectedCustomer?.name || 'Cliente Balcão',
      origin: 'balcao',
      orderType: 'balcao',
    };
    setOrderDataForPayment(saleData);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentProcessed = async (paymentDetails: any) => {
    if (!orderDataForPayment) return;
    setLoading(true);
    setIsPaymentModalOpen(false);

    const finalOrderData = {
      ...orderDataForPayment,
      paymentDetails,
      status: 'preparo',
    };

    try {
      const result = await createOrderWithSequentialId({ orderData: finalOrderData });
      if (!result.data.success || !result.data.order) {
        throw new Error('A Cloud Function retornou uma falha ao criar o pedido.');
      }
      await subscriptionGuard.recordNewOrderUsage();
      showAlert('Pedido enviado para o preparo!', 'success');
      
      const newOrderFromServer = result.data.order;
      const orderForPrint = {
        ...newOrderFromServer,
        tableName: 'Balcão',
        createdAt: newOrderFromServer.createdAt ? new Date(newOrderFromServer.createdAt._seconds * 1000) : new Date(),
        updatedAt: new Date()
      };
      
      setTimeout(() => printKitchenOrder(orderForPrint), 500);
      setTimeout(() => printCustomerBill(orderForPrint), 1500);
      
      setCart([]);
      setSelectedCustomerId('');
      setOrderDataForPayment(null);
    } catch (error: any) {
      console.error('Erro ao criar pedido de balcão:', error);
      showAlert(`Erro ao criar pedido: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  return (
    <>
      <div className="flex h-full gap-6 p-4 bg-gray-50">
        {/* Coluna Esquerda: Produtos e Categorias */}
        <div className="w-3/5 flex flex-col">
          {/* Header com botão voltar e título */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors shadow-sm"
              >
                <ArrowLeft size={20} />
                Voltar
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Vendas - Balcão</h1>
            </div>
            
            {/* Botão Meio-a-Meio no header */}
            <button
              onClick={() => setIsCombinationModalOpen(true)}
              className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-200"
            >
              <Split size={20} />
              <span className="font-semibold">Meio-a-Meio</span>
            </button>
          </div>

          {/* Barra de busca */}
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Buscar produto por nome..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full p-4 pl-12 border border-gray-300 rounded-xl text-lg focus:ring-3 focus:ring-orange-500 focus:border-orange-500 transition"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          </div>

          {/* Categorias */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map(cat => (
              <button
                key={cat as string}
                onClick={() => setActiveCategory(cat as string)}
                className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                  activeCategory === cat
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-200'
                    : 'bg-white text-gray-700 hover:bg-orange-50 border border-gray-200'
                }`}
              >
                {cat as string}
              </button>
            ))}
          </div>

          {/* Grid de Produtos COM IMAGENS COMPLETAS SEM CORTES */}
          <div className="flex-grow overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-white rounded-2xl shadow-sm">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-orange-500 transition-all duration-200 group cursor-pointer flex flex-col"
                  onClick={() => handleProductSelect(product)}
                >
                  {/* Área da Imagem - CONTAINER FLEXÍVEL SEM CORTES */}
                  <div className="relative h-32 bg-gradient-to-br from-gray-50 to-gray-100 rounded-t-xl overflow-hidden flex items-center justify-center p-2">
                    {product.imageUrl ? (
                      <>
                        {/* IMAGEM SEM CORTES - object-contain garante imagem completa */}
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            // Fallback se a imagem não carregar
                            e.currentTarget.style.display = 'none';
                          }}
                          style={{ 
                            width: 'auto', 
                            height: 'auto',
                            maxWidth: '100%',
                            maxHeight: '100%'
                          }}
                        />
                        {/* Botão de visualização de imagem */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFeaturedImage(product.imageUrl);
                          }}
                          className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          <ImageIcon size={14} />
                        </button>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <ImageIcon size={32} className="mb-2" />
                        <p className="text-xs text-center px-2">Sem imagem</p>
                      </div>
                    )}
                    
                    {/* Botão de adição rápida */}
                    <button
                      onClick={(e) => handleQuickAdd(product, e)}
                      className="absolute bottom-2 right-2 p-2 bg-green-500 text-white rounded-full opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200 shadow-lg hover:bg-green-600"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* Informações do Produto */}
                  <div className="p-3 flex-1 flex flex-col">
                    <p className="font-semibold text-gray-800 text-sm leading-tight mb-1 line-clamp-2">
                      {product.name}
                    </p>
                    {product.description && (
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    <p className="font-bold text-orange-600 text-base mt-auto">
                      {formatCurrency(product.salePrice)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-gray-500">
                <ShoppingCart size={64} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Nenhum produto encontrado</p>
                <p className="text-sm text-gray-400 mt-2">
                  Tente alterar a categoria ou termo de busca
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Coluna Direita: Carrinho e Finalização */}
        <div className="w-2/5 bg-white rounded-2xl shadow-xl flex flex-col">
          {/* Header do Carrinho */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Comanda Balcão</h2>
              <div className="flex items-center gap-2 text-orange-600">
                <ShoppingCart size={24} />
                <span className="font-semibold">{cart.length} itens</span>
              </div>
            </div>

            {/* Seletor de Cliente */}
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <User size={16} />
                Associar Cliente (Opcional)
              </label>
              <select
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              >
                <option value="">Cliente de Balcão</option>
                {localCustomers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Lista de Itens do Carrinho */}
          <div className="flex-grow overflow-y-auto p-6">
            {cart.length > 0 ? (
              <div className="space-y-4">
                {cart.map((item: any) => (
                  <div 
                    key={item.cartItemId} 
                    className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-orange-300 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{item.name}</p>
                        <p className="text-lg font-bold text-orange-600">
                          {formatCurrency(item.salePrice * item.qty)}
                        </p>
                        {item.observation && (
                          <p className="text-sm text-blue-600 italic mt-1">
                            Obs: {item.observation}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.cartItemId)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateCartQty(item.cartItemId, -1)}
                          className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="font-bold text-lg w-8 text-center">{item.qty}</span>
                        <button
                          onClick={() => updateCartQty(item.cartItemId, 1)}
                          className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(item.salePrice)} cada
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <ShoppingCart size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Carrinho vazio</p>
                <p className="text-sm text-gray-400 mt-2">
                  Adicione produtos para continuar
                </p>
              </div>
            )}
          </div>

          {/* Footer com Total e Botões */}
          <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-2xl">
            <div className="flex justify-between items-center mb-6">
              <span className="text-2xl font-bold text-gray-800">Total:</span>
              <span className="text-3xl font-bold text-orange-600">
                {formatCurrency(totalAmount)}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={clearCart}
                disabled={loading || cart.length === 0}
                className="flex items-center justify-center gap-2 px-4 py-4 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <Minus size={20} />
                Limpar
              </button>
              <button
                onClick={handleInitiateCheckout}
                disabled={loading || cart.length === 0}
                className="flex items-center justify-center gap-2 px-4 py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <ShoppingCart size={20} />
                {loading ? 'Finalizando...' : 'Finalizar Venda'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Imagem em Destaque */}
      {featuredImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <img
              src={featuredImage}
              alt="Visualização do produto"
              className="max-w-full max-h-full object-contain rounded-2xl bg-white"
            />
            <button
              onClick={() => setFeaturedImage(null)}
              className="absolute -top-4 -right-4 p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}

      {/* Modais */}
      {selectedProduct && (
        <ProductCustomizationModal
          isOpen={isCustomizationModalOpen}
          onClose={() => setIsCustomizationModalOpen(false)}
          product={selectedProduct}
          onConfirm={handleConfirmCustomization}
        />
      )}

      {isPaymentModalOpen && orderDataForPayment && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          orderData={orderDataForPayment}
          onPaymentProcessed={handlePaymentProcessed}
        />
      )}

      <CombinationFlowModal
        isOpen={isCombinationModalOpen}
        onClose={() => setIsCombinationModalOpen(false)}
        onConfirm={handleConfirmCombination}
        products={products}
      />
    </>
  );
};