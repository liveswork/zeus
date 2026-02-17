// src/components/public/business/food/directory/RestaurantDirectory.desktop.tsx

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import {
  Utensils,
  Search,
  MapPin,
  Star,
  Clock,
  Truck,
  Heart,
  Shield,
  Award,
  Sparkles,
  Crown,
  CheckCircle,
  BadgePercent,
  Bike,
  ChevronLeft,
  ChevronRight,
  Flame,
} from 'lucide-react';

import { db } from '../../../../../config/firebase';
import { useAuth } from '../../../../../contexts/AuthContext';
import { formatCurrency } from '../../../../../utils/formatters';

type Restaurant = any;

type AdsItem = {
  campaignId: string;
  businessId: string;
  productId?: string;
  name: string;
  imageUrl?: string;
  originalPrice?: number;
  promoPrice?: number;
  badgeText?: string;
};

type AdsCampaign = {
  id: string;
  title?: string;
  subtitle?: string;
  businessId: string;
  items: Array<{
    productId?: string;
    name: string;
    imageUrl?: string;
    originalPrice?: number;
    promoPrice?: number;
    badgeText?: string;
  }>;
  startsAt?: any;
  endsAt?: any;
};

const FALLBACK_THEME = '#2563EB';

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const calcOffPercent = (original?: number, promo?: number) => {
  if (!original || !promo) return null;
  if (original <= 0 || promo >= original) return null;
  const pct = Math.round(((original - promo) / original) * 100);
  return clamp(pct, 1, 95);
};

