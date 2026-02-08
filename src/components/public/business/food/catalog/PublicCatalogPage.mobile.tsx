// src/components/public/catalog/PublicCatalogPage.mobile.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { 
    Utensils, Phone, MapPin, MessageSquare, ShoppingCart, 
    Image as ImageIcon, Star, Clock, Truck, Shield, 
    Filter, Search, ChevronDown, Heart, X, Menu, Home,
    User, History, Award
} from 'lucide-react';
import { db } from '../../../../../config/firebase';
import { formatCurrency } from '../../../../../utils/formatters';
import { CustomerCheckoutModal } from '../checkout/CustomerCheckoutModal';
import { ProductAddonsModal } from '../../../../business/modules/common/ProductAddonsModal';

export const PublicCatalogPage: React.FC = () => {
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [isAddonsModalOpen, setIsAddonsModalOpen] = useState(false);
    const [productForAddons, setProductForAddons] = useState<any | null>(null);
    const [activeSection, setActiveSection] = useState('home');
    const { restaurantId } = useParams();
    const [restaurantProfile, setRestaurantProfile] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [lastOrders, setLastOrders] = useState<any[]>([]);

    // Dados mockados para demonstração
    const featuredProducts = useMemo(() => {
        return products.filter(product => product.isFeatured).slice(0, 3);
    }, [products]);

    const categories = useMemo(() => {
        const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
        return ['all', ...uniqueCategories];
    }, [products]);

    const filteredProducts = useMemo(() => {
        let filtered = products.filter(product => 
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(product => product.category === selectedCategory);
        }

        return filtered;
    }, [products, searchTerm, selectedCategory]);

    useEffect(() => {
        if (!restaurantId) return;

        const fetchData = async () => {
            try {
                const userRef = doc(db, 'users', restaurantId);
                const userSnap = await getDoc(userRef);
                
                if (userSnap.exists()) {
                    setRestaurantProfile(userSnap.data());
                }

                const productsQuery = query(
                    collection(db, 'products'),
                    where("businessId", "==", restaurantId),
                    where("showInCatalog", "==", true)
                );
                
                const productsSnapshot = await getDocs(productsQuery);
                const productsData = productsSnapshot.docs.map(doc => ({ 
                    id: doc.id, 
                    ...doc.data(),
                    rating: Math.random() * 2 + 3, // Mock rating between 3-5
                    reviewCount: Math.floor(Math.random() * 100) + 10 // Mock review count
                }));
                setProducts(productsData);

                // Mock last orders
                setLastOrders(productsData.slice(0, 2).map(product => ({
                    id: `order-${product.id}`,
                    product: product,
                    date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
                    quantity: Math.floor(Math.random() * 3) + 1
                })));
                
            } catch (error) {
                console.error("Erro ao buscar dados:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [restaurantId]);

    const addToCart = (product: any) => {
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            setCart(cart.map(item =>
                item.id === product.id ? { ...item, qty: item.qty + 1 } : item
            ));
        } else {
            setCart([...cart, { ...product, qty: 1 }]);
        }
    };

    const removeFromCart = (productId: string) => {
        setCart(cart.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId: string, newQty: number) => {
        if (newQty < 1) {
            removeFromCart(productId);
            return;
        }
        setCart(cart.map(item =>
            item.id === productId ? { ...item, qty: newQty } : item
        ));
    };

    const handleOrderFinalized = () => {
        setCart([]);
        setIsCheckoutModalOpen(false);
    };

    const handleProductClick = (product: any) => {
        if (product.addonGroupIds && product.addonGroupIds.length > 0) {
            setProductForAddons(product);
            setIsAddonsModalOpen(true);
        } else {
            addToCart(product);
        }
    };

    const handleConfirmAddons = (customizedProduct: any) => {
        setCart(prevCart => [...prevCart, customizedProduct]);
        setIsAddonsModalOpen(false);
        setProductForAddons(null);
    };

    const reorderProduct = (product: any) => {
        handleProductClick(product);
    };

    const totalCartValue = useMemo(() => {
        return cart.reduce((total, item) => total + (item.salePrice * item.qty), 0);
    }, [cart]);

    const cartItemCount = useMemo(() => {
        return cart.reduce((total, item) => total + item.qty, 0);
    }, [cart]);

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={12}
                        className={`${
                            star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                    />
                ))}
                <span className="text-xs text-gray-500 ml-1">({rating.toFixed(1)})</span>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-xl text-gray-600">Carregando cardápio...</p>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        switch (activeSection) {
            case 'home':
                return (
                    <div className="space-y-6">
                        {/* Banner Promocional */}
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-4 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg mb-1">Entrega Grátis!</h3>
                                    <p className="text-sm opacity-90">Em pedidos acima de R$ 35,00</p>
                                    <p className="text-xs opacity-80 mt-1">Válido para região central</p>
                                </div>
                                <div className="bg-white text-orange-500 px-3 py-1 rounded-full text-sm font-bold">
                                    APROVEITE!
                                </div>
                            </div>
                        </div>

                        {/* Pedir Novamente */}
                        {lastOrders.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-gray-900">Pedir Novamente</h2>
                                    <History size={20} className="text-gray-500" />
                                </div>
                                <div className="space-y-3">
                                    {lastOrders.map(order => (
                                        <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                                        {order.product.imageUrl ? (
                                                            <img 
                                                                src={order.product.imageUrl} 
                                                                alt={order.product.name}
                                                                className="w-10 h-10 object-cover rounded"
                                                            />
                                                        ) : (
                                                            <Utensils size={20} className="text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900">{order.product.name}</h3>
                                                        <p className="text-sm text-gray-500">
                                                            Pedido em {order.date.toLocaleDateString('pt-BR')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => reorderProduct(order.product)}
                                                    className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-700 transition-colors"
                                                >
                                                    Pedir
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Menu de Categorias */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Categorias</h2>
                            <div className="grid grid-cols-3 gap-3">
                                {categories.filter(cat => cat !== 'all').slice(0, 6).map(category => (
                                    <button
                                        key={category}
                                        onClick={() => {
                                            setSelectedCategory(category);
                                            setActiveSection('menu');
                                        }}
                                        className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center hover:shadow-md transition-shadow"
                                    >
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                                            <Utensils size={20} className="text-blue-600" />
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
                                    {featuredProducts.map(product => (
                                        <FeaturedProductCard 
                                            key={product.id} 
                                            product={product} 
                                            onProductClick={handleProductClick}
                                            renderStars={renderStars}
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
                        {/* Filtro de Categorias */}
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                            <h3 className="font-semibold text-gray-900 mb-3">Filtrar por Categoria</h3>
                            <div className="flex overflow-x-auto space-x-2 pb-2">
                                {categories.map(category => (
                                    <button
                                        key={category}
                                        onClick={() => setSelectedCategory(category)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 ${
                                            selectedCategory === category
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700'
                                        }`}
                                    >
                                        {category === 'all' ? 'Todas' : category}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Lista de Produtos */}
                        <div className="space-y-4">
                            {filteredProducts.map(product => (
                                <MobileProductCard 
                                    key={product.id} 
                                    product={product} 
                                    onProductClick={handleProductClick}
                                    cart={cart}
                                    renderStars={renderStars}
                                />
                            ))}
                        </div>
                    </div>
                );

            case 'profile':
                return (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <User size={24} className="text-blue-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Seu Perfil</h2>
                            <p className="text-gray-600">Faça login para ver seu histórico de pedidos</p>
                            <button className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold mt-4 hover:bg-blue-700 transition-colors">
                                Fazer Login
                            </button>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-20">
            {/* Header Mobile */}
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
                <div className="px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                {restaurantProfile?.logoUrl ? (
                                    <img 
                                        src={restaurantProfile.logoUrl} 
                                        alt="Logo" 
                                        className="w-8 h-8 object-contain rounded"
                                    />
                                ) : (
                                    <Utensils className="text-white" size={20} />
                                )}
                            </div>
                            <div>
                                <h1 className="font-bold text-gray-900 text-sm">
                                    {restaurantProfile?.companyName || restaurantProfile?.displayName}
                                </h1>
                                <div className="flex items-center space-x-1">
                                    {renderStars(4.8)}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <button 
                                onClick={() => setShowSearch(true)}
                                className="p-2 text-gray-600"
                            >
                                <Search size={20} />
                            </button>
                            {cart.length > 0 && (
                                <button 
                                    onClick={() => setIsCheckoutModalOpen(true)}
                                    className="relative p-2 text-gray-600"
                                >
                                    <ShoppingCart size={20} />
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                        {cartItemCount}
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Barra de Pesquisa Expandida */}
                {showSearch && (
                    <div className="px-4 py-3 border-t border-gray-200 bg-white">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Buscar no cardápio..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                autoFocus
                            />
                            <button 
                                onClick={() => setShowSearch(false)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </header>

            {/* Banner do Restaurante */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-700 px-4 py-6 text-white">
                <h2 className="text-2xl font-bold mb-2">
                    {restaurantProfile?.companyName || 'Bem-vindo!'}
                </h2>
                <p className="text-blue-100 text-sm mb-4">
                    {restaurantProfile?.profile?.description || 'Sabores incríveis entregues na sua porta'}
                </p>
                <div className="flex items-center space-x-4 text-xs">
                    <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        35-45 min
                    </span>
                    <span className="flex items-center">
                        <Truck className="w-4 h-4 mr-1" />
                        Grátis
                    </span>
                    <span className="flex items-center">
                        <Shield className="w-4 h-4 mr-1" />
                        Seguro
                    </span>
                </div>
            </div>

            {/* Conteúdo Principal */}
            <main className="px-4 py-6">
                {renderContent()}
            </main>

            {/* Barra de Carrinho Fixa Mobile */}
            {cart.length > 0 && (
                <div className="fixed bottom-16 left-0 right-0 bg-white shadow-lg border-t border-gray-200 p-4 z-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">{cartItemCount} itens</p>
                            <p className="text-lg font-bold text-gray-900">{formatCurrency(totalCartValue)}</p>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setIsCheckoutModalOpen(true)}
                                className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg flex-1 hover:bg-blue-700 transition-colors"
                            >
                                Ver Carrinho
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer Navigation */}
            <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
                <div className="flex justify-around items-center py-3">
                    <button
                        onClick={() => setActiveSection('home')}
                        className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-lg transition-colors ${
                            activeSection === 'home' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'
                        }`}
                    >
                        <Home size={20} />
                        <span className="text-xs font-medium">Início</span>
                    </button>
                    
                    <button
                        onClick={() => setActiveSection('menu')}
                        className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-lg transition-colors ${
                            activeSection === 'menu' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'
                        }`}
                    >
                        <Menu size={20} />
                        <span className="text-xs font-medium">Cardápio</span>
                    </button>
                    
                    <button
                        onClick={() => setActiveSection('profile')}
                        className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-lg transition-colors ${
                            activeSection === 'profile' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'
                        }`}
                    >
                        <User size={20} />
                        <span className="text-xs font-medium">Perfil</span>
                    </button>
                </div>
            </footer>

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
                    restaurantId={restaurantId!}
                    onOrderFinalized={handleOrderFinalized}
                />
            )}
        </div>
    );
};

// Componente de Card de Produto em Destaque
const FeaturedProductCard = ({ product, onProductClick, renderStars }) => {
    return (
        <div 
            onClick={() => onProductClick(product)} 
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer"
        >
            <div className="flex">
                <div className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-gray-900 text-lg flex-1 pr-2">
                            {product.name}
                        </h3>
                        <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap">
                            Destaque
                        </span>
                    </div>

                    {product.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {product.description}
                        </p>
                    )}

                    <div className="mb-3">
                        {renderStars(product.rating)}
                    </div>

                    <div className="flex items-center justify-between">
                        <p className="text-xl font-bold text-green-600">
                            {formatCurrency(product.salePrice)}
                        </p>
                        {product.originalPrice > product.salePrice && (
                            <p className="text-sm text-gray-500 line-through">
                                {formatCurrency(product.originalPrice)}
                            </p>
                        )}
                    </div>
                </div>
                
                <div className="w-24 h-24 flex-shrink-0 m-4">
                    {product.imageUrl ? (
                        <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="w-full h-full object-cover rounded-lg"
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                            <Utensils className="w-8 h-8 text-gray-400" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Componente de Card de Produto Mobile
const MobileProductCard = ({ product, onProductClick, cart, renderStars }) => {
    const cartItem = cart.find(item => item.id === product.id);
    const quantity = cartItem?.qty || 0;

    return (
        <div 
            onClick={() => onProductClick(product)} 
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer"
        >
            <div className="flex">
                <div className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 text-sm flex-1 pr-2">
                            {product.name}
                        </h3>
                        {product.isPopular && (
                            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap">
                                Popular
                            </span>
                        )}
                    </div>

                    {product.description && (
                        <p className="text-gray-600 text-xs mb-2 line-clamp-2">
                            {product.description}
                        </p>
                    )}

                    <div className="mb-2">
                        {renderStars(product.rating)}
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-lg font-bold text-green-600">
                                {formatCurrency(product.salePrice)}
                            </p>
                            {product.originalPrice > product.salePrice && (
                                <p className="text-sm text-gray-500 line-through">
                                    {formatCurrency(product.originalPrice)}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center space-x-2">
                            {quantity > 0 ? (
                                <div 
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center space-x-3 bg-blue-50 rounded-full px-3 py-1"
                                >
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onProductClick({ ...product, qty: -1 });
                                        }}
                                        className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold hover:bg-blue-700"
                                    >
                                        -
                                    </button>
                                    <span className="font-semibold text-blue-600 min-w-4 text-center text-sm">
                                        {quantity}
                                    </span>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onProductClick(product);
                                        }}
                                        className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold hover:bg-blue-700"
                                    >
                                        +
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        onProductClick(product); 
                                    }}
                                    className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-full hover:bg-blue-700 transition-colors text-sm"
                                >
                                    Adicionar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="w-20 h-20 flex-shrink-0 m-3">
                    {product.imageUrl ? (
                        <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="w-full h-full object-cover rounded-lg"
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                            <Utensils className="w-6 h-6 text-gray-400" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};