import React from 'react';
import { Users, Building, Truck, TrendingUp, Database } from 'lucide-react';
import { StatCard } from '../../ui/StatCard';
import { formatCurrency } from '../../../utils/formatters';

export const AdminDashboard: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white p-6 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold">Painel de Controle Geral</h1>
        <p className="text-red-100 mt-1">Visão completa do ecossistema FoodPDV</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Restaurantes Ativos" 
          value="0" 
          icon={<Building />} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Fornecedores Ativos" 
          value="0" 
          icon={<Truck />} 
          color="bg-green-500" 
        />
        <StatCard 
          title="Total de Usuários" 
          value="0" 
          icon={<Users />} 
          color="bg-purple-500" 
        />
        <StatCard 
          title="Vendas Totais" 
          value={formatCurrency(0)} 
          icon={<TrendingUp />} 
          color="bg-orange-500" 
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="font-bold text-lg text-gray-700 mb-4">Atividade Recente</h3>
          <div className="text-center py-8">
            <TrendingUp size={40} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Nenhuma atividade recente</p>
            <p className="text-gray-400 text-sm">As atividades do sistema aparecerão aqui</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="font-bold text-lg text-gray-700 mb-4">Status do Sistema</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="font-medium">Database</span>
              <span className="text-green-600 font-bold">Online</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="font-medium">API</span>
              <span className="text-green-600 font-bold">Funcionando</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="font-medium">Cache</span>
              <span className="text-green-600 font-bold">Ativo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};