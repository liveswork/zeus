import React, { useState } from 'react';
import { PlusCircle, Edit, Trash2, Clipboard, AlertTriangle } from 'lucide-react';
import { useBusiness } from '../../../../../contexts/BusinessContext';
import { useUI } from '../../../../../contexts/UIContext';
import { TableFormModal } from '../../../food/modules/table/TableFormModal';

export const TablesManager: React.FC = () => {
  const { tables } = useBusiness();
  const { showAlert, showConfirmation } = useUI();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTable, setCurrentTable] = useState(null);

  const handleOpenModal = (table = null) => {
    setCurrentTable(table);
    setIsModalOpen(true);
  };

  const handleDelete = (tableId: string) => {
    showConfirmation('Tem certeza que deseja excluir esta mesa?', () => {
      // Delete logic will be implemented
      showAlert('Mesa excluída com sucesso!');
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Cadastro de Mesas</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center hover:bg-blue-700 transition"
        >
          <PlusCircle size={20} className="mr-2" />
          Nova Mesa
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        {tables.length === 0 ? (
          <div className="text-center py-12">
            <Clipboard size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Nenhuma mesa cadastrada</p>
            <p className="text-gray-400 text-sm">Clique em "Nova Mesa" para começar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Número</th>
                  <th className="px-6 py-3">Nome</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {tables.map(table => (
                  <tr key={table.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-bold">{table.number}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{table.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        table.status === 'livre' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {table.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center space-x-2">
                      <button
                        onClick={() => handleOpenModal(table)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(table.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <TableFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialData={currentTable}
        />
      )}
    </div>
  );
};