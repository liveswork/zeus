import React from 'react';
import { ShoppingCart, MapPin, Award, DollarSign, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatCard } from '../../ui/StatCard';
import { formatCurrency } from '../../../utils/formatters';

export const CustomerDashboard: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-6 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold">Bem-vindo ao FoodPDV</h1>
        <p className="text-blue-100 mt-1">Sua área pessoal para pedidos e descobertas</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Pedidos Realizados" 
          value="0" 
          icon={<ShoppingCart />} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Total Gasto" 
          value={formatCurrency(0)} 
          icon={<DollarSign />} 
          color="bg-green-500" 
        />
        <StatCard 
          title="Endereços Cadastrados" 
          value="0" 
          icon={<MapPin />} 
          color="bg-purple-500" 
        />
        <StatCard 
          title="Pontos de Fidelidade" 
          value="0" 
          icon={<Award />} 
          color="bg-orange-500" 
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="font-bold text-lg text-gray-700 mb-4">Pedidos Recentes</h3>
          <div className="text-center py-8">
            <ShoppingCart size={40} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Nenhum pedido realizado ainda</p>
            <p className="text-gray-400 text-sm">Explore os restaurantes e faça seu primeiro pedido</p>
            <Link 
              to="/restaurantes" 
              className="mt-4 inline-block bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition"
            >
              Ver Restaurantes
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="font-bold text-lg text-gray-700 mb-4">Ações Rápidas</h3>
          <div className="space-y-3">
            <Link 
              to="/restaurantes" 
              className="block p-4 bg-red-50 rounded-lg hover:bg-red-100 transition text-center"
            >
              <ShoppingCart size={32} className="mx-auto text-red-600 mb-2" />
              <span className="font-semibold text-red-700">Pedir Comida</span>
            </Link>
            
            <Link 
              to="/lojas" 
              className="block p-4 bg-green-50 rounded-lg hover:bg-green-100 transition text-center"
            >
              <Package size={32} className="mx-auto text-green-600 mb-2" />
              <span className="font-semibold text-green-700">Comprar Produtos</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};