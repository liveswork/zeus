import React, { useState, useMemo } from 'react';
import { PlusCircle, Edit, Trash2, Package, Search } from 'lucide-react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../../../config/firebase';
import { useBusiness } from '../../../../../contexts/BusinessContext';
import { useUI } from '../../../../../contexts/UIContext';
import { Modal } from '../../../../ui/Modal';
import { FoodProductForm } from './forms/FoodProductForm';
import { formatCurrency } from '../../../../../utils/formatters';
import { Product } from '../../../../../types';

export const FoodProductsManager: React.FC = () => {
    const { products, categories, onDeleteProductImage } = useBusiness();
    const { showAlert, showConfirmation } = useUI();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProducts = useMemo(() => {
        return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [products, searchTerm]);

    const handleOpen = (product?: Product) => {
        setEditingProduct(product || null);
        setIsModalOpen(true);
    };

    const handleDelete = (product: Product) => {
        showConfirmation(`Excluir ${product.name}?`, async () => {
            try {
                if (product.imagePath) await onDeleteProductImage(product.imagePath);
                await deleteDoc(doc(db, 'products', product.id));
                showAlert('Produto excluído.');
            } catch (e) { console.error(e); showAlert('Erro ao excluir.', 'error'); }
        });
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Cardápio & Produtos</h1>
                <button onClick={() => handleOpen()} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-green-700">
                    <PlusCircle size={20} /> Novo Item
                </button>
            </div>

            {/* Barra de Busca */}
            <div className="bg-white p-4 rounded-lg border flex gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input 
                        className="w-full pl-10 p-2 border rounded-lg" 
                        placeholder="Buscar por nome..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-bold text-gray-600 flex items-center">
                    {filteredProducts.length} itens
                </div>
            </div>

            {/* Lista */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 font-bold text-sm">
                        <tr>
                            <th className="p-4">Produto</th>
                            <th className="p-4">Categoria</th>
                            <th className="p-4">Preço</th>
                            <th className="p-4 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filteredProducts.map(product => (
                            <tr key={product.id} className="hover:bg-gray-50">
                                <td className="p-4 flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                                        {product.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover"/> : <Package className="text-gray-400"/>}
                                    </div>
                                    <span className="font-bold text-gray-800">{product.name}</span>
                                </td>
                                <td className="p-4 text-gray-600">{product.category || '-'}</td>
                                <td className="p-4 font-bold text-green-600">{formatCurrency(product.salePrice)}</td>
                                <td className="p-4 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => handleOpen(product)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit size={18}/></button>
                                        <button onClick={() => handleDelete(product)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={18}/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal Específico de Food */}
            {isModalOpen && (
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct ? 'Editar Item' : 'Novo Item'} size="4xl">
                    <FoodProductForm 
                        initialData={editingProduct} 
                        onClose={() => setIsModalOpen(false)} 
                    />
                </Modal>
            )}
        </div>
    );
};