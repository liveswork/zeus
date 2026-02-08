// src/components/business/modules/registrations/AddonsManager.tsx
import React, { useState } from 'react';
import { PlusCircle, Edit, Trash2, Box, Layers, ShoppingBag, Paperclip } from 'lucide-react';
import { useUI } from '../../../../contexts/UIContext';
import { useBusiness } from '../../../../contexts/BusinessContext';
import { AddonGroupFormModal } from './AddonGroupFormModal'; // Importa o modal
import { db } from '../../../../config/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

const getGroupIcon = (type: string) => {
    switch(type) {
        case 'ingredient': return <Box className="text-blue-500" />;
        case 'specification': return <Layers className="text-purple-500" />;
        case 'cross-sell': return <ShoppingBag className="text-green-500" />;
        case 'disposable': return <Paperclip className="text-gray-500" />;
        default: return <Box />;
    }
}

export const AddonsManager: React.FC = () => {
  const { showAlert, showConfirmation } = useUI();
  const { addonGroups } = useBusiness(); // Usa os dados do context
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentGroup, setCurrentGroup] = useState(null);

  const handleOpenModal = (group = null) => {
    setCurrentGroup(group);
    setIsModalOpen(true);
  };
  
  const handleDeleteGroup = (group: any) => {
      showConfirmation(`Tem certeza que deseja excluir o grupo "${group.name}"?`, async () => {
          try {
              // Adicionar lógica para verificar se o grupo está em uso por algum produto antes de deletar
              await deleteDoc(doc(db, 'addonGroups', group.id));
              showAlert('Grupo excluído com sucesso!');
          } catch (error) {
              showAlert('Erro ao excluir o grupo.', 'error');
          }
      });
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Cadastro de Complementos</h1>
            <p className="text-gray-600 mt-1">Crie e gerencie os grupos de complementos para seus produtos.</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg flex items-center hover:bg-blue-700 transition shadow-lg"
          >
            <PlusCircle size={20} className="mr-2" />
            Novo Grupo
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          {addonGroups.length === 0 ? (
            <div className="text-center py-12">
              <Box size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Nenhum grupo de complemento cadastrado.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {addonGroups.map(group => (
                <div key={group.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                          {getGroupIcon(group.type)}
                          <div>
                              <h3 className="font-bold text-lg text-gray-800">{group.name}</h3>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                                  <span>Tipo: <span className="font-semibold capitalize">{group.type}</span></span>
                                  <span>Seleção: <span className="font-semibold">Mín {group.minSelection}, Máx {group.maxSelection}</span></span>
                                  <span>{group.isRequired ? 'Obrigatório' : 'Opcional'}</span>
                              </div>
                          </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => handleOpenModal(group)} className="text-blue-600 p-2 rounded-full hover:bg-blue-50"><Edit size={18} /></button>
                          <button onClick={() => handleDeleteGroup(group)} className="text-red-600 p-2 rounded-full hover:bg-red-50"><Trash2 size={18} /></button>
                      </div>
                  </div>
                  <div className="mt-4 pt-3 border-t">
                      <h4 className="text-sm font-semibold mb-2">Itens no Grupo ({group.items?.length || 0}):</h4>
                      <div className="flex flex-wrap gap-2">
                          {group.items?.map((item:any) => (
                              <span key={item.id} className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded-full">{item.name}</span>
                          ))}
                      </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {isModalOpen && (
          <AddonGroupFormModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            initialData={currentGroup}
          />
      )}
    </>
  );
};