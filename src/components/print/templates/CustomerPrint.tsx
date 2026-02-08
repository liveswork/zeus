import React from 'react';
import { Order } from '../../../types';
import { formatCurrency, formatDateTime } from '../../../utils/formatters';
import { useAuth } from '../../../contexts/AuthContext';

interface CustomerPrintProps {
  order: Order;
  format?: 'a4' | '80mm' | '58mm';
}

export const CustomerPrint: React.FC<CustomerPrintProps> = ({ order, format = '80mm' }) => {
  const { userProfile } = useAuth();
  const date = formatDateTime(order.createdAt || new Date());

  // ✅ CORREÇÃO: Lógica para lidar com 'paymentDetails' sendo objeto ou array
  const payments = Array.isArray(order.paymentDetails)
    ? order.paymentDetails
    : (order.paymentDetails?.allPayments && Array.isArray(order.paymentDetails.allPayments))
      ? order.paymentDetails.allPayments
      : (order.paymentDetails?.method)
        ? [order.paymentDetails]
        : [];

  return (
    <div className={`print-container p-4 bg-white text-black font-mono print-${format}`}>
      <style type="text/css" media="print">{`
          @page { 
            size: ${format === 'a4' ? 'A4' : '80mm auto'}; 
            margin: ${format === 'a4' ? '1cm' : '0.2cm'}; 
          }
          body { -webkit-print-color-adjust: exact; }
          .print-container { margin: 0; padding: 0; }
          .print-a4 { font-size: 12pt; }
          .print-80mm { 
            font-family: 'Courier New', Courier, monospace; 
            width: 72mm; 
            font-size: 10pt; 
          }
          .print-58mm { 
            font-family: 'Courier New', Courier, monospace; 
            width: 54mm; 
            font-size: 9pt; 
          }
          .no-break { page-break-inside: avoid; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .border-dashed { border-style: dashed; }
          .mt-4 { margin-top: 1rem; }
          .mb-2 { margin-bottom: 0.5rem; }
          .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 0.25rem; text-align: left; }
          .text-right { text-align: right; }
        `}</style>

      <div className="header text-center mb-4 no-break">
        <h2 className="font-bold text-lg">{userProfile?.companyName || 'FoodPDV'}</h2>
        <p className="text-sm">COMPROVANTE DE VENDA</p>
        <p className="text-sm">Pedido: #{order.id?.substring(0, 8) || 'N/A'}</p>
        <p className="text-sm">Data: {date}</p>
        <div className="border-dashed border-b-2 border-black my-2"></div>
      </div>

      {order.customerName && (
        <div className="customer-info mb-4 no-break">
          <p><strong>Cliente:</strong> {order.customerName}</p>
          {order.customerPhone && (
            <p><strong>Telefone:</strong> {order.customerPhone}</p>
          )}
          {order.deliveryAddress && (
            <p><strong>Endereço:</strong> {order.deliveryAddress}</p>
          )}
          <div className="border-dashed border-b border-black my-2"></div>
        </div>
      )}

      <div className="items-table">
        <table>
          <thead>
            <tr className="border-dashed border-b border-black">
              <th className="text-left">QTD</th>
              <th className="text-left">Item</th>
              <th className="text-right">Valor</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, index) => (
              <React.Fragment key={index}>
                <tr>
                  <td className="py-1">{item.qty}x</td>
                  <td className="py-1">{item.name}</td>
                  <td className="py-1 text-right">{formatCurrency(item.salePrice)}</td>
                  <td className="py-1 text-right">{formatCurrency(item.salePrice * item.qty)}</td>
                </tr>
                {item.observation && (
                  <tr>
                    <td></td>
                    <td colSpan={3} className="py-1 text-sm italic" style={{ fontSize: '9pt', paddingLeft: '10px' }}>
                      ↳ obs: {item.observation}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="totals-section border-dashed border-t-2 border-black pt-2 mt-4 no-break">
        <div className="text-right space-y-1">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(order.totalAmount || 0)}</span>
          </div>
          {order.deliveryFee && order.deliveryFee > 0 && (
            <div className="flex justify-between">
              <span>Taxa Entrega:</span>
              <span>{formatCurrency(order.deliveryFee)}</span>
            </div>
          )}
          <div className="border-dashed border-t border-black pt-1 mt-2">
            <div className="flex justify-between font-bold text-lg">
              <span>TOTAL:</span>
              <span>{formatCurrency(order.finalAmount || order.totalAmount || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ CORREÇÃO: Utiliza a variável 'payments' que já foi tratada */}
      {payments && payments.length > 0 && (
        <div className="payment-section border-dashed border-t border-black pt-2 mt-4 no-break">
          <p className="font-bold mb-2">FORMA DE PAGAMENTO:</p>
          {payments.map((payment: { method: string; amountPaid: number; }, index: React.Key | null | undefined) => (
            <div key={index} className="flex justify-between text-sm">
              <span>{payment.method.toUpperCase()}:</span>
              <span>{formatCurrency(payment.amountPaid)}</span>
            </div>
          ))}
          {payments.some((p: { change: number; }) => p.change && p.change > 0) && (
            <div className="flex justify-between text-sm mt-1">
              <span>TROCO:</span>
              <span>{formatCurrency(payments.find((p: { change: any; }) => p.change)?.change || 0)}</span>
            </div>
          )}
        </div>
      )}

      <div className="footer text-center mt-4 no-break">
        <div className="border-dashed border-b border-black my-2"></div>
        <p className="text-sm">Obrigado pela preferencia!</p>
        <p className="text-sm">Volte sempre!</p>
        <p className="text-xs mt-2">FoodPDV - Sistema de Gestao</p>
      </div>
    </div>
  );
};