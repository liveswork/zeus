import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, Users, ShoppingBasket, TrendingUp, Clock, 
  Clipboard, Truck, Package, Settings, ShoppingCart, 
  AlertTriangle, Zap, Target, Brain, BarChart3, Sparkles
} from 'lucide-react';

import { useBusiness } from '../../../contexts/BusinessContext';
import { useAuth } from '../../../contexts/AuthContext';
import { StatCard } from '../../ui/StatCard';
import { formatCurrency } from '../../../utils/formatters';
import { ProductRecipeAlert } from '../../ai/ProductRecipeAlert';
import { AIInsightsWidget } from '../../ai/AIInsightsWidget';
import { Order, Product, Table } from '../../../types';

// 🧠 ALGORITMOS AVANÇADOS (MESMOS DO NEXT.JS)

// 1. Algoritmo de Previsão de Demanda (ARIMA simplificado)
class DemandPredictor {
  private salesData: number[];
  private seasonality: number;

  constructor(salesData: number[], seasonality: number = 7) {
    this.salesData = salesData;
    this.seasonality = seasonality;
  }

  predictNextPeriod(): number {
    if (this.salesData.length < this.seasonality) {
      return this.calculateSimpleAverage();
    }

    const seasonalComponent = this.calculateSeasonalComponent();
    const trendComponent = this.calculateTrendComponent();
    const noiseComponent = this.calculateNoiseComponent();

    return seasonalComponent + trendComponent + noiseComponent;
  }

  private calculateSimpleAverage(): number {
    return this.salesData.reduce((a, b) => a + b, 0) / this.salesData.length;
  }

  private calculateSeasonalComponent(): number {
    const seasonalValues = [];
    for (let i = this.salesData.length - this.seasonality; i < this.salesData.length; i++) {
      if (i >= 0) {
        seasonalValues.push(this.salesData[i]);
      }
    }
    return seasonalValues.reduce((a, b) => a + b, 0) / seasonalValues.length;
  }

  private calculateTrendComponent(): number {
    if (this.salesData.length < 2) return 0;
    
    const recent = this.salesData.slice(-5);
    const x = recent.map((_, i) => i);
    const y = recent;
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((a, _, i) => a + x[i] * y[i], 0);
    const sumX2 = x.reduce((a, b) => a + b * b, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope * 2;
  }

  private calculateNoiseComponent(): number {
    const returns = [];
    for (let i = 1; i < this.salesData.length; i++) {
      returns.push((this.salesData[i] - this.salesData[i-1]) / this.salesData[i-1]);
    }
    
    const volatility = Math.sqrt(
      returns.reduce((a, b) => a + b * b, 0) / returns.length
    );
    
    return volatility * this.calculateSimpleAverage() * (Math.random() - 0.5);
  }
}

// 2. Algoritmo de Otimização de Estoque (EOQ + Machine Learning)
class InventoryOptimizer {
  private products: Product[];
  private salesHistory: any[];

  constructor(products: Product[], salesHistory: any[]) {
    this.products = products;
    this.salesHistory = salesHistory;
  }

  calculateOptimalInventory() {
    return this.products.map(product => {
      const productSales = this.salesHistory.filter(s => 
        s.items.some((item: any) => item.productId === product.id)
      );
      
      const demand = this.calculateProductDemand(product.id, productSales);
      const eoq = this.calculateEOQ(
        demand, 
        product.costPrice || 10, 
        product.holdingCost || 2
      );
      
      const safetyStock = this.calculateSafetyStock(demand, product.leadTime || 3);
      const reorderPoint = this.calculateReorderPoint(demand, product.leadTime || 3, safetyStock);
      
      return {
        productId: product.id,
        productName: product.name,
        currentStock: product.stock || 0,
        optimalOrderQuantity: Math.ceil(eoq),
        reorderPoint: Math.ceil(reorderPoint),
        safetyStock: Math.ceil(safetyStock),
        riskLevel: this.calculateRiskLevel(product.stock || 0, reorderPoint),
        recommendation: this.generateRecommendation(product.stock || 0, reorderPoint, eoq)
      };
    });
  }

