import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { 
    Truck, Search, MapPin, Star, Clock, Factory, 
    Filter, ChevronDown, Heart, Shield, Award, 
    Zap, Warehouse, BadgeCheck, FileText, Package
} from 'lucide-react';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';

export const SupplierDirectory: React.FC = () => {
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState('partner');
    const [minOrderFilter, setMinOrderFilter] = useState('all');

    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                // Buscar fornecedores ativos
                // Nota: Adaptando para buscar de 'users' com role 'supplier' ou coleção dedicada 'suppliers' dependendo da sua arquitetura
                // Vou assumir a coleção 'users' com role 'supplier' para manter consistência com o resto do sistema
                const q = query(
                    collection(db, 'users'),
                    where("role", "==", "supplier"),
                    where("status", "==", "active")
                );
                
                // Fallback para coleção 'suppliers' se a query acima não retornar nada (para compatibilidade)
                const querySnapshot = await getDocs(q);
                let supplierData: any[] = [];

                if (!querySnapshot.empty) {
                    supplierData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                } else {
                    // Tenta buscar da coleção antiga/separada
                    const q2 = query(collection(db, 'suppliers'), where("isPartner", "==", true));
                    const snap2 = await getDocs(q2);
                    supplierData = snap2.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                }

                // Enriquecendo com dados mockados para demo se faltar info
                const enrichedData = supplierData.map(s => ({
                    ...s,
                    rating: s.rating || (Math.random() * 1 + 4).toFixed(1),
                    reviewCount: s.reviewCount || Math.floor(Math.random() * 200) + 20,
                    minOrder: s.minOrder || Math.floor(Math.random() * 500) + 100,
                    deliveryTime: s.deliveryTime || `${Math.floor(Math.random() * 3) + 1} dias`,
                    categories: s.categories || ['Hortifruti', 'Carnes', 'Bebidas', 'Embalagens', 'Limpeza'].slice(0, Math.floor(Math.random() * 3) + 1),
                    isVerified: true,
                    isPartner: Math.random() > 0.3
                }));
                
                setSuppliers(enrichedData);
            } catch (error) {
                console.error("Erro ao buscar fornecedores:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSuppliers();
    }, []);

    const categories = useMemo(() => {
        const allCategories = suppliers.flatMap(s => s.categories || []);
        return ['all', ...new Set(allCategories)];
    }, [suppliers]);

    const filteredSuppliers = useMemo(() => {
        let filtered = suppliers.filter(supplier =>
            (supplier.companyName || supplier.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (supplier.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (supplier.categories || []).some((cat: string) => cat.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(supplier => 
                (supplier.categories || []).includes(selectedCategory)
            );
        }

        if (minOrderFilter === 'low') {
            filtered = filtered.filter(s => s.minOrder <= 200);
        }

        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'rating': return b.rating - a.rating;
                case 'min-order': return a.minOrder - b.minOrder;
                case 'name': return (a.companyName || a.name).localeCompare(b.companyName || b.name);
                case 'partner':
                default:
                    if (a.isPartner && !b.isPartner) return -1;
                    if (!a.isPartner && b.isPartner) return 1;
                    return b.rating - a.rating;
            }
        });

        return filtered;
    }, [suppliers, searchTerm, selectedCategory, sortBy, minOrderFilter]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex justify-center items-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-xl text-slate-600">Conectando à rede de distribuição...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Hero B2B */}
            <div className="bg-gradient-to-r from-slate-800 to-indigo-900 text-white">
                <div className="container mx-auto px-6 py-16">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center bg-indigo-500/20 rounded-full px-4 py-1 mb-6 border border-indigo-400/30">
                            <Factory size={16} className="mr-2 text-indigo-300" />
                            <span className="text-sm font-medium text-indigo-100">Marketplace B2B</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-6">
                            Abasteça seu Negócio
                        </h1>
                        <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
                            Conecte-se diretamente com distribuidores e indústrias. 
                            Preços de atacado, logística integrada e crédito facilitado.
                        </p>
                        
                        <div className="max-w-2xl mx-auto relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />
                            <input
                                type="text"
                                placeholder="Buscar produtos, fornecedores ou categorias..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 text-lg rounded-xl border-0 focus:ring-4 focus:ring-indigo-500/30 bg-white text-slate-900 placeholder-slate-400 shadow-xl"
                            />
                        </div>

                        <div className="flex justify-center gap-12 mt-12 text-slate-300">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white mb-1">{suppliers.length}+</div>
                                <div className="text-sm">Fornecedores</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white mb-1">24h</div>
                                <div className="text-sm">Cotação Rápida</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white mb-1">100%</div>
                                <div className="text-sm">Verificados</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 py-8">
                <div className="flex gap-8">
                    {/* Sidebar */}
                    <aside className="w-80 flex-shrink-0">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-slate-900 text-lg">Filtros B2B</h3>
                                <button className="text-indigo-600 text-sm font-medium hover:text-indigo-700">Limpar</button>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-slate-900 mb-3">Segmento</label>
                                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                                    {categories.map(category => (
                                        <button
                                            key={category}
                                            onClick={() => setSelectedCategory(category)}
                                            className={`flex items-center justify-between w-full text-left px-3 py-2 rounded-lg transition-all ${
                                                selectedCategory === category
                                                    ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200'
                                                    : 'text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            <span className="capitalize">
                                                {category === 'all' ? 'Todos os segmentos' : category}
                                            </span>
                                            {selectedCategory === category && <BadgeCheck size={16} className="text-indigo-600" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-slate-900 mb-3">Pedido Mínimo</label>
                                <select
                                    value={minOrderFilter}
                                    onChange={(e) => setMinOrderFilter(e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50 text-slate-700"
                                >
                                    <option value="all">Qualquer valor</option>
                                    <option value="low">Até R$ 200,00</option>
                                    <option value="medium">Até R$ 500,00</option>
                                    <option value="high">Acima de R$ 1.000,00</option>
                                </select>
                            </div>

                            <div className="pt-6 border-t border-slate-200">
                                <h4 className="font-semibold text-slate-900 mb-3">Condições</h4>
                                <div className="space-y-3">
                                    <label className="flex items-center space-x-3 text-sm text-slate-700 cursor-pointer hover:bg-slate-50 p-2 rounded -ml-2">
                                        <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                        <span>Boleto a Prazo</span>
                                    </label>
                                    <label className="flex items-center space-x-3 text-sm text-slate-700 cursor-pointer hover:bg-slate-50 p-2 rounded -ml-2">
                                        <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                        <span>Frete CIF (Grátis)</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">
                                    {filteredSuppliers.length} Parceiros Encontrados
                                </h2>
                                <p className="text-slate-500 mt-1">Negocie direto com quem produz</p>
                            </div>
                            <div className="flex bg-white rounded-lg border border-slate-200 p-1">
                                <button 
                                    onClick={() => setSortBy('partner')}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${sortBy === 'partner' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900'}`}
                                >
                                    Relevância
                                </button>
                                <button 
                                    onClick={() => setSortBy('min-order')}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${sortBy === 'min-order' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900'}`}
                                >
                                    Menor Pedido
                                </button>
                            </div>
                        </div>

                        {filteredSuppliers.length > 0 ? (
                            <div className="grid gap-6">
                                {filteredSuppliers.map(supplier => (
                                    <SupplierCard key={supplier.id} supplier={supplier} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
                                <Warehouse className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-slate-900 mb-2">Nenhum fornecedor encontrado</h3>
                                <p className="text-slate-500">Tente buscar por outros termos ou categorias.</p>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

const SupplierCard = ({ supplier }) => {
    return (
        <Link
            to={`/fornecedor/${supplier.id}`}
            className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-slate-200 hover:border-indigo-300 flex flex-col md:flex-row"
        >
            {/* Logo Area */}
            <div className="w-full md:w-64 h-48 md:h-auto bg-slate-50 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 relative group-hover:bg-indigo-50/30 transition-colors">
                {supplier.logoUrl ? (
                    <img
                        src={supplier.logoUrl}
                        alt={supplier.companyName || supplier.name}
                        className="w-24 h-24 object-contain mb-4 mix-blend-multiply"
                    />
                ) : (
                    <Factory size={64} className="text-slate-300 mb-4" />
                )}
                {supplier.isPartner && (
                    <div className="absolute top-3 left-3 bg-indigo-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wide flex items-center gap-1">
                        <Award size={10} /> Oficial
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {supplier.companyName || supplier.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="flex items-center text-yellow-500 text-sm font-medium">
                                <Star size={14} className="fill-current mr-1" />
                                {supplier.rating}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-500 text-sm">{supplier.reviewCount} avaliações</span>
                        </div>
                    </div>
                    <Heart className="text-slate-300 hover:text-red-500 transition-colors cursor-pointer" size={20} />
                </div>

                <div className="mb-4 flex-1">
                    <p className="text-slate-600 text-sm line-clamp-2 mb-3">
                        {supplier.description || 'Distribuidor autorizado com ampla linha de produtos para seu negócio. Atendimento especializado e entrega rápida.'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {(supplier.categories || []).slice(0, 4).map((cat: string, i: number) => (
                            <span key={i} className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded border border-slate-200">
                                {cat}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex gap-6 text-sm">
                        <div className="flex flex-col">
                            <span className="text-slate-400 text-xs uppercase font-bold">Pedido Mínimo</span>
                            <span className="font-semibold text-slate-700">R$ {supplier.minOrder},00</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-slate-400 text-xs uppercase font-bold">Entrega</span>
                            <span className="font-semibold text-slate-700 flex items-center gap-1">
                                <Truck size={14} /> {supplier.deliveryTime}
                            </span>
                        </div>
                    </div>
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center gap-2">
                        Ver Catálogo <ChevronDown size={16} className="-rotate-90" />
                    </button>
                </div>
            </div>
        </Link>
    );
};