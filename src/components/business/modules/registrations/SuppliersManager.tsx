import React, { useState } from 'react';
import { PlusCircle, Edit, Trash2, Truck, Search, Phone, Mail, Building } from 'lucide-react';
import { useUI } from '../../../../contexts/UIContext';

export const SuppliersManager: React.FC = () => {
  const { showAlert } = useUI();
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Cadastro de Fornecedores</h1>
          <p className="text-gray-600 mt-1">Gerencie seus fornecedores e parcerias</p>
        </div>
        <button
          onClick={() => showAlert('Funcionalidade em desenvolvimento')}
          className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg flex items-center hover:bg-blue-700 transition shadow-lg"
        >
          <PlusCircle size={20} className="mr-2" />
          Novo Fornecedor
        </button>
      </div>

      <div className="bg-white p-12 rounded-lg shadow-md text-center">
        <Truck size={64} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Módulo em Desenvolvimento</h3>
        <p className="text-gray-500">
          O cadastro de fornecedores será implementado em breve com funcionalidades completas.
        </p>
      </div>
    </div>
  );
};