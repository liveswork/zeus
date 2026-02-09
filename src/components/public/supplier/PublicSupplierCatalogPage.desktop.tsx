import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { 
    Factory, Phone, MapPin, ShoppingCart, 
    Star, Clock, Truck, Shield, 
    Filter, Search, ChevronDown, Heart, Package, Layers, BadgeCheck
} from 'lucide-react';
import { db } from '../../../config/firebase';
import { formatCurrency } from '../../../utils/formatters';
import { useAuth } from '../../../contexts/AuthContext';

export const PublicSupplierCatalogPage: React.FC = () => {
    const { supplierId } = useParams();
    const [supplierProfile, setSupplierProfile] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState('name');

    useEffect(() => {
        if (!supplierId) return;

        const fetchData = async () => {
            try {
                // Tenta buscar de 'users' (padrão novo) ou 'suppliers' (legado)
                let userRef = doc(db, 'users', supplierId);
                let userSnap = await getDoc(userRef);
                
                if (!userSnap.exists()) {
                    userRef = doc(db, 'suppliers', supplierId);
                    userSnap = await getDoc(userRef);
                }
                
                if (userSnap.exists()) {
                    setSupplierProfile(userSnap.data());
                }

                // Buscar produtos
                // Nota: Adaptar para a coleção correta do seu banco (products ou supplierProducts)
                const productsQuery = query(
                    collection(db, 'products'), 
                    where("businessId", "==", supplierId),
                    where("showInCatalog", "==", true)
                );
                
                const productsSnapshot = await getDocs(productsQuery);
                let productsData = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Se não achar em 'products', tenta 'supplierProducts'
                if (productsData.length === 0) {
                     const q2 = query(collection(db, 'supplierProducts'), where("supplierId", "==", supplierId));
                     const snap2 = await getDocs(q2);
                     productsData = snap2.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                }

                setProducts(productsData.map(p => ({
                    ...p,
                    // Mockando dados que podem faltar para manter o layout bonito
                    category: p.category || 'Geral',
                    minOrder: p.minOrder || 1,
                    unit: p.unit || 'un'
                })));
                
            } catch (error) {
                console.error("Erro ao buscar dados:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [supplierId]);

    const filteredAndSortedProducts = useMemo(() => {
        let filtered = products.filter(product => 
            (product.name || product.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.description || '').toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(product => product.category === selectedCategory);
        }

        return filtered.sort((a, b) => {
            const priceA = a.salePrice || a.price || 0;
            const priceB = b.salePrice || b.price || 0;
            const nameA = a.name || a.productName || '';
            const nameB = b.name || b.productName || '';

            switch (sortBy) {
                case 'price-low': return priceA - priceB;
                case 'price-high': return priceB - priceA;
                case 'name':
                default: return nameA.localeCompare(nameB);
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
                item.id === product.id ? { ...item, qty: item.qty + (product.minOrder || 1) } : item
            ));
        } else {
            setCart([...cart, { ...product, qty: product.minOrder || 1 }]);
        }
    };

    const cartItemCount = cart.reduce((total, item) => total + 1, 0); // Contagem de itens únicos no B2B faz mais sentido
    const totalCartValue = cart.reduce((total, item) => total + ((item.salePrice || item.price) * item.qty), 0);

    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-slate-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-xl text-slate-600">Carregando catálogo B2B...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen">
            {/* Header Fixo */}
            <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-8">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
                                    {supplierProfile?.logoUrl ? (
                                        <img src={supplierProfile.logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded" />
                                    ) : (
                                        <Factory className="text-white" size={24} />
                                    )}
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-slate-900">
                                        {supplierProfile?.companyName || supplierProfile?.name || 'Fornecedor'}
                                    </h1>
                                    <p className="text-sm text-slate-500 flex items-center">
                                        <BadgeCheck className="w-4 h-4 text-indigo-500 mr-1" />
                                        Fornecedor Verificado • {products.length} produtos
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="relative hidden md:block">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Buscar por SKU ou nome..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-80"
                                />
                            </div>

                            {cart.length > 0 && (
                                <button className="relative bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 px-4">
                                    <ShoppingCart size={20} />
                                    <span className="font-bold">Orçamento ({cartItemCount})</span>
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
                        <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24 border border-slate-200">
                            <h3 className="font-semibold text-lg text-slate-900 mb-4 flex items-center gap-2">
                                <Filter size={20} /> Filtros B2B
                            </h3>
                            
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-700 mb-3">Categorias</label>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                    {categories.map(category => (
                                        <button
                                            key={category}
                                            onClick={() => setSelectedCategory(category)}
                                            className={`flex items-center justify-between w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                                selectedCategory === category
                                                    ? 'bg-indigo-50 text-indigo-700 font-medium border border-indigo-100'
                                                    : 'text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            <span className="capitalize">{category === 'all' ? 'Todas as linhas' : category}</span>
                                            {selectedCategory === category && <BadgeCheck size={14} />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-200">
                                <h4 className="font-semibold text-slate-900 mb-3">Logística</h4>
                                <div className="space-y-3 text-sm text-slate-600">
                                    <div className="flex items-center">
                                        <Truck className="w-4 h-4 mr-2 text-indigo-600" />
                                        Entrega: 24-48h
                                    </div>
                                    <div className="flex items-center">
                                        <Package className="w-4 h-4 mr-2 text-indigo-600" />
                                        Pedido Mín: R$ 500,00
                                    </div>
                                    <div className="flex items-center">
                                        <Shield className="w-4 h-4 mr-2 text-indigo-600" />
                                        Garantia de Troca
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Conteúdo Principal */}
                    <main className="flex-1">
                        {/* Banner do Fornecedor */}
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-900 rounded-2xl p-8 text-white mb-8 shadow-lg relative overflow-hidden">
                            <div className="relative z-10 max-w-3xl">
                                <h2 className="text-3xl font-bold mb-4">
                                    {supplierProfile?.companyName || supplierProfile?.name || 'Catálogo de Atacado'}
                                </h2>
                                <p className="text-indigo-100 text-lg mb-6 max-w-xl">
                                    {supplierProfile?.description || supplierProfile?.businessProfile?.description || 'Abasteça seu negócio com produtos de qualidade e preços competitivos diretamente da fábrica.'}
                                </p>
                                <div className="flex items-center space-x-6 text-sm">
                                    <span className="flex items-center bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                                        <Star className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" />
                                        4.9 (Fornecedor Premium)
                                    </span>
                                    <span className="flex items-center bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                                        <Layers className="w-4 h-4 mr-1" />
                                        Venda em Atacado
                                    </span>
                                </div>
                            </div>
                            <Factory className="absolute -right-6 -bottom-6 w-64 h-64 text-white/5 transform rotate-12" />
                        </div>

                        {/* Grid de Produtos */}
                        <div id="catalogo">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                    Produtos Disponíveis <span className="text-sm font-normal text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-full">{filteredAndSortedProducts.length} SKUs</span>
                                </h3>
                                
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                                >
                                    <option value="name">Nome A-Z</option>
                                    <option value="price-low">Menor preço</option>
                                    <option value="price-high">Maior preço</option>
                                </select>
                            </div>

                            {filteredAndSortedProducts.length > 0 ? (
                                <div className="grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {filteredAndSortedProducts.map(product => (
                                        <SupplierProductCard 
                                            key={product.id} 
                                            product={product} 
                                            onAddToCart={addToCart}
                                            cart={cart}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-white rounded-xl border border-slate-200 border-dashed">
                                    <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                    <h4 className="text-lg font-semibold text-slate-900 mb-2">Nenhum produto encontrado</h4>
                                    <p className="text-slate-500">Tente ajustar os filtros de busca</p>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

const SupplierProductCard = ({ product, onAddToCart, cart }) => {
    const price = product.salePrice || product.price || 0;
    const productName = product.name || product.productName || 'Produto sem nome';
    const unit = product.unit || product.unitOfSale || 'un';
    const minOrder = product.minOrder || 1;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col group">
            <div className="relative pt-[60%] bg-slate-100 overflow-hidden border-b border-slate-100">
                {product.imageUrl ? (
                    <img 
                        src={product.imageUrl} 
                        alt={productName}
                        className="absolute inset-0 w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300 mix-blend-multiply"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Package className="w-12 h-12 text-slate-300" />
                    </div>
                )}
                
                {minOrder > 1 && (
                    <div className="absolute bottom-2 left-2 bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                        Mínimo: {minOrder} {unit}
                    </div>
                )}
            </div>

            <div className="p-5 flex flex-col flex-1">
                <div className="mb-auto">
                    <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide font-semibold">{product.category}</p>
                    <h3 className="font-bold text-slate-900 text-base mb-2 line-clamp-2 leading-snug">
                        {productName}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                        {product.description || 'Produto de alta qualidade para revenda ou uso profissional.'}
                    </p>
                </div>

                <div className="pt-4 border-t border-slate-100 mt-2">
                    <div className="flex items-end justify-between mb-3">
                        <div>
                            <p className="text-xs text-slate-400">Preço por {unit}</p>
                            <p className="text-xl font-bold text-indigo-700">
                                {formatCurrency(price)}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => onAddToCart(product)}
                        className="w-full bg-slate-900 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-indigo-600 transition-colors text-sm flex items-center justify-center gap-2 group-hover:bg-indigo-600"
                    >
                        <ShoppingCart size={16} />
                        Adicionar ao Pedido
                    </button>
                </div>
            </div>
        </div>
    );
};