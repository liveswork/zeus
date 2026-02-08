import React, { useState, useEffect, useMemo } from 'react';
import { Wallet, PlusCircle, MinusCircle, DollarSign, TrendingUp, Loader } from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { useBusiness } from '../../../contexts/BusinessContext';
import { useUI } from '../../../contexts/UIContext';
import { CashierSession, Sale, Product, Category } from '../../../types';
import { StatCard } from '../../ui/StatCard';
import { formatCurrency } from '../../../utils/formatters';
// --- NOVO: Importar o modal de fechamento ---
import { CashierClosingModal } from './financial/CashierClosingModal'; 

export const CashierManager: React.FC = () => {
  const { userProfile } = useAuth();
  // --- NOVO: Pegar 'products' e 'categories' para os cálculos ---
  const { businessId, sales, products, categories } = useBusiness();
  const { showAlert, showConfirmation } = useUI();
  const [activeSession, setActiveSession] = useState<CashierSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [openingBalance, setOpeningBalance] = useState('0.00');

  // --- NOVOS ESTADOS PARA O FLUXO DE FECHAMENTO ---
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [closingReportData, setClosingReportData] = useState<any | null>(null);
  const [isCalculating, setIsCalculating] = useState(false); // Para o loading do relatório

  // Monitor active cashier session
  useEffect(() => {
    if (!businessId) return;

    const sessionsRef = collection(db, 'cashier_sessions');
    const q = query(
      sessionsRef,
      where("businessId", "==", businessId),
      where("status", "==", "open")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const sessionDoc = snapshot.docs[0];
        setActiveSession({ id: sessionDoc.id, ...sessionDoc.data() } as CashierSession);
      } else {
        setActiveSession(null);
      }
      setLoadingSession(false);
    });

    return () => unsubscribe();
  }, [businessId]);

  const handleOpenCashier = async () => {
    const balance = parseFloat(openingBalance);
    if (balance < 0) {
      showAlert("O saldo inicial não pode ser negativo", "error");
      return;
    }

    try {
      await addDoc(collection(db, 'cashier_sessions'), {
        businessId: businessId,
        status: "open",
        openedAt: serverTimestamp(),
        openedBy: {
          uid: userProfile?.uid,
          name: userProfile?.displayName || 'Usuário'
        },
        openingBalance: balance,
      });
      showAlert("Caixa aberto com sucesso!");
    } catch (error) {
      console.error("Erro ao abrir caixa:", error);
      showAlert("Não foi possível abrir o caixa", "error");
    }
  };

  // --- NOVO: Função para gerar a Análise da IA ---
  const generateAIInsight = (profitByCategory: any): string => {
    if (Object.keys(profitByCategory).length === 0) {
      return "Não houve vendas suficientes para uma análise detalhada.";
    }

    let bestCategory = { name: '', margin: -Infinity };
    let worstCategory = { name: '', margin: Infinity };

    Object.entries(profitByCategory).forEach(([name, data]: [string, any]) => {
      if (data.margin > bestCategory.margin) {
        bestCategory = { name, margin: data.margin };
      }
      if (data.margin < worstCategory.margin && data.profit > 0) { // Ignora margens 0 ou negativas para "pior"
        worstCategory = { name, margin: data.margin };
      }
    });

    if (bestCategory.margin === -Infinity) {
       return "Não foi possível calcular as margens. Verifique o custo dos seus produtos.";
    }

    let insight = `Sua categoria mais lucrativa foi "${bestCategory.name}" com ${bestCategory.margin.toFixed(1)}% de margem.`;
    
    if (worstCategory.margin !== Infinity && worstCategory.name !== bestCategory.name) {
      insight += ` A categoria "${worstCategory.name}" teve a menor margem (${worstCategory.margin.toFixed(1)}%). Considere revisar os custos ou preços desta categoria.`;
    }

    return insight;
  };

  // --- NOVO: Função de cálculo do relatório ---
  const generateClosingReport = async () => {
    if (!activeSession || !businessId) return null;

    // 1. Buscar todas as vendas da sessão atual
    const salesRef = collection(db, 'sales');
    const q = query(
      salesRef,
      where("businessId", "==", businessId),
      where("createdAt", ">=", activeSession.openedAt)
      // Idealmente, filtraríamos por "status: 'completed'", mas vamos pegar todas por enquanto
    );
    
    const salesSnapshot = await getDocs(q);
    const sessionSales = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));

    let totalSales = 0;
    let totalCost = 0;
    const paymentBreakdown: { [key: string]: number } = {};
    const profitByCategory: { [key: string]: { profit: number; revenue: number; margin?: number } } = {};

    // 2. Processar cada venda
    for (const sale of sessionSales) {
      totalSales += sale.finalAmount || sale.totalAmount || 0;

      // Processar itens para custo e lucro
      if (sale.items) {
        for (const item of sale.items) {
          const product = products.find(p => p.id === item.productId);
          const itemCost = item.costPrice || product?.costPrice || 0;
          const itemRevenue = item.salePrice * item.qty;
          const itemProfit = (item.salePrice - itemCost) * item.qty;
          
          totalCost += itemCost * item.qty;

          // Agrupar lucro por categoria
          const categoryName = categories.find(c => c.id === product?.categoryId)?.name || 'Sem Categoria';
          if (!profitByCategory[categoryName]) {
            profitByCategory[categoryName] = { profit: 0, revenue: 0 };
          }
          profitByCategory[categoryName].profit += itemProfit;
          profitByCategory[categoryName].revenue += itemRevenue;
        }
      }

      // Processar pagamentos
      const payments = Array.isArray(sale.paymentDetails) ? sale.paymentDetails : [sale.paymentDetails];
      for (const payment of payments) {
        if (payment && payment.method) {
            paymentBreakdown[payment.method] = (paymentBreakdown[payment.method] || 0) + payment.amountPaid;
        }
      }
    }
    
    // 3. Calcular totais e médias
    const totalProfit = totalSales - totalCost;
    const avgMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
    
    // Calcular margem por categoria
    Object.keys(profitByCategory).forEach(key => {
        const category = profitByCategory[key];
        category.margin = category.revenue > 0 ? (category.profit / category.revenue) * 100 : 0;
    });

    const expectedCash = activeSession.openingBalance + (paymentBreakdown.dinheiro || 0);

    // 4. Gerar Insight da IA
    const aiInsight = generateAIInsight(profitByCategory);

    return {
      totalSales,
      totalCost,
      totalProfit,
      avgMargin,
      paymentBreakdown,
      profitByCategory,
      openingBalance: activeSession.openingBalance,
      expectedCash,
      aiInsight,
      salesCount: sessionSales.length
    };
  };

  // --- ATUALIZADO: handleCloseCashier agora abre o modal ---
  const handleCloseCashier = async () => {
    setIsCalculating(true);
    try {
      const report = await generateClosingReport();
      if (report) {
        setClosingReportData(report);
        setIsClosingModalOpen(true);
      } else {
        showAlert("Não foi possível gerar o relatório.", "error");
      }
    } catch (error: any) {
      console.error("Erro ao gerar relatório:", error);
      showAlert(`Erro ao gerar relatório: ${error.message}`, "error");
    } finally {
      setIsCalculating(false);
    }
  };

  // --- NOVO: Função para confirmar o fechamento ---
  const handleConfirmCloseCashier = async (reportData: any) => {
    if (!activeSession) return;
    setIsCalculating(true);
    
    try {
      const sessionRef = doc(db, 'cashier_sessions', activeSession.id);
      await updateDoc(sessionRef, {
        status: "closed",
        closedAt: serverTimestamp(),
        closedBy: {
          uid: userProfile?.uid,
          name: userProfile?.displayName || 'Usuário'
        },
        closingReport: reportData // Salva o relatório no documento
      });

      showAlert("Caixa fechado com sucesso!");
      setIsClosingModalOpen(false);
      setClosingReportData(null);
      setActiveSession(null);
    } catch (error) {
      console.error("Erro ao fechar caixa:", error);
      showAlert("Erro ao salvar fechamento do caixa.", "error");
    } finally {
      setIsCalculating(false);
    }
  };

  if (loadingSession) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin" size={48} />
        <p className="text-lg ml-4">Verificando status do caixa...</p>
      </div>
    );
  }

  if (!activeSession) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="text-blue-500" size={24} />
            <h2 className="text-xl font-bold text-gray-800">Abrir Caixa</h2>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Saldo Inicial em Espécie
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
            <p className="text-sm text-gray-500 mt-1">
              Digite o valor inicial em dinheiro que está no caixa
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={handleOpenCashier}
              disabled={!openingBalance || parseFloat(openingBalance) < 0}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Abrir Caixa
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active cashier dashboard
  const todaySales = sales.filter(s => 
    new Date(s.date).toDateString() === new Date().toDateString()
  );
  const todayTotal = todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0);

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Caixa Atual</h1>
          <button
            onClick={handleCloseCashier}
            disabled={isCalculating}
            className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition flex items-center"
          >
            {isCalculating ? <Loader size={20} className="animate-spin mr-2" /> : <Wallet size={20} className="mr-2" />}
            {isCalculating ? 'Calculando...' : 'Fechar Caixa'}
          </button>
        </div>

        {/* Session Info */}
        <div className="bg-white p-4 rounded-lg shadow-sm border flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Sessão: {activeSession.id.substring(0, 8).toUpperCase()}</p>
            <p className="font-semibold text-gray-800">Operador: {activeSession.openedBy.name}</p>
            <p className="font-semibold text-gray-800">
              Abertura: {new Date(activeSession.openedAt).toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="bg-green-100 text-green-800 font-bold py-1 px-3 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Aberto
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Saldo Inicial"
            value={formatCurrency(activeSession.openingBalance)}
            icon={<Wallet />}
            color="bg-blue-500"
          />
          <StatCard
            title="Vendas Hoje"
            value={formatCurrency(todayTotal)}
            subValue={`${todaySales.length} transações`}
            icon={<DollarSign />}
            color="bg-green-500"
          />
          <StatCard
            title="Suprimentos"
            value={formatCurrency(0)}
            icon={<PlusCircle />}
            color="bg-cyan-500"
          />
          <StatCard
            title="Sangrias"
            value={formatCurrency(0)}
            icon={<MinusCircle />}
            color="bg-red-500"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="bg-green-500 text-white p-4 rounded-lg hover:bg-green-600 transition">
            <PlusCircle size={24} className="mx-auto mb-2" />
            <span className="block text-sm font-semibold">Suprimento</span>
          </button>
          <button className="bg-red-500 text-white p-4 rounded-lg hover:bg-red-600 transition">
            <MinusCircle size={24} className="mx-auto mb-2" />
            <span className="block text-sm font-semibold">Sangria</span>
          </button>
        </div>
      </div>

      {/* --- NOVO: Modal de Fechamento --- */}
      {isClosingModalOpen && (
        <CashierClosingModal
          isOpen={isClosingModalOpen}
          onClose={() => setIsClosingModalOpen(false)}
          onConfirm={handleConfirmCloseCashier}
          reportData={closingReportData}
          loading={isCalculating}
        />
      )}
    </>
  );
};