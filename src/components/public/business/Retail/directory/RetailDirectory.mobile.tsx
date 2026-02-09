import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { 
    Search, MapPin, Star, Clock, Truck, 
    Filter, ChevronDown, Heart, X, Store,
    ChevronRight, Award, Crown, Zap, TrendingUp, Package
} from 'lucide-react';
import { db } from '../../../../../config/firebase';

export const RetailDirectory: React.FC = () => {
    const [stores, setStores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');

    useEffect(() => {
        const fetchStores = async () => {
            try {
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
                        rating: (Math.random() * 1 + 4).toFixed(1),
                        reviewCount: Math.floor(Math.random() * 500) + 50,
                        deliveryTime: Math.random() > 0.5 ? '24h' : 'Express',
                        deliveryFee: Math.random() > 0.3 ? 0 : (Math.random() * 15 + 5).toFixed(2),
                        categories: ['Moda', 'Tech', 'Casa', 'Beleza', 'Kids', 'Pet', 'Gamer'].slice(0, Math.floor(Math.random() * 3) + 1),
                        isFeatured: Math.random() > 0.7,
                        isTrending: Math.random() > 0.8,
                        promo: Math.random() > 0.5 ? 'Frete Grátis' : null
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

    const filteredStores = useMemo(() => {
        let filtered = stores.filter(store =>
            (store.companyName || store.displayName || '').toLowerCase().includes(searchTerm.toLowerCase())
        );

        switch (activeFilter) {
            case 'free-delivery':
                filtered = filtered.filter(s => s.deliveryFee === 0);
                break;
            case 'high-rating':
                filtered = filtered.filter(s => parseFloat(s.rating) >= 4.5);
                break;
            case 'express':
                filtered = filtered.filter(s => s.deliveryTime === 'Express');
                break;
            case 'featured':
                filtered = filtered.filter(s => s.isFeatured);
                break;
        }

        return filtered;
    }, [stores, searchTerm, activeFilter]);

    const featuredStores = useMemo(() => stores.filter(s => s.isFeatured).slice(0, 6), [stores]);
    const trendingStores = useMemo(() => stores.filter(s => s.isTrending).slice(0, 8), [stores]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
                <div className="container mx-auto p-4">
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                        <p className="text-lg text-gray-600">Carregando lojas...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-20">
            {/* Header Mobile */}
            <header className="bg-white shadow-lg sticky top-0 z-50">
                <div className="px-4 py-4">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h1 className="font-black text-2xl text-gray-900">
                                SHOPPING + OFERTAS!
                            </h1>
                            <p className="text-xs text-gray-500 mt-1">As melhores lojas da região</p>
                        </div>
                        
                        <button 
                            onClick={() => setShowSearch(true)}
                            className="bg-green-600 text-white p-3 rounded-xl shadow-lg active:scale-95 transition-transform"
                        >
                            <Search size={20} />
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="O que você procura hoje?"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-gray-100 border-0 rounded-2xl focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
                        />
                    </div>
                </div>

                {/* Filtros */}
                <div className="px-4 pb-4">
                    <div className="flex items-center space-x-3 overflow-x-auto scrollbar-hide">
                        <button 
                            onClick={() => setActiveFilter('all')}
                            className={`px-4 py-3 rounded-xl text-sm font-bold whitespace-nowrap flex items-center space-x-2 transition-all ${
                                activeFilter === 'all' ? 'bg-green-600 text-white shadow-lg' : 'bg-white text-gray-700 shadow-sm'
                            }`}
                        >
                            <span>Tudo</span>
                        </button>
                        <button 
                            onClick={() => setActiveFilter('free-delivery')}
                            className={`px-4 py-3 rounded-xl text-sm font-bold whitespace-nowrap flex items-center space-x-2 transition-all ${
                                activeFilter === 'free-delivery' ? 'bg-green-600 text-white shadow-lg' : 'bg-white text-gray-700 shadow-sm'
                            }`}
                        >
                            <Truck size={16} />
                            <span>Frete Grátis</span>
                        </button>
                        <button 
                            onClick={() => setActiveFilter('express')}
                            className={`px-4 py-3 rounded-xl text-sm font-bold whitespace-nowrap flex items-center space-x-2 transition-all ${
                                activeFilter === 'express' ? 'bg-green-600 text-white shadow-lg' : 'bg-white text-gray-700 shadow-sm'
                            }`}
                        >
                            <Zap size={16} />
                            <span>Express</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Conteúdo Principal */}
            <main className="p-4 space-y-6">
                {/* Lojas em Alta */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-black text-gray-900">Lojas em alta</h2>
                        <button className="text-green-600 text-sm font-bold flex items-center">
                            Ver todas <ChevronRight size={16} />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {featuredStores.slice(0, 4).map((store, index) => (
                            <TrendingStoreCard key={store.id} store={store} index={index} />
                        ))}
                    </div>
                </section>

                {/* Populares */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-black text-gray-900">Populares no App</h2>
                    </div>
                    <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2">
                        {trendingStores.map(store => (
                            <FamousStoreCard key={store.id} store={store} />
                        ))}
                    </div>
                </section>

                {/* Todas as Lojas */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-black text-gray-900">Todas as Lojas</h2>
                        <span className="text-gray-500 text-sm">{filteredStores.length} locais</span>
                    </div>
                    <div className="space-y-3">
                        {filteredStores.map(store => (
                            <ModernStoreCard key={store.id} store={store} />
                        ))}
                    </div>

                    {filteredStores.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
                            <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma loja encontrada</h3>
                        </div>
                    )}
                </section>
            </main>

            {/* Modal de Pesquisa */}
            {showSearch && (
                <div className="fixed inset-0 bg-white z-50">
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-black">Buscar lojas</h2>
                            <button onClick={() => setShowSearch(false)} className="p-2"><X size={24} /></button>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Digite o nome da loja..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-gray-100 border-0 rounded-2xl focus:ring-2 focus:ring-green-500 focus:bg-white"
                                autoFocus
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Componentes de Card Mobile (Variantes)
const TrendingStoreCard = ({ store, index }) => {
    return (
        <Link to={`/loja/${store.uid || store.id}`} className="block bg-white rounded-2xl shadow-lg overflow-hidden active:scale-95 transition-transform">
            <div className="relative">
                <div className="h-32 bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center">
                    {store.logoUrl ? (
                        <img src={store.logoUrl} alt={store.companyName} className="w-16 h-16 object-cover rounded-full border-4 border-white" />
                    ) : (
                        <Store size={24} className="text-white" />
                    )}
                </div>
                <div className="absolute top-2 left-2 bg-black/80 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Top {index + 1}
                </div>
            </div>
            <div className="p-3">
                <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">{store.companyName}</h3>
                <div className="flex items-center justify-between text-xs text-gray-600">
                    <span className="flex items-center gap-1"><Star size={10} className="fill-current text-yellow-500" /> {store.rating}</span>
                    <span className="font-bold text-green-600">{store.deliveryFee === 0 ? 'Grátis' : `R$ ${store.deliveryFee}`}</span>
                </div>
            </div>
        </Link>
    );
};

const FamousStoreCard = ({ store }) => {
    return (
        <Link to={`/loja/${store.uid || store.id}`} className="flex-shrink-0 w-28 active:scale-95 transition-transform">
            <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    {store.logoUrl ? (
                        <img src={store.logoUrl} alt={store.companyName} className="w-12 h-12 object-cover rounded-full" />
                    ) : (
                        <Store size={20} className="text-white" />
                    )}
                </div>
                <h3 className="font-bold text-gray-900 text-xs line-clamp-2">{store.companyName}</h3>
            </div>
        </Link>
    );
};

const ModernStoreCard = ({ store }) => {
    const [isLiked, setIsLiked] = useState(false);
    return (
        <Link to={`/loja/${store.uid || store.id}`} className="block bg-white rounded-2xl shadow-lg overflow-hidden active:scale-95 transition-transform">
            <div className="flex">
                <div className="w-24 h-24 flex-shrink-0 relative">
                    <div className="w-full h-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center">
                        {store.logoUrl ? (
                            <img src={store.logoUrl} alt={store.companyName} className="w-full h-full object-cover" />
                        ) : (
                            <Store size={24} className="text-white" />
                        )}
                    </div>
                    <div className="absolute top-2 left-2 space-y-1">
                        {store.promo && <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">{store.promo}</div>}
                    </div>
                </div>
                <div className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                            <h3 className="font-black text-gray-900 text-lg line-clamp-1">{store.companyName}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                                <div className="flex items-center space-x-1 bg-yellow-50 px-2 py-1 rounded-full">
                                    <Star size={14} className="text-yellow-400 fill-current" />
                                    <span className="text-xs font-bold text-gray-900">{store.rating}</span>
                                </div>
                                <span className="text-xs text-gray-500">•</span>
                                <span className="text-xs text-gray-500">{store.reviewCount} avaliações</span>
                            </div>
                        </div>
                        <button onClick={(e) => { e.preventDefault(); setIsLiked(!isLiked); }} className="p-2 hover:scale-110 transition-transform">
                            <Heart size={20} className={isLiked ? "text-red-500 fill-current" : "text-gray-300"} />
                        </button>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                                <Clock size={14} />
                                <span className="font-semibold">{store.deliveryTime === 'Express' ? 'Express' : '24h'}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Package size={14} />
                                <span className={`font-semibold ${store.deliveryFee === 0 ? 'text-green-600' : ''}`}>
                                    {store.deliveryFee === 0 ? 'Grátis' : `R$ ${store.deliveryFee}`}
                                </span>
                            </div>
                        </div>
                        <div className="bg-green-600 text-white text-sm font-bold py-1 px-3 rounded-full">Ver →</div>
                    </div>
                </div>
            </div>
        </Link>
    );
};