const hexToRgba = (hex: string, alpha = 0.12) => {
  const h = (hex || '').replace('#', '').trim();
  if (h.length !== 6) return `rgba(59,130,246,${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const s =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  return R * c;
};

const getRestaurantCoords = (restaurant: any): { lat: number; lng: number } | null => {
  const ps = restaurant?.publicSettings;
  const loc = ps?.location;
  const lat = loc?.lat ?? ps?.lat ?? restaurant?.lat;
  const lng = loc?.lng ?? ps?.lng ?? restaurant?.lng;
  if (typeof lat === 'number' && typeof lng === 'number') return { lat, lng };
  return null;
};

const formatKm = (km: number) => {
  if (!isFinite(km)) return '';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
};

// ------------------------------
// Skeleton shimmer card (lista)
// ------------------------------
const SkeletonCard = () => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-64 h-44 md:h-56 bg-gray-100 relative overflow-hidden">
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100" />
        </div>

        <div className="flex-1 p-6">
          <div className="space-y-3">
            <div className="h-5 w-2/3 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-4/5 bg-gray-100 rounded animate-pulse" />

            <div className="flex gap-2 pt-2">
              <div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
              <div className="h-6 w-24 bg-gray-100 rounded-full animate-pulse" />
              <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
            </div>

            <div className="flex items-center justify-between pt-6">
              <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
              <div className="h-10 w-40 bg-gray-100 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ------------------------------
// Skeleton shimmer card (ADS)
// ------------------------------
const AdsDealSkeleton = () => {
  return (
    <div className="min-w-[220px] max-w-[220px] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="h-36 bg-gray-100 animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse" />
        <div className="h-5 w-1/2 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse mt-3" />
      </div>
    </div>
  );
};

export const RestaurantDirectory: React.FC = () => {
  const { userProfile } = useAuth();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  // filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [deliveryTime, setDeliveryTime] = useState('all');

  // seleção (card selecionado)
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);

  // geolocation (distância)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoDenied, setGeoDenied] = useState(false);

  // favoritos persistentes
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // ADS
  const [adsLoading, setAdsLoading] = useState(true);
  const [adsTitle, setAdsTitle] = useState('Desconto até 35% OFF');
  const [adsSubtitle, setAdsSubtitle] = useState('Produtos patrocinados em promoção');
  const [adsItems, setAdsItems] = useState<AdsItem[]>([]);

  // ---------------------------
  // Buscar restaurantes
  // ---------------------------
  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'business'), where('status', '==', 'active'));
        const snap = await getDocs(q);

        const data = snap.docs
          .map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }))
          .filter(
            (r) =>
              r.businessProfile?.type === 'food_service' ||
              r.businessProfile?.subCategory === 'restaurante'
          )
          .map((r) => ({
            ...r,

            // MOCK (substitua por campos reais quando tiver)
            rating: r.rating ?? Math.random() * 1 + 4,
            reviewCount: r.reviewCount ?? Math.floor(Math.random() * 500) + 50,
            deliveryTime: r.deliveryTime ?? Math.floor(Math.random() * 30) + 15,
            deliveryFee: r.deliveryFee ?? (Math.random() > 0.35 ? 0 : Math.floor(Math.random() * 10) + 5),
            isFeatured: r.isFeatured ?? Math.random() > 0.75,
            isPartner: r.isPartner ?? Math.random() > 0.55,
            categories:
              r.categories ??
              ['brasileira', 'pizza', 'hamburguer', 'japonesa', 'saudável'].slice(0, Math.floor(Math.random() * 3) + 1),
          }));

        setRestaurants(data);
      } catch (err) {
        console.error('Erro ao buscar restaurantes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  // ---------------------------
  // ADS: buscar campanhas
  // placement = restaurant_directory_deals
  // ---------------------------
  useEffect(() => {
    const fetchAds = async () => {
      setAdsLoading(true);
      try {
        const now = new Date();

        const qAds = query(
          collection(db, 'adsCampaigns'),
          where('status', '==', 'active'),
          where('placement', '==', 'restaurant_directory_deals')
        );

        const snap = await getDocs(qAds);

        const campaigns: AdsCampaign[] = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as any) }))
          .filter((c: any) => {
            const starts = c.startsAt?.toDate?.() as Date | undefined;
            const ends = c.endsAt?.toDate?.() as Date | undefined;
            if (starts && now < starts) return false;
            if (ends && now > ends) return false;
            return true;
          });

        // header
        const first = campaigns[0];
        if (first?.title) setAdsTitle(first.title);
        if (first?.subtitle) setAdsSubtitle(first.subtitle);

        // flatten items
        const flat: AdsItem[] = campaigns.flatMap((c) =>
          (c.items || []).map((it) => ({
            campaignId: c.id,
            businessId: c.businessId,
            productId: it.productId,
            name: it.name,
            imageUrl: it.imageUrl,
            originalPrice: it.originalPrice,
            promoPrice: it.promoPrice,
            badgeText: it.badgeText,
          }))
        );

        // se não tiver productId, ainda deixa entrar (vai abrir catálogo sem destaque)
        setAdsItems(flat);
      } catch (e) {
        console.error('Erro ao buscar ADS:', e);
        setAdsItems([]);
      } finally {
        setAdsLoading(false);
      }
    };

    fetchAds();
  }, []);

  // ---------------------------
  // Geolocation (distância)
  // ---------------------------
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGeoDenied(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setGeoDenied(true);
      },
      { enableHighAccuracy: false, timeout: 6000 }
    );
  }, []);

  // ---------------------------
  // Favoritos: carregar
  // - logado: Firestore index doc
  // - não logado: localStorage
  // ---------------------------
  useEffect(() => {
    const loadFavorites = async () => {
      const uid = userProfile?.uid || userProfile?.id;
      if (!uid) {
        const raw = localStorage.getItem('public_favorites_restaurants');
        if (raw) {
          try {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) setFavoriteIds(new Set(arr));
          } catch {
            // ignore
          }
        }
        return;
      }

      try {
        const indexRef = doc(db, 'users', uid, 'publicSettings', 'favoritesRestaurantsIndex');
        const snap = await getDoc(indexRef);
        if (snap.exists()) {
          const ids = snap.data()?.ids;
          if (Array.isArray(ids)) setFavoriteIds(new Set(ids));
        }
      } catch (e) {
        console.error('Erro ao carregar favoritos:', e);
      }
    };

    loadFavorites();
  }, [userProfile?.uid, userProfile?.id]);

  const persistFavorites = useCallback(
    async (next: Set<string>) => {
      const uid = userProfile?.uid || userProfile?.id;

      if (!uid) {
        localStorage.setItem('public_favorites_restaurants', JSON.stringify(Array.from(next)));
        return;
      }

      const indexRef = doc(db, 'users', uid, 'publicSettings', 'favoritesRestaurantsIndex');
      await setDoc(indexRef, { ids: Array.from(next) }, { merge: true });
    },
    [userProfile?.uid, userProfile?.id]
  );

  const toggleFavorite = useCallback(
    async (restaurantId: string) => {
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (next.has(restaurantId)) next.delete(restaurantId);
        else next.add(restaurantId);

        void persistFavorites(next);
        return next;
      });
    },
    [persistFavorites]
  );

  // ---------------------------
  // Categorias
  // ---------------------------
  const categories = useMemo(() => {
    const all = restaurants.flatMap((r) => r.categories || []);
    return ['all', ...new Set(all)];
  }, [restaurants]);

  // ---------------------------
  // Filtros + ordenação
  // ---------------------------
  const filteredRestaurants = useMemo(() => {
    let filtered = restaurants.filter((r) => {
      const name = (r.companyName || r.displayName || '').toLowerCase();
      const desc = (r.businessProfile?.description || '').toLowerCase();
      const term = searchTerm.toLowerCase();
      const hasCat = (r.categories || []).some((c: string) => c.toLowerCase().includes(term));
      return name.includes(term) || desc.includes(term) || hasCat;
    });

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((r) => (r.categories || []).includes(selectedCategory));
    }

    if (deliveryTime !== 'all') {
      const t = parseInt(deliveryTime);
      filtered = filtered.filter((r) => r.deliveryTime <= t);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'delivery-time':
          return (a.deliveryTime || 999) - (b.deliveryTime || 999);
        case 'delivery-fee':
          return (a.deliveryFee || 0) - (b.deliveryFee || 0);
        case 'name':
          return (a.companyName || a.displayName || '').localeCompare(b.companyName || b.displayName || '');
        case 'featured':
        default:
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return (b.rating || 0) - (a.rating || 0);
      }
    });

    return filtered;
  }, [restaurants, searchTerm, selectedCategory, sortBy, deliveryTime]);

  const deliveryByLabel = 'Nexxus OS';

  // index dos restaurantes por id (pra pegar logo/cor no ADS)
  const restaurantsById = useMemo(() => {
    const m = new Map<string, any>();
    for (const r of restaurants) {
      const id = r.uid || r.id;
      m.set(id, r);
    }
    return m;
  }, [restaurants]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* HERO */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Descubra Sabores Incríveis
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Explore os melhores restaurantes da sua região. Delivery rápido, preços incríveis e experiências únicas.
            </p>

            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70" size={24} />
              <input
                type="text"
                placeholder="Buscar restaurantes, culinárias ou pratos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-lg rounded-2xl border-0 focus:ring-4 focus:ring-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-white/70 outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-8 mt-12 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{restaurants.length}+</div>
                <div className="text-white/80 text-sm">Restaurantes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">4.8</div>
                <div className="text-white/80 text-sm">Avaliação Média</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">15-30</div>
                <div className="text-white/80 text-sm">Minutos</div>
              </div>
            </div>

            {!geoDenied && (
              <div className="mt-6 text-sm text-white/80 flex items-center justify-center gap-2">
                <MapPin size={16} />
                <span>Distância calculada pela sua localização (se disponível)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* SIDEBAR */}
          <aside className="w-full lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900 text-lg">Filtros</h3>
                <button
                  className="text-blue-600 text-sm font-medium hover:text-blue-700"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setSortBy('featured');
                    setDeliveryTime('all');
                    setSelectedRestaurantId(null);
                  }}
                >
                  Limpar
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">Ordenar por</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 outline-none"
                >
                  <option value="featured">Recomendados</option>
                  <option value="rating">Melhor avaliados</option>
                  <option value="delivery-time">Menor tempo</option>
                  <option value="delivery-fee">Menor taxa</option>
                  <option value="name">Ordem A-Z</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">Culinária</label>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`flex items-center justify-between w-full text-left px-3 py-2 rounded-lg transition-all ${
                        selectedCategory === category
                          ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="capitalize">{category === 'all' ? 'Todas as culinárias' : category}</span>
                      {selectedCategory === category && <CheckCircle size={16} className="text-blue-600" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">Tempo de Entrega</label>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'Qualquer tempo' },
                    { value: '20', label: 'Até 20 min' },
                    { value: '30', label: 'Até 30 min' },
                    { value: '45', label: 'Até 45 min' },
                  ].map((o) => (
                    <button
                      key={o.value}
                      onClick={() => setDeliveryTime(o.value)}
                      className={`flex items-center justify-between w-full text-left px-3 py-2 rounded-lg transition-all ${
                        deliveryTime === o.value
                          ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span>{o.label}</span>
                      {deliveryTime === o.value && <CheckCircle size={16} className="text-blue-600" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Sparkles size={16} className="text-yellow-500" />
                  <span>Restaurantes verificados e avaliados</span>
                </div>
              </div>
            </div>
          </aside>

          {/* LISTA */}
          <main className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {loading ? 'Carregando...' : `${filteredRestaurants.length} Restaurantes`}
                  {selectedCategory !== 'all' && !loading ? ` em ${selectedCategory}` : ''}
                  {searchTerm && !loading ? ` para "${searchTerm}"` : ''}
                </h2>
                <p className="text-gray-600 mt-1">Descubra experiências gastronômicas incríveis</p>
              </div>

              <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
                <Shield size={16} className="text-blue-600" />
                <span>Verificados</span>
              </div>
            </div>

            {/* ===========================
                BLOCO ADS (iFood style)
               =========================== */}
            <AdsDealsCarousel
              loading={adsLoading}
              title={adsTitle}
              subtitle={adsSubtitle}
              items={adsItems}
              restaurantsById={restaurantsById}
            />

            {/* Skeleton shimmer lista */}
            {loading ? (
              <div className="grid gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : filteredRestaurants.length > 0 ? (
              <div className="grid gap-6">
                {filteredRestaurants.map((restaurant) => {
                  const id = restaurant.uid || restaurant.id;
                  return (
                    <RestaurantCardIFoodPro
                      key={id}
                      restaurant={restaurant}
                      isSelected={selectedRestaurantId === id}
                      onSelect={() => setSelectedRestaurantId((prev) => (prev === id ? null : id))}
                      deliveryByLabel={deliveryByLabel}
                      userCoords={userCoords}
                      isFavorite={favoriteIds.has(id)}
                      onToggleFavorite={() => toggleFavorite(id)}
                    />
                  );
                })}
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

// ------------------------------------
// ADS Carousel (iFood-like)
// - Clique: /catalogo/:businessId?product=:productId&campaign=:campaignId
// - Logo do restaurante no canto
// - Skeleton shimmer
// ------------------------------------
const AdsDealsCarousel = ({
  loading,
  title,
  subtitle,
  items,
  restaurantsById,
}: {
  loading: boolean;
  title: string;
  subtitle: string;
  items: AdsItem[];
  restaurantsById: Map<string, any>;
}) => {
  const ref = React.useRef<HTMLDivElement | null>(null);

  const scrollBy = (px: number) => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: px, behavior: 'smooth' });
  };

  if (!loading && items.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Flame className="text-red-500" size={20} />
            {title}
          </h3>
          <p className="text-gray-500 text-sm mt-0.5">{subtitle}</p>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => scrollBy(-520)}
            className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm hover:shadow-md flex items-center justify-center"
            aria-label="Anterior"
          >
            <ChevronLeft />
          </button>
          <button
            onClick={() => scrollBy(520)}
            className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm hover:shadow-md flex items-center justify-center"
            aria-label="Próximo"
          >
            <ChevronRight />
          </button>
        </div>
      </div>

      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto pb-2 scroll-smooth"
        style={{ scrollbarWidth: 'none' as any }}
      >
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <AdsDealSkeleton key={i} />)
          : items.map((it, idx) => {
              const r = restaurantsById.get(it.businessId);
              return <AdsDealCard key={`${it.campaignId}-${idx}`} item={it} restaurant={r} />;
            })}
      </div>
    </section>
  );
};

const AdsDealCard = ({ item, restaurant }: { item: AdsItem; restaurant?: any }) => {
  const businessId = item.businessId;

  const ps = restaurant?.publicSettings;
  const logoUrl = ps?.logoUrl as string | undefined;
  const primaryColor = (ps?.primaryColor as string | undefined) || FALLBACK_THEME;

  const offPct = calcOffPercent(item.originalPrice, item.promoPrice);

  // ✅ deep link para abrir já selecionado
  const qs = new URLSearchParams();
  if (item.productId) qs.set('product', item.productId);
  if (item.campaignId) qs.set('campaign', item.campaignId);
  qs.set('src', 'ads');

  const to = `/catalogo/${businessId}${qs.toString() ? `?${qs.toString()}` : ''}`;

  return (
    <Link
      to={to}
      className="min-w-[220px] max-w-[220px] bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden group"
      title="Oferta patrocinada"
    >
      <div className="relative h-36 bg-gray-100 overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-white"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, #7C3AED)` }}
          >
            <Utensils size={36} className="text-white/90" />
          </div>
        )}

        {/* %OFF */}
        {offPct !== null && (
          <div className="absolute top-2 left-2 bg-green-600 text-white text-xs font-black px-2 py-1 rounded-full shadow">
            {offPct}% OFF
          </div>
        )}

        {/* badgeText */}
        {item.badgeText && (
          <div className="absolute top-2 right-2 bg-black/75 text-white text-[11px] font-bold px-2 py-1 rounded-full backdrop-blur-sm shadow">
            {item.badgeText}
          </div>
        )}

        {/* logo do restaurante */}
        <div className="absolute bottom-2 left-2 w-9 h-9 rounded-xl overflow-hidden border border-white shadow bg-white">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
              <Utensils size={16} className="text-white" />
            </div>
          )}
        </div>
      </div>

      <div className="p-3">
        <div className="text-sm font-bold text-gray-900 line-clamp-2 min-h-[40px]">{item.name}</div>

        <div className="mt-2 flex items-end gap-2">
          <div className="text-green-600 font-black text-lg leading-none">
            {typeof item.promoPrice === 'number' ? formatCurrency(item.promoPrice) : 'Promo'}
          </div>

          {typeof item.originalPrice === 'number' &&
            typeof item.promoPrice === 'number' &&
            item.originalPrice > item.promoPrice && (
              <div className="text-gray-400 text-sm line-through leading-none">{formatCurrency(item.originalPrice)}</div>
            )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span
            className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border"
            style={{
              color: primaryColor,
              borderColor: `${primaryColor}33`,
              backgroundColor: `${primaryColor}0D`,
            }}
          >
            <BadgePercent size={14} />
            Patrocinado
          </span>

          <span className="text-xs text-gray-500">Ver oferta →</span>
        </div>
      </div>
    </Link>
  );
};

