import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronsLeft, Search, MoreVertical, Circle, HelpCircle } from 'lucide-react';
import { useBusiness } from '../../../../../contexts/BusinessContext';
import { useUI } from '../../../../../contexts/UIContext';
import { doc, updateDoc, collection, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db, functions } from '../../../../../config/firebase';
import { usePrintManager } from '../../../../../hooks/usePrintManager';
import { OrderModal } from './OrderModal';
import { TableActionFooter } from './TableActionFooter';
import { PreCloseModal } from './PreCloseModal';
import { PaymentModal } from './PaymentModal';
import { TableOptionsMenuModal } from './TableOptionsMenuModal';
import { Order, Table } from '../../../../../types';
import { formatCurrency } from '../../../../../utils/formatters';
import { httpsCallable } from 'firebase/functions';

import { TableManagerTour, mainPageSteps, modalSteps } from './TableManagerTour';
import { EVENTS, ACTIONS, STATUS } from 'react-joyride';
import { CancelItemsModal } from './CancelItemsModal';

// ✅ Novos botões Nexus Vision AI
import { ScanComandaButton } from '../../../modules/common/ScanComandaButton';
import { ComandaScanner } from '../../../modules/composer/ComandaScanner';

const createOrderWithSequentialId = httpsCallable(functions, 'createOrderWithSequentialId');
const finalizeSaleAndProcessAffiliate = httpsCallable(functions, 'finalizeSaleAndProcessAffiliate');
const processComandaScan = httpsCallable(functions, 'processComandaScan');

