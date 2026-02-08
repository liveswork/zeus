import React, { useMemo } from 'react';
import { BarChart2, TrendingUp, DollarSign, Package, Users } from 'lucide-react';
import { useBusiness } from '../../../contexts/BusinessContext';
import { StatCard } from '../../ui/StatCard';
import { formatCurrency } from '../../../utils/formatters';

export const ReportsManager: React.FC = () => {
  const { sales, products } = useBusiness();

  const reportData = useMemo(() => {
    const productSales = sales.flatMap(sale => sale.items || []).reduce((acc: any, item: any) => {
      if (!acc[item.productId]) {
        acc[item.productId] = {
          name: item.name,
          totalQty: 0,
          totalRevenue: 0
        };
      }
      acc[item.productId].totalQty += item.qty;
      acc[item.productId].totalRevenue += item.qty * item.salePrice;
      return acc;
    }, {});

    return Object.values(productSales).sort((a: any, b: any) => b.totalRevenue - a.totalRevenue);
  }, [sales]);

  const todayStats = useMemo(() => {
    const today = new Date().toDateString();
    const todaySales = sales.filter(s => new Date(s.date).toDateString() === today);
    const totalRevenue = todaySales.reduce((acc, s) => acc + s.totalAmount, 0);
    const totalOrders = todaySales.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return { totalRevenue, totalOrders, avgOrderValue };
  }, [sales]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Relatórios e Análises</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Vendas Hoje"
          value={formatCurrency(todayStats.totalRevenue)}
          subValue={`${todayStats.totalOrders} pedidos`}
          icon={<DollarSign />}
          color="bg-green-500"
        />
        <StatCard
          title="Ticket Médio"
          value={formatCurrency(todayStats.avgOrderValue)}
          icon={<TrendingUp />}
          color="bg-blue-500"
        />
        <StatCard
          title="Produtos Cadastrados"
          value={products.length.toString()}
          icon={<Package />}
          color="bg-purple-500"
        />
        <StatCard
          title="Performance"
          value="100%"
          subValue="Sistema operacional"
          icon={<BarChart2 />}
          color="bg-orange-500"
        />
      </div>

      {/* Produtos Mais Vendidos */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
          <BarChart2 size={24} />
          Produtos Mais Vendidos
        </h3>
        
        {reportData.length === 0 ? (
          <div className="text-center py-8">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Nenhuma venda registrada ainda</p>
            <p className="text-gray-400 text-sm">Os relatórios aparecerão aqui após as primeiras vendas</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-sm font-bold text-gray-600 mb-2 border-b pb-2">
              <span>Produto</span>
              <span className="text-center">Quantidade Vendida</span>
              <span className="text-right">Receita Total</span>
            </div>
            
            {reportData.slice(0, 10).map((item: any, index) => (
              <div 
                key={index} 
                className="grid grid-cols-3 gap-4 p-3 rounded-md bg-gray-50 hover:bg-gray-100 transition"
              >
                <span className="font-medium text-gray-800">{item.name}</span>
                <span className="text-center font-semibold text-blue-600">{item.totalQty}</span>
                <span className="text-right font-semibold text-green-600">
                  {formatCurrency(item.totalRevenue)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};