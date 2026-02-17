// src/components/public/business/food/catalog/PublicCatalogPage.mobile.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import {
  Award,
  Clock,
  Home,
  Menu,
  Search,
  ShoppingCart,
  Star,
  Truck,
  User,
  Utensils,
  X,
  History,
} from 'lucide-react';

import { db } from '../../../../../config/firebase';
import { formatCurrency } from '../../../../../utils/formatters';
import { CustomerCheckoutModal } from '../checkout/CustomerCheckoutModal';
import { ProductAddonsModal } from '../../../../business/modules/common/ProductAddonsModal';
import { usePublicBusiness } from '../../../../../hooks/usePublicBusiness';

type CartItem = any & { qty: number };

export const PublicCatalogPage: React.FC = () => {
  const { restaurantId } = useParams(); // pode ser ID ou slug
  const { business, loading: loadingBusiness } = usePublicBusiness(restaurantId);

  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // UI / Carrinho
  const [activeSection, setActiveSection] = useState<'home' | 'menu' | 'profile'>('home');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  const [isAddonsModalOpen, setIsAddonsModalOpen] = useState(false);
  const [productForAddons, setProductForAddons] = useState<any | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [lastOrders, setLastOrders] = useState<any[]>([]); // mock demo

  const themeColor = business?.color || '#3B82F6';

  // Busca produtos quando tiver business.id resolvido
  useEffect(() => {
    if (!business?.id) return;

    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const productsQuery = query(
          collection(db, 'products'),
          where('businessId', '==', business.id),
          where('showInCatalog', '==', true)
        );

        const productsSnapshot = await getDocs(productsQuery);
        const productsData = productsSnapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          rating: Math.random() * 2 + 3, // mock demo 3-5
          reviewCount: Math.floor(Math.random() * 100) + 10,
        }));

        setProducts(productsData);

        // Mock lastOrders (somente demo)
        setLastOrders(
          productsData.slice(0, 2).map((product: any) => ({
            id: `order-${product.id}`,
            product,
            date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            quantity: Math.floor(Math.random() * 3) + 1,
          }))
        );
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [business?.id]);

  // Dados derivados
  const featuredProducts = useMemo(() => {
    return products.filter((p) => p.isFeatured).slice(0, 3);
  }, [products]);

  const categories = useMemo(() => {
    const unique = [...new Set(products.map((p) => p.category).filter(Boolean))];
    return ['all', ...unique];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let filtered = products.filter((p) => {
      const name = (p.name || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      const term = searchTerm.toLowerCase();
      return name.includes(term) || desc.includes(term);
    });

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    return filtered;
  }, [products, searchTerm, selectedCategory]);

  const totalCartValue = useMemo(() => {
    return cart.reduce((total, item) => total + item.salePrice * item.qty, 0);
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((total, item) => total + item.qty, 0);
  }, [cart]);

  // Carrinho
  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== productId));
  };

  const updateQuantity = (productId: string, newQty: number) => {
    if (newQty < 1) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) => prev.map((i) => (i.id === productId ? { ...i, qty: newQty } : i)));
  };

  const handleOrderFinalized = () => {
    setCart([]);
    setIsCheckoutModalOpen(false);
  };

  // Clique no produto (addons ou add normal)
  const handleProductClick = (product: any) => {
    if (product.addonGroupIds && product.addonGroupIds.length > 0) {
      setProductForAddons(product);
      setIsAddonsModalOpen(true);
      return;
    }
    addToCart(product);
  };

  const handleConfirmAddons = (customizedProduct: any) => {
    setCart((prev) => [...prev, customizedProduct]);
    setIsAddonsModalOpen(false);
    setProductForAddons(null);
  };

  const reorderProduct = (product: any) => {
    handleProductClick(product);
  };

  const renderStars = (rating: number) => {
    const rounded = Math.round(rating * 10) / 10;
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={12}
            className={`${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          />
        ))}
        <span className="text-xs text-gray-500 ml-1">({rounded.toFixed(1)})</span>
      </div>
    );
  };

  // Loading / Not found
  if (loadingBusiness || loadingProducts) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto mb-4"
            style={{ borderColor: themeColor }}
          />
          <p className="text-xl text-gray-600">Carregando cardápio...</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return <div className="min-h-screen flex items-center justify-center">Loja não encontrada.</div>;
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'home':
        return (
          <div className="space-y-6">
            {/* Banner Promocional */}
            <div className="rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 z-0" />
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">Entrega Grátis!</h3>
                  <p className="text-sm opacity-90">Em pedidos acima de R$ 35,00</p>
                  <p className="text-xs opacity-80 mt-1">Válido para região central</p>
                </div>
                <div className="bg-white text-orange-500 px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                  APROVEITE!
                </div>
              </div>
            </div>

            {/* Pedir Novamente (mock) */}
            {lastOrders.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Pedir Novamente</h2>
                  <History size={20} className="text-gray-500" />
                </div>

                <div className="space-y-3">
                  {lastOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                            {order.product.imageUrl ? (
                              <img
                                src={order.product.imageUrl}
                                alt={order.product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Utensils size={20} className="text-gray-400" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-sm">
                              {order.product.name}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {order.date.toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => reorderProduct(order.product)}
                          className="text-white px-4 py-2 rounded-full text-xs font-semibold shadow-sm transition-colors"
                          style={{ backgroundColor: themeColor }}
                        >
                          Pedir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Categorias */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Categorias</h2>
              <div className="grid grid-cols-3 gap-3">
                {categories
                  .filter((c) => c !== 'all')
                  .slice(0, 6)
                  .map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category);
                        setActiveSection('menu');
                      }}
                      className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center hover:shadow-md transition-all active:scale-95"
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2 bg-gray-50">
                        <Utensils size={20} style={{ color: themeColor }} />
                      </div>
                      <span className="text-xs font-medium text-gray-700 capitalize">
                        {category}
                      </span>
                    </button>
                  ))}
              </div>
            </section>

            {/* Destaques */}
            {featuredProducts.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Destaques</h2>
                  <Award size={20} className="text-yellow-500" />
                </div>
                <div className="space-y-4">
                  {featuredProducts.map((product) => (
                    <FeaturedProductCard
                      key={product.id}
                      product={product}
                      onProductClick={handleProductClick}
                      renderStars={renderStars}
                      themeColor={themeColor}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        );

      case 'menu':
        return (
          <div className="space-y-6">
            {/* Filtro de Categorias (sticky abaixo do header) */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 sticky top-[72px] z-30">
              <div className="flex overflow-x-auto space-x-2 pb-2 no-scrollbar">
                {categories.map((category) => {
                  const active = selectedCategory === category;
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                        active
                          ? 'text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      style={active ? { backgroundColor: themeColor } : {}}
                    >
                      {category === 'all' ? 'Todas' : category}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lista de Produtos */}
            <div className="space-y-4">
              {filteredProducts.map((product) => (
                <MobileProductCard
                  key={product.id}
                  product={product}
                  onProductClick={handleProductClick}
                  cart={cart}
                  updateQuantity={updateQuantity}
                  renderStars={renderStars}
                  themeColor={themeColor}
                />
              ))}

              {filteredProducts.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                  Nenhum produto encontrado nesta categoria.
                </div>
              )}
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <User size={24} style={{ color: themeColor }} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Seu Perfil</h2>
              <p className="text-gray-600 mb-4">Faça login para ver seu histórico de pedidos</p>
              <button
                className="text-white px-6 py-3 rounded-full font-semibold transition-colors shadow-md w-full"
                style={{ backgroundColor: themeColor }}
              >
                Fazer Login / Cadastrar
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: themeColor }}
              >
                {business.logo ? (
                  <img src={business.logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Utensils className="text-white" size={20} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="font-bold text-gray-900 text-sm truncate">
                  {business.displayName}
                </h1>
                <div className="flex items-center space-x-1">{renderStars(4.8)}</div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSearch(true)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
              >
                <Search size={20} />
              </button>

              {cart.length > 0 && (
                <button
                  onClick={() => setIsCheckoutModalOpen(true)}
                  className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                >
                  <ShoppingCart size={20} style={{ color: themeColor }} />
                  <span
                    className="absolute -top-1 -right-1 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
                    style={{ backgroundColor: themeColor }}
                  >
                    {cartItemCount}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search expandida */}
        {showSearch && (
          <div className="px-4 py-3 border-t border-gray-200 bg-white animate-in slide-in-from-top-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar no cardápio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
                autoFocus
              />
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchTerm('');
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Banner/Capa do restaurante */}
      <div className="relative bg-gray-900 text-white overflow-hidden transition-all duration-500" style={{ height: '200px' }}>
        {business.cover ? (
          <img src={business.cover} alt="Capa" className="absolute inset-0 w-full h-full object-cover opacity-60" />
        ) : (
          <div className="absolute inset-0 opacity-80" style={{ backgroundColor: themeColor }} />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h2 className="text-2xl font-bold mb-1 shadow-sm">{business.displayName}</h2>
          <p className="text-gray-200 text-sm mb-3 line-clamp-2 shadow-sm">
            {business.description || 'Os melhores pratos, feitos com carinho para você.'}
          </p>

          <div className="flex items-center space-x-4 text-xs font-medium text-gray-100">
            <span className="flex items-center bg-black/30 px-2 py-1 rounded backdrop-blur-sm">
              <Clock className="w-3.5 h-3.5 mr-1" /> 35-45 min
            </span>
            <span className="flex items-center bg-black/30 px-2 py-1 rounded backdrop-blur-sm">
              <Truck className="w-3.5 h-3.5 mr-1" /> Grátis
            </span>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <main className="px-4 py-6">{renderContent()}</main>

      {/* Carrinho flutuante */}
      {cart.length > 0 && (
        <div className="fixed bottom-20 left-4 right-4 bg-white shadow-2xl border border-gray-100 p-4 rounded-2xl z-40 animate-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">{cartItemCount} itens</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(totalCartValue)}</p>
            </div>
            <button
              onClick={() => setIsCheckoutModalOpen(true)}
              className="text-white font-bold py-3 px-8 rounded-xl shadow-md hover:opacity-90 transition-opacity"
              style={{ backgroundColor: themeColor }}
            >
              Ver Carrinho
            </button>
          </div>
        </div>
      )}

      {/* Footer Nav */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe">
        <div className="flex justify-around items-center py-3">
          <button
            onClick={() => setActiveSection('home')}
            className={`flex flex-col items-center space-y-1 px-4 py-1 rounded-lg transition-colors ${
              activeSection === 'home' ? 'font-medium' : 'text-gray-400'
            }`}
            style={{ color: activeSection === 'home' ? themeColor : undefined }}
          >
            <Home size={22} />
            <span className="text-[10px]">Início</span>
          </button>

          <button
            onClick={() => setActiveSection('menu')}
            className={`flex flex-col items-center space-y-1 px-4 py-1 rounded-lg transition-colors ${
              activeSection === 'menu' ? 'font-medium' : 'text-gray-400'
            }`}
            style={{ color: activeSection === 'menu' ? themeColor : undefined }}
          >
            <Menu size={22} />
            <span className="text-[10px]">Cardápio</span>
          </button>

          <button
            onClick={() => setActiveSection('profile')}
            className={`flex flex-col items-center space-y-1 px-4 py-1 rounded-lg transition-colors ${
              activeSection === 'profile' ? 'font-medium' : 'text-gray-400'
            }`}
            style={{ color: activeSection === 'profile' ? themeColor : undefined }}
          >
            <User size={22} />
            <span className="text-[10px]">Perfil</span>
          </button>
        </div>
      </footer>

      {/* Modais */}
      {productForAddons && (
        <ProductAddonsModal
          isOpen={isAddonsModalOpen}
          onClose={() => setIsAddonsModalOpen(false)}
          product={productForAddons}
          onConfirm={handleConfirmAddons}
        />
      )}

      {isCheckoutModalOpen && (
        <CustomerCheckoutModal
          isOpen={isCheckoutModalOpen}
          onClose={() => setIsCheckoutModalOpen(false)}
          cart={cart}
          restaurantId={business.id}
          onOrderFinalized={handleOrderFinalized}
        />
      )}
    </div>
  );
};

// --------------------
// Componentes auxiliares
// --------------------

const FeaturedProductCard = ({
  product,
  onProductClick,
  renderStars,
  themeColor,
}: {
  product: any;
  onProductClick: (p: any) => void;
  renderStars: (r: number) => React.ReactNode;
  themeColor: string;
}) => {
  return (
    <div
      onClick={() => onProductClick(product)}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
    >
      <div className="flex">
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-bold text-gray-900 text-base flex-1 pr-2 line-clamp-1">
              {product.name}
            </h3>
            <span
              className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
              style={{ backgroundColor: themeColor }}
            >
              Top
            </span>
          </div>

          {product.description && (
            <p className="text-gray-500 text-xs mb-3 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}

          <div className="mb-2">{renderStars(product.rating)}</div>

          <div className="flex items-center justify-between">
            <p className="text-lg font-bold" style={{ color: themeColor }}>
              {formatCurrency(product.salePrice)}
            </p>
            {product.originalPrice > product.salePrice && (
              <p className="text-xs text-gray-400 line-through">
                {formatCurrency(product.originalPrice)}
              </p>
            )}
          </div>
        </div>

        <div className="w-28 h-auto bg-gray-100 relative">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Utensils className="text-gray-300" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MobileProductCard = ({
  product,
  onProductClick,
  cart,
  updateQuantity,
  renderStars,
  themeColor,
}: {
  product: any;
  onProductClick: (p: any) => void;
  cart: CartItem[];
  updateQuantity: (productId: string, newQty: number) => void;
  renderStars: (r: number) => React.ReactNode;
  themeColor: string;
}) => {
  const cartItem = cart.find((i) => i.id === product.id);
  const quantity = cartItem?.qty || 0;

  return (
    <div
      onClick={() => onProductClick(product)}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
    >
      <div className="flex p-3 gap-3">
        <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden relative">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Utensils className="text-gray-300" size={16} />
            </div>
          )}

          {quantity > 0 && (
            <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-bl-lg">
              {quantity}x
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{product.name}</h3>
              {product.isPopular && (
                <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                  Popular
                </span>
              )}
            </div>

            {product.description ? (
              <p className="text-gray-500 text-xs line-clamp-1 mt-0.5">{product.description}</p>
            ) : (
              <p className="text-gray-400 text-xs line-clamp-1 mt-0.5">Sem descrição</p>
            )}

            <div className="mt-1">{renderStars(product.rating)}</div>
          </div>

          <div className="flex items-end justify-between mt-2">
            <div>
              <p className="font-bold text-sm" style={{ color: themeColor }}>
                {formatCurrency(product.salePrice)}
              </p>
              {product.originalPrice > product.salePrice && (
                <p className="text-[10px] text-gray-400 line-through">
                  {formatCurrency(product.originalPrice)}
                </p>
              )}
            </div>

            {quantity > 0 ? (
              <div
                className="flex items-center bg-gray-100 rounded-full px-1 py-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateQuantity(product.id, quantity - 1);
                  }}
                  className="w-6 h-6 flex items-center justify-center text-gray-600 font-bold"
                  aria-label="Diminuir"
                >
                  -
                </button>

                <span className="text-xs font-bold w-4 text-center">{quantity}</span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onProductClick(product);
                  }}
                  className="w-6 h-6 flex items-center justify-center font-bold"
                  style={{ color: themeColor }}
                  aria-label="Aumentar"
                >
                  +
                </button>
              </div>
            ) : (
              <button
                className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm"
                style={{ backgroundColor: themeColor }}
                onClick={(e) => {
                  e.stopPropagation();
                  onProductClick(product);
                }}
                aria-label="Adicionar"
              >
                <span className="text-lg leading-none mb-0.5">+</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
