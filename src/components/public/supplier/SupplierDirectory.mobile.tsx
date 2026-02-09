import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { 
    Search, Factory, Star, Truck, Filter, 
    ChevronRight, Award, Box, FileText, Zap
} from 'lucide-react';
import { db } from '../../../config/firebase';

export const SupplierDirectory: React.FC = () => {
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        // Mesma lógica de fetch do desktop, simplificada
        const fetchSuppliers = async () => {
            try {
                const q = query(
                    collection(db, 'users'),
                    where("role", "==", "supplier"),
                    where("status", "==", "active")
                );
                const snap = await getDocs(q);
                let data = [];
                
                if (!snap.empty) {
                    data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                } else {
                    const q2 = query(collection(db, 'suppliers'), where("isPartner", "==", true));
                    const snap2 = await getDocs(q2);
                    data = snap2.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                }

                setSuppliers(data.map(s => ({
                    ...s,
                    rating: (Math.random() * 1 + 4).toFixed(1),
                    minOrder: Math.floor(Math.random() * 500) + 100,
                    deliveryTime: '24-48h',
                    categories: ['Bebidas', 'Mercearia', 'Limpeza', 'Hortifruti'].slice(0, 3),
                    isVerified: true
                })));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSuppliers();
    }, []);

    const filteredSuppliers = useMemo(() => {
        return suppliers.filter(s => 
            (s.companyName || s.name || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [suppliers, searchTerm]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header Mobile */}
            <header className="bg-slate-900 text-white sticky top-0 z-50 px-4 py-4 shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="font-bold text-xl">Nexus Supply</h1>
                        <p className="text-slate-400 text-xs">Rede de Abastecimento</p>
                    </div>
                    <div className="bg-slate-800 p-2 rounded-lg">
                        <Zap className="text-yellow-400" size={20} />
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar fornecedor ou produto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-800 border-none rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                <div className="flex gap-3 mt-4 overflow-x-auto pb-1 scrollbar-hide">
                    <button className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap">
                        Todos
                    </button>
                    <button className="bg-slate-800 text-slate-300 px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap">
                        Meus Fornecedores
                    </button>
                    <button className="bg-slate-800 text-slate-300 px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap">
                        Promoções
                    </button>
                </div>
            </header>

            <main className="p-4 space-y-4">
                {/* Stats Banner */}
                <div className="bg-indigo-600 rounded-xl p-4 text-white shadow-lg flex justify-between items-center">
                    <div>
                        <p className="text-indigo-200 text-xs font-medium uppercase">Cotação do Dia</p>
                        <h3 className="font-bold text-lg">Ofertas em Atacado</h3>
                        <p className="text-xs mt-1">Até 15% OFF em bebidas</p>
                    </div>
                    <Box size={32} className="text-indigo-300 opacity-50" />
                </div>

                {/* Categories Grid */}
                <div>
                    <h3 className="font-bold text-slate-900 mb-3 text-sm">Categorias</h3>
                    <div className="grid grid-cols-4 gap-2">
                        {['Bebidas', 'Carnes', 'Limpeza', 'Embalagens'].map((cat, i) => (
                            <div key={i} className="bg-white p-3 rounded-xl shadow-sm flex flex-col items-center justify-center gap-2 border border-slate-100">
                                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                                    <Box size={14} className="text-slate-600" />
                                </div>
                                <span className="text-[10px] font-medium text-slate-600">{cat}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* List */}
                <div>
                    <h3 className="font-bold text-slate-900 mb-3 text-sm">Fornecedores Recomendados</h3>
                    <div className="space-y-3">
                        {filteredSuppliers.map(supplier => (
                            <Link 
                                key={supplier.id}
                                to={`/fornecedor/${supplier.id}`}
                                className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-4 active:bg-slate-50 transition-colors"
                            >
                                <div className="w-16 h-16 bg-slate-100 rounded-lg flex-shrink-0 flex items-center justify-center border border-slate-200">
                                    {supplier.logoUrl ? (
                                        <img src={supplier.logoUrl} className="w-12 h-12 object-contain mix-blend-multiply" />
                                    ) : (
                                        <Factory size={24} className="text-slate-400" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-slate-900 text-sm">{supplier.companyName || supplier.name}</h4>
                                        <div className="flex items-center gap-1 bg-yellow-50 px-1.5 py-0.5 rounded text-[10px] font-bold text-yellow-700">
                                            <Star size={8} className="fill-current" /> {supplier.rating}
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{supplier.categories?.join(', ')}</p>
                                    <div className="flex items-center gap-3 mt-3 text-xs">
                                        <span className="text-slate-600 font-medium">Min: R$ {supplier.minOrder}</span>
                                        <span className="text-green-600 font-bold flex items-center gap-1">
                                            <Truck size={10} /> {supplier.deliveryTime}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};