import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { 
    Store, Search, MapPin, Star, Clock, Truck, 
    ChevronDown, Heart, Shield, Award, 
    Sparkles, TrendingUp, Crown, CheckCircle, Tag, ShoppingBag
} from 'lucide-react';
import { db } from '../../../../../config/firebase';
import { useAuth } from '../../../../../contexts/AuthContext';

export const RetailDirectory: React.FC = () => {
    const [stores, setStores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState('featured');
    const [deliveryTime, setDeliveryTime] = useState('all');

    useEffect(() => {
        const fetchStores = async () => {
            try {
                // Buscar lojas ativas
                const q = query(
                    collection(db, 'users'),
                    where("role", "==", "business"),
                    where("status", "==", "active")
                );
                const querySnapshot = await getDocs(q);
                const storeData = querySnapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }))
                    .filter(store => 
                        store.businessProfile?.type === 'retail'
                    )
                    .map(store => ({
                        ...store,
                        // Dados simulados para preencher a UI (igual ao de restaurantes)
                        rating: Math.random() * 1 + 4, // 4.0 - 5.0
                        reviewCount: Math.floor(Math.random() * 500) + 50,
                        deliveryTime: Math.floor(Math.random() * 48) + 24, // Horas para varejo geralmente
                        isExpress: Math.random() > 0.7, // Entrega expressa (minutos)
                        deliveryFee: Math.random() > 0.3 ? 0 : Math.floor(Math.random() * 15) + 5,
                        isFeatured: Math.random() > 0.7,
                        isPartner: Math.random() > 0.5,
                        categories: ['Roupas', 'Eletrônicos', 'Beleza', 'Casa', 'Esportes', 'Brinquedos'].slice(0, Math.floor(Math.random() * 3) + 1)
                    }));
                
                setStores(storeData);
            } catch (error) {
                console.error("Erro ao buscar lojas:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStores();
    }, []);

    const categories = useMemo(() => {
        const allCategories = stores.flatMap(s => s.categories || []);
        return ['all', ...new Set(allCategories)];
    }, [stores]);

    const filteredStores = useMemo(() => {
        let filtered = stores.filter(store =>
            (store.companyName || store.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (store.businessProfile?.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (store.categories || []).some((cat: string) => cat.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(store => 
                (store.categories || []).includes(selectedCategory)
            );
        }

        if (deliveryTime === 'express') {
            filtered = filtered.filter(store => store.isExpress);
        }

        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'rating': return b.rating - a.rating;
                case 'delivery-fee': return a.deliveryFee - b.deliveryFee;
                case 'name': return (a.companyName || a.displayName).localeCompare(b.companyName || b.displayName);
                case 'featured':
                default:
                    if (a.isFeatured && !b.isFeatured) return -1;
                    if (!a.isFeatured && b.isFeatured) return 1;
                    return b.rating - a.rating;
            }
        });

        return filtered;
    }, [stores, searchTerm, selectedCategory, sortBy, deliveryTime]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50/30">
                <div className="container mx-auto px-6 py-8">
                    <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
                        <p className="text-xl text-gray-600">Carregando vitrines...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50/30">
            {/* Hero Section - Tema Verde/Teal para Varejo */}
            <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-green-700 text-white">
                <div className="container mx-auto px-6 py-16">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
                            O Melhor do Shopping Aqui
                        </h1>
                        <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
                            Moda, eletrônicos, casa e muito mais. 
                            As melhores lojas da cidade com entrega rápida e segura.
                        </p>
                        
                        <div className="max-w-2xl mx-auto relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />
                            <input
                                type="text"
                                placeholder="Buscar lojas, produtos ou marcas..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 text-lg rounded-2xl border-0 focus:ring-4 focus:ring-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-green-200"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-8 mt-12 max-w-2xl mx-auto">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-white">{stores.length}+</div>
                                <div className="text-green-200 text-sm">Lojas Parceiras</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-white">4.9</div>
                                <div className="text-green-200 text-sm">Satisfação</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-white">24h</div>
                                <div className="text-green-200 text-sm">Suporte</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 py-8">
                <div className="flex gap-8">
                    {/* Sidebar */}
                    <aside className="w-80 flex-shrink-0">
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-gray-900 text-lg">Filtros</h3>
                                <button className="text-green-600 text-sm font-medium hover:text-green-700">Limpar</button>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-900 mb-3">Ordenar por</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50"
                                >
                                    <option value="featured">Recomendados</option>
                                    <option value="rating">Melhor avaliados</option>
                                    <option value="delivery-fee">Menor taxa</option>
                                    <option value="name">Ordem A-Z</option>
                                </select>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-900 mb-3">Departamentos</label>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {categories.map(category => (
                                        <button
                                            key={category}
                                            onClick={() => setSelectedCategory(category)}
                                            className={`flex items-center justify-between w-full text-left px-3 py-2 rounded-lg transition-all ${
                                                selectedCategory === category
                                                    ? 'bg-green-50 text-green-700 font-semibold border border-green-200'
                                                    : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            <span className="capitalize">
                                                {category === 'all' ? 'Todos os departamentos' : category}
                                            </span>
                                            {selectedCategory === category && <CheckCircle size={16} className="text-green-600" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-200">
                                <h4 className="font-semibold text-gray-900 mb-3">Serviços</h4>
                                <div className="space-y-3">
                                    <label className="flex items-center space-x-3 text-sm text-gray-700 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={deliveryTime === 'express'}
                                            onChange={(e) => setDeliveryTime(e.target.checked ? 'express' : 'all')}
                                            className="rounded border-gray-300 text-green-600 focus:ring-green-500" 
                                        />
                                        <span>Entrega Expressa</span>
                                    </label>
                                    <label className="flex items-center space-x-3 text-sm text-gray-700 cursor-pointer">
                                        <input type="checkbox" className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                                        <span>Frete Grátis</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {filteredStores.length} Lojas Encontradas
                                    {selectedCategory !== 'all' && ` em ${selectedCategory}`}
                                </h2>
                                <p className="text-gray-600 mt-1">Encontre tudo o que você precisa</p>
                            </div>
                            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500">
                                <Sparkles size={16} className="text-yellow-500" />
                                <span>Lojas verificadas</span>
                            </div>
                        </div>

                        {filteredStores.length > 0 ? (
                            <div className="grid gap-6">
                                {filteredStores.map(store => (
                                    <RetailStoreCard key={store.id} store={store} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-200">
                                <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma loja encontrada</h3>
                                <button 
                                    onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
                                    className="mt-4 bg-green-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-green-700"
                                >
                                    Limpar Filtros
                                </button>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

const RetailStoreCard = ({ store }) => {
    const [isLiked, setIsLiked] = useState(false);
    const { userProfile } = useAuth();

    return (
        <Link
            to={`/loja/${store.uid || store.id}`}
            className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-green-200 transform hover:-translate-y-1"
        >
            <div className="flex">
                <div className="w-48 h-48 flex-shrink-0 relative">
                    <div className="w-full h-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center relative overflow-hidden">
                        {userProfile?.logoUrl ? (
                            <img
                                src={userProfile.logoUrl}
                                alt={store.companyName}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                        ) : (
                            <Store size={48} className="text-white" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="absolute top-3 left-3 flex flex-col space-y-2">
                            {store.isFeatured && (
                                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center space-x-1">
                                    <Crown size={12} />
                                    <span>Top Loja</span>
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={(e) => { e.preventDefault(); setIsLiked(!isLiked); }}
                            className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                        >
                            <Heart size={16} className={isLiked ? "text-red-500 fill-current" : "text-gray-600"} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                                {store.companyName || store.displayName}
                            </h3>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                                <div className="flex items-center space-x-1">
                                    <Star size={16} className="text-yellow-400 fill-current" />
                                    <span className="font-semibold text-gray-900">{store.rating.toFixed(1)}</span>
                                    <span>({store.reviewCount})</span>
                                </div>
                                {store.isExpress ? (
                                    <div className="flex items-center space-x-1 text-green-600 font-medium">
                                        <Clock size={16} />
                                        <span>Entrega Express</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center space-x-1">
                                        <Truck size={16} />
                                        <span>Envio em 24h</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {store.businessProfile?.description || 'Encontre os melhores produtos com qualidade garantida.'}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                        {(store.categories || []).map((category: string, index: number) => (
                            <span key={index} className="bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded-full capitalize flex items-center gap-1">
                                <Tag size={10} />
                                {category}
                            </span>
                        ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <MapPin size={14} />
                            <span>Fortaleza, CE</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                                <Shield size={14} />
                                <span>Compra Segura</span>
                            </div>
                            <span className="bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold py-2 px-6 rounded-full group-hover:from-green-700 group-hover:to-teal-700 transition-all transform group-hover:scale-105">
                                Ver Produtos →
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};