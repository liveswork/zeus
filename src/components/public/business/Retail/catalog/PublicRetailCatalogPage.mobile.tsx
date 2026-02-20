import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import {
    Store, ShoppingBag, ShoppingCart,
    Search, Home, User, Grid, Tag, ChevronRight, Zap
} from 'lucide-react';
import { db } from '../../../../../config/firebase';
import { formatCurrency } from '../../../../../utils/formatters';
import { CustomerCheckoutModal } from '../../food/checkout/CustomerCheckoutModal';

type ProductVisibility = 'PUBLIC' | 'HIDDEN' | 'LINK_ONLY';

function toDateMaybe(v: any): Date | null {
    if (!v) return null;
    if (typeof v === 'string') {
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : d;
    }
    if (typeof v?.toDate === 'function') return v.toDate();
    if (typeof v?.seconds === 'number') return new Date(v.seconds * 1000);
    return null;
}

function getVisibility(p: any): ProductVisibility {
    if (p?.visibility) return p.visibility;
    if (p?.showInCatalog === false) return 'HIDDEN';
    return 'PUBLIC';
}

function isProductPublic(p: any, now = new Date()) {
    if (p?.isActive === false) return false;
    if (p?.channel && p.channel !== 'RETAIL') return false;

    const publishAt = toDateMaybe(p?.publishAt);
    const unpublishAt = toDateMaybe(p?.unpublishAt);
    if (publishAt && now < publishAt) return false;
    if (unpublishAt && now >= unpublishAt) return false;

    const vis = getVisibility(p);
    if (vis === 'HIDDEN') return false;

    const trackStock = p?.trackStock ?? true;
    const allowBackorder = p?.allowBackorder ?? false;
    if (trackStock && !allowBackorder) {
        const stock = Number(p?.stockQuantity ?? 0);
        if (stock <= 0) return false;
    }

    return true;
}

function isListable(p: any) {
    return getVisibility(p) !== 'LINK_ONLY';
}

function getProductCover(p: any) {
    const imgs = Array.isArray(p?.images) ? p.images : [];
    return p?.imageUrl || imgs[0] || '';
}

