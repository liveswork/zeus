import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, ShoppingBag, TrendingUp, Package, 
  Tag, Barcode, AlertTriangle, Users, ShoppingCart,
  Calendar, ArrowRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

import { useBusiness } from '../../../contexts/BusinessContext';
import { useAuth } from '../../../contexts/AuthContext';
import { StatCard } from '../../ui/StatCard';
import { formatCurrency } from '../../../utils/formatters';

export const RetailDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const { sales, products, loading, customers } = useBusiness(); // Adicionei customers se tiver no context, senão remova

  // --- CÁLCULO DE MÉTRICAS DE VAREJO (KPIs) ---
  const stats = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Filtros de Data
    const salesToday = sales.filter((s: any) => {
      const d = s.finishedAt?.toDate?.() || new Date(s.date || s.createdAt);
      return d.getDate() === today.getDate() && 
             d.getMonth() === currentMonth && 
             d.getFullYear() === currentYear;
    });

    const salesMonth = sales.filter((s: any) => {
      const d = s.finishedAt?.toDate?.() || new Date(s.date || s.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    // 1. Faturamento
    const totalSalesToday = salesToday.reduce((acc, s) => acc + (s.finalAmount || 0), 0);
    const totalSalesMonth = salesMonth.reduce((acc, s) => acc + (s.finalAmount || 0), 0);

    // 2. Ticket Médio (Faturamento / Nº Vendas)
    const ticketMedio = salesMonth.length > 0 ? totalSalesMonth / salesMonth.length : 0;

    // 3. Peças por Atendimento (PA) - Vital para Varejo
    const totalItemsMonth = salesMonth.reduce((acc, s) => {
        return acc + (s.items?.reduce((sum: number, i: any) => sum + (i.qty || 1), 0) || 0);
    }, 0);
    const pa = salesMonth.length > 0 ? totalItemsMonth / salesMonth.length : 0;

    // 4. Produtos com Baixo Estoque
    const lowStockCount = products.filter(p => {
        // Soma estoque simples + estoque das variações (grades)
        const variantStock = p.variants?.reduce((sum: number, v: any) => sum + (v.stock || 0), 0) || 0;
        const totalStock = (p.stockQuantity || 0) + variantStock;
        return totalStock < 5; // Limite de alerta
    }).length;

    return {
      totalSalesToday,
      totalSalesMonth,
      ticketMedio,
      pa,
      salesCountToday: salesToday.length,
      lowStockCount
    };
  }, [sales, products]);

  // --- DADOS PARA GRÁFICOS (Top Categorias) ---
  const chartData = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    
    sales.forEach(sale => {
        sale.items?.forEach((item: any) => {
            const prod = products.find(p => p.id === item.productId);
            const cat = prod?.category || 'Geral';
            // Soma o valor total vendido por categoria
            categoryMap[cat] = (categoryMap[cat] || 0) + ((item.salePrice || 0) * (item.qty || 1));
        });
    });

    const topCategories = Object.entries(categoryMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    return { topCategories };
  }, [sales, products]);

  // --- AÇÕES RÁPIDAS (CORRIGIDAS PARA VAREJO) ---
  const quickActions = [
    { 
        to: "/painel/pdv", 
        icon: <ShoppingCart size={24} className="text-blue-600" />, 
        label: "Nova Venda (PDV)", 
        desc: "Frente de caixa",
        color: "bg-blue-50 hover:bg-blue-100" 
    },
    { 
        to: "/painel/registrations/products", // Vai para o ProductsManager de Retail
        icon: <Tag size={24} className="text-purple-600" />, 
        label: "Produtos & Grade", 
        desc: "Gerenciar estoque",
        color: "bg-purple-50 hover:bg-purple-100" 
    },
    { 
        to: "/painel/registrations/customers", 
        icon: <Users size={24} className="text-green-600" />, 
        label: "Clientes", 
        desc: "CRM e Fidelidade",
        color: "bg-green-50 hover:bg-green-100" 
    },
    { 
        to: "/painel/reports", 
        icon: <TrendingUp size={24} className="text-orange-600" />, 
        label: "Relatórios", 
        desc: "Curva ABC e Vendas",
        color: "bg-orange-50 hover:bg-orange-100" 
    },
  ];

  if (loading) return <div className="p-8 text-center">Carregando indicadores...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">
                Olá, {userProfile?.displayName?.split(' ')[0] || 'Lojista'}!
            </h1>
            <p className="text-gray-500">Aqui está o desempenho da sua loja hoje.</p>
        </div>
        <div className="mt-4 md:mt-0 text-right">
            <p className="text-sm text-gray-400">Data de Hoje</p>
            <p className="font-bold text-gray-700 flex items-center gap-2">
                <Calendar size={16} />
                {new Date().toLocaleDateString('pt-BR')}
            </p>
        </div>
      </div>

      {/* Cards Principais (KPIs de Varejo) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            title="Vendas Hoje" 
            value={formatCurrency(stats.totalSalesToday)} 
            subValue={`${stats.salesCountToday} vendas`}
            icon={<DollarSign />} 
            color="bg-green-500" 
        />
        <StatCard 
            title="Ticket Médio (Mês)" 
            value={formatCurrency(stats.ticketMedio)} 
            subValue="Valor por cliente"
            icon={<TrendingUp />} 
            color="bg-blue-500" 
        />
        <StatCard 
            title="P.A. (Peças/Atend.)" 
            value={stats.pa.toFixed(1)} 
            subValue="Média de itens" 
            icon={<ShoppingBag />} 
            color="bg-purple-500" 
        />
        <StatCard 
            title="Estoque Baixo" 
            value={stats.lowStockCount.toString()} 
            subValue="Itens críticos" 
            icon={<AlertTriangle />} 
            color="bg-red-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Vendas por Categoria */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-lg text-gray-800 mb-6">Categorias Mais Vendidas</h3>
            <div className="h-64">
                {chartData.topCategories.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData.topCategories} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                            <XAxis type="number" fontSize={12} tickFormatter={(val) => `R$${val}`} />
                            <YAxis dataKey="name" type="category" width={100} fontSize={12} />
                            <Tooltip formatter={(val: number) => formatCurrency(val)} cursor={{ fill: '#f3f4f6' }} />
                            <Bar dataKey="value" fill="#4F46E5" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                        Sem dados de vendas ainda
                    </div>
                )}
            </div>
        </div>

        {/* Ações Rápidas CORRIGIDAS */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-lg text-gray-800 mb-4">Acesso Rápido</h3>
            <div className="grid grid-cols-1 gap-3">
                {quickActions.map((action, index) => (
                    <Link
                        key={index}
                        to={action.to}
                        className={`flex items-center p-3 rounded-xl transition-all duration-200 group hover:shadow-md ${action.color}`}
                    >
                        <div className="p-2 bg-white/50 rounded-lg mr-3">
                            {action.icon}
                        </div>
                        <div className="flex-1">
                            <span className="block font-semibold text-gray-800">{action.label}</span>
                            <span className="text-xs text-gray-500">{action.desc}</span>
                        </div>
                        <ArrowRight size={16} className="text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-transform" />
                    </Link>
                ))}
            </div>
            
            {/* Resumo Rápido de Estoque */}
            <div className="mt-6 pt-6 border-t border-gray-100">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Package size={18} /> Inventário
                </h4>
                <div className="flex justify-between text-sm bg-gray-50 p-3 rounded-lg">
                    <span className="text-gray-500">Total de SKUs</span>
                    <span className="font-bold text-gray-800">{products.length}</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};