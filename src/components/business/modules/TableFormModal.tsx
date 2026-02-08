import React, { useState, useEffect } from 'react';
import { Clipboard, MapPin, Users, Save } from 'lucide-react';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useBusiness } from '../../../contexts/BusinessContext';
import { Modal } from '../../ui/Modal';
import { FormField } from '../../ui/FormField';
import { useUI } from '../../../contexts/UIContext';
import { Table } from '../../../types';

interface TableFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Table | null;
}

export const TableFormModal: React.FC<TableFormModalProps> = ({
  isOpen,
  onClose,
  initialData
}) => {
  const { showAlert } = useUI();
  const { businessId, tables } = useBusiness();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    number: 0,
    location: '',
    places: 4
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || '',
          number: initialData.number || 0,
          location: initialData.location || '',
          places: initialData.places || 4
        });
      } else {
        // Sugere o próximo número de mesa disponível
        const nextNumber = tables.length > 0 ? Math.max(...tables.map(t => t.number)) + 1 : 1;
        setFormData({
          name: `Mesa ${nextNumber}`,
          number: nextNumber,
          location: 'Salão Principal',
          places: 4
        });
      }
    }
  }, [isOpen, initialData, tables]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'number' ? parseInt(value, 10) || 0 : value;
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || formData.number <= 0 || !formData.location.trim() || formData.places <= 0) {
      showAlert('Todos os campos são obrigatórios e devem ter valores válidos.', 'error');
      return;
    }

    if (!businessId) {
        showAlert('Erro: ID do negócio não encontrado.', 'error');
        return;
    }

    setLoading(true);
    try {
      const tableData = {
        ...formData,
        businessId,
        ...(initialData ? { updatedAt: serverTimestamp() } : { status: 'livre', createdAt: serverTimestamp() })
      };

      if (initialData) {
        const tableRef = doc(db, 'tables', initialData.id);
        await updateDoc(tableRef, tableData);
        showAlert('Mesa atualizada com sucesso!');
      } else {
        await addDoc(collection(db, 'tables'), tableData);
        showAlert('Mesa criada com sucesso!');
      }
      
      onClose();
    } catch (error) {
      console.error("Erro ao salvar mesa:", error);
      showAlert('Erro ao salvar a mesa. Verifique o console para mais detalhes.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={initialData ? `Editar ${formData.name}` : 'Nova Mesa'} 
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Nome da Mesa" tooltip="Ex: Mesa 01, Varanda, Balcão 2">
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </FormField>
            
            <FormField label="Número (para ordenação)">
              <input
                name="number"
                type="number"
                value={formData.number}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </FormField>

            <FormField label="Localização" tooltip="Onde a mesa fica. Ex: Salão Principal, Área Externa, VIP.">
              <input
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Salão Principal"
                required
              />
            </FormField>

            <FormField label="Quantidade de Lugares">
              <input
                name="places"
                type="number"
                value={formData.places}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </FormField>
        </div>
        
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition flex items-center"
          >
             {loading ? 'Salvando...' : (
                <>
                    <Save size={18} className="mr-2" />
                    {initialData ? 'Salvar Alterações' : 'Criar Mesa'}
                </>
             )}
          </button>
        </div>
      </form>
    </Modal>
  );
};