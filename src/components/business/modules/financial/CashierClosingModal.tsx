// src/components/business/modules/financial/CashierClosingModal.tsx
import React from 'react';
import { Modal } from '../../../ui/Modal';
import { StatCard } from '../../../ui/StatCard';
import { formatCurrency } from '../../../../utils/formatters';
import { DollarSign, TrendingUp, BarChart2, Wallet, Zap, PieChart, CheckCircle } from 'lucide-react';
import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface CashierClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reportData: any) => void;
  reportData: any | null;
  loading: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#E36414'];

export const CashierClosingModal: React.FC<CashierClosingModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  reportData,
  loading 
}) => {
  if (!reportData) return null;

  const {
    totalSales,
    totalCost,
    totalProfit,
    avgMargin,
    paymentBreakdown,
    profitByCategory,
    openingBalance,
    expectedCash,
    aiInsight
  } = reportData;

  const categoryChartData = Object.entries(profitByCategory).map(([name, data]: [string, any]) => ({
    name,
    value: data.profit,
  })).sort((a, b) => b.value - a.value);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Fechamento de Caixa Inteligente" size="4xl">
      <div className="space-y-6">
        
        {/* Bloco de Destaques (KPIs) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Vendas Brutas"
            value={formatCurrency(totalSales)}
            icon={<DollarSign />}
            color="bg-green-500"
          />
          <StatCard
            title="Custo dos Produtos (CPV)"
            value={formatCurrency(totalCost)}
            icon={<BarChart2 />}
            color="bg-red-500"
          />
          <StatCard
            title="Lucro Bruto"
            value={formatCurrency(totalProfit)}
            subValue={`Margem de ${avgMargin.toFixed(1)}%`}
            icon={<TrendingUp />}
            color="bg-blue-500"
          />
        </div>

        {/* Bloco de Análise da IA Nexus */}
        <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Zap size={16} className="text-white" />
            </div>
            <div className="flex-1">
                <h4 className="font-bold text-purple-800">Análise da IA Nexus</h4>
                <p className="text-sm text-purple-700 mt-1">{aiInsight}</p>
            </div>
          </div>
        </div>
        
        {/* Grid de Detalhes (Pagamentos e Categorias) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Detalhes de Pagamento */}
          <div className="p-4 bg-white border border-gray-200 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3">Resumo de Pagamentos</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span>Dinheiro:</span>
                <span className="font-semibold">{formatCurrency(paymentBreakdown.dinheiro || 0)}</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span>Cartão:</span>
                <span className="font-semibold">{formatCurrency(paymentBreakdown.cartao || 0)}</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span>PIX:</span>
                <span className="font-semibold">{formatCurrency(paymentBreakdown.pix || 0)}</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span>Voucher:</span>
                <span className="font-semibold">{formatCurrency(paymentBreakdown.voucher || 0)}</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-dashed">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Saldo de Abertura (Dinheiro):</span>
                    <span className="font-medium">{formatCurrency(openingBalance)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-blue-600 mt-2">
                    <span><Wallet size={18} className="inline mr-2" /> Esperado em Gaveta:</span>
                    <span>{formatCurrency(expectedCash)}</span>
                </div>
            </div>
          </div>

          {/* Lucro por Categoria */}
          <div className="p-4 bg-white border border-gray-200 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3">Lucro por Categoria</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend wrapperStyle={{fontSize: "12px"}} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Botão de Confirmação */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reportData)}
            disabled={loading}
            className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <CheckCircle size={18} />
            {loading ? 'Fechando...' : 'Confirmar e Fechar Caixa'}
          </button>
        </div>
      </div>
    </Modal>
  );
};