export const PublicRetailCatalogPage: React.FC = () => {
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('home');

    const { storeId, restaurantId } = useParams() as any;

    const [storeProfile, setStoreProfile] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [cart, setCart] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        const id = storeId || restaurantId;
        if (!id) return;

        const fetchData = async () => {
            try {
                const userRef = doc(db, 'users', id);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) setStoreProfile(userSnap.data());

                // IMPORTANTE: não filtrar por showInCatalog aqui
                const productsQuery = query(
                    collection(db, 'products'),
                    where("businessId", "==", id),
                    where("isActive", "==", true),
                    where("showInCatalog", "==", true),
                    where("isHidden", "==", false),
                    where("physicalOnly", "==", false),
                );

                const productsSnapshot = await getDocs(productsQuery);
                const all = productsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

                const now = new Date();
                const publicList = all
                    .filter(p => isProductPublic(p, now))
                    .filter(p => isListable(p));

                setProducts(publicList);
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [storeId, restaurantId]);

    const featuredProducts = useMemo(() => {
        return products
            .filter(p => p.isFeatured || Number(p.salePrice || 0) > 100)
            .slice(0, 4);
    }, [products]);

    const categories = useMemo(() => {
        const unique = [...new Set(products.map(p => String(p.category || '').trim()).filter(Boolean))];
        return ['all', ...unique];
    }, [products]);

    const filteredProducts = useMemo(() => {
        let filtered = products.filter(product =>
            String(product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(product.description || '').toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(product => String(product.category || '').toLowerCase() === selectedCategory.toLowerCase());
        }

        return filtered;
    }, [products, searchTerm, selectedCategory]);

    const addToCart = (product: any) => {
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
        } else {
            setCart([...cart, { ...product, qty: 1 }]);
        }
    };

    const totalCartValue = useMemo(() => {
        return cart.reduce((total, item) => total + (Number(item.salePrice || 0) * item.qty), 0);
    }, [cart]);

    const cartItemCount = useMemo(() => {
        return cart.reduce((total, item) => total + item.qty, 0);
    }, [cart]);

    const handleOrderFinalized = () => {
        setCart([]);
        setIsCheckoutModalOpen(false);
    };

    const handleProductClick = (product: any) => addToCart(product);

    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    const renderContent = () => {
        switch (activeSection) {
            case 'home':
                return (
                    <div className="space-y-6 pb-20">
                        <div className="bg-gray-900 rounded-xl p-5 text-white shadow-lg mx-4 mt-4 relative overflow-hidden">
                            <div className="relative z-10">
                                <span className="bg-yellow-400 text-gray-900 text-[10px] font-bold px-2 py-0.5 rounded mb-2 inline-block">
                                    NOVIDADE
                                </span>
                                <h3 className="font-bold text-xl mb-1 leading-tight">Vitrine Online</h3>
                                <p className="text-gray-400 text-xs mb-4">Produtos disponíveis agora</p>
                                <button
                                    onClick={() => setActiveSection('catalog')}
                                    className="bg-white text-gray-900 px-4 py-2 rounded-lg text-xs font-bold"
                                >
                                    Ver Produtos
                                </button>
                            </div>
                            <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-gray-800 to-transparent"></div>
                            <ShoppingBag className="absolute -right-4 -bottom-4 text-white/10 w-32 h-32 transform -rotate-12" />
                        </div>

                        <section>
                            <div className="flex items-center justify-between px-4 mb-3">
                                <h2 className="font-bold text-gray-900">Departamentos</h2>
                                <button onClick={() => setActiveSection('catalog')} className="text-green-600 text-xs font-medium flex items-center">
                                    Ver todos <ChevronRight size={14} />
                                </button>
                            </div>
                            <div className="flex overflow-x-auto px-4 gap-3 pb-2 scrollbar-hide">
                                {categories.filter(c => c !== 'all').map(category => (
                                    <button
                                        key={category}
                                        onClick={() => {
                                            setSelectedCategory(category);
                                            setActiveSection('catalog');
                                        }}
                                        className="flex flex-col items-center min-w-[72px]"
                                    >
                                        <div className="w-14 h-14 bg-white rounded-full border border-gray-100 shadow-sm flex items-center justify-center mb-1">
                                            <Tag size={20} className="text-gray-600" />
                                        </div>
                                        <span className="text-[10px] text-gray-600 font-medium capitalize truncate w-full text-center">
                                            {category}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="px-4">
                            <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <Zap size={16} className="text-yellow-500 fill-current" /> Destaques
                            </h2>
                            <div className="grid grid-cols-2 gap-3">
                                {featuredProducts.map(product => (
                                    <MobileRetailProductCard
                                        key={product.id}
                                        product={product}
                                        onProductClick={handleProductClick}
                                    />
                                ))}
                            </div>
                        </section>
                    </div>
                );

            case 'catalog':
                return (
                    <div className="pb-20">
                        <div className="sticky top-[60px] bg-white z-30 shadow-sm py-3 px-4 border-b border-gray-100 overflow-x-auto whitespace-nowrap">
                            <div className="flex space-x-2">
                                {categories.map(category => (
                                    <button
                                        key={category}
                                        onClick={() => setSelectedCategory(category)}
                                        className={`px-4 py-1.5 rounded-full text-xs font-medium border ${selectedCategory === category
                                            ? 'bg-gray-900 text-white border-gray-900'
                                            : 'bg-white text-gray-600 border-gray-200'
                                            }`}
                                    >
                                        <span className="capitalize">{category === 'all' ? 'Tudo' : category}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 space-y-4">
                            {filteredProducts.map(product => {
                                const cover = getProductCover(product);
                                return (
                                    <div
                                        key={product.id}
                                        onClick={() => handleProductClick(product)}
                                        className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex gap-3"
                                    >
                                        <div className="w-24 h-24 bg-gray-50 rounded-lg flex-shrink-0 relative overflow-hidden">
                                            {cover ? (
                                                <img src={cover} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                    <ShoppingBag size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <h4 className="font-medium text-gray-900 text-sm line-clamp-2">{product.name}</h4>
                                                <p className="text-xs text-gray-500 mt-1">{product.category}</p>
                                            </div>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="font-bold text-green-700">{formatCurrency(Number(product.salePrice || 0))}</span>
                                                <button className="bg-green-50 text-green-700 p-1.5 rounded-lg">
                                                    <ShoppingCart size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );

            case 'profile':
                return (
                    <div className="p-6 text-center space-y-6">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                            <User size={32} className="text-gray-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Acesse sua conta</h2>
                            <p className="text-gray-500 text-sm mt-2">Acompanhe seus pedidos e salve favoritos</p>
                        </div>
                        <button className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold">
                            Entrar ou Cadastrar
                        </button>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <header className="bg-white sticky top-0 z-40 px-4 py-3 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white">
                        <Store size={16} />
                    </div>
                    <h1 className="font-bold text-gray-900 truncate max-w-[150px]">
                        {storeProfile?.companyName || 'Loja'}
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowSearch(!showSearch)}
                        className={`p-2 rounded-full transition-colors ${showSearch ? 'bg-gray-100 text-gray-900' : 'text-gray-500'}`}
                    >
                        <Search size={20} />
                    </button>
                    <button
                        onClick={() => setIsCheckoutModalOpen(true)}
                        className="relative p-2 text-gray-500"
                    >
                        <ShoppingBag size={20} />
                        {cartItemCount > 0 && (
                            <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                {cartItemCount}
                            </span>
                        )}
                    </button>
                </div>
            </header>

            {showSearch && (
                <div className="px-4 py-2 bg-white border-b border-gray-100 animate-in slide-in-from-top-2">
                    <input
                        type="text"
                        placeholder="O que você procura hoje?"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            if (e.target.value) setActiveSection('catalog');
                        }}
                        className="w-full bg-gray-100 border-none rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-green-500"
                        autoFocus
                    />
                </div>
            )}

            <main>{renderContent()}</main>

            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-50 safe-area-bottom">
                <button
                    onClick={() => setActiveSection('home')}
                    className={`flex flex-col items-center gap-1 ${activeSection === 'home' ? 'text-green-600' : 'text-gray-400'}`}
                >
                    <Home size={22} strokeWidth={activeSection === 'home' ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">Início</span>
                </button>

                <button
                    onClick={() => setActiveSection('catalog')}
                    className={`flex flex-col items-center gap-1 ${activeSection === 'catalog' ? 'text-green-600' : 'text-gray-400'}`}
                >
                    <Grid size={22} strokeWidth={activeSection === 'catalog' ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">Produtos</span>
                </button>

                <button
                    onClick={() => setActiveSection('profile')}
                    className={`flex flex-col items-center gap-1 ${activeSection === 'profile' ? 'text-green-600' : 'text-gray-400'}`}
                >
                    <User size={22} strokeWidth={activeSection === 'profile' ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">Perfil</span>
                </button>
            </nav>

            {isCheckoutModalOpen && (
                <CustomerCheckoutModal
                    isOpen={isCheckoutModalOpen}
                    onClose={() => setIsCheckoutModalOpen(false)}
                    cart={cart}
                    restaurantId={storeId || restaurantId || ''}
                    onOrderFinalized={handleOrderFinalized}
                />
            )}
        </div>
    );
};

const MobileRetailProductCard = ({ product, onProductClick }: any) => {
    const cover = getProductCover(product);

    return (
        <div
            onClick={() => onProductClick(product)}
            className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm flex flex-col"
        >
            <div className="aspect-square bg-gray-50 relative">
                {cover ? (
                    <img src={cover} alt="" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <ShoppingBag size={24} />
                    </div>
                )}
            </div>
            <div className="p-2 flex-1 flex flex-col">
                <h4 className="text-xs font-medium text-gray-900 line-clamp-2 mb-1 flex-1">
                    {product.name}
                </h4>
                <div className="mt-auto">
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(Number(product.salePrice || 0))}</p>
                </div>
            </div>
        </div>
    );
};
