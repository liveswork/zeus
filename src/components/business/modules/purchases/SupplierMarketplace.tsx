// src/components/business/modules/purchases/SupplierMarketplace.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useBusiness } from '../../../../contexts/BusinessContext'; // Caminho corrigido
import { Search, Star, ShieldCheck, Truck, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const SupplierCard = ({ supplier }) => (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 group">
        <div className="p-5">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center border-2 border-gray-200">
                    {supplier.logoUrl ? <img src={supplier.logoUrl} alt={supplier.name} className="w-full h-full object-contain rounded-full p-1" /> : <Truck size={32} className="text-gray-400" />}
                </div>
                <div className="flex-grow">
                    <h3 className="font-bold text-xl text-gray-900">{supplier.name}</h3>
                    <p className="text-sm text-gray-500">{supplier.supplierProfile?.subCategoryLabel || 'Fornecedor'}</p>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2" title="Score de Confiabilidade (IA Nexus)">
                    <ShieldCheck size={18} className="text-green-500" />
                    <span className="font-semibold">{supplier.reliabilityScore || 85}/100</span>
                </div>
                <div className="flex items-center gap-2" title="Avaliação Média (Comunidade)">
                    <Star size={18} className="text-yellow-500" />
                    <span className="font-semibold">{supplier.rating || 4.5}</span>
                </div>
            </div>
        </div>
        <div className="bg-gray-50 p-3 text-center">
            <Link to={`/painel/compras/suppliers/${supplier.id}`} className="font-bold text-blue-600 group-hover:underline">
                Ver Catálogo e Ofertas
            </Link>
        </div>
    </div>
);

export const SupplierMarketplace: React.FC = () => {
    const { suppliers } = useBusiness();
    const [searchTerm, setSearchTerm] = useState('');
    const [allSuppliers, setAllSuppliers] = useState([]); 

    useEffect(() => {
        // Simulação de enriquecimento de dados com scores de IA
        const suppliersWithAI = suppliers.map(s => ({
            ...s,
            reliabilityScore: 85 + Math.floor(Math.random() * 15),
            rating: 4 + Math.random()
        }));
        setAllSuppliers(suppliersWithAI);
    }, [suppliers]);

    const filteredSuppliers = useMemo(() => {
        return allSuppliers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [allSuppliers, searchTerm]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Marketplace de Fornecedores</h1>
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Busque por nome ou tipo de produto..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full p-4 pl-12 border rounded-full shadow-sm"
                />
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredSuppliers.map(supplier => (
                    <SupplierCard key={supplier.id} supplier={supplier} />
                ))}
            </div>
        </div>
    );
};