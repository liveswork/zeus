// src/components/public/catalog/PublicCatalogPage.desktop.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { 
    Utensils, Phone, MapPin, MessageSquare, ShoppingCart, 
    Image as ImageIcon, Star, Clock, Truck, Shield, 
    Filter, Search, ChevronDown, Heart
} from 'lucide-react';
import { db } from '../../../../../config/firebase';
import { formatCurrency } from '../../../../../utils/formatters';
import { CustomerCheckoutModal } from '../checkout/CustomerCheckoutModal';
import { ProductAddonsModal } from '../../../../business/modules/common/ProductAddonsModal';
import { useAuth } from '../../../../../contexts/AuthContext';

export const PublicCatalogPage: React.FC = () => {
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [isAddonsModalOpen, setIsAddonsModalOpen] = useState(false);
    const [productForAddons, setProductForAddons] = useState<any | null>(null);
    const { restaurantId } = useParams();
    const [restaurantProfile, setRestaurantProfile] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState('name');
    const { userProfile, logout } = useAuth();

    useEffect(() => {
        if (!restaurantId) return;

        const fetchData = async () => {
            try {
                // Buscar perfil do restaurante na coleção users
                const userRef = doc(db, 'users', restaurantId);
                const userSnap = await getDoc(userRef);
                
                if (userSnap.exists()) {
                    setRestaurantProfile(userSnap.data());
                }

                // Buscar produtos públicos
                const productsQuery = query(
                    collection(db, 'products'),
                    where("businessId", "==", restaurantId),
                    where("showInCatalog", "==", true)
                );
                
                const productsSnapshot = await getDocs(productsQuery);
                setProducts(productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                
            } catch (error) {
                console.error("Erro ao buscar dados:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [restaurantId]);

    // Filtros e ordenação
    const filteredAndSortedProducts = useMemo(() => {
        let filtered = products.filter(product => 
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(product => product.category === selectedCategory);
        }

        return filtered.sort((a, b) => {
            switch (sortBy) {
                case 'price-low':
                    return a.salePrice - b.salePrice;
                case 'price-high':
                    return b.salePrice - a.salePrice;
                case 'name':
                default:
                    return a.name.localeCompare(b.name);
            }
        });
    }, [products, searchTerm, selectedCategory, sortBy]);

    const categories = useMemo(() => {
        const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
        return ['all', ...uniqueCategories];
    }, [products]);

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

    // Função que decide o que fazer ao clicar no produto
    const handleProductClick = (product: any) => {
        if (product.addonGroupIds && product.addonGroupIds.length > 0) {
            setProductForAddons(product);
            setIsAddonsModalOpen(true);
        } else {
            // Se não tiver complementos, adiciona direto ao carrinho
            addToCart(product);
        }
    };

    const handleConfirmAddons = (customizedProduct: any) => {
        setCart(prevCart => [...prevCart, customizedProduct]);
        setIsAddonsModalOpen(false);
        setProductForAddons(null);
    };

    const totalCartValue = useMemo(() => {
        return cart.reduce((total, item) => total + (item.salePrice * item.qty), 0);
    }, [cart]);

    const cartItemCount = useMemo(() => {
        return cart.reduce((total, item) => total + item.qty, 0);
    }, [cart]);

    const generateWhatsappMessage = () => {
        const businessWhatsappNumber = restaurantProfile?.profile?.whatsapp || "5585998112283";
        const name = restaurantProfile ? restaurantProfile.companyName : "Estabelecimento";
        let message = `*Olá, ${name}!* \n\nTenho interesse em fazer um pedido:\n\n`;

        cart.forEach(item => {
            message += `*- ${item.name}* (Qtd: ${item.qty}x) - ${formatCurrency(item.salePrice * item.qty)}\n`;
        });

        message += `\n*Total Estimado:* ${formatCurrency(totalCartValue)}\n\n`;
        message += `Por favor, me informe sobre as opções de pagamento e entrega.`;

        return `https://wa.me/${businessWhatsappNumber}?text=${encodeURIComponent(message)}`;
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

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Header Fixo */}
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-8">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                                    {userProfile?.logoUrl ? (
                                        <img 
                                            src={userProfile.logoUrl} 
                                            alt="Logo" 
                                            className="w-10 h-10 object-contain rounded"
                                        />
                                    ) : (
                                        <Utensils className="text-white" size={24} />
                                    )}
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">
                                        {restaurantProfile?.companyName || restaurantProfile?.displayName}
                                    </h1>
                                    <p className="text-sm text-gray-500 flex items-center">
                                        <Star className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" />
                                        4.8 • {products.length} itens
                                    </p>
                                </div>
                            </div>

                            <nav className="hidden lg:flex space-x-6">
                                <a href="#destaques" className="text-gray-700 hover:text-blue-600 font-medium">Destaques</a>
                                <a href="#cardapio" className="text-gray-700 hover:text-blue-600 font-medium">Cardápio</a>
                                <a href="#sobre" className="text-gray-700 hover:text-blue-600 font-medium">Sobre</a>
                            </nav>
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* Barra de Pesquisa */}
                            <div className="relative hidden md:block">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Buscar no cardápio..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                                />
                            </div>

                            {/* Carrinho */}
                            {cart.length > 0 && (
                                <button
                                    onClick={() => setIsCheckoutModalOpen(true)}
                                    className="relative bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors"
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
                    {/* Sidebar de Filtros */}
                    <aside className="w-80 flex-shrink-0">
                        <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                            <h3 className="font-semibold text-lg text-gray-900 mb-4">Filtros</h3>
                            
                            {/* Categorias */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-3">Categorias</label>
                                <div className="space-y-2">
                                    {categories.map(category => (
                                        <button
                                            key={category}
                                            onClick={() => setSelectedCategory(category)}
                                            className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                                selectedCategory === category
                                                    ? 'bg-blue-100 text-blue-700 font-medium'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            {category === 'all' ? 'Todas as categorias' : category}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Ordenação */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">Ordenar por</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="name">Nome A-Z</option>
                                    <option value="price-low">Menor preço</option>
                                    <option value="price-high">Maior preço</option>
                                </select>
                            </div>

                            {/* Informações do Restaurante */}
                            <div className="mt-8 pt-6 border-t border-gray-200">
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
                        {/* Banner do Restaurante */}
                        <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl p-8 text-white mb-8">
                            <div className="max-w-2xl">
                                <h2 className="text-3xl font-bold mb-4">
                                    {restaurantProfile?.companyName || 'Bem-vindo!'}
                                </h2>
                                <p className="text-blue-100 text-lg mb-6">
                                    {restaurantProfile?.profile?.description || 'Sabores incríveis entregues na sua porta'}
                                </p>
                                <div className="flex items-center space-x-6 text-sm">
                                    <span className="flex items-center">
                                        <Star className="w-5 h-5 text-yellow-400 mr-1" fill="currentColor" />
                                        4.8 (2.4k avaliações)
                                    </span>
                                    <span className="flex items-center">
                                        <Clock className="w-5 h-5 mr-1" />
                                        35-45 min
                                    </span>
                                    <span className="flex items-center">
                                        <Truck className="w-5 h-5 mr-1" />
                                        R$ 0,00 delivery
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Grid de Produtos */}
                        <div id="cardapio">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold text-gray-900">
                                    Cardápio {filteredAndSortedProducts.length > 0 && `(${filteredAndSortedProducts.length} itens)`}
                                </h3>
                                
                                {/* Filtros Mobile */}
                                <div className="md:hidden flex items-center space-x-2">
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
                                    {filteredAndSortedProducts.map(product => (
                                        <ProductCard 
                                            key={product.id} 
                                            product={product} 
                                            onProductClick={handleProductClick}
                                            cart={cart}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-white rounded-xl">
                                    <Utensils className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Nenhum produto encontrado</h4>
                                    <p className="text-gray-500">
                                        {searchTerm ? 'Tente ajustar os filtros de busca' : 'Cardápio em atualização'}
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
                        className="bg-blue-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:bg-blue-700 transition-all transform hover:scale-105 flex items-center space-x-3"
                    >
                        <ShoppingCart size={20} />
                        <span>Ver Carrinho ({cartItemCount})</span>
                        <span className="bg-white text-blue-600 px-2 py-1 rounded-lg text-sm font-bold">
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
                    restaurantId={restaurantId!}
                    onOrderFinalized={handleOrderFinalized}
                />
            )}
        </div>
    );
};

// Componente de Card de Produto Otimizado
const ProductCard = ({ product, onProductClick, cart }) => {
    const cartItem = cart.find(item => item.id === product.id);
    const quantity = cartItem?.qty || 0;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 group cursor-pointer">
            <div className="relative">
                <div className="aspect-w-16 aspect-h-12 bg-gray-100">
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
                
                {/* Badges */}
                <div className="absolute top-3 left-3">
                    {product.isPopular && (
                        <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            Popular
                        </span>
                    )}
                </div>

                <button className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                    <Heart className="w-4 h-4 text-gray-400 hover:text-red-500" />
                </button>
            </div>

            <div className="p-5">
                <div className="mb-3">
                    <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-2">
                        {product.name}
                    </h3>
                    {product.description && (
                        <p className="text-gray-600 text-sm line-clamp-2">
                            {product.description}
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-2xl font-bold text-green-600">
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
                            <div className="flex items-center space-x-3 bg-blue-50 rounded-full px-4 py-2">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onProductClick({ ...product, qty: -1 });
                                    }}
                                    className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold hover:bg-blue-700"
                                >
                                    -
                                </button>
                                <span className="font-semibold text-blue-600 min-w-6 text-center">
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
                                className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-full hover:bg-blue-700 transition-colors flex items-center space-x-2"
                            >
                                <span>Selecionar</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};