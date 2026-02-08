// src/components/business/modules/SuppliesManager.tsx
import React, { useState, useMemo } from 'react';
import { useBusiness } from '../../../contexts/BusinessContext';
import { useUI } from '../../../contexts/UIContext';
import { PlusCircle, Edit, Trash2, Link as LinkIcon, AlertTriangle, ImageIcon } from 'lucide-react';
import { SupplyFormModal } from './SupplyFormModal';
import { formatCurrency } from '../../../utils/formatters';
import { Supply } from '../../../types';

export const SuppliesManager = () => {
    // Pega tudo que precisa diretamente dos contextos
    const { supplies, onDeleteSupply } = useBusiness();
    const { showConfirmation, showAlert } = useUI();

    // Estado local para controlar o modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [supplyToEdit, setSupplyToEdit] = useState<Supply | null>(null);

    const handleOpenForm = (supply: Supply | null = null) => {
        setSupplyToEdit(supply);
        setIsModalOpen(true);
    };

    const handleCloseForm = () => {
        setIsModalOpen(false);
        setSupplyToEdit(null);
    };

    const handleDelete = (id: string) => {
        showConfirmation('Tem certeza que deseja excluir este insumo?', async () => {
            try {
                await onDeleteSupply(id);
                showAlert("Insumo deletado com sucesso.", "success");
            } catch (error) {
                showAlert("Falha ao deletar insumo.", "error");
            }
        });
    };
    
    const lowStockSupplies = useMemo(() => {
        return supplies.filter(s => (s.stockQuantity || 0) <= (s.minStockLevel || 0) && (s.minStockLevel || 0) > 0);
    }, [supplies]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Insumos e Estoque</h1>
                <button onClick={() => handleOpenForm()} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center hover:bg-blue-700 transition">
                    <PlusCircle size={20} className="mr-2" /> Novo Insumo
                </button>
            </div>

            {lowStockSupplies.length > 0 && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded-md">
                    <div className="flex items-center">
                        <AlertTriangle size={24} className="mr-3" />
                        <div>
                            <p className="font-bold">Alerta de Estoque Baixo!</p>
                            <p className="text-sm">Os seguintes itens precisam de reposição: {lowStockSupplies.map(s => s.name).join(', ')}.</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                {/* --- COLUNA DA IMAGEM ADICIONADA --- */}
                                <th className="px-4 py-3">Foto</th> 
                                <th className="px-6 py-3">Insumo</th>
                                <th className="px-6 py-3">Estoque Atual</th>
                                <th className="px-6 py-3">Custo Unitário</th>
                                <th className="px-6 py-3">Fornecedor Vinculado</th>
                                <th className="px-6 py-3 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {supplies.map(supply => {
                                const costPerUnit = (supply.packageCost && supply.packageSize) ? supply.packageCost / supply.packageSize : 0;
                                return (
                                    <tr key={supply.id} className="bg-white border-b hover:bg-gray-50">
                                        {/* --- CÉLULA DA IMAGEM ADICIONADA --- */}
                                        <td className="px-4 py-2">
                                            <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                                                {supply.imageUrl ? (
                                                    <img src={supply.imageUrl} alt={supply.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageIcon size={24} className="text-gray-400" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{supply.name}</td>
                                        <td className={`px-6 py-4 font-bold text-lg ${lowStockSupplies.some(s => s.id === supply.id) ? 'text-red-500' : 'text-gray-700'}`}>
                                            {(supply.stockQuantity || 0).toFixed(2)} {supply.unit}
                                        </td>
                                        <td className="px-6 py-4">{formatCurrency(costPerUnit)} / {supply.unit}</td>
                                        <td className="px-6 py-4">
                                            <span className="flex items-center gap-2 text-sm text-blue-600 font-semibold">
                                                <LinkIcon size={16} />
                                                {supply.linkedProducts?.length || 0} Fornecedor(es)
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center space-x-3">
                                            <button onClick={() => handleOpenForm(supply)} className="text-blue-600 hover:text-blue-800"><Edit size={18} /></button>
                                            <button onClick={() => handleDelete(supply.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <SupplyFormModal
                    isOpen={isModalOpen}
                    onClose={handleCloseForm}
                    initialData={supplyToEdit}
                />
            )}
        </div>
    );
};