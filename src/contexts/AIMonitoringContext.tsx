import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { subscriptionGuard } from '../services/subscriptionGuard';
import { useBusiness } from './BusinessContext';
import { useAuth } from './AuthContext';
import { useUI } from './UIContext';

interface AIAlert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'suggestion';
  category: 'product' | 'inventory' | 'sales' | 'system' | 'optimization';
  title: string;
  message: string;
  action?: {
    label: string;
    path: string;
  };
  priority: number;
  createdAt: Date;
  dismissed?: boolean;
}

interface AIInsight {
  id: string;
  type: 'performance' | 'trend' | 'recommendation' | 'prediction';
  title: string;
  description: string;
  data: any;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
}

interface AIMonitoringContextType {
  alerts: AIAlert[];
  insights: AIInsight[];
  isMonitoring: boolean;
  dismissAlert: (alertId: string) => void;
  getAlertsByCategory: (category: string) => AIAlert[];
  getCriticalAlertsCount: () => number;
  getSystemHealthScore: () => number;
}

const AIMonitoringContext = createContext<AIMonitoringContextType | null>(null);

export const useAIMonitoring = () => {
  const context = useContext(AIMonitoringContext);
  if (!context) {
    throw new Error('useAIMonitoring must be used within an AIMonitoringProvider');
  }
  return context;
};

interface AIMonitoringProviderProps {
  children: ReactNode;
}