  private calculateProductDemand(productId: string, sales: any[]): number {
    const dailyDemand = sales.map(sale => {
      const item = sale.items.find((item: any) => item.productId === productId);
      return item ? item.quantity : 0;
    });
    
    return dailyDemand.reduce((a, b) => a + b, 0) / (dailyDemand.length || 1);
  }

  private calculateEOQ(demand: number, setupCost: number, holdingCost: number): number {
    return Math.sqrt((2 * demand * setupCost) / holdingCost);
  }

  private calculateSafetyStock(demand: number, leadTime: number): number {
    const serviceLevel = 1.65;
    const demandVariance = demand * 0.2;
    return serviceLevel * Math.sqrt(leadTime) * demandVariance;
  }

  private calculateReorderPoint(demand: number, leadTime: number, safetyStock: number): number {
    return demand * leadTime + safetyStock;
  }

  private calculateRiskLevel(currentStock: number, reorderPoint: number): 'high' | 'medium' | 'low' {
    if (currentStock < reorderPoint * 0.5) return 'high';
    if (currentStock < reorderPoint * 0.8) return 'medium';
    return 'low';
  }

  private generateRecommendation(currentStock: number, reorderPoint: number, eoq: number): string {
    if (currentStock < reorderPoint) {
      return `Reabastecer ${Math.ceil(eoq)} unidades`;
    }
    return `Estoque adequado`;
  }
}

// 3. Algoritmo de Recomendação Preditiva
class RecommendationEngine {
  private orders: Order[];
  private products: Product[];

  constructor(orders: Order[], products: Product[]) {
    this.orders = orders;
    this.products = products;
  }

  getProductRecommendations(): any[] {
    const productPairs = this.analyzeProductPairs();
    const recommendations = [];

    for (const product of this.products) {
      const similarProducts = this.findSimilarProducts(product.id, productPairs);
      if (similarProducts.length > 0) {
        recommendations.push({
          baseProduct: product.name,
          recommendations: similarProducts.slice(0, 3)
        });
      }
    }

    return recommendations;
  }

  private analyzeProductPairs() {
    const pairs: { [key: string]: number } = {};

    this.orders.forEach(order => {
      const productIds = order.items.map(item => item.productId);
      
      for (let i = 0; i < productIds.length; i++) {
        for (let j = i + 1; j < productIds.length; j++) {
          const key = `${productIds[i]}-${productIds[j]}`;
          pairs[key] = (pairs[key] || 0) + 1;
        }
      }
    });

    return pairs;
  }

  private findSimilarProducts(productId: string, pairs: { [key: string]: number }) {
    const similarities: { productId: string, score: number }[] = [];

    Object.keys(pairs).forEach(key => {
      const [id1, id2] = key.split('-');
      
      if (id1 === productId || id2 === productId) {
        const otherProductId = id1 === productId ? id2 : id1;
        similarities.push({
          productId: otherProductId,
          score: pairs[key]
        });
      }
    });

    return similarities
      .sort((a, b) => b.score - a.score)
      .map(sim => {
        const product = this.products.find(p => p.id === sim.productId);
        return product ? { ...product, confidence: sim.score } : null;
      })
      .filter(Boolean)
      .slice(0, 5);
  }
}

// 4. Algoritmo de Detecção de Anomalias
class AnomalyDetector {
  private data: number[];
  private threshold: number;

  constructor(data: number[], threshold: number = 2.5) {
    this.data = data;
    this.threshold = threshold;
  }

  detectAnomalies(): { index: number, value: number, zScore: number, isAnomaly: boolean }[] {
    const mean = this.calculateMean();
    const stdDev = this.calculateStandardDeviation(mean);

    return this.data.map((value, index) => {
      const zScore = stdDev !== 0 ? Math.abs((value - mean) / stdDev) : 0;
      
      return {
        index,
        value,
        zScore,
        isAnomaly: zScore > this.threshold
      };
    });
  }

