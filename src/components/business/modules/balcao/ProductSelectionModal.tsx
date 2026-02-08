import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../../ui/Modal';
import { formatCurrency } from '../../../../utils/formatters';
import { Search } from 'lucide-react';

// Este é o modal secundário, reutilizável, que aparece para o usuário buscar e selecionar os sabores.

interface ProductSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (product: any) => void;
    products: any[];
    title: string;
}

export const ProductSelectionModal: React.FC<ProductSelectionModalProps> = ({ isOpen, onClose, onSelect, products, title }) => {
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
        }
    }, [isOpen]);

    const filteredProducts = useMemo(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        if (!lowercasedFilter) return products;
        
        // Lógica de busca por nome ou código (barcode/sku)
        return products.filter(p =>
            p.name.toLowerCase().includes(lowercasedFilter) ||
            p.barcode?.includes(lowercasedFilter) ||
            p.sku?.includes(lowercasedFilter)
        );
    }, [searchTerm, products]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="3xl">
            <div className="flex flex-col h-[60vh]">
                <div className="relative mb-4">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Buscar por nome ou código..."
                        className="w-full p-3 pl-12 border rounded-lg"
                        autoFocus
                    />
                </div>
                <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                    {filteredProducts.map(product => (
                        <button
                            key={product.id}
                            onClick={() => onSelect(product)}
                            className="w-full text-left p-4 bg-white rounded-lg shadow-sm border hover:border-blue-500 hover:bg-blue-50 transition flex justify-between items-center"
                        >
                            <span className="font-semibold text-gray-800">{product.name}</span>
                            <span className="font-bold text-green-600">{formatCurrency(product.salePrice)}</span>
                        </button>
                    ))}
                </div>
            </div>
        </Modal>
    );
};