import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { 
    Utensils, Search, MapPin, Star, Clock, Truck, 
    Filter, ChevronDown, Heart, Shield, Award, 
    Sparkles, TrendingUp, Crown, CheckCircle
} from 'lucide-react';
import { db } from '../../../../../config/firebase';
import { useAuth } from '../../../../../contexts/AuthContext';

export const RestaurantDirectory: React.FC = () => {
    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState('featured');
    const [priceRange, setPriceRange] = useState('all');
    const [deliveryTime, setDeliveryTime] = useState('all');

    useEffect(() => {
        const fetchRestaurants = async () => {
            try {
                // Buscar na coleção users com role business
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
                        // Dados simulados para demonstração
                        rating: Math.random() * 1 + 4, // 4.0 - 5.0
                        reviewCount: Math.floor(Math.random() * 500) + 50,
                        deliveryTime: Math.floor(Math.random() * 30) + 15, // 15-45 min
                        deliveryFee: Math.random() > 0.3 ? 0 : Math.floor(Math.random() * 10) + 5,
                        isFeatured: Math.random() > 0.7,
                        isPartner: Math.random() > 0.5,
                        categories: ['brasileira', 'pizza', 'hamburguer', 'japonesa', 'saudável'].slice(0, Math.floor(Math.random() * 3) + 1)
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

    const categories = useMemo(() => {
        const allCategories = restaurants.flatMap(r => r.categories || []);
        return ['all', ...new Set(allCategories)];
    }, [restaurants]);

    const filteredRestaurants = useMemo(() => {
        let filtered = restaurants.filter(restaurant =>
            (restaurant.companyName || restaurant.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (restaurant.businessProfile?.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (restaurant.categories || []).some((cat: string) => cat.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        // Filtro por categoria
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(restaurant => 
                (restaurant.categories || []).includes(selectedCategory)
            );
        }

        // Filtro por tempo de entrega
        if (deliveryTime !== 'all') {
            const time = parseInt(deliveryTime);
            filtered = filtered.filter(restaurant => restaurant.deliveryTime <= time);
        }

        // Ordenação
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'rating':
                    return b.rating - a.rating;
                case 'delivery-time':
                    return a.deliveryTime - b.deliveryTime;
                case 'delivery-fee':
                    return a.deliveryFee - b.deliveryFee;
                case 'name':
                    return (a.companyName || a.displayName).localeCompare(b.companyName || b.displayName);
                case 'featured':
                default:
                    if (a.isFeatured && !b.isFeatured) return -1;
                    if (!a.isFeatured && b.isFeatured) return 1;
                    return b.rating - a.rating;
            }
        });

        return filtered;
    }, [restaurants, searchTerm, selectedCategory, sortBy, deliveryTime]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
                <div className="container mx-auto px-6 py-8">
                    <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-xl text-gray-600">Carregando restaurantes...</p>
                        <p className="text-gray-500 mt-2">Encontrando os melhores sabores para você</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white">
                <div className="container mx-auto px-6 py-16">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                            Descubra Sabores Incríveis
                        </h1>
                        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                            Explore os melhores restaurantes da sua região. 
                            Delivery rápido, preços incríveis e experiências únicas.
                        </p>
                        
                        {/* Barra de Pesquisa Hero */}
                        <div className="max-w-2xl mx-auto relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />
                            <input
                                type="text"
                                placeholder="Buscar restaurantes, culinárias ou pratos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 text-lg rounded-2xl border-0 focus:ring-4 focus:ring-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-blue-200"
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <div className="flex items-center space-x-2 text-sm text-blue-200">
                                    <span>⌘K</span>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-8 mt-12 max-w-2xl mx-auto">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-white">{restaurants.length}+</div>
                                <div className="text-blue-200 text-sm">Restaurantes</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-white">4.8</div>
                                <div className="text-blue-200 text-sm">Avaliação Média</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-white">15-30</div>
                                <div className="text-blue-200 text-sm">Minutos</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 py-8">
                <div className="flex gap-8">
                    {/* Sidebar de Filtros */}
                    <aside className="w-80 flex-shrink-0">
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-gray-900 text-lg">Filtros</h3>
                                <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
                                    Limpar
                                </button>
                            </div>

                            {/* Ordenação */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-900 mb-3">Ordenar por</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                                >
                                    <option value="featured">Recomendados</option>
                                    <option value="rating">Melhor avaliados</option>
                                    <option value="delivery-time">Menor tempo</option>
                                    <option value="delivery-fee">Menor taxa</option>
                                    <option value="name">Ordem A-Z</option>
                                </select>
                            </div>

                            {/* Categorias */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-900 mb-3">Culinária</label>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {categories.map(category => (
                                        <button
                                            key={category}
                                            onClick={() => setSelectedCategory(category)}
                                            className={`flex items-center justify-between w-full text-left px-3 py-2 rounded-lg transition-all ${
                                                selectedCategory === category
                                                    ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                                                    : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            <span className="capitalize">
                                                {category === 'all' ? 'Todas as culinárias' : category}
                                            </span>
                                            {selectedCategory === category && (
                                                <CheckCircle size={16} className="text-blue-600" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tempo de Entrega */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-900 mb-3">Tempo de Entrega</label>
                                <div className="space-y-2">
                                    {[
                                        { value: 'all', label: 'Qualquer tempo' },
                                        { value: '20', label: 'Até 20 min' },
                                        { value: '30', label: 'Até 30 min' },
                                        { value: '45', label: 'Até 45 min' }
                                    ].map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => setDeliveryTime(option.value)}
                                            className={`flex items-center justify-between w-full text-left px-3 py-2 rounded-lg transition-all ${
                                                deliveryTime === option.value
                                                    ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                                                    : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            <span>{option.label}</span>
                                            {deliveryTime === option.value && (
                                                <CheckCircle size={16} className="text-blue-600" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Features */}
                            <div className="pt-6 border-t border-gray-200">
                                <h4 className="font-semibold text-gray-900 mb-3">Características</h4>
                                <div className="space-y-3">
                                    <label className="flex items-center space-x-3 text-sm text-gray-700 cursor-pointer">
                                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                        <span>Entrega Grátis</span>
                                    </label>
                                    <label className="flex items-center space-x-3 text-sm text-gray-700 cursor-pointer">
                                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                        <span>Parceiro Premium</span>
                                    </label>
                                    <label className="flex items-center space-x-3 text-sm text-gray-700 cursor-pointer">
                                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                        <span>Aberto Agora</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Conteúdo Principal */}
                    <main className="flex-1">
                        {/* Header do Conteúdo */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {filteredRestaurants.length} Restaurantes 
                                    {selectedCategory !== 'all' && ` em ${selectedCategory}`}
                                    {searchTerm && ` para "${searchTerm}"`}
                                </h2>
                                <p className="text-gray-600 mt-1">
                                    Descubra experiências gastronômicas incríveis
                                </p>
                            </div>
                            
                            <div className="flex items-center space-x-4">
                                <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500">
                                    <Sparkles size={16} className="text-yellow-500" />
                                    <span>Restaurantes verificados e avaliados</span>
                                </div>
                            </div>
                        </div>

                        {/* Grid de Restaurantes */}
                        {filteredRestaurants.length > 0 ? (
                            <div className="grid gap-6">
                                {filteredRestaurants.map(restaurant => (
                                    <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-200">
                                <Utensils className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum restaurante encontrado</h3>
                                <p className="text-gray-500 max-w-md mx-auto">
                                    Tente ajustar seus filtros ou termos de busca para encontrar mais opções.
                                </p>
                                <button 
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSelectedCategory('all');
                                        setDeliveryTime('all');
                                    }}
                                    className="mt-4 bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
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

// Componente de Card de Restaurante Premium
const RestaurantCard = ({ restaurant }) => {
    const [isLiked, setIsLiked] = useState(false);
    const { userProfile, logout } = useAuth();
    return (
        <Link
            to={`/catalogo/${restaurant.uid || restaurant.id}`}
            className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-blue-200 transform hover:-translate-y-1"
        >
            <div className="flex">
                {/* Imagem do Restaurante */}
                <div className="w-48 h-48 flex-shrink-0 relative">
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center relative overflow-hidden">
                        {userProfile?.logoUrl ? (
                            <img
                                src={userProfile.logoUrl}
                                alt={restaurant.companyName || restaurant.displayName}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                        ) : (
                            <Utensils size={48} className="text-white" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex flex-col space-y-2">
                            {restaurant.isFeatured && (
                                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center space-x-1">
                                    <Crown size={12} />
                                    <span>Destaque</span>
                                </div>
                            )}
                            {restaurant.isPartner && (
                                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center space-x-1">
                                    <Award size={12} />
                                    <span>Premium</span>
                                </div>
                            )}
                        </div>

                        {/* Botão Like */}
                        <button 
                            onClick={(e) => {
                                e.preventDefault();
                                setIsLiked(!isLiked);
                            }}
                            className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                        >
                            <Heart 
                                size={16} 
                                className={isLiked ? "text-red-500 fill-current" : "text-gray-600"} 
                            />
                        </button>
                    </div>
                </div>

                {/* Informações do Restaurante */}
                <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                {restaurant.companyName || restaurant.displayName}
                            </h3>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                                <div className="flex items-center space-x-1">
                                    <Star size={16} className="text-yellow-400 fill-current" />
                                    <span className="font-semibold text-gray-900">{restaurant.rating.toFixed(1)}</span>
                                    <span>({restaurant.reviewCount})</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <Clock size={16} />
                                    <span>{restaurant.deliveryTime} min</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <Truck size={16} />
                                    <span className={restaurant.deliveryFee === 0 ? "text-green-600 font-semibold" : ""}>
                                        {restaurant.deliveryFee === 0 ? 'Grátis' : `R$ ${restaurant.deliveryFee}`}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="bg-green-50 text-green-700 text-sm font-semibold px-3 py-1 rounded-full mb-2">
                                Aberto
                            </div>
                            <div className="text-xs text-gray-500">
                                Até 23:00
                            </div>
                        </div>
                    </div>

                    {/* Descrição */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {restaurant.businessProfile?.description || 'Experiência gastronômica única com ingredientes selecionados e preparo especializado.'}
                    </p>

                    {/* Categorias */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {(restaurant.categories || []).map((category: string, index: number) => (
                            <span 
                                key={index}
                                className="bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded-full capitalize"
                            >
                                {category}
                            </span>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <MapPin size={14} />
                            <span>Fortaleza, CE</span>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                                <Shield size={14} />
                                <span>Verificado</span>
                            </div>
                            <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-2 px-6 rounded-full group-hover:from-blue-700 group-hover:to-purple-700 transition-all transform group-hover:scale-105">
                                Ver Cardápio →
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};