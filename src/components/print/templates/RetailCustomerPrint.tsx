import React from 'react';
import { Order } from '../../../types';
import { formatCurrency, formatDateTime } from '../../../utils/formatters';
import { useAuth } from '../../../contexts/AuthContext';

function resolvePrintDate(v: any): Date {
  if (!v) return new Date();

  // Date nativo
  if (v instanceof Date) return v;

  // Firestore Timestamp (web v9) geralmente tem toDate()
  if (typeof v?.toDate === 'function') return v.toDate();

  // Timestamp “plain” { seconds, nanoseconds }
  if (typeof v?.seconds === 'number') return new Date(v.seconds * 1000);

  // string / number
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v);
    return isNaN(d.getTime()) ? new Date() : d;
  }

  // fallback
  return new Date();
}

interface RetailCustomerPrintProps {
  order: Order;
  format?: 'a4' | '80mm' | '58mm';
}

export const RetailCustomerPrint: React.FC<RetailCustomerPrintProps> = ({
  order,
  format = '80mm'
}) => {
  const { userProfile } = useAuth();
  const date = formatDateTime(
  resolvePrintDate((order as any).finishedAt ?? (order as any).createdAt)
);

  // pagamentos mistos
  const payments = Array.isArray(order.paymentDetails)
    ? order.paymentDetails
    : [];

  return (
    <div className={`print-container bg-white text-black font-mono print-${format}`}>
      <style type="text/css" media="print">{`
  /* Força cupom SEMPRE em pé: largura fixa (80/58) + altura grande (corte no fim) */
  @page {
    size: ${
      format === 'a4'
        ? 'A4 portrait'
        : (format === '58mm' ? '58mm 300mm' : '80mm 300mm')
    };
    margin: ${format === 'a4' ? '1cm' : '0.2cm'};
  }

  html, body {
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* largura do conteúdo compatível com margem (se quiser, pode usar 58/80 direto também) */
  .print-80mm { width: 72mm; font-size: 10pt; }
  .print-58mm { width: 54mm; font-size: 9pt; }
  .print-a4 { font-size: 12pt; }

  .dash { border-top: 2px dashed #000; margin: 8px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 2px 0; vertical-align: top; }
  .right { text-align: right; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
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
