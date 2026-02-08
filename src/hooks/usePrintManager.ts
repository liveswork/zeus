import { useCallback } from 'react';
import { usePrint } from '../contexts/PrintContext';
import { Order, PurchaseOrder } from '../types';

export const usePrintManager = () => {
  const { requestPrint } = usePrint();

  const printKitchenOrder = useCallback((order: Order) => {
    console.log('Solicitando impressão da cozinha:', order);
    requestPrint({
      order,
      type: 'kitchen',
      format: '80mm'
    });
  }, [requestPrint]);

  const printCustomerBill = useCallback((order: Order) => {
    console.log('Solicitando impressão do cliente:', order);
    requestPrint({
      order,
      type: 'customer',
      format: '80mm'
    });
  }, [requestPrint]);

  const printDeliveryOrder = useCallback((order: Order) => {
    console.log('Solicitando impressão do entregador:', order);
    requestPrint({
      order,
      type: 'delivery',
      format: '80mm'
    });
  }, [requestPrint]);

  const printPurchaseOrder = useCallback((order: PurchaseOrder) => {
    console.log('Solicitando impressão de compra:', order);
    requestPrint({
      order,
      type: 'purchaseOrder',
      format: 'a4'
    });
  }, [requestPrint]);

  return {
    printKitchenOrder,
    printCustomerBill,
    printDeliveryOrder,
    printPurchaseOrder,
  };
};