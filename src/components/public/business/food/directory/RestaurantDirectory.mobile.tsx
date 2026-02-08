import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { 
    Search, MapPin, Star, Clock, Truck, 
    Filter, ChevronDown, Heart, X, Utensils,
    ChevronRight, Award, Crown, Zap, TrendingUp
} from 'lucide-react';
import { db } from '../../../../../config/firebase';

export const RestaurantDirectory: React.FC = () => {
    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');

    useEffect(() => {
        const fetchRestaurants = async () => {
            try {
                const q = query(
                    collection(db, 'users'),
                    where("role", "==", "business"),
                    where("status", "==", "active")
                );
                const querySnapshot = await getDocs(q);
                const restaurantData = querySnapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }))
                    .filter(restaurant => 
                        restaurant.businessProfile?.type === 'food_service' ||
                        restaurant.businessProfile?.subCategory === 'restaurante'
                    )
                    .map(restaurant => ({
                        ...restaurant,
                        rating: (Math.random() * 1 + 4).toFixed(1),
                        reviewCount: Math.floor(Math.random() * 500) + 50,
                        deliveryTime: `${Math.floor(Math.random() * 30) + 15}-${Math.floor(Math.random() * 30) + 45}`,
                        deliveryFee: Math.random() > 0.3 ? 0 : (Math.random() * 8 + 2).toFixed(2),
                        categories: ['Brasileira', 'Pizza', 'Hamburguer', 'Japonesa', 'Saudável', 'Açai', 'Churrasco', 'Marmita'].slice(0, Math.floor(Math.random() * 3) + 1),
                        isFeatured: Math.random() > 0.7,
                        isTrending: Math.random() > 0.8,
                        promo: Math.random() > 0.5 ? 'Frete Grátis' : null
                    }));
                
                setRestaurants(restaurantData);
            } catch (error) {
                console.error("Erro ao buscar restaurantes:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRestaurants();
    }, []);

    const filteredRestaurants = useMemo(() => {
        let filtered = restaurants.filter(restaurant =>
            (restaurant.companyName || restaurant.displayName || '').toLowerCase().includes(searchTerm.toLowerCase())
        );

        switch (activeFilter) {
            case 'free-delivery':
                filtered = filtered.filter(r => r.deliveryFee === 0);
                break;
            case 'high-rating':
                filtered = filtered.filter(r => parseFloat(r.rating) >= 4.5);
                break;
            case 'fast-delivery':
                filtered = filtered.filter(r => parseInt(r.deliveryTime.split('-')[0]) <= 30);
                break;
            case 'featured':
                filtered = filtered.filter(r => r.isFeatured);
                break;
        }

        return filtered;
    }, [restaurants, searchTerm, activeFilter]);

    const featuredRestaurants = useMemo(() => {
        return restaurants.filter(r => r.isFeatured).slice(0, 6);
    }, [restaurants]);

    const trendingRestaurants = useMemo(() => {
        return restaurants.filter(r => r.isTrending).slice(0, 8);
    }, [restaurants]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
                <div className="container mx-auto p-4">
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                        <p className="text-lg text-gray-600">Carregando restaurantes...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white pb-20">
            {/* Header Mobile Moderno */}
            <header className="bg-white shadow-lg sticky top-0 z-50">
                <div className="px-4 py-4">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h1 className="font-black text-2xl text-gray-900">
                                BURGUER + FRETE GRÁTIS!
                            </h1>
                            <p className="text-xs text-gray-500 mt-1">Os melhores restaurantes perto de você</p>
                        </div>
                        
                        <button 
                            onClick={() => setShowSearch(true)}
                            className="bg-orange-500 text-white p-3 rounded-xl shadow-lg active:scale-95 transition-transform"
                        >
                            <Search size={20} />
                        </button>
                    </div>

                    {/* Barra de Pesquisa Integrada */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Busque seu item..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-gray-100 border-0 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                        />
                    </div>
                </div>

                {/* Filtros Modernos */}
                <div className="px-4 pb-4">
                    <div className="flex items-center space-x-3 overflow-x-auto scrollbar-hide">
                        <button 
                            onClick={() => setActiveFilter('all')}
                            className={`px-4 py-3 rounded-xl text-sm font-bold whitespace-nowrap flex items-center space-x-2 transition-all ${
                                activeFilter === 'all' 
                                    ? 'bg-orange-500 text-white shadow-lg' 
                                    : 'bg-white text-gray-700 shadow-sm'
                            }`}
                        >
                            <span>Todos</span>
                        </button>
                        <button 
                            onClick={() => setActiveFilter('free-delivery')}
                            className={`px-4 py-3 rounded-xl text-sm font-bold whitespace-nowrap flex items-center space-x-2 transition-all ${
                                activeFilter === 'free-delivery' 
                                    ? 'bg-orange-500 text-white shadow-lg' 
                                    : 'bg-white text-gray-700 shadow-sm'
                            }`}
                        >
                            <Truck size={16} />
                            <span>Frete Grátis</span>
                        </button>
                        <button 
                            onClick={() => setActiveFilter('high-rating')}
                            className={`px-4 py-3 rounded-xl text-sm font-bold whitespace-nowrap flex items-center space-x-2 transition-all ${
                                activeFilter === 'high-rating' 
                                    ? 'bg-orange-500 text-white shadow-lg' 
                                    : 'bg-white text-gray-700 shadow-sm'
                            }`}
                        >
                            <Star size={16} />
                            <span>+4.5 ⭐</span>
                        </button>
                        <button 
                            onClick={() => setActiveFilter('fast-delivery')}
                            className={`px-4 py-3 rounded-xl text-sm font-bold whitespace-nowrap flex items-center space-x-2 transition-all ${
                                activeFilter === 'fast-delivery' 
                                    ? 'bg-orange-500 text-white shadow-lg' 
                                    : 'bg-white text-gray-700 shadow-sm'
                            }`}
                        >
                            <Zap size={16} />
                            <span>Rápido</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Conteúdo Principal */}
            <main className="p-4 space-y-6">
                {/* Comidas em Alta */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-black text-gray-900">Comidas em alta</h2>
                        <button className="text-orange-500 text-sm font-bold flex items-center">
                            Ver todos <ChevronRight size={16} />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {featuredRestaurants.slice(0, 4).map((restaurant, index) => (
                            <TrendingFoodCard key={restaurant.id} restaurant={restaurant} index={index} />
                        ))}
                    </div>
                </section>

                {/* Famosos no AppDelivery */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-black text-gray-900">Famosos no AppDelivery</h2>
                        <button className="text-orange-500 text-sm font-bold flex items-center">
                            Ver todos <ChevronRight size={16} />
                        </button>
                    </div>
                    <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2">
                        {trendingRestaurants.map(restaurant => (
                            <FamousRestaurantCard key={restaurant.id} restaurant={restaurant} />
                        ))}
                    </div>
                </section>

                {/* Todos os Restaurantes */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-black text-gray-900">Restaurantes</h2>
                        <span className="text-gray-500 text-sm">{filteredRestaurants.length} locais</span>
                    </div>
                    <div className="space-y-3">
                        {filteredRestaurants.map(restaurant => (
                            <ModernRestaurantCard key={restaurant.id} restaurant={restaurant} />
                        ))}
                    </div>

                    {filteredRestaurants.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
                            <Utensils className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum restaurante encontrado</h3>
                            <p className="text-gray-500 text-sm">
                                Tente ajustar sua busca
                            </p>
                        </div>
                    )}
                </section>
            </main>

            {/* Modal de Pesquisa Expandida */}
            {showSearch && (
                <div className="fixed inset-0 bg-white z-50">
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-black">Buscar restaurantes</h2>
                            <button 
                                onClick={() => setShowSearch(false)}
                                className="p-2"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Digite o nome do restaurante..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-gray-100 border-0 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:bg-white"
                                autoFocus
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Card de Comida em Alta
const TrendingFoodCard = ({ restaurant, index }) => {
    const ratings = ['+4.5', '+4.4', '+4.4'];
    
    return (
        <Link
            to={`/catalogo/${restaurant.uid || restaurant.id}`}
            className="block bg-white rounded-2xl shadow-lg overflow-hidden active:scale-95 transition-transform"
        >
            <div className="relative">
                <div className="h-32 bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                    {restaurant.logoUrl ? (
                        <img
                            src={restaurant.logoUrl}
                            alt={restaurant.companyName}
                            className="w-16 h-16 object-cover rounded-full border-4 border-white"
                        />
                    ) : (
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                            <Utensils size={24} className="text-white" />
                        </div>
                    )}
                </div>
                
                {/* Badge de Rating */}
                <div className="absolute top-2 left-2 bg-black/80 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {ratings[index] || '+4.5'}
                </div>
            </div>
            
            <div className="p-3">
                <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">
                    {restaurant.companyName}
                </h3>
                <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{restaurant.deliveryTime} min</span>
                    <span className="font-bold text-green-600">
                        R$ {restaurant.deliveryFee === 0 ? 'Grátis' : restaurant.deliveryFee}
                    </span>
                </div>
            </div>
        </Link>
    );
};

// Card de Restaurante Famoso
const FamousRestaurantCard = ({ restaurant }) => {
    return (
        <Link
            to={`/catalogo/${restaurant.uid || restaurant.id}`}
            className="flex-shrink-0 w-28 active:scale-95 transition-transform"
        >
            <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    {restaurant.logoUrl ? (
                        <img
                            src={restaurant.logoUrl}
                            alt={restaurant.companyName}
                            className="w-12 h-12 object-cover rounded-full"
                        />
                    ) : (
                        <Utensils size={20} className="text-white" />
                    )}
                </div>
                <h3 className="font-bold text-gray-900 text-xs line-clamp-2">
                    {restaurant.companyName}
                </h3>
            </div>
        </Link>
    );
};

// Card Moderno de Restaurante
const ModernRestaurantCard = ({ restaurant }) => {
    const [isLiked, setIsLiked] = useState(false);

    return (
        <Link
            to={`/catalogo/${restaurant.uid || restaurant.id}`}
            className="block bg-white rounded-2xl shadow-lg overflow-hidden active:scale-95 transition-transform"
        >
            <div className="flex">
                {/* Imagem com Gradiente */}
                <div className="w-24 h-24 flex-shrink-0 relative">
                    <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                        {restaurant.logoUrl ? (
                            <img
                                src={restaurant.logoUrl}
                                alt={restaurant.companyName}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <Utensils size={24} className="text-white" />
                        )}
                    </div>
                    
                    {/* Badges */}
                    <div className="absolute top-2 left-2 space-y-1">
                        {restaurant.promo && (
                            <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                {restaurant.promo}
                            </div>
                        )}
                        {restaurant.isTrending && (
                            <div className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
                                <TrendingUp size={10} className="mr-1" />
                                Trend
                            </div>
                        )}
                    </div>
                </div>

                {/* Informações */}
                <div className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                            <h3 className="font-black text-gray-900 text-lg line-clamp-1">
                                {restaurant.companyName}
                            </h3>
                            <div className="flex items-center space-x-2 mt-1">
                                <div className="flex items-center space-x-1 bg-yellow-50 px-2 py-1 rounded-full">
                                    <Star size={14} className="text-yellow-400 fill-current" />
                                    <span className="text-xs font-bold text-gray-900">{restaurant.rating}</span>
                                </div>
                                <span className="text-xs text-gray-500">•</span>
                                <span className="text-xs text-gray-500">{restaurant.reviewCount} reviews</span>
                            </div>
                        </div>
                        
                        <button 
                            onClick={(e) => {
                                e.preventDefault();
                                setIsLiked(!isLiked);
                            }}
                            className="p-2 hover:scale-110 transition-transform"
                        >
                            <Heart 
                                size={20} 
                                className={isLiked ? "text-red-500 fill-current" : "text-gray-300"} 
                            />
                        </button>
                    </div>

                    {/* Categorias */}
                    <div className="flex flex-wrap gap-1 mb-3">
                        {(restaurant.categories || []).slice(0, 3).map((category: string, index: number) => (
                            <span 
                                key={index}
                                className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full capitalize font-medium"
                            >
                                {category}
                            </span>
                        ))}
                    </div>

                    {/* Info de Entrega */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                                <Clock size={14} />
                                <span className="font-semibold">{restaurant.deliveryTime} min</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Truck size={14} />
                                <span className={`font-semibold ${restaurant.deliveryFee === 0 ? 'text-green-600' : ''}`}>
                                    {restaurant.deliveryFee === 0 ? 'Frete Grátis' : `R$ ${restaurant.deliveryFee}`}
                                </span>
                            </div>
                        </div>
                        
                        <div className="bg-orange-500 text-white text-sm font-bold py-1 px-3 rounded-full">
                            Pedir →
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

// Estilos customizados para scrollbar
const styles = `
    .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }
`;

// Adiciona os estilos ao documento
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);