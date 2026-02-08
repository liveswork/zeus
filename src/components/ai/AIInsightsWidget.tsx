import React from 'react';
import { Brain, TrendingUp, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { AlertTriangle, Info, Lightbulb, BarChart3, Target, Activity } from 'lucide-react';
import { useAIMonitoring } from '../../contexts/AIMonitoringContext';

export const AIInsightsWidget: React.FC = () => {
  const { alerts, insights, getSystemHealthScore, getCriticalAlertsCount } = useAIMonitoring();
  
  const healthScore = getSystemHealthScore();
  const criticalCount = getCriticalAlertsCount();

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle size={18} className="text-red-500" />;
      case 'warning': return <AlertTriangle size={18} className="text-yellow-500" />;
      case 'info': return <Info size={18} className="text-blue-500" />;
      case 'suggestion': return <Lightbulb size={18} className="text-purple-500" />;
      default: return <Info size={18} className="text-gray-500" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'performance': return <BarChart3 size={18} className="text-green-500" />;
      case 'trend': return <TrendingUp size={18} className="text-blue-500" />;
      case 'recommendation': return <Target size={18} className="text-purple-500" />;
      case 'prediction': return <Zap size={18} className="text-orange-500" />;
      default: return <Activity size={18} className="text-gray-500" />;
    }
  };

  const getHealthStatus = (score: number) => {
    if (score >= 90) return { label: 'Excelente', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 70) return { label: 'Bom', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { label: 'Precisa Atenção', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const healthStatus = getHealthStatus(healthScore);

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <Brain size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">FoodPDV AI</h3>
            <p className="text-sm text-gray-500">Assistente Inteligente</p>
          </div>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${healthStatus.bg} ${healthStatus.color}`}>
          {healthStatus.label}
        </div>
      </div>

      {/* Health Score */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Score do Sistema</span>
          <span className={`text-lg font-bold ${healthStatus.color}`}>{healthScore}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              healthScore >= 90 ? 'bg-green-500' :
              healthScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${healthScore}%` }}
          />
        </div>
      </div>

      {/* Resumo de Alertas */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
          <AlertCircle size={24} className="mx-auto text-red-500 mb-1" />
          <p className="text-lg font-bold text-red-600">{criticalCount}</p>
          <p className="text-xs text-red-700">Críticos</p>
        </div>
        
        <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
          <Lightbulb size={24} className="mx-auto text-blue-500 mb-1" />
          <p className="text-lg font-bold text-blue-600">{insights.length}</p>
          <p className="text-xs text-blue-700">Insights</p>
        </div>
      </div>

      {/* Alertas Principais */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700 text-sm">Alertas Principais</h4>
          {alerts.slice(0, 2).map(alert => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border-l-4 text-sm ${
                alert.type === 'critical' ? 'border-red-500 bg-red-50' :
                alert.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                'border-blue-500 bg-blue-50'
              }`}
            >
              <div className="flex items-start gap-2">
                {getAlertIcon(alert.type)}
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{alert.title}</p>
                  <p className="text-gray-600 text-xs mt-1">{alert.message}</p>
                </div>
              </div>
            </div>
          ))}
          
          {alerts.length > 2 && (
            <p className="text-center text-xs text-gray-500 mt-2">
              +{alerts.length - 2} alertas adicionais
            </p>
          )}
        </div>
      )}

      {/* Insights Principais */}
      {insights.length > 0 && (
        <div className="space-y-2 mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-700 text-sm">Insights Recentes</h4>
          {insights.slice(0, 1).map(insight => (
            <div
              key={insight.id}
              className="p-3 rounded-lg bg-purple-50 border border-purple-200 text-sm"
            >
              <div className="flex items-start gap-2">
                {getInsightIcon(insight.type)}
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{insight.title}</p>
                  <p className="text-gray-600 text-xs mt-1">{insight.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status da IA */}
      <div className="mt-4 pt-4 border-t border-gray-200 text-center">
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>IA ativa • Monitoramento em tempo real</span>
        </div>
      </div>
    </div>
  );
};