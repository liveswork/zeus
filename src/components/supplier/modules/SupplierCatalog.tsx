import React, { useState } from 'react';
import { PlusCircle, Edit, Trash2, Package, DollarSign } from 'lucide-react';
import { useUI } from '../../../contexts/UIContext';

export const SupplierCatalog: React.FC = () => {
  const { showAlert, showConfirmation } = useUI();
  const [products] = useState([]); // Will be connected to context
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleDelete = (productId: string) => {
    showConfirmation('Tem certeza que deseja excluir este produto?', () => {
      showAlert('Produto excluído com sucesso!');
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Meu Catálogo de Vendas</h1>
        <button
          onClick={handleOpenModal}
          className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center hover:bg-blue-700 transition"
        >
          <PlusCircle size={20} className="mr-2" />
          Adicionar Produto
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Seu catálogo está vazio</p>
            <p className="text-gray-400 text-sm">Adicione seu primeiro produto para começar a vender</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Produto</th>
                  <th className="px-6 py-3">Unidade</th>
                  <th className="px-6 py-3 text-right">Preço</th>
                  <th className="px-6 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {/* Products will be mapped here */}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};