export const TableManager: React.FC = () => {
  const { tables, orders, products, businessId } = useBusiness();
  const { showConfirmation, showAlert } = useUI();
  const { printKitchenOrder, printCustomerBill } = usePrintManager();

  // Estados dos modais
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isPreCloseModalOpen, setIsPreCloseModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCancelItemsModalOpen, setIsCancelItemsModalOpen] = useState(false);

  // Estados de controle
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [currentOrder, setCurrentOrder] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Tour
  const [runTour, setRunTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  const tourSteps = useMemo(() => (!isOrderModalOpen ? mainPageSteps : modalSteps), [isOrderModalOpen]);

  // Observador para tour
  useEffect(() => {
    if (isOrderModalOpen && runTour && tourStep === 2) {
      setTimeout(() => setTourStep(3), 400);
    }
  }, [isOrderModalOpen, runTour]);

  const handleTourCallback = (data: any) => {
    const { action, index, status, type } = data;

    if (([STATUS.FINISHED, STATUS.SKIPPED] as any).includes(status)) {
      setRunTour(false);
      setTourStep(0);
      setSelectedTable(null);
      return;
    }

    if (type === EVENTS.STEP_AFTER) {
      const nextStepIndex = index + (action === ACTIONS.PREV ? -1 : 1);

      if (action === ACTIONS.NEXT) {
        if (index === 0 && firstFreeTable) handleTableSelect(firstFreeTable);
        else if (index === 1 && selectedTable) {
          setRunTour(false);
          openTable(selectedTable);
        }
      }
      setTourStep(nextStepIndex);
    }
  };

  const startTour = () => {
    setIsOrderModalOpen(false);
    setSelectedTable(null);
    setCurrentOrder(null);
    setTourStep(0);
    setTimeout(() => setRunTour(true), 100);
  };

  // Cancelamento de mesa
  const handleCancelTable = () => {
    if (!currentOrder || !selectedTable) return;
    showConfirmation(`Tem certeza que deseja cancelar a ${currentOrder.tableName}?`, async () => {
      try {
        const batch = writeBatch(db);
        batch.delete(doc(db, 'orders', currentOrder.id));
        batch.update(doc(db, 'tables', selectedTable.id), { status: 'livre', currentOrderId: null });
        await batch.commit();
        showAlert(`${currentOrder.tableName} foi cancelada!`, 'success');
        setIsOptionsMenuOpen(false);
        setSelectedTable(null);
        setCurrentOrder(null);
      } catch (error) {
        console.error("Erro ao cancelar mesa:", error);
        showAlert("Erro ao cancelar mesa.", "error");
      }
    });
  };

  const handleConfirmCancelItems = async (itemsToCancel: { [productId: string]: number }) => {
    if (!currentOrder) return;
    const updatedItems = currentOrder.items.map((item: any) => {
      const cancelQty = itemsToCancel[item.productId] || 0;
      return { ...item, qty: item.qty - cancelQty };
    }).filter((item: any) => item.qty > 0);

    const newTotalAmount = updatedItems.reduce((sum: number, item: any) => sum + (item.salePrice * item.qty), 0);

    try {
      await updateDoc(doc(db, 'orders', currentOrder.id), {
        items: updatedItems,
        totalAmount: newTotalAmount,
        updatedAt: serverTimestamp()
      });
      showAlert('Itens cancelados!', 'success');
      setIsCancelItemsModalOpen(false);
      setIsOptionsMenuOpen(false);
      setCurrentOrder((prev: any) => ({ ...prev, items: updatedItems, totalAmount: newTotalAmount }));
    } catch (error) {
      console.error("Erro ao cancelar itens:", error);
      showAlert("Erro ao cancelar itens.", "error");
    }
  };

  // Processamento de mesas
  const processedTables = useMemo(() => {
    return tables.map(table => {
      const order = table.currentOrderId ? orders.find(o => o.id === table.currentOrderId) : null;
      return {
        ...table,
        totalAmount: order?.totalAmount || 0,
        itemCount: order?.items?.length || 0,
        places: table.places || 4,
        location: table.location || 'Salão Principal'
      };
    }).filter(table =>
      table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(table.number).includes(searchTerm)
    );
  }, [tables, orders, searchTerm]);

  const firstFreeTable = useMemo(() => processedTables.find(t => t.status === 'livre'), [processedTables]);

  const stats = useMemo(() => ({
    livres: tables.filter(t => t.status === 'livre').length,
    ocupadas: tables.filter(t => t.status === 'ocupada').length,
    pagamento: tables.filter(t => t.status === 'pagamento').length,
  }), [tables]);

  const handleTableSelect = (table: any) => {
    if (table.id === selectedTable?.id) {
      if (table.status === 'pagamento') {
        showAlert("Mesa aguardando pagamento.", "warning");
        return;
      }
      const orderToLoad = orders.find(o => o.id === table.currentOrderId);
      if (orderToLoad) {
        setCurrentOrder(orderToLoad);
        setIsOrderModalOpen(true);
      } else if (table.status === 'livre') {
        openTable(table);
      }
    } else {
      setSelectedTable(table);
      const order = orders.find(o => o.id === table.currentOrderId);
      setCurrentOrder(order || null);
    }
  };

  const openTable = (table: any) => {
    const confirmAction = async () => {
      if (!businessId) {
        showAlert("ID do negócio não encontrado!", "error");
        return;
      }
      const newOrderRef = doc(collection(db, 'orders'));
      const tableRef = doc(db, 'tables', table.id);
      const newOrderData = {
        id: newOrderRef.id,
        tableId: table.id,
        tableName: table.name,
        businessId,
        status: 'open',
        items: [],
        totalAmount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      const batch = writeBatch(db);
      batch.set(newOrderRef, newOrderData);
      batch.update(tableRef, { status: 'ocupada', currentOrderId: newOrderRef.id });
      await batch.commit();
      setCurrentOrder({ ...newOrderData, createdAt: { toDate: () => new Date() } });
      setIsOrderModalOpen(true);
    };
    if (runTour) confirmAction();
    else showConfirmation(`Abrir nova comanda na mesa ${table.name}?`, confirmAction);
  };

  // --- Atalhos ---
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!selectedTable || selectedTable.status === 'livre') return;
      if (event.key === 'F5') { event.preventDefault(); handleOpenPreClose(); }
      else if (event.key === 'F6') { event.preventDefault(); handleOpenPayment(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTable]);

  // --- Atualização de pedido ---
  const handleUpdateOrder = async (updatedOrderData: any) => {
    const originalOrder = orders.find(o => o.id === updatedOrderData.id);
    if (!originalOrder) {
      showAlert("Pedido original não encontrado.", "error");
      return;
    }
    try {
      await updateDoc(doc(db, 'orders', updatedOrderData.id), {
        items: updatedOrderData.items,
        totalAmount: updatedOrderData.totalAmount,
        updatedAt: serverTimestamp()
      });
      showAlert("Comanda atualizada!", 'success');

      const itemsToPrint = updatedOrderData.items.map((newItem: any) => {
        const originalItem = originalOrder.items.find((oi: any) => oi.productId === newItem.productId && oi.observation === newItem.observation);
        const diff = newItem.qty - (originalItem ? originalItem.qty : 0);
        return diff > 0 ? { ...newItem, qty: diff } : null;
      }).filter(Boolean);

      if (itemsToPrint.length > 0) {
        printKitchenOrder({ ...updatedOrderData, items: itemsToPrint, createdAt: new Date() });
      }
      handleCloseOrderModal();
    } catch (error) {
      console.error("Erro ao lançar pedido:", error);
      showAlert("Erro ao lançar pedido.", "error");
    }
  };

  // --- Alterações principais ---
  const handleOpenPreClose = () => selectedTable ? setIsPreCloseModalOpen(true) : showAlert('Selecione uma mesa.');
  const handleOpenPayment = () => selectedTable ? setIsPaymentModalOpen(true) : showAlert('Selecione uma mesa.');
  const handleOpenOptions = () => selectedTable ? setIsOptionsMenuOpen(true) : showAlert('Selecione uma mesa.');

  const handlePrintPreClose = async (printData: any) => {
    try {
      await updateDoc(doc(db, 'tables', printData.tableId), { status: 'pagamento' });
      printCustomerBill(printData as Order);
      showAlert("Conta impressa!", 'success');
      setIsPreCloseModalOpen(false);
      setSelectedTable(null);
      setCurrentOrder(null);
    } catch (error) {
      console.error("Erro no pré-fechamento:", error);
      showAlert("Erro ao atualizar mesa.", "error");
    }
  };

  const handleReopenTable = () => {
    if (!currentOrder) return;
    showConfirmation(`Reabrir ${currentOrder.tableName}?`, async () => {
      try {
        await updateDoc(doc(db, 'tables', currentOrder.tableId), { status: 'ocupada' });
        showAlert(`${currentOrder.tableName} reaberta!`, 'success');
        setSelectedTable(prev => prev ? { ...prev, status: 'ocupada' } : null);
        setIsOptionsMenuOpen(false);
      } catch (error) {
        console.error('Erro ao reabrir mesa:', error);
        showAlert("Erro ao reabrir mesa.", "error");
      }
    });
  };

  const handleFinalizeAndPay = async (paymentData: any[]) => {
    if (!currentOrder) return;
    const saleData = {
      ...currentOrder,
      businessId,
      paymentDetails: paymentData,
      status: 'completed',
      origin: 'mesas',
      orderType: 'mesa'
    };
    try {
      const result = await finalizeSaleAndProcessAffiliate({ orderData: saleData });
      if (!result.data.success) throw new Error('Falha na finalização.');
      printCustomerBill({ ...saleData, createdAt: new Date() } as any);
      showAlert("Venda finalizada!", 'success');
      setIsPaymentModalOpen(false);
      setSelectedTable(null);
      setCurrentOrder(null);
    } catch (error: any) {
      console.error("Erro ao finalizar venda:", error);
      showAlert(`Erro: ${error.message}`, "error");
    }
  };

  const handleCloseOrderModal = () => {
    setCurrentOrder(null);
    setIsOrderModalOpen(false);
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'ocupada': return 'bg-red-200 border-red-400 hover:bg-red-300 text-red-800';
      case 'livre': return 'bg-green-200 border-green-400 hover:bg-green-300 text-green-800';
      case 'pagamento': return 'bg-yellow-200 border-yellow-400 hover:bg-yellow-300 text-yellow-800';
      default: return 'bg-gray-200 border-gray-400 hover:bg-gray-300 text-gray-800';
    }
  };

  const handleScanComplete = async (imageData: string) => {
    if (!selectedTable) return;
    showAlert("Analisando comanda com Nexus Vision AI...", "info");
    try {
      const result: any = await processComandaScan({ imageData, layoutId: 'massa-v1' });
      if (result.data.success && result.data.pedido) {
        const scannedOrder = result.data.pedido;
        showConfirmation(
          `Pedido Escaneado: ${scannedOrder.items.length} itens, Total: ${scannedOrder.total}. Lançar na mesa ${selectedTable.name}?`,
          () => showAlert(`Pedido lançado na Mesa ${selectedTable.name}!`, "success")
        );
      } else throw new Error("Falha ao processar comanda.");
    } catch (error: any) {
      console.error("Erro no scan:", error);
      showAlert(`Erro: ${error.message}`, "error");
    }
  };

  return (
    <>
      <TableManagerTour run={runTour} callback={handleTourCallback} stepIndex={tourStep} steps={tourSteps} />
      <div className="flex h-screen w-full flex-col font-sans bg-gray-50">
        <header className="flex-shrink-0 flex justify-between items-center p-4 bg-white border-b border-gray-200 z-10">
          <Link to="/painel/dashboard" className="text-gray-500 hover:text-gray-900 transition-colors">
            <ChevronsLeft size={24} />
          </Link>
          <h1 className="text-xl font-semibold text-gray-800">Gestão de Mesas</h1>
          <button onClick={startTour} className="text-gray-500 hover:text-blue-600 transition-colors">
            <HelpCircle size={24} />
          </button>
        </header>

        <main className="flex-grow p-6 overflow-y-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div className="flex items-center gap-4 text-sm font-medium text-gray-600">
              <span className="flex items-center gap-2"><Circle size={10} className="text-green-500 fill-current" /> Livres: {stats.livres}</span>
              <span className="flex items-center gap-2"><Circle size={10} className="text-yellow-500 fill-current" /> Ocupadas: {stats.ocupadas}</span>
              <span className="flex items-center gap-2"><Circle size={10} className="text-orange-500 fill-current" /> Pagamento: {stats.pagamento}</span>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text" placeholder="Buscar mesa..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 table-grid-container">
            {processedTables.map(table => (
              <button
                key={table.id} onClick={() => handleTableSelect(table)}
                className={`relative p-4 rounded-lg shadow-md border-b-4 flex flex-col justify-between aspect-[4/5] transition-all duration-200 transform hover:-translate-y-1
                              ${selectedTable?.id === table.id ? 'ring-4 ring-offset-2 ring-blue-500 selected' : ''} 
                              ${getStatusClass(table.status)}
                              ${table.id === firstFreeTable?.id ? 'table-card-livre' : ''}`}
              >
                <div className="w-full">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold">{table.name}</h3>
                    <MoreVertical size={20} className="opacity-70" />
                  </div>
                  <p className="text-xs font-semibold uppercase">{table.status}</p>
                </div>
                <div className="w-full text-left">
                  {table.status !== 'livre' ? (
                    <>
                      <p className="text-2xl font-bold">{formatCurrency(table.totalAmount)}</p>
                      <p className="text-sm opacity-90">{table.itemCount} itens</p>
                    </>
                  ) : (<p className="text-lg font-semibold">Disponível</p>)}
                  <p className="text-xs opacity-80 mt-2">{table.places} lugares • {table.location}</p>
                </div>
              </button>
            ))}
          </div>
        </main>

        {selectedTable && selectedTable.status !== 'livre' && (
          <div className="table-action-footer">
            <TableActionFooter
              onPreClose={handleOpenPreClose} 
              onCloseout={handleOpenPayment} 
              onOptions={handleOpenOptions}
            />
          </div>
        )}
      </div>

      {currentOrder && (
        <OrderModal
          isOpen={isOrderModalOpen} onClose={handleCloseOrderModal} order={currentOrder}
          products={products} onUpdateOrder={handleUpdateOrder} onFinalizeSale={handleOpenPayment}
          showAlert={showAlert} tableStatus={selectedTable?.status || 'livre'}
        />
      )}

      <PreCloseModal 
        isOpen={isPreCloseModalOpen} 
        onClose={() => setIsPreCloseModalOpen(false)} 
        order={currentOrder || (selectedTable ? orders.find(o => o.id === selectedTable.currentOrderId) : null)} 
        onPrint={handlePrintPreClose} 
      />

      <PaymentModal
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)}
        orderData={{ ...(currentOrder || (selectedTable ? orders.find(o => o.id === selectedTable.currentOrderId) : {})), finalAmount: currentOrder?.totalAmount }}
        onPaymentProcessed={handleFinalizeAndPay}
      />

      <TableOptionsMenuModal
        isOpen={isOptionsMenuOpen}
        onClose={() => setIsOptionsMenuOpen(false)}
        orderStatus={selectedTable?.status}
        onPrintKitchen={() => { currentOrder && printKitchenOrder(currentOrder); setIsOptionsMenuOpen(false); }}
        onCancelItems={() => setIsCancelItemsModalOpen(true)}
        onCancelTable={handleCancelTable}
        onReopenTable={handleReopenTable}
      />

      <CancelItemsModal
        isOpen={isCancelItemsModalOpen}
        onClose={() => setIsCancelItemsModalOpen(false)}
        order={currentOrder}
        onConfirm={handleConfirmCancelItems}
      />

      <ComandaScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScanComplete}
      />
    </>
  );
};
