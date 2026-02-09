import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { 
    Factory, Phone, MapPin, ShoppingCart, 
    Star, Search, X, Menu, Home, Layers,
    User, Package, ChevronRight, Truck, Filter
} from 'lucide-react';
import { db } from '../../../config/firebase';
import { formatCurrency } from '../../../utils/formatters';

export const PublicSupplierCatalogPage: React.FC = () => {
    const { supplierId } = useParams();
    const [activeSection, setActiveSection] = useState('home');
    const [supplierProfile, setSupplierProfile] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        if (!supplierId) return;

        const fetchData = async () => {
            try {
                let userRef = doc(db, 'users', supplierId);
                let userSnap = await getDoc(userRef);
                
                if (!userSnap.exists()) {
                    userRef = doc(db, 'suppliers', supplierId);
                    userSnap = await getDoc(userRef);
                }
                
                if (userSnap.exists()) {
                    setSupplierProfile(userSnap.data());
                }

                // Tenta buscar produtos de todas as coleções possíveis
                const q1 = query(collection(db, 'products'), where("businessId", "==", supplierId), where("showInCatalog", "==", true));
                const s1 = await getDocs(q1);
                let data = s1.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                if (data.length === 0) {
                     const q2 = query(collection(db, 'supplierProducts'), where("supplierId", "==", supplierId));
                     const s2 = await getDocs(q2);
                     data = s2.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                }

                setProducts(data.map(p => ({
                    ...p,
                    category: p.category || 'Geral',
                    minOrder: p.minOrder || 1,
                    unit: p.unit || p.unitOfSale || 'un'
                })));
                
            } catch (error) {
                console.error("Erro ao buscar dados:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [supplierId]);

    const categories = useMemo(() => {
        const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
        return ['all', ...uniqueCategories];
    }, [products]);

    const filteredProducts = useMemo(() => {
        let filtered = products.filter(product => 
            (product.name || product.productName || '').toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(product => product.category === selectedCategory);
        }

        return filtered;
    }, [products, searchTerm, selectedCategory]);

    const addToCart = (product: any) => {
        const existingItem = cart.find(item => item.id === product.id);
        const minOrder = product.minOrder || 1;
        
        if (existingItem) {
            setCart(cart.map(item =>
                item.id === product.id ? { ...item, qty: item.qty + minOrder } : item
            ));
        } else {
            setCart([...cart, { ...product, qty: minOrder }]);
        }
    };

    const cartTotalItems = cart.length;
    const cartTotalValue = cart.reduce((acc, item) => acc + ((item.salePrice || item.price) * item.qty), 0);

    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
            </div>
        );
    }

    const renderContent = () => {
        switch (activeSection) {
            case 'home':
                return (
                    <div className="space-y-6 pb-24">
                        {/* Banner B2B */}
                        <div className="bg-slate-900 rounded-xl p-5 text-white shadow-lg mx-4 mt-4 relative overflow-hidden">
                            <div className="relative z-10">
                                <span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded mb-2 inline-block">
                                    B2B OFICIAL
                                </span>
                                <h3 className="font-bold text-xl mb-1 leading-tight">Reposição de<br/>Estoque Fácil</h3>
                                <p className="text-slate-400 text-xs mb-4">Condições especiais para CNPJ</p>
                                <button 
                                    onClick={() => setActiveSection('catalog')}
                                    className="bg-white text-slate-900 px-4 py-2 rounded-lg text-xs font-bold"
                                >
                                    Ver Catálogo
                                </button>
                            </div>
                            <Factory className="absolute -right-4 -bottom-4 text-white/10 w-32 h-32" />
                        </div>

                        {/* Categorias Horizontal */}
                        <section>
                            <div className="flex items-center justify-between px-4 mb-3">
                                <h2 className="font-bold text-slate-900">Linhas de Produto</h2>
                            </div>
                            <div className="flex overflow-x-auto px-4 gap-3 pb-2 scrollbar-hide">
                                {categories.filter(c => c !== 'all').map(category => (
                                    <button
                                        key={category}
                                        onClick={() => {
                                            setSelectedCategory(category);
                                            setActiveSection('catalog');
                                        }}
                                        className="flex flex-col items-center min-w-[80px]"
                                    >
                                        <div className="w-14 h-14 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center mb-1">
                                            <Package size={20} className="text-slate-600" />
                                        </div>
                                        <span className="text-[10px] text-slate-600 font-medium capitalize truncate w-full text-center">
                                            {category}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Produtos em Destaque (Lista) */}
                        <section className="px-4">
                            <h2 className="font-bold text-slate-900 mb-3">Últimas Novidades</h2>
                            <div className="space-y-3">
                                {products.slice(0, 5).map(product => (
                                    <MobileSupplierProductCard 
                                        key={product.id} 
                                        product={product} 
                                        onAddToCart={addToCart} 
                                    />
                                ))}
                            </div>
                        </section>
                    </div>
                );

            case 'catalog':
                return (
                    <div className="pb-24">
                        <div className="sticky top-[60px] bg-slate-50 z-30 py-3 px-4 overflow-x-auto whitespace-nowrap border-b border-slate-200">
                            <div className="flex space-x-2">
                                {categories.map(category => (
                                    <button
                                        key={category}
                                        onClick={() => setSelectedCategory(category)}
                                        className={`px-4 py-1.5 rounded-full text-xs font-medium border ${
                                            selectedCategory === category
                                                ? 'bg-slate-900 text-white border-slate-900'
                                                : 'bg-white text-slate-600 border-slate-200'
                                        }`}
                                    >
                                        <span className="capitalize">{category === 'all' ? 'Tudo' : category}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 space-y-4">
                            {filteredProducts.map(product => (
                                <MobileSupplierProductCard 
                                    key={product.id} 
                                    product={product} 
                                    onAddToCart={addToCart} 
                                />
                            ))}
                        </div>
                    </div>
                );
            
            default: return null;
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen">
            {/* Header Mobile */}
            <header className="bg-white sticky top-0 z-40 px-4 py-3 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                        {supplierProfile?.logoUrl ? (
                            <img src={supplierProfile.logoUrl} className="w-8 h-8 object-contain" />
                        ) : (
                            <Factory size={20} className="text-slate-500" />
                        )}
                    </div>
                    <div>
                        <h1 className="font-bold text-slate-900 text-sm truncate max-w-[150px]">
                            {supplierProfile?.companyName || supplierProfile?.name || 'Fornecedor'}
                        </h1>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Truck size={10} /> Entrega Rápida
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={() => setShowSearch(!showSearch)} className="p-2 text-slate-600">
                        <Search size={20} />
                    </button>
                    {cart.length > 0 && (
                        <div className="relative p-2">
                            <ShoppingCart size={20} className="text-slate-900" />
                            <span className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                {cartTotalItems}
                            </span>
                        </div>
                    )}
                </div>
            </header>

            {showSearch && (
                <div className="px-4 py-2 bg-white border-b border-slate-200">
                    <input
                        type="text"
                        placeholder="Buscar produto..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            if(e.target.value) setActiveSection('catalog');
                        }}
                        className="w-full bg-slate-100 border-none rounded-lg py-2 px-4 text-sm"
                        autoFocus
                    />
                </div>
            )}

            <main>{renderContent()}</main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50 safe-area-bottom">
                <button
                    onClick={() => setActiveSection('home')}
                    className={`flex flex-col items-center gap-1 ${activeSection === 'home' ? 'text-indigo-600' : 'text-slate-400'}`}
                >
                    <Home size={22} strokeWidth={activeSection === 'home' ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">Início</span>
                </button>
                
                <button
                    onClick={() => setActiveSection('catalog')}
                    className={`flex flex-col items-center gap-1 ${activeSection === 'catalog' ? 'text-indigo-600' : 'text-slate-400'}`}
                >
                    <Layers size={22} strokeWidth={activeSection === 'catalog' ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">Catálogo</span>
                </button>
                
                <button
                    className={`flex flex-col items-center gap-1 text-slate-400`}
                >
                    <User size={22} strokeWidth={2} />
                    <span className="text-[10px] font-medium">Conta</span>
                </button>
            </nav>

            {/* Floating Cart Summary if needed */}
            {cart.length > 0 && (
                <div className="fixed bottom-[70px] left-4 right-4 bg-slate-900 text-white p-3 rounded-xl shadow-xl flex justify-between items-center z-40">
                    <div className="flex flex-col">
                        <span className="text-xs text-slate-400">{cartTotalItems} itens adicionados</span>
                        <span className="font-bold">{formatCurrency(cartTotalValue)}</span>
                    </div>
                    <button className="bg-indigo-600 px-4 py-2 rounded-lg text-xs font-bold">
                        Finalizar Cotação
                    </button>
                </div>
            )}
        </div>
    );
};

const MobileSupplierProductCard = ({ product, onAddToCart }) => {
    const price = product.salePrice || product.price || 0;
    const name = product.name || product.productName;
    const unit = product.unit || product.unitOfSale || 'un';

    return (
        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200 flex gap-3">
            <div className="w-20 h-20 bg-slate-50 rounded-lg flex-shrink-0 flex items-center justify-center border border-slate-100">
                {product.imageUrl ? (
                    <img src={product.imageUrl} className="w-16 h-16 object-contain mix-blend-multiply" />
                ) : (
                    <Package size={24} className="text-slate-300" />
                )}
            </div>
            <div className="flex-1 flex flex-col justify-between">
                <div>
                    <h4 className="font-medium text-slate-900 text-sm line-clamp-2">{name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Mínimo: {product.minOrder || 1} {unit}</p>
                </div>
                <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-indigo-700 text-sm">{formatCurrency(price)} <span className="text-[10px] font-normal text-slate-500">/{unit}</span></span>
                    <button 
                        onClick={() => onAddToCart(product)}
                        className="bg-slate-100 text-slate-700 p-1.5 rounded-lg active:bg-slate-200"
                    >
                        <ShoppingCart size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};