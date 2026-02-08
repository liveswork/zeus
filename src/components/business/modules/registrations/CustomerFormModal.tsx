import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, Save, MapPin, Cake } from 'lucide-react';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { useBusiness } from '../../../../contexts/BusinessContext';
import { Modal } from '../../../ui/Modal';
import { FormField } from '../../../ui/FormField';
import { useUI } from '../../../../contexts/UIContext';
import { formatPhoneNumber } from '../../../../utils/formatters';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  initialData
}) => {
  const { showAlert } = useUI();
  const { businessId } = useBusiness();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    birthDate: '' // NOVO CAMPO ADICIONADO
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || '',
          phone: initialData.phone || '',
          email: initialData.email || '',
          address: initialData.address || '',
          notes: initialData.notes || '',
          birthDate: initialData.birthDate || '' // NOVO CAMPO ADICIONADO
        });
      } else {
        setFormData({
          name: '',
          phone: '',
          email: '',
          address: '',
          notes: '',
          birthDate: '' // NOVO CAMPO ADICIONADO
        });
      }
    }
  }, [isOpen, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'phone' ? formatPhoneNumber(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showAlert('Nome do cliente é obrigatório', 'error');
      return;
    }

    if (!formData.phone.trim()) {
      showAlert('Telefone do cliente é obrigatório', 'error');
      return;
    }

    setLoading(true);
    try {
      const customerData = {
        ...formData,
        ...(initialData ? {} : { createdAt: serverTimestamp() }),
        updatedAt: serverTimestamp()
      };

      if (initialData) {
        // Atualizar cliente existente
        const customerRef = doc(db, 'users', businessId, 'localCustomers', initialData.id);
        await updateDoc(customerRef, customerData);
        showAlert('Cliente atualizado com sucesso!');
      } else {
        // Criar novo cliente
        await addDoc(collection(db, 'users', businessId, 'localCustomers'), customerData);
        showAlert('Cliente cadastrado com sucesso!');
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      showAlert('Erro ao salvar cliente', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={initialData ? 'Editar Cliente' : 'Novo Cliente'} 
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Nome Completo *">
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nome completo do cliente"
                required
              />
            </div>
          </FormField>

          <FormField label="Telefone/WhatsApp *">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="(85) 99999-9999"
                required
              />
            </div>
          </FormField>

          <FormField label="E-mail">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="email@exemplo.com"
              />
            </div>
          </FormField>

          <FormField label="Data de Aniversário">
            <div className="relative">
              <Cake className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                name="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </FormField>

          <div className="md:col-span-2">
            <FormField label="Endereço">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Endereço completo"
                />
              </div>
            </FormField>
          </div>
        </div>

        <FormField label="Observações">
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Observações sobre o cliente..."
          />
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