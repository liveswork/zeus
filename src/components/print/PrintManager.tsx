import React from 'react';
import { usePrint } from '../../contexts/PrintContext';
import { KitchenPrint } from './templates/KitchenPrint';
import { CustomerPrint } from './templates/CustomerPrint';
import { DeliveryPrint } from './templates/DeliveryPrint';
import { PurchaseOrderPrint } from './templates/PurchaseOrderPrint';

export const PrintManager: React.FC = () => {
  const { printData, printComponentRef } = usePrint();

  const renderPrintTemplate = () => {
    if (!printData) return null;

    console.log('Renderizando template de impressão:', printData.type);

    switch (printData.type) {
      case 'kitchen':
        return <KitchenPrint order={printData.order} format={printData.format} />;
      case 'customer':
        return <CustomerPrint order={printData.order} format={printData.format} />;
      case 'delivery':
        return <DeliveryPrint order={printData.order} format={printData.format} />;
      case 'purchaseOrder':
        return <PurchaseOrderPrint order={printData.order} format={printData.format} />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Componente visível para debug */}
      {printData && (
        <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <p className="text-sm">Preparando impressão: {printData.type}</p>
        </div>
      )}
      
      {/* Componente de impressão oculto */}
      <div style={{ display: 'none' }}>
        <div ref={printComponentRef}>
          {renderPrintTemplate()}
        </div>
      </div>
    </>
  );
};