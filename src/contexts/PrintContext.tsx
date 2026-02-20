import React, { createContext, useContext, useState, useRef, ReactNode, useCallback } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Order, PurchaseOrder } from '../types';

interface PrintData {
  order: Order | PurchaseOrder;
  type: 'kitchen' | 'customer' | 'delivery' | 'purchaseOrder' | 'retailReceipt' | 'retailCounter' | 'retailCustomer';
  format?: 'a4' | '80mm' | '58mm';
}

interface PrintContextType {
  printData: PrintData | null;
  printComponentRef: React.RefObject<HTMLDivElement>;
  requestPrint: (data: PrintData) => void;
  clearPrintData: () => void;
}

const PrintContext = createContext<PrintContextType | null>(null);

export const usePrint = () => {
  const context = useContext(PrintContext);
  if (!context) {
    throw new Error('O comando usePrint deve ser usado dentro de um PrintProvider.');
  }
  return context;
};

interface PrintProviderProps {
  children: ReactNode;
}

export const PrintProvider: React.FC<PrintProviderProps> = ({ children }) => {
  const [printData, setPrintData] = useState<PrintData | null>(null);
  const printComponentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printComponentRef,
    onAfterPrint: () => {
      console.log('Impressão concluída');
      setPrintData(null);
    },
    onPrintError: (error) => {
      console.error("Erro de Impressão:", error);
      setPrintData(null);
    },
    documentTitle: printData ? `${printData.type}_${Date.now()}` : 'documento'
  });

  const requestPrint = useCallback((data: PrintData) => {
    console.log('Solicitação de impressão:', data);
    setPrintData(data);
    
    // Aguardar o componente renderizar antes de imprimir
    setTimeout(() => {
      if (printComponentRef.current) {
        console.log('Iniciando impressão...');
        handlePrint();
      } else {
        console.error('Componente de impressão não encontrado');
      }
    }, 500);
  }, [handlePrint]);

  const clearPrintData = () => {
    setPrintData(null);
  };

  const value = {
    printData,
    printComponentRef,
    requestPrint,
    clearPrintData,
  };

  return (
    <PrintContext.Provider value={value}>
      {children}
    </PrintContext.Provider>
  );
};