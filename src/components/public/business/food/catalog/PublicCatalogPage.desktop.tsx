// src/components/public/business/food/catalog/PublicCatalogPage.desktop.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import {
  Clock,
  Filter,
  Heart,
  Search,
  ShoppingCart,
  Shield,
  Star,
  Truck,
  Utensils,
  ChevronDown,
} from 'lucide-react';

import { db } from '../../../../../config/firebase';
import { formatCurrency } from '../../../../../utils/formatters';
import { CustomerCheckoutModal } from '../checkout/CustomerCheckoutModal';
import { ProductAddonsModal } from '../../../../business/modules/common/ProductAddonsModal';
import { useAuth } from '../../../../../contexts/AuthContext';
import { usePublicBusiness } from '../../../../../hooks/usePublicBusiness';

type CartItem = any & { qty: number };

export const PublicCatalogPage: React.FC = () => {
  const { restaurantId } = useParams(); // pode ser ID ou slug
  const { business, loading: loadingBusiness } = usePublicBusiness(restaurantId);
  const { userProfile } = useAuth(); // mantido (caso queira usar depois)

  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isAddonsModalOpen, setIsAddonsModalOpen] = useState(false);
  const [productForAddons, setProductForAddons] = useState<any | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'price-low' | 'price-high'>('name');

  // ✅ NOVO: produto selecionado (realce no card)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const themeColor = business?.color || '#3B82F6';

  // Busca produtos apenas quando tivermos o ID real do business
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

        const snap = await getDocs(productsQuery);
        setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [business?.id]);

  // Categorias
  const categories = useMemo(() => {
    const unique = [...new Set(products.map((p) => p.category).filter(Boolean))];
    return ['all', ...unique];
  }, [products]);

  // Filtros + ordenação
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter((product) => {
      const name = (product.name || '').toLowerCase();
      const desc = (product.description || '').toLowerCase();
      const term = searchTerm.toLowerCase();
      return name.includes(term) || desc.includes(term);
    });

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return (a.salePrice || 0) - (b.salePrice || 0);
        case 'price-high':
          return (b.salePrice || 0) - (a.salePrice || 0);
        case 'name':
        default:
          return (a.name || '').localeCompare(b.name || '');
      }
    });
  }, [products, searchTerm, selectedCategory, sortBy]);

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

  // ✅ Agora essa função é chamada SOMENTE por botões ("Selecionar" ou "+")
  const handleAddAction = (product: any) => {
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

  const totalCartValue = useMemo(() => {
    return cart.reduce((total, item) => total + (item.salePrice || 0) * item.qty, 0);
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((total, item) => total + item.qty, 0);
  }, [cart]);

  // Loading + not found
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
    return <div className="text-center mt-20">Loja não encontrada.</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header Fixo */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: themeColor }}
                >
                  {business.logo ? (
                    <img src={business.logo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Utensils className="text-white" size={24} />
                  )}
                </div>

                <div>
                  <h1 className="text-xl font-bold text-gray-900">{business.displayName}</h1>
                  <p className="text-sm text-gray-500 flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" />
                    4.8 • {products.length} itens
                  </p>
                </div>
              </div>

              <nav className="hidden lg:flex space-x-6">
                <a href="#cardapio" className="text-gray-700 hover:opacity-80 font-medium">
                  Cardápio
                </a>
                <a href="#sobre" className="text-gray-700 hover:opacity-80 font-medium">
                  Sobre
                </a>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar no cardápio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent w-72 outline-none"
                  style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
                />
              </div>

              {cart.length > 0 && (
                <button
                  onClick={() => setIsCheckoutModalOpen(true)}
                  className="relative text-white p-3 rounded-lg hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: themeColor }}
                >
                  <ShoppingCart size={20} />
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filtros */}
          <aside className="w-80 flex-shrink-0 hidden lg:block">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h3 className="font-semibold text-lg text-gray-900 mb-4">Filtros</h3>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Categorias</label>
                <div className="space-y-2">
                  {categories.map((category) => {
                    const active = selectedCategory === category;
                    return (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className="block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                        style={
                          active
                            ? { backgroundColor: `${themeColor}1A`, color: themeColor, fontWeight: 600 }
                            : { color: '#4B5563' }
                        }
                      >
                        {category === 'all' ? 'Todas as categorias' : category}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Ordenar por</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:border-transparent outline-none"
                  style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
                >
                  <option value="name">Nome A-Z</option>
                  <option value="price-low">Menor preço</option>
                  <option value="price-high">Maior preço</option>
                </select>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200" id="sobre">
                <h4 className="font-semibold text-gray-900 mb-3">Informações</h4>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Aberto agora • 35-45 min
                  </div>
                  <div className="flex items-center">
                    <Truck className="w-4 h-4 mr-2" />
                    Delivery Grátis
                  </div>
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 mr-2" />
                    Pagamento seguro
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Conteúdo Principal */}
          <main className="flex-1">
            {/* Banner */}
            <div
              className="rounded-2xl p-8 text-white mb-8 relative overflow-hidden"
              style={{ backgroundColor: themeColor, minHeight: '200px' }}
            >
              {business.cover && (
                <>
                  <img
                    src={business.cover}
                    className="absolute inset-0 w-full h-full object-cover z-0"
                    alt="Capa"
                  />
                  <div className="absolute inset-0 bg-black/50 z-10" />
                </>
              )}

              <div className="relative z-20 max-w-2xl">
                <h2 className="text-3xl font-bold mb-4">{business.displayName}</h2>
                <p className="text-white/90 text-lg mb-6">
                  {business.description || 'Bem-vindo ao nosso cardápio digital.'}
                </p>

                <div className="flex items-center flex-wrap gap-3 text-sm">
                  <span className="flex items-center bg-black/25 px-3 py-1 rounded-full backdrop-blur-sm">
                    <Star className="w-4 h-4 text-yellow-400 mr-2" fill="currentColor" />
                    4.8
                  </span>
                  <span className="flex items-center bg-black/25 px-3 py-1 rounded-full backdrop-blur-sm">
                    <Clock className="w-4 h-4 mr-2" />
                    35-45 min
                  </span>
                  <span className="flex items-center bg-black/25 px-3 py-1 rounded-full backdrop-blur-sm">
                    <Truck className="w-4 h-4 mr-2" />
                    Delivery grátis
                  </span>
                </div>
              </div>
            </div>

            <div id="cardapio">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Cardápio {filteredAndSortedProducts.length > 0 && `(${filteredAndSortedProducts.length} itens)`}
                </h3>

                <div className="lg:hidden flex items-center space-x-2">
                  <button className="flex items-center space-x-2 border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <Filter size={16} />
                    <span>Filtrar</span>
                  </button>
                  <button className="flex items-center space-x-2 border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <ChevronDown size={16} />
                    <span>Ordenar</span>
                  </button>
                </div>
              </div>

              {filteredAndSortedProducts.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredAndSortedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      cart={cart}
                      primaryColor={themeColor}
                      isSelected={selectedProductId === product.id}
                      onSelect={(id) => setSelectedProductId((prev) => (prev === id ? null : id))}
                      onAddAction={handleAddAction}
                      addToCart={addToCart}
                      updateQuantity={updateQuantity}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                  <Utensils className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Nenhum produto encontrado</h4>
                  <p className="text-gray-500">
                    {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Cardápio em atualização.'}
                  </p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-8 right-8 z-50">
          <button
            onClick={() => setIsCheckoutModalOpen(true)}
            className="text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all transform hover:scale-105 flex items-center space-x-3 hover:opacity-95"
            style={{ backgroundColor: themeColor }}
          >
            <ShoppingCart size={20} />
            <span>Ver Carrinho ({cartItemCount})</span>
            <span className="bg-white px-2 py-1 rounded-lg text-sm font-bold" style={{ color: themeColor }}>
              {formatCurrency(totalCartValue)}
            </span>
          </button>
        </div>
      )}

      {/* Modal de Complementos */}
      {productForAddons && (
        <ProductAddonsModal
          isOpen={isAddonsModalOpen}
          onClose={() => setIsAddonsModalOpen(false)}
          product={productForAddons}
          onConfirm={handleConfirmAddons}
        />
      )}

      {/* Modal de Checkout */}
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
// ProductCard (seleção + borda)
// --------------------

const ProductCard = ({
  product,
  cart,
  primaryColor,
  isSelected,
  onSelect,
  onAddAction,
  addToCart,
  updateQuantity,
}: {
  product: any;
  cart: CartItem[];
  primaryColor: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onAddAction: (p: any) => void; // abre addons ou adiciona
  addToCart: (p: any) => void;
  updateQuantity: (productId: string, newQty: number) => void;
}) => {
  const cartItem = cart.find((i) => i.id === product.id);
  const quantity = cartItem?.qty || 0;

  const selectedStyle: React.CSSProperties = isSelected
    ? {
        outline: `2px solid ${primaryColor}`,
        outlineOffset: '2px',
        boxShadow: `0 0 0 4px ${primaryColor}14`,
      }
    : {};

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 group cursor-pointer"
      style={selectedStyle}
      aria-selected={isSelected}
      onClick={() => onSelect(product.id)} // ✅ clique agora só seleciona
    >
      <div className="relative">
        <div className="bg-gray-100">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-48 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <Utensils className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>

        {/* Badge */}
        <div className="absolute top-3 left-3">
          {product.isPopular && (
            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              Popular
            </span>
          )}
        </div>

        <button
          className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
          }}
          aria-label="Favoritar"
        >
          <Heart className="w-4 h-4 text-gray-400 hover:text-red-500" />
        </button>
      </div>

      <div className="p-5">
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-2">{product.name}</h3>
          {product.description && <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-2xl font-bold" style={{ color: primaryColor }}>
              {formatCurrency(product.salePrice)}
            </p>
            {product.originalPrice > product.salePrice && (
              <p className="text-sm text-gray-500 line-through">{formatCurrency(product.originalPrice)}</p>
            )}
          </div>

          {/* Controles do carrinho (não selecionam o card ao clicar) */}
          <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
            {quantity > 0 ? (
              <div className="flex items-center space-x-3 bg-gray-100 rounded-full px-3 py-2">
                <button
                  onClick={() => updateQuantity(product.id, quantity - 1)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-gray-700 font-bold hover:bg-white"
                  aria-label="Diminuir"
                >
                  -
                </button>

                <span className="font-semibold min-w-6 text-center">{quantity}</span>

                <button
                  onClick={() => addToCart(product)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold hover:opacity-95"
                  style={{ backgroundColor: primaryColor }}
                  aria-label="Aumentar"
                >
                  +
                </button>
              </div>
            ) : (
              <button
                // ✅ Agora botão adiciona/abre addons — clique no card só seleciona
                onClick={() => onAddAction(product)}
                style={{ backgroundColor: primaryColor }}
                className="text-white font-semibold py-2 px-4 rounded-full hover:opacity-95 transition-opacity"
              >
                Selecionar
              </button>
            )}
          </div>
        </div>

        {/* ✅ Indicador extra opcional (texto) */}
        {isSelected && (
          <div className="mt-3 text-xs font-semibold" style={{ color: primaryColor }}>
            Item selecionado
          </div>
        )}
      </div>
    </div>
  );
};