  private calculateMean(): number {
    return this.data.reduce((a, b) => a + b, 0) / this.data.length;
  }

  private calculateStandardDeviation(mean: number): number {
    const squaredDifferences = this.data.map(value => Math.pow(value - mean, 2));
    const variance = squaredDifferences.reduce((a, b) => a + b, 0) / this.data.length;
    return Math.sqrt(variance);
  }
}

export const Dashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const { sales, tables, orders, products } = useBusiness();
  const [showRecipeAlert, setShowRecipeAlert] = useState(true);
  const [predictions, setPredictions] = useState<any>(null);
  const [inventoryOptimization, setInventoryOptimization] = useState<any[]>([]);
  const [productRecommendations, setProductRecommendations] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);

  // 🚀 INICIALIZAÇÃO DOS ALGORITMOS
  useEffect(() => {
    if (sales.length > 0 && products.length > 0) {
      // 1. Previsão de demanda
      const salesAmounts = sales.map(s => s.finalAmount || 0).slice(-30);
      const demandPredictor = new DemandPredictor(salesAmounts);
      const nextDayPrediction = demandPredictor.predictNextPeriod();

      // 2. Otimização de estoque
      const inventoryOptimizer = new InventoryOptimizer(products, sales);
      const optimalInventory = inventoryOptimizer.calculateOptimalInventory();

      // 3. Recomendações de produtos
      const recommendationEngine = new RecommendationEngine(orders, products);
      const recommendations = recommendationEngine.getProductRecommendations();

      // 4. Detecção de anomalias
      const dailySales = sales.reduce((acc: { [key: string]: number }, sale) => {
        const date = new Date(sale.finishedAt?.toDate?.() || sale.date || sale.createdAt).toDateString();
        acc[date] = (acc[date] || 0) + (sale.finalAmount || 0);
        return acc;
      }, {});

      const salesValues = Object.values(dailySales) as number[];
      const anomalyDetector = new AnomalyDetector(salesValues);
      const detectedAnomalies = anomalyDetector.detectAnomalies();

      setPredictions({ nextDayPrediction });
      setInventoryOptimization(optimalInventory);
      setProductRecommendations(recommendations);
      setAnomalies(detectedAnomalies.filter(a => a.isAnomaly));
    }
  }, [sales, products, orders]);

  // 📊 ESTATÍSTICAS PRINCIPAIS
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const salesToday = sales.filter((s: any) => {
      const saleDate = s.finishedAt?.toDate?.() || new Date(s.date || s.createdAt);
      return saleDate.toDateString() === today;
    });

    const monthSales = sales.filter((s: any) => {
      const saleDate = s.finishedAt?.toDate?.() || new Date(s.date || s.createdAt);
      return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
    });

    const totalSalesToday = salesToday.reduce((acc, s) => acc + (s.finalAmount || 0), 0);
    const totalSalesMonth = monthSales.reduce((acc, s) => acc + (s.finalAmount || 0), 0);
    const ordersTodayCount = salesToday.length;

    const deliveryInProgress = orders.filter(o => 
      o.origin === 'delivery' && 
      (o.status === 'processing' || o.status === 'in_transit' || o.status === 'preparo' || o.status === 'analise')
    ).length;

    const occupiedTables = tables.filter(t => t.status === 'ocupada').length;
    const totalTables = tables.length;
    const occupancyRate = totalTables > 0 ? (occupiedTables / totalTables) * 100 : 0;

    return {
      totalSalesToday,
      ordersToday: ordersTodayCount,
      occupiedTables,
      totalTables,
      occupancyRate,
      totalSalesMonth,
      deliveryInProgress,
      predictedSales: predictions?.nextDayPrediction || 0
    };
  }, [sales, orders, tables, predictions]);

  const recentActiveOrders = useMemo(() => {
    return orders
      .filter(o => o.status !== 'finished' && o.status !== 'canceled')
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.date || a.createdAt);
        const dateB = b.createdAt?.toDate?.() || new Date(b.date || b.createdAt);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5);
  }, [orders]);

  // 📈 COMPONENTES AVANÇADOS

  const PredictiveInsights = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {/* Card de Previsão */}
      <div className="bg-gradient-to-br from-purple-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <Target size={24} />
          <span className="text-sm bg-white/20 px-2 py-1 rounded-full">AI PREDITIVO</span>
        </div>
        <h3 className="font-bold text-lg mb-2">Previsão de Amanhã</h3>
        <p className="text-2xl font-bold">{formatCurrency(stats.predictedSales)}</p>
        <p className="text-blue-100 text-sm mt-2">
          {stats.predictedSales > stats.totalSalesToday ? 
            `+${((stats.predictedSales - stats.totalSalesToday) / stats.totalSalesToday * 100).toFixed(1)}% em relação a hoje` : 
            'Expectativa conservadora'}
        </p>
      </div>

      {/* Card de Recomendações */}
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <Sparkles size={24} />
          <span className="text-sm bg-white/20 px-2 py-1 rounded-full">AI RECOMENDA</span>
        </div>
        <h3 className="font-bold text-lg mb-2">Produtos em Alta</h3>
        <div className="space-y-2">
          {productRecommendations.slice(0, 2).map((rec, idx) => (
            <div key={idx} className="text-sm">
              <p className="font-semibold">{rec.baseProduct}</p>
              <p className="text-emerald-100">+ {rec.recommendations[0]?.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Card de Anomalias */}
      <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <AlertTriangle size={24} />
          <span className="text-sm bg-white/20 px-2 py-1 rounded-full">MONITORAMENTO</span>
        </div>
        <h3 className="font-bold text-lg mb-2">Detecção de Anomalias</h3>
        <p className="text-2xl font-bold">{anomalies.length}</p>
        <p className="text-red-100 text-sm mt-2">
          {anomalies.length > 0 ? 'Padrões incomuns detectados' : 'Comportamento normal'}
        </p>
      </div>
    </div>
  );

  const InventoryOptimizationPanel = () => (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h3 className="font-bold text-lg text-gray-700 mb-4 flex items-center gap-2">
        <Package size={20} />
        Otimização de Estoque - AI
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {inventoryOptimization.slice(0, 4).map((item, index) => (
          <div key={index} className={`p-4 rounded-lg border-l-4 ${
            item.riskLevel === 'high' ? 'border-l-red-500 bg-red-50' :
            item.riskLevel === 'medium' ? 'border-l-orange-500 bg-orange-50' :
            'border-l-green-500 bg-green-50'
          }`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-gray-800">{item.productName}</p>
                <p className="text-sm text-gray-600">Estoque: {item.currentStock} units</p>
                <p className="text-xs text-gray-500">Ponto de reposição: {item.reorderPoint}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                item.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                item.riskLevel === 'medium' ? 'bg-orange-100 text-orange-700' :
                'bg-green-100 text-green-700'
              }`}>
                {item.riskLevel === 'high' ? 'ALTO RISCO' : item.riskLevel === 'medium' ? 'MÉDIO RISCO' : 'OK'}
              </span>
            </div>
            <p className="text-sm font-medium mt-2">{item.recommendation}</p>
          </div>
        ))}
      </div>
    </div>
  );

  // 🎯 AÇÕES RÁPIDAS
  const quickActions = [
    { to: "/painel/tables", icon: <Clipboard size={24} className="text-blue-600" />, label: "Mesas", color: "bg-blue-50 hover:bg-blue-100" },
    { to: "/painel/delivery", icon: <Truck size={24} className="text-orange-600" />, label: "Delivery", color: "bg-orange-50 hover:bg-orange-100" },
    { to: "/painel/registrations/supplies", icon: <Package size={24} className="text-green-600" />, label: "Estoque AI", color: "bg-green-50 hover:bg-green-100" },
    { to: "/painel/pdv", icon: <ShoppingCart size={24} className="text-red-600" />, label: "PDV Inteligente", color: "bg-red-50 hover:bg-red-100" },
    { to: "/painel/ai-analytics", icon: <BarChart3 size={24} className="text-purple-600" />, label: "Analytics AI", color: "bg-purple-50 hover:bg-purple-100" },
    { to: "/painel/settings", icon: <Settings size={24} className="text-gray-600" />, label: "Configurações", color: "bg-gray-100 hover:bg-gray-200" },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <div className="space-y-8">
      {showRecipeAlert && (
        <ProductRecipeAlert onDismiss={() => setShowRecipeAlert(false)} />
      )}

      {/* Header com IA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl shadow-lg flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Brain size={32} />
            <h1 className="text-3xl font-bold">{getGreeting()}, {userProfile?.displayName?.split(' ')[0]}!</h1>
          </div>
          <p className="text-blue-100">Sistema de gestão alimentar com IA preditiva</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Componente mascote opcional - você pode criar ou remover */}
          <div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
            <Brain size={32} className="text-white" />
          </div>
        </div>
      </div>

      {/* INSIGHTS PREDITIVOS */}
      <PredictiveInsights />

      {/* Cards de Estatísticas Tradicionais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Vendas Hoje" 
          value={formatCurrency(stats.totalSalesToday)} 
          subValue={`${stats.ordersToday} pedidos`} 
          icon={<DollarSign />} 
          color="bg-green-500" 
        />
        <StatCard 
          title="Mesas Ocupadas" 
          value={`${stats.occupiedTables} / ${stats.totalTables}`} 
          subValue={`${stats.occupancyRate.toFixed(0)}% ocupação`} 
          icon={<Users />} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Pedidos Delivery" 
          value={stats.deliveryInProgress.toString()} 
          subValue="Em andamento" 
          icon={<ShoppingBasket />} 
          color="bg-orange-500" 
        />
        <StatCard 
          title="Faturamento Mês" 
          value={formatCurrency(stats.totalSalesMonth)} 
          subValue={new Date().toLocaleString('pt-BR', { month: 'long' })} 
          icon={<TrendingUp />} 
          color="bg-purple-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Últimos Pedidos */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
          <h3 className="font-bold text-lg text-gray-700 mb-4">Últimos Pedidos</h3>
          {recentActiveOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-gray-500 h-64">
              <Clock size={40} className="mb-4" />
              <p className="font-semibold">Nenhum pedido ativo</p>
              <p className="text-sm">Os pedidos em preparo ou trânsito aparecerão aqui.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentActiveOrders.map(order => {
                  const orderDate = order.createdAt?.toDate?.() || new Date(order.date || order.createdAt);
                  return (
                    <div key={order.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <p className="font-semibold text-gray-800">
                            #{order.orderNumber || order.id?.substring(0, 5)}
                          </p>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            order.status === 'finished' ? 'bg-green-100 text-green-700' :
                            order.status === 'processing' || order.status === 'preparo' ? 'bg-orange-100 text-orange-700' :
                            order.status === 'in_transit' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{order.customerName || 'Cliente'} • {order.items?.length || 0} itens</p>
                        <p className="text-xs text-gray-500">{orderDate.toLocaleString('pt-BR')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600 text-lg">{formatCurrency(order.finalAmount || 0)}</p>
                        <p className="text-xs text-gray-500">{order.origin}</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Ações Rápidas */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="font-bold text-lg text-gray-700 mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.to}
                className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300 transform hover:-translate-y-1 ${action.color}`}
              >
                {action.icon}
                <span className="mt-2 text-sm font-semibold text-gray-700">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* OTIMIZAÇÃO DE ESTOQUE */}
      <InventoryOptimizationPanel />

      {/* Widgets de IA */}
      <AIInsightsWidget />
    </div>
  );
};