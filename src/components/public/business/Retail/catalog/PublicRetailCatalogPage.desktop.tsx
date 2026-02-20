import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import {
    Store, ShoppingBag, ShoppingCart,
    Star, Truck, Shield,
    Filter, Search, ChevronDown, Heart, Tag, Package
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
    // fallback legado
    if (p?.showInCatalog === false) return 'HIDDEN';
    return 'PUBLIC';
}

function isProductPublic(p: any, now = new Date()) {
    // ativo
    if (p?.isActive === false) return false;

    // canal retail (se existir)
    if (p?.channel && p.channel !== 'RETAIL') return false;

    // agendamento
    const publishAt = toDateMaybe(p?.publishAt);
    const unpublishAt = toDateMaybe(p?.unpublishAt);
    if (publishAt && now < publishAt) return false;
    if (unpublishAt && now >= unpublishAt) return false;

    // visibilidade
    const vis = getVisibility(p);
    if (vis === 'HIDDEN') return false;

    // estoque
    const trackStock = p?.trackStock ?? true;
    const allowBackorder = p?.allowBackorder ?? false;
    if (trackStock && !allowBackorder) {
        const stock = Number(p?.stockQuantity ?? 0);
        if (stock <= 0) return false;
    }

    return true;
}

function isListable(p: any) {
    const vis = getVisibility(p);
    return vis !== 'LINK_ONLY';
}

function getProductCover(p: any) {
    const imgs = Array.isArray(p?.images) ? p.images : [];
    return p?.imageUrl || imgs[0] || '';
}

