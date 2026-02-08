import React, { useState } from 'react';
import { PlusCircle, Edit, Trash2, MapPin, Search, DollarSign } from 'lucide-react';
import { doc, deleteDoc, collection, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { useBusiness } from '../../../../contexts/BusinessContext';
import { useUI } from '../../../../contexts/UIContext';
import { DeliveryFeeFormModal } from './DeliveryFeeFormModal';
import { formatCurrency } from '../../../../utils/formatters';

export const DeliveryFeesManager: React.FC = () => {
  const { deliveryFees, businessId } = useBusiness();
  const { showAlert, showConfirmation } = useUI();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentFee, setCurrentFee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFees = deliveryFees.filter(fee =>
    fee.neighborhood.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (fee = null) => {
    setCurrentFee(fee);
    setIsModalOpen(true);
  };

  const handleDelete = (feeId: string, neighborhood: string) => {
    showConfirmation(`Tem certeza que deseja excluir a taxa para "${neighborhood}"?`, async () => {
      try {
        await deleteDoc(doc(db, 'users', businessId, 'deliveryFees', feeId));
        showAlert('Taxa de entrega excluída com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir taxa:', error);
        showAlert('Erro ao excluir taxa de entrega', 'error');
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Taxas de Entrega</h1>
          <p className="text-gray-600 mt-1">Configure as taxas por bairro/região</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg flex items-center hover:bg-blue-700 transition shadow-lg"
        >
          <PlusCircle size={20} className="mr-2" />
          Nova Taxa
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total de Bairros</p>
              <p className="text-3xl font-bold">{deliveryFees.length}</p>
            </div>
            <MapPin size={32} className="text-blue-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Taxa Média</p>
              <p className="text-3xl font-bold">
                {deliveryFees.length > 0 
                  ? formatCurrency(deliveryFees.reduce((sum, fee) => sum + fee.fee, 0) / deliveryFees.length)
                  : formatCurrency(0)
                }
              </p>
            </div>
            <DollarSign size={32} className="text-green-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Taxa Máxima</p>
              <p className="text-3xl font-bold">
                {deliveryFees.length > 0 
                  ? formatCurrency(Math.max(...deliveryFees.map(fee => fee.fee)))
                  : formatCurrency(0)
                }
              </p>
            </div>
            <MapPin size={32} className="text-purple-200" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por bairro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Fees List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredFees.length === 0 ? (
          <div className="text-center py-12">
            <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">
              {searchTerm 
                ? 'Nenhum bairro encontrado' 
                : 'Nenhuma taxa de entrega cadastrada'
              }
            </p>
            <p className="text-gray-400 text-sm mt-2">
              {!searchTerm && 'Clique em "Nova Taxa" para começar'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 font-semibold">Bairro/Região</th>
                  <th className="px-6 py-4 font-semibold">Taxa de Entrega</th>
                  <th className="px-6 py-4 font-semibold text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredFees.map(fee => (
                  <tr key={fee.id} className="bg-white border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white">
                          <MapPin size={18} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{fee.neighborhood}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(fee.fee)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-3">
                        <button
                          onClick={() => handleOpenModal(fee)}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 transition"
                          title="Editar taxa"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(fee.id, fee.neighborhood)}
                          className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition"
                          title="Excluir taxa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <DeliveryFeeFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialData={currentFee}
        />
      )}
    </div>
  );
};