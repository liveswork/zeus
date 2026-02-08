import React, { useState, useEffect } from 'react';
import { MapPin, DollarSign, Save } from 'lucide-react';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { useBusiness } from '../../../../contexts/BusinessContext';
import { Modal } from '../../../ui/Modal';
import { FormField } from '../../../ui/FormField';
import { useUI } from '../../../../contexts/UIContext';

interface DeliveryFeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
}

export const DeliveryFeeFormModal: React.FC<DeliveryFeeFormModalProps> = ({
  isOpen,
  onClose,
  initialData
}) => {
  const { showAlert } = useUI();
  const { businessId } = useBusiness();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    neighborhood: '',
    fee: 0
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          neighborhood: initialData.neighborhood || '',
          fee: initialData.fee || 0
        });
      } else {
        setFormData({
          neighborhood: '',
          fee: 0
        });
      }
    }
  }, [isOpen, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.neighborhood.trim()) {
      showAlert('Nome do bairro é obrigatório', 'error');
      return;
    }

    if (formData.fee < 0) {
      showAlert('Taxa de entrega não pode ser negativa', 'error');
      return;
    }

    setLoading(true);
    try {
      const feeData = {
        neighborhood: formData.neighborhood.trim(),
        fee: formData.fee,
        businessId
      };

      if (initialData) {
        // Atualizar taxa existente
        const feeRef = doc(db, 'users', businessId, 'deliveryFees', initialData.id);
        await updateDoc(feeRef, feeData);
        showAlert('Taxa de entrega atualizada com sucesso!');
      } else {
        // Criar nova taxa
        await addDoc(collection(db, 'users', businessId, 'deliveryFees'), feeData);
        showAlert('Taxa de entrega cadastrada com sucesso!');
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao salvar taxa:', error);
      showAlert('Erro ao salvar taxa de entrega', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={initialData ? 'Editar Taxa de Entrega' : 'Nova Taxa de Entrega'} 
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormField label="Bairro/Região *">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              name="neighborhood"
              value={formData.neighborhood}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nome do bairro ou região"
              required
            />
          </div>
        </FormField>

        <FormField label="Taxa de Entrega (R$) *">
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              name="fee"
              type="number"
              step="0.01"
              min="0"
              value={formData.fee}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
              required
            />
          </div>
        </FormField>

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
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save size={18} className="mr-2" />
                {initialData ? 'Atualizar' : 'Cadastrar'}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};