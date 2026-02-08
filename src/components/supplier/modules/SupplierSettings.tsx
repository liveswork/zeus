import React, { useState } from 'react';
import { Save, Building, Phone, Mail, MapPin, User } from 'lucide-react';
import { FormField } from '../../ui/FormField';
import { useUI } from '../../../contexts/UIContext';

export const SupplierSettings: React.FC = () => {
  const { showAlert } = useUI();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: ''
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Save logic will be implemented
      await new Promise(resolve => setTimeout(resolve, 1000));
      showAlert('Configurações salvas com sucesso!');
    } catch (error) {
      showAlert('Erro ao salvar configurações', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Configurações da Empresa</h1>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center hover:bg-blue-700 transition disabled:bg-gray-400"
        >
          <Save size={20} className="mr-2" />
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Identidade da Empresa */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2 flex items-center gap-2">
            <Building size={24} />
            Identidade da Empresa
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Nome da Empresa">
              <input
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </FormField>
            
            <FormField label="Pessoa de Contato">
              <input
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>
          </div>
        </div>

        {/* Informações de Contato */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2 flex items-center gap-2">
            <Phone size={24} />
            Informações de Contato
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Telefone / WhatsApp">
              <div className="flex items-center">
                <Phone className="text-gray-400 mr-2" size={20} />
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(XX) XXXXX-XXXX"
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </FormField>
            
            <FormField label="E-mail">
              <div className="flex items-center">
                <Mail className="text-gray-400 mr-2" size={20} />
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </FormField>
          </div>
        </div>

        {/* Endereço */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2 flex items-center gap-2">
            <MapPin size={24} />
            Endereço Comercial
          </h2>
          
          <div className="grid grid-cols-6 gap-6">
            <div className="col-span-6 md:col-span-4">
              <FormField label="Rua e Número">
                <input
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </FormField>
            </div>
            
            <div className="col-span-6 md:col-span-2">
              <FormField label="CEP">
                <input
                  name="address.zip"
                  value={formData.address.zip}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </FormField>
            </div>
            
            <div className="col-span-6 md:col-span-3">
              <FormField label="Cidade">
                <input
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </FormField>
            </div>
            
            <div className="col-span-6 md:col-span-3">
              <FormField label="Estado">
                <input
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </FormField>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};