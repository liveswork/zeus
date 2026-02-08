import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Brain, AlertTriangle, CheckCircle, Info, Lightbulb, X, 
  TrendingUp, Package, BarChart3, Settings, Zap, Target,
  ChevronDown, ChevronUp, Activity, Shield
} from 'lucide-react';
import { useAIMonitoring } from '../../contexts/AIMonitoringContext';

export const AIMonitoringPanel: React.FC = () => {
  const { 
    alerts, 
    insights, 
    dismissAlert, 
    getCriticalAlertsCount, 
    getSystemHealthScore 
  } = useAIMonitoring();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('alerts');

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

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-50 border-green-200';
    if (score >= 70) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Botão Principal da IA */}
      <div className="relative">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 ${
            criticalCount > 0 
              ? 'bg-gradient-to-r from-red-500 to-red-600 animate-pulse' 
              : 'bg-gradient-to-r from-blue-600 to-purple-600'
          }`}
        >
          <Brain size={28} className="text-white" />
        </button>

        {/* Badge de Alertas Críticos */}
        {criticalCount > 0 && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce">
            {criticalCount}
          </div>
        )}

        {/* Indicador de Health Score */}
        <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
          <span className={`text-xs font-bold ${getHealthColor(healthScore)}`}>
            {healthScore}
          </span>
        </div>
      </div>

      {/* Painel Expandido */}
      {isExpanded && (
        <div className="absolute bottom-20 right-0 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transform transition-all duration-300">
          {/* Header da IA */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Brain size={20} />
                </div>
                <div>
                  <h3 className="font-bold">FoodPDV AI</h3>
                  <p className="text-xs text-blue-100">Assistente Inteligente</p>
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-white/80 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Health Score */}
            <div className={`mt-4 p-3 rounded-lg border ${getHealthBgColor(healthScore)} bg-white/10`}>
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">Score do Sistema</span>
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-white" />
                  <span className="text-white font-bold text-lg">{healthScore}%</span>
                </div>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                <div 
                  className="bg-white rounded-full h-2 transition-all duration-500"
                  style={{ width: `${healthScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('alerts')}
              className={`flex-1 p-3 text-sm font-medium transition ${
                activeTab === 'alerts' 
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Alertas ({alerts.length})
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`flex-1 p-3 text-sm font-medium transition ${
                activeTab === 'insights' 
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Insights ({insights.length})
            </button>
          </div>

          {/* Conteúdo */}
          <div className="max-h-80 overflow-y-auto">
            {activeTab === 'alerts' ? (
              <div className="p-4 space-y-3">
                {alerts.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle size={32} className="mx-auto text-green-500 mb-2" />
                    <p className="text-green-600 font-medium">Sistema Otimizado!</p>
                    <p className="text-gray-500 text-sm">Nenhum alerta no momento</p>
                  </div>
                ) : (
                  alerts
                    .sort((a, b) => b.priority - a.priority)
                    .map(alert => (
                      <div
                        key={alert.id}
                        className={`p-3 rounded-lg border-l-4 ${
                          alert.type === 'critical' ? 'border-red-500 bg-red-50' :
                          alert.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                          alert.type === 'info' ? 'border-blue-500 bg-blue-50' :
                          'border-purple-500 bg-purple-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2 flex-1">
                            {getAlertIcon(alert.type)}
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-800 text-sm">
                                {alert.title}
                              </h4>
                              <p className="text-gray-600 text-xs mt-1">
                                {alert.message}
                              </p>
                              {alert.action && (
                                <Link
                                  to={alert.action.path}
                                  className="inline-block mt-2 text-xs font-medium text-blue-600 hover:text-blue-800"
                                  onClick={() => setIsExpanded(false)}
                                >
                                  {alert.action.label} →
                                </Link>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => dismissAlert(alert.id)}
                            className="text-gray-400 hover:text-gray-600 ml-2"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {insights.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-600 font-medium">Coletando Dados</p>
                    <p className="text-gray-500 text-sm">Insights aparecerão em breve</p>
                  </div>
                ) : (
                  insights.map(insight => (
                    <div
                      key={insight.id}
                      className="p-3 rounded-lg bg-gray-50 border border-gray-200"
                    >
                      <div className="flex items-start gap-2">
                        {getInsightIcon(insight.type)}
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800 text-sm">
                            {insight.title}
                          </h4>
                          <p className="text-gray-600 text-xs mt-1">
                            {insight.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              insight.impact === 'high' ? 'bg-red-100 text-red-700' :
                              insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              Impacto {insight.impact === 'high' ? 'Alto' : insight.impact === 'medium' ? 'Médio' : 'Baixo'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {Math.round(insight.confidence * 100)}% confiança
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-3 text-center">
            <p className="text-xs text-gray-500">
              Powered by FoodPDV AI • Atualizado em tempo real
            </p>
          </div>
        </div>
      )}
    </div>
  );
};