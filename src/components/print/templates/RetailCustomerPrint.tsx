import React from 'react';
import { Order } from '../../../types';
import { formatCurrency, formatDateTime } from '../../../utils/formatters';
import { useAuth } from '../../../contexts/AuthContext';

interface RetailCustomerPrintProps {
  order: Order;
  format?: 'a4' | '80mm' | '58mm';
}

export const RetailCustomerPrint: React.FC<RetailCustomerPrintProps> = ({
  order,
  format = '80mm'
}) => {
  const { userProfile } = useAuth();
  const date = formatDateTime(order.createdAt || new Date());

  // pagamentos mistos
  const payments = Array.isArray(order.paymentDetails)
    ? order.paymentDetails
    : [];

  return (
    <div className={`print-container p-4 bg-white text-black font-mono print-${format}`}>
      <style type="text/css" media="print">{`
        @page { size: ${format === 'a4' ? 'A4' : '80mm auto'}; margin: 0.2cm; }
        body { -webkit-print-color-adjust: exact; }
        .print-80mm { width: 72mm; font-size: 10pt; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 2px; }
      `}</style>

      {/* CABEÇALHO */}
      <div className="text-center mb-3">
        <h2 className="font-bold">{userProfile?.companyName || 'PDV'}</h2>
        <p>COMPROVANTE DE VENDA</p>
        <p>Venda #{order.id?.slice(-6)}</p>
        <p>{date}</p>
        <div className="border-dashed border-b border-black my-2"></div>
      </div>

      {/* CLIENTE */}
      <div className="mb-2">
        <p><strong>Cliente:</strong> {order.customerName || 'Balcão'}</p>
      </div>

      {/* ITENS */}
      <table>
        <thead>
          <tr className="border-b border-black">
            <th>QTD</th>
            <th>ITEM</th>
            <th className="text-right">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {order.items?.map((item, i) => (
            <tr key={i}>
              <td>{item.qty}x</td>
              <td>{item.name}</td>
              <td className="text-right">
                {formatCurrency(item.salePrice * item.qty)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* TOTAL */}
      <div className="border-t border-black mt-2 pt-2 text-right">
        <p className="font-bold text-lg">
          TOTAL: {formatCurrency(order.finalAmount || order.totalAmount)}
        </p>
      </div>

      {/* PAGAMENTOS */}
      {payments.length > 0 && (
        <div className="mt-3">
          <p className="font-bold">PAGAMENTOS</p>

          {payments.map((p, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span>{p.method.toUpperCase()}</span>
              <span>{formatCurrency(p.amountPaid)}</span>
            </div>
          ))}

          {payments.some(p => p.change > 0) && (
            <div className="flex justify-between text-sm">
              <span>TROCO:</span>
              <span>
                {formatCurrency(payments.find(p => p.change > 0)?.change || 0)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* RODAPÉ */}
      <div className="text-center mt-4">
        <p>Obrigado pela preferência!</p>
      </div>
    </div>
  );
};
