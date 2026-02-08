import React from 'react';
import { PurchaseOrder, Supply } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';
import { useBusiness } from '../../../contexts/BusinessContext';

interface PurchaseOrderPrintProps {
  order: PurchaseOrder;
  format?: 'a4' | '80mm' | '58mm';
}

export const PurchaseOrderPrint: React.FC<PurchaseOrderPrintProps> = ({ order, format = 'a4' }) => {
  const { supplies } = useBusiness();

  return (
    <div className={`print-container p-4 bg-white text-black font-sans print-${format}`}>
      <style type="text/css" media="print">
        {`
          @page { 
            size: ${format === 'a4' ? 'A4' : '80mm auto'}; 
            margin: ${format === 'a4' ? '1cm' : '0.5cm'}; 
          }
          body { -webkit-print-color-adjust: exact; }
          .print-container { margin: 0; padding: 0; }
          .print-a4 { font-size: 12pt; }
          .print-80mm { 
            font-family: 'Courier New', Courier, monospace; 
            width: 80mm; 
            font-size: 10pt; 
          }
          .print-58mm { 
            font-family: 'Courier New', Courier, monospace; 
            width: 58mm; 
            font-size: 9pt; 
          }
          .no-break { page-break-inside: avoid; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 0.5rem; border-bottom: 1px solid #000; }
        `}
      </style>

      <div className="header text-center mb-4 no-break">
        <h2 className="text-2xl font-bold">ORÇAMENTO DE COMPRA</h2>
        <p className="text-sm">Data do Pedido: {new Date(order.createdAt).toLocaleDateString('pt-BR')}</p>
      </div>

      <div className="supplier-info border-t border-b border-black py-2 my-2 no-break">
        <p><strong>Fornecedor:</strong> {order.supplierName}</p>
      </div>

      <div className="items-table my-4">
        <table>
          <thead>
            <tr>
              <th className="text-left">Item</th>
              <th className="text-center">Qtd</th>
              <th className="text-right">Custo Unit.</th>
              <th className="text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => {
              const supply = supplies.find(s => s.id === item.supplyId);
              return (
                <tr key={index}>
                  <td>{supply?.name || item._productName || 'N/A'}</td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-right">{formatCurrency(item.unitCost)}</td>
                  <td className="text-right">{formatCurrency(item.unitCost * item.quantity)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="total-section border-t border-black pt-2 mt-4 text-right no-break">
        <p className="font-bold text-lg">TOTAL ESTIMADO: {formatCurrency(order.totalAmount)}</p>
      </div>

      {order.notes && (
        <div className="notes-section border-t border-dashed border-black pt-2 mt-2 no-break">
          <p><strong>Observações:</strong> {order.notes}</p>
        </div>
      )}
    </div>
  );
};