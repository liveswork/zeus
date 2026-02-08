import React, { useState } from 'react';
import { Building, Save, Phone, Mail, MapPin, FileText } from 'lucide-react';
import { useUI } from '../../../../contexts/UIContext';
import { FormField } from '../../../ui/FormField';

export const CompanyManager: React.FC = () => {
  const { showAlert } = useUI();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    companyName: '',
    cnpj: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    description: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      showAlert('Dados da empresa salvos com sucesso!');
    } catch (error) {
      showAlert('Erro ao salvar dados da empresa', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dados da Empresa</h1>
          <p className="text-gray-600 mt-1">Configure as informações do seu estabelecimento</p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg flex items-center hover:bg-blue-700 transition shadow-lg"
        >
          <Save size={20} className="mr-2" />
          {loading ? 'Salvando...' : 'Salvar Dados'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Informações Básicas */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2 flex items-center gap-2">
            <Building size={24} />
            Informações Básicas
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Nome da Empresa">
              <input
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nome fantasia da empresa"
              />
            </FormField>
            
            <FormField label="CNPJ">
              <input
                name="cnpj"
                value={formData.cnpj}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="00.000.000/0000-00"
              />
            </FormField>
          </div>
        </div>

        {/* Contato */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2 flex items-center gap-2">
            <Phone size={24} />
            Informações de Contato
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Telefone">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="(85) 99999-9999"
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
                  placeholder="contato@empresa.com"
                />
              </div>
            </FormField>
          </div>
        </div>

        {/* Endereço */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2 flex items-center gap-2">
            <MapPin size={24} />
            Endereço
          </h2>
          
          <div className="grid grid-cols-6 gap-6">
            <div className="col-span-6 md:col-span-4">
              <FormField label="Endereço">
                <input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Rua, número, complemento"
                />
              </FormField>
            </div>
            
            <div className="col-span-6 md:col-span-2">
              <FormField label="CEP">
                <input
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="00000-000"
                />
              </FormField>
            </div>
            
            <div className="col-span-6 md:col-span-3">
              <FormField label="Cidade">
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Fortaleza"
                />
              </FormField>
            </div>
            
            <div className="col-span-6 md:col-span-3">
              <FormField label="Estado">
                <input
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="CE"
                />
              </FormField>
            </div>
          </div>
        </div>

        {/* Descrição */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2 flex items-center gap-2">
            <FileText size={24} />
            Descrição
          </h2>
          
          <FormField label="Descrição da Empresa">
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descreva sua empresa, especialidades, diferenciais..."
            />
          </FormField>
        </div>
      </form>
    </div>
  );
};