export const AIMonitoringProvider: React.FC<AIMonitoringProviderProps> = ({ children }) => {
  const { products, supplies, sales, tables, categories, subcategories } = useBusiness();
  const { userProfile } = useAuth();
  const [alerts, setAlerts] = useState<AIAlert[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);

  // IA Principal - Análise Contínua
  useEffect(() => {
    if (!isMonitoring || !userProfile) return;

    const runAIAnalysis = () => {
      const newAlerts: AIAlert[] = [];
      const newInsights: AIInsight[] = [];

      const usagePercentage = subscriptionGuard.getUsagePercentage();
      const isOverLimit = subscriptionGuard.isOverLimit();
      const userPlan = userProfile?.subscription?.planId;

      if (userPlan === 'free') {
        if (isOverLimit) {
            newAlerts.push({
                id: 'plan-limit-exceeded',
                type: 'critical',
                category: 'system',
                title: 'Limite de Pedidos Atingido!',
                message: 'Você alcançou os 200 pedidos/mês do Plano Grátis. Faça upgrade para continuar vendendo sem interrupções.',
                action: { label: 'Ver Planos', path: '/painel/assinatura' },
                priority: 11, // Prioridade máxima
                createdAt: new Date()
            });
        } else if (usagePercentage >= 80) {
            newAlerts.push({
                id: 'plan-limit-warning',
                type: 'warning',
                category: 'optimization',
                title: 'Limite do Plano Próximo!',
                message: `Você já utilizou ${usagePercentage.toFixed(0)}% do seu limite de pedidos. Considere um upgrade para não parar suas vendas.`,
                action: { label: 'Ver Planos', path: '/painel/assinatura' },
                priority: 8,
                createdAt: new Date()
            });
        }
      }

      // 🤖 ANÁLISE 1: Produtos de Produção sem Ficha Técnica
      const productionProducts = products.filter(p => p.productStructure === 'producao');
      const productsWithoutRecipe = productionProducts.filter(p => !p.recipe || p.recipe.length === 0);
      
      if (productsWithoutRecipe.length > 0) {
        newAlerts.push({
          id: 'missing-recipes',
          type: 'critical',
          category: 'product',
          title: '🔬 Fichas Técnicas Faltando',
          message: `${productsWithoutRecipe.length} produtos de produção estão sem ficha técnica. Isso impede o controle de custos e estoque.`,
          action: {
            label: 'Configurar Fichas Técnicas',
            path: '/painel/registrations/products'
          },
          priority: 10,
          createdAt: new Date()
        });
      }

      // 🤖 ANÁLISE 2: Produtos sem Categoria
      const uncategorizedProducts = products.filter(p => !p.categoryId);
      if (uncategorizedProducts.length > 0) {
        newAlerts.push({
          id: 'uncategorized-products',
          type: 'warning',
          category: 'product',
          title: '📂 Produtos Sem Categoria',
          message: `${uncategorizedProducts.length} produtos não possuem categoria definida. Isso dificulta a organização.`,
          action: {
            label: 'Organizar Produtos',
            path: '/painel/registrations/products'
          },
          priority: 7,
          createdAt: new Date()
        });
      }

      // 🤖 ANÁLISE 3: Ingredientes com Estoque Baixo
      const lowStockSupplies = supplies.filter(s => 
        s.minStockLevel && s.stockQuantity <= s.minStockLevel
      );
      if (lowStockSupplies.length > 0) {
        newAlerts.push({
          id: 'low-stock-supplies',
          type: 'critical',
          category: 'inventory',
          title: '⚠️ Estoque Crítico',
          message: `${lowStockSupplies.length} ingredientes estão com estoque abaixo do mínimo. Risco de parar a produção.`,
          action: {
            label: 'Gerenciar Estoque',
            path: '/painel/registrations/supplies'
          },
          priority: 9,
          createdAt: new Date()
        });
      }

      // 🤖 ANÁLISE 4: Produtos sem Preço de Custo
      const productsWithoutCost = products.filter(p => !p.costPrice || p.costPrice <= 0);
      if (productsWithoutCost.length > 0) {
        newAlerts.push({
          id: 'missing-cost-prices',
          type: 'warning',
          category: 'product',
          title: '💰 Custos Não Definidos',
          message: `${productsWithoutCost.length} produtos estão sem preço de custo. Isso impede análises de margem.`,
          action: {
            label: 'Definir Custos',
            path: '/painel/registrations/products'
          },
          priority: 6,
          createdAt: new Date()
        });
      }

      // 🤖 ANÁLISE 5: Sistema sem Categorias
      if (categories.length === 0) {
        newAlerts.push({
          id: 'no-categories',
          type: 'critical',
          category: 'system',
          title: '🏷️ Sistema Sem Categorias',
          message: 'Nenhuma categoria foi criada. Isso é essencial para organizar produtos e relatórios.',
          action: {
            label: 'Criar Categorias',
            path: '/painel/registrations/categories'
          },
          priority: 8,
          createdAt: new Date()
        });
      }

      // 🤖 ANÁLISE 6: Mesas Não Configuradas
      if (tables.length === 0 && userProfile.businessProfile?.type === 'food_service') {
        newAlerts.push({
          id: 'no-tables',
          type: 'warning',
          category: 'system',
          title: '🪑 Mesas Não Configuradas',
          message: 'Nenhuma mesa foi cadastrada. Configure as mesas para usar o sistema de comandas.',
          action: {
            label: 'Cadastrar Mesas',
            path: '/painel/registrations/tables'
          },
          priority: 5,
          createdAt: new Date()
        });
      }

      // 🤖 INSIGHT 1: Análise de Margem
      if (products.length > 0) {
        const productsWithMargin = products.filter(p => p.costPrice > 0 && p.salePrice > 0);
        if (productsWithMargin.length > 0) {
          const avgMargin = productsWithMargin.reduce((acc, p) => {
            const margin = ((p.salePrice - p.costPrice) / p.salePrice) * 100;
            return acc + margin;
          }, 0) / productsWithMargin.length;

          newInsights.push({
            id: 'margin-analysis',
            type: 'performance',
            title: '📊 Análise de Margem',
            description: `Margem média dos produtos: ${avgMargin.toFixed(1)}%`,
            data: { avgMargin, productsAnalyzed: productsWithMargin.length },
            confidence: 0.95,
            impact: 'high'
          });
        }
      }

      // 🤖 INSIGHT 2: Produtos Mais Vendidos
      if (sales.length > 0) {
        const productSales = sales.flatMap(sale => sale.items || []).reduce((acc: any, item: any) => {
          if (!acc[item.productId]) {
            acc[item.productId] = { name: item.name, totalQty: 0, totalRevenue: 0 };
          }
          acc[item.productId].totalQty += item.qty;
          acc[item.productId].totalRevenue += item.qty * item.salePrice;
          return acc;
        }, {});

        const topProducts = Object.values(productSales)
          .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
          .slice(0, 3);

        if (topProducts.length > 0) {
          newInsights.push({
            id: 'top-products',
            type: 'trend',
            title: '🏆 Produtos Campeões',
            description: `Seus ${topProducts.length} produtos mais vendidos representam a maior parte da receita`,
            data: { topProducts },
            confidence: 0.9,
            impact: 'high'
          });
        }
      }

      // 🤖 INSIGHT 3: Recomendações de Otimização
      const optimizationScore = calculateOptimizationScore();
      if (optimizationScore < 80) {
        newInsights.push({
          id: 'optimization-recommendation',
          type: 'recommendation',
          title: '⚡ Oportunidades de Melhoria',
          description: `Score de otimização: ${optimizationScore}%. Há oportunidades para melhorar a eficiência.`,
          data: { score: optimizationScore },
          confidence: 0.85,
          impact: 'medium'
        });
      }

      setAlerts(newAlerts);
      setInsights(newInsights);
    };

    // Executar análise inicial
    runAIAnalysis();

    // Executar análise a cada 30 segundos
    const interval = setInterval(runAIAnalysis, 30000);

    return () => clearInterval(interval);
  }, [products, supplies, sales, tables, categories, subcategories, userProfile, isMonitoring]);

  const calculateOptimizationScore = (): number => {
    let score = 100;
    
    // Penalizar por produtos sem ficha técnica
    const productionProducts = products.filter(p => p.productStructure === 'producao');
    const productsWithoutRecipe = productionProducts.filter(p => !p.recipe || p.recipe.length === 0);
    if (productionProducts.length > 0) {
      score -= (productsWithoutRecipe.length / productionProducts.length) * 30;
    }

    // Penalizar por produtos sem categoria
    const uncategorizedProducts = products.filter(p => !p.categoryId);
    if (products.length > 0) {
      score -= (uncategorizedProducts.length / products.length) * 20;
    }

    // Penalizar por produtos sem custo
    const productsWithoutCost = products.filter(p => !p.costPrice || p.costPrice <= 0);
    if (products.length > 0) {
      score -= (productsWithoutCost.length / products.length) * 25;
    }

    // Penalizar por falta de categorias
    if (categories.length === 0) {
      score -= 15;
    }

    // Penalizar por estoque baixo
    const lowStockSupplies = supplies.filter(s => 
      s.minStockLevel && s.stockQuantity <= s.minStockLevel
    );
    if (supplies.length > 0) {
      score -= (lowStockSupplies.length / supplies.length) * 10;
    }

    return Math.max(0, Math.round(score));
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, dismissed: true } : alert
    ));
  };

  const getAlertsByCategory = (category: string) => {
    return alerts.filter(alert => alert.category === category && !alert.dismissed);
  };

  const getCriticalAlertsCount = () => {
    return alerts.filter(alert => alert.type === 'critical' && !alert.dismissed).length;
  };

  const getSystemHealthScore = () => {
    return calculateOptimizationScore();
  };

  const value = {
    alerts: alerts.filter(alert => !alert.dismissed),
    insights,
    isMonitoring,
    dismissAlert,
    getAlertsByCategory,
    getCriticalAlertsCount,
    getSystemHealthScore,
  };

  return (
    <AIMonitoringContext.Provider value={value}>
      {children}
    </AIMonitoringContext.Provider>
  );
};