export const PublicRetailCatalogPage: React.FC = () => {
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const { storeId, restaurantId } = useParams() as any;

    const [storeProfile, setStoreProfile] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [cart, setCart] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState('name');

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

    const filteredAndSortedProducts = useMemo(() => {
        let filtered = products.filter(product =>
            String(product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(product.description || '').toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(product => String(product.category || '').toLowerCase() === selectedCategory.toLowerCase());
        }

        return filtered.sort((a, b) => {
            switch (sortBy) {
                case 'price-low':
                    return Number(a.salePrice || 0) - Number(b.salePrice || 0);
                case 'price-high':
                    return Number(b.salePrice || 0) - Number(a.salePrice || 0);
                case 'name':
                default:
                    return String(a.name || '').localeCompare(String(b.name || ''));
            }
        });
    }, [products, searchTerm, selectedCategory, sortBy]);

    const categories = useMemo(() => {
        const unique = [...new Set(products.map(p => String(p.category || '').trim()).filter(Boolean))];
        return ['all', ...unique];
    }, [products]);

    const addToCart = (product: any) => {
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
        } else {
            setCart([...cart, { ...product, qty: 1 }]);
        }
    };

    const handleProductClick = (product: any) => addToCart(product);

    const totalCartValue = useMemo(() => cart.reduce((t, item) => t + (Number(item.salePrice || 0) * item.qty), 0), [cart]);
    const cartItemCount = useMemo(() => cart.reduce((t, item) => t + item.qty, 0), [cart]);

    const handleOrderFinalized = () => {
        setCart([]);
        setIsCheckoutModalOpen(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-xl text-gray-600">Carregando vitrine...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-8">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                                    {storeProfile?.logoUrl ? (
                                        <img src={storeProfile.logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded" />
                                    ) : (
                                        <Store className="text-white" size={24} />
                                    )}
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">
                                        {storeProfile?.companyName || storeProfile?.displayName}
                                    </h1>
                                    <p className="text-sm text-gray-500 flex items-center">
                                        <Star className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" />
                                        4.9 • {products.length} produtos
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="relative hidden md:block">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Buscar na loja..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent w-64"
                                />
                            </div>

                            {cart.length > 0 && (
                                <button
                                    onClick={() => setIsCheckoutModalOpen(true)}
                                    className="relative bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 transition-colors"
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
                    <aside className="w-80 flex-shrink-0">
                        <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                            <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
                                <Filter size={20} /> Filtros
                            </h3>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-3">Departamentos</label>
                                <div className="space-y-2">
                                    {categories.map(category => (
                                        <button
                                            key={category}
                                            onClick={() => setSelectedCategory(category)}
                                            className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${selectedCategory === category
                                                ? 'bg-green-50 text-green-700 font-medium'
                                                : 'text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            <span className="capitalize">{category === 'all' ? 'Todos os departamentos' : category}</span>
                                            {selectedCategory === category && <Tag size={14} />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">Ordenar por</label>
                                <div className="relative">
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 appearance-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                                    >
                                        <option value="name">Nome A-Z</option>
                                        <option value="price-low">Menor preço</option>
                                        <option value="price-high">Maior preço</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <h4 className="font-semibold text-gray-900 mb-3">Diferenciais</h4>
                                <div className="space-y-3 text-sm text-gray-600">
                                    <div className="flex items-center">
                                        <Package className="w-4 h-4 mr-2 text-green-600" />
                                        Embalagem para presente
                                    </div>
                                    <div className="flex items-center">
                                        <Truck className="w-4 h-4 mr-2 text-green-600" />
                                        Entrega expressa
                                    </div>
                                    <div className="flex items-center">
                                        <Shield className="w-4 h-4 mr-2 text-green-600" />
                                        Garantia de qualidade
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>

                    <main className="flex-1">
                        <div className="bg-gradient-to-r from-green-600 to-teal-700 rounded-2xl p-8 text-white mb-8 shadow-lg relative overflow-hidden">
                            <div className="relative z-10 max-w-2xl">
                                <h2 className="text-3xl font-bold mb-4">
                                    {storeProfile?.companyName || 'Bem-vindo à nossa loja!'}
                                </h2>
                                <p className="text-green-100 text-lg mb-6">
                                    {storeProfile?.profile?.description || 'Encontre os melhores produtos com os melhores preços.'}
                                </p>
                                <div className="flex items-center space-x-6 text-sm">
                                    <span className="flex items-center bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                                        <Star className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" />
                                        4.9 de avaliação
                                    </span>
                                    <span className="flex items-center bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                                        <Tag className="w-4 h-4 mr-1" />
                                        Ofertas diárias
                                    </span>
                                </div>
                            </div>
                            <ShoppingBag className="absolute -right-10 -bottom-10 w-64 h-64 text-white/10 transform rotate-12" />
                        </div>

                        <div id="catalogo">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    Catálogo <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{filteredAndSortedProducts.length} itens</span>
                                </h3>
                            </div>

                            {filteredAndSortedProducts.length > 0 ? (
                                <div className="grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {filteredAndSortedProducts.map(product => (
                                        <RetailProductCard
                                            key={product.id}
                                            product={product}
                                            onProductClick={handleProductClick}
                                            cart={cart}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                                    <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Nenhum produto encontrado</h4>
                                    <p className="text-gray-500">
                                        {searchTerm ? 'Tente buscar por outro termo ou categoria' : 'Estamos repondo o estoque!'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>

            {cart.length > 0 && (
                <div className="fixed bottom-8 right-8 z-50 animate-bounce-subtle">
                    <button
                        onClick={() => setIsCheckoutModalOpen(true)}
                        className="bg-green-600 text-white font-bold py-4 px-6 rounded-xl shadow-xl hover:bg-green-700 transition-all transform hover:scale-105 flex items-center space-x-3"
                    >
                        <ShoppingBag size={20} />
                        <span>Sacola ({cart.reduce((t, i) => t + i.qty, 0)})</span>
                        <div className="h-4 w-px bg-white/30"></div>
                        <span className="text-sm font-bold">{formatCurrency(totalCartValue)}</span>
                    </button>
                </div>
            )}

            {isCheckoutModalOpen && (
                <CustomerCheckoutModal
                    isOpen={isCheckoutModalOpen}
                    onClose={() => setIsCheckoutModalOpen(false)}
                    cart={cart}
                    restaurantId={storeId || restaurantId || ''}
                    onOrderFinalized={() => {
                        setCart([]);
                        setIsCheckoutModalOpen(false);
                    }}
                />
            )}
        </div>
    );
};

const RetailProductCard = ({ product, onProductClick, cart }: any) => {
    const cartItem = cart.find((item: any) => item.id === product.id);
    const quantity = cartItem?.qty || 0;

    const cover = getProductCover(product);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer flex flex-col h-full">
            <div className="relative pt-[100%] bg-gray-50 overflow-hidden">
                {cover ? (
                    <img
                        src={cover}
                        alt={product.name}
                        className="absolute inset-0 w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300 mix-blend-multiply"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <ShoppingBag className="w-16 h-16 text-gray-300" />
                    </div>
                )}

                <button className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                    <Heart className="w-4 h-4 text-gray-400 hover:text-red-500" />
                </button>
            </div>

            <div className="p-5 flex flex-col flex-1" onClick={() => onProductClick(product)}>
                <div className="mb-auto">
                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">{product.category || 'Geral'}</p>
                    <h3 className="font-medium text-gray-900 text-base mb-2 line-clamp-2 leading-snug">{product.name}</h3>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-end justify-between mb-3">
                        <p className="text-xl font-bold text-gray-900">{formatCurrency(Number(product.salePrice || 0))}</p>
                        <div className="text-right">
                            <p className="text-[10px] text-gray-500">ou 12x de {formatCurrency(Number(product.salePrice || 0) / 12)}</p>
                        </div>
                    </div>

                    {quantity > 0 ? (
                        <div className="flex items-center justify-between bg-green-50 rounded-lg p-1">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // decremento simples (ajuste se você tiver remove)
                                    onProductClick({ ...product, __dec: true });
                                }}
                                className="w-8 h-8 bg-white text-green-600 rounded shadow-sm flex items-center justify-center hover:bg-green-100 transition-colors border border-green-100"
                            >
                                -
                            </button>
                            <span className="font-bold text-green-700 text-sm">{quantity} un</span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onProductClick(product);
                                }}
                                className="w-8 h-8 bg-green-600 text-white rounded shadow-sm flex items-center justify-center hover:bg-green-700 transition-colors"
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
                            className="w-full bg-gray-900 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-green-600 transition-colors text-sm flex items-center justify-center gap-2 group-hover:bg-green-600"
                        >
                            <ShoppingCart size={16} />
                            Adicionar à Sacola
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