// ------------------------------------
// RestaurantCard iFood PRO
// - Cover: publicSettings.foodCoverUrl
// - Logo: publicSettings.logoUrl (OCUPA TODO o quadrado)
// - Primary color: publicSettings.primaryColor
// - Seleção: outline + glow
// - Favorito persistente
// - Distância: geolocation + coords
// - Chips: cupom/promo/grátis/entrega por
// ------------------------------------
const RestaurantCardIFoodPro = ({
  restaurant,
  isSelected,
  onSelect,
  deliveryByLabel,
  userCoords,
  isFavorite,
  onToggleFavorite,
}: {
  restaurant: any;
  isSelected: boolean;
  onSelect: () => void;
  deliveryByLabel: string;
  userCoords: { lat: number; lng: number } | null;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) => {
  const id = restaurant.uid || restaurant.id;

  const logoUrl = restaurant.publicSettings?.logoUrl as string | undefined;
  const coverUrl = restaurant.publicSettings?.foodCoverUrl as string | undefined;
  const themeColor = (restaurant.publicSettings?.primaryColor as string | undefined) || FALLBACK_THEME;

  const restCoords = getRestaurantCoords(restaurant);
  const km = userCoords && restCoords ? haversineKm(userCoords, restCoords) : null;

  const freeDelivery = (restaurant.deliveryFee ?? 0) === 0 || restaurant.publicSettings?.freeDelivery === true;

  const couponText: string | null =
    restaurant.publicSettings?.couponText || restaurant.publicSettings?.coupon || null;

  const hasPromo: boolean = restaurant.publicSettings?.hasPromo === true || Boolean(couponText);

  const selectedStyle: React.CSSProperties = isSelected
    ? {
        outline: `2px solid ${themeColor}`,
        outlineOffset: '3px',
        boxShadow: `0 0 0 7px ${hexToRgba(themeColor, 0.10)}`,
      }
    : {};

  return (
    <div
      className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-blue-200 transform hover:-translate-y-1 cursor-pointer"
      style={selectedStyle}
      onClick={onSelect}
      aria-selected={isSelected}
    >
      <div className="flex flex-col md:flex-row">
        {/* BLOCO VISUAL */}
        <div className="w-full md:w-64 h-44 md:h-56 flex-shrink-0 relative overflow-hidden">
          {/* Cover (por trás) */}
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={restaurant.companyName || restaurant.displayName}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${themeColor}, #7C3AED)`,
              }}
            />
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {/* ✅ LOGO OCUPA TODO O QUADRADO */}
          <div className="absolute inset-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={restaurant.companyName || restaurant.displayName}
                className="w-full h-full object-cover opacity-[0.97] hover:opacity-100 transition-opacity"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Utensils size={52} className="text-white/90" />
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {restaurant.isFeatured && (
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full inline-flex items-center gap-1 shadow">
                <Crown size={12} />
                Destaque
              </span>
            )}
            {restaurant.isPartner && (
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full inline-flex items-center gap-1 shadow">
                <Award size={12} />
                Premium
              </span>
            )}
          </div>

          {/* Favorito */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite();
            }}
            className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full transition-all hover:scale-110 shadow"
            aria-label="Favoritar"
            title="Favoritar"
          >
            <Heart size={16} className={isFavorite ? 'text-red-500 fill-current' : 'text-gray-700'} />
          </button>

          {/* Rodapé */}
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
            <div className="text-white min-w-0">
              <div className="text-sm font-bold leading-tight line-clamp-1 drop-shadow">
                {restaurant.companyName || restaurant.displayName}
              </div>
              <div className="text-xs text-white/85 flex items-center gap-1 drop-shadow">
                <MapPin size={12} />
                Fortaleza, CE
              </div>
            </div>

            <span className="bg-green-500/90 text-white text-[11px] font-bold px-2 py-1 rounded-full shadow">
              Aberto
            </span>
          </div>
        </div>

        {/* CONTEÚDO */}
        <div className="flex-1 p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3
                className="text-xl font-bold text-gray-900 mb-2 line-clamp-1"
                style={{ color: isSelected ? themeColor : undefined }}
              >
                {restaurant.companyName || restaurant.displayName}
              </h3>

              <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                  <Star size={16} className="text-yellow-400 fill-current" />
                  <span className="font-semibold text-gray-900">{Number(restaurant.rating || 4.8).toFixed(1)}</span>
                  <span className="text-gray-500">({restaurant.reviewCount || 120})</span>
                </div>

                <div className="flex items-center gap-1">
                  <Clock size={16} />
                  <span>{restaurant.deliveryTime || 25} min</span>
                </div>

                {km !== null && (
                  <div className="flex items-center gap-1">
                    <MapPin size={16} />
                    <span>{formatKm(km)}</span>
                  </div>
                )}
              </div>

              {/* Chips */}
              <div className="flex flex-wrap gap-2 mb-4">
                {freeDelivery && (
                  <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full border border-green-100">
                    <Truck size={14} />
                    Frete grátis
                  </span>
                )}

                {hasPromo && (
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full border border-amber-100">
                    <BadgePercent size={14} />
                    {couponText ? couponText : 'Promoção'}
                  </span>
                )}

                <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-700 text-xs font-semibold px-3 py-1 rounded-full border border-gray-100">
                  <Bike size={14} />
                  Entrega por {deliveryByLabel}
                </span>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {restaurant.businessProfile?.description ||
                  'Experiência gastronômica única com ingredientes selecionados e preparo especializado.'}
              </p>

              <div className="flex flex-wrap gap-2">
                {(restaurant.categories || []).slice(0, 4).map((category: string, idx: number) => (
                  <span
                    key={idx}
                    className="bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded-full capitalize"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>

            {isSelected && (
              <div
                className="hidden md:flex items-center gap-2 text-sm font-semibold whitespace-nowrap"
                style={{ color: themeColor }}
              >
                <CheckCircle size={18} />
                Selecionado
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Shield size={14} className="text-gray-400" />
              <span>Verificado</span>
            </div>

            {/* ✅ Navega apenas aqui */}
            <Link
              to={`/catalogo/${id}`}
              onClick={(e) => e.stopPropagation()}
              className="font-bold py-2.5 px-6 rounded-full transition-all transform hover:scale-105 shadow"
              style={{
                background: `linear-gradient(90deg, ${themeColor}, #7C3AED)`,
                color: 'white',
              }}
            >
              Ver Cardápio →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
