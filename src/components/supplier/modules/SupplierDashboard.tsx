import React from 'react';
import { Package, ShoppingBasket, TrendingUp, DollarSign, Users } from 'lucide-react';
import { StatCard } from '../../ui/StatCard';
import { formatCurrency } from '../../../utils/formatters';

export const SupplierDashboard: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold">Painel do Fornecedor</h1>
        <p className="text-blue-100 mt-1">Gerencie seu catálogo e pedidos recebidos</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Produtos no Catálogo" 
          value="0" 
          icon={<Package />} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Pedidos Hoje" 
          value="0" 
          icon={<ShoppingBasket />} 
          color="bg-green-500" 
        />
        <StatCard 
          title="Vendas do Mês" 
          value={formatCurrency(0)} 
          icon={<DollarSign />} 
          color="bg-purple-500" 
        />
        <StatCard 
          title="Taxa de Conversão" 
          value="0%" 
          icon={<TrendingUp />} 
          color="bg-orange-500" 
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="font-bold text-lg text-gray-700 mb-4">Pedidos Recentes</h3>
          <div className="text-center py-8">
            <ShoppingBasket size={40} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Nenhum pedido recebido ainda</p>
            <p className="text-gray-400 text-sm">Os pedidos aparecerão aqui quando você receber</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="font-bold text-lg text-gray-700 mb-4">Produtos em Destaque</h3>
          <div className="text-center py-8">
            <Package size={40} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Adicione produtos ao seu catálogo</p>
            <p className="text-gray-400 text-sm">Seus produtos mais vendidos aparecerão aqui</p>
          </div>
        </div>
      </div>
    </div>
  );
};