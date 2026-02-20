import React from 'react';
import { Order } from '../../../types';
import { formatCurrency, formatDateTime } from '../../../utils/formatters';
import { useAuth } from '../../../contexts/AuthContext';

interface RetailCounterPrintProps {
  order: Order;
  format?: 'a4' | '80mm' | '58mm';
}

function normalizePayments(order: any) {
  if (Array.isArray(order.paymentDetails)) return order.paymentDetails;
  if (order.paymentDetails?.allPayments && Array.isArray(order.paymentDetails.allPayments)) return order.paymentDetails.allPayments;
  if (order.paymentDetails?.method) return [order.paymentDetails];
  return [];
}

export const RetailCounterPrint: React.FC<RetailCounterPrintProps> = ({ order, format = '80mm' }) => {
  const { userProfile } = useAuth();
  const date = formatDateTime(order.createdAt || new Date());
  const payments = normalizePayments(order);

  const total = Number(order.finalAmount || order.totalAmount || 0);
  const itemsCount = (order.items || []).reduce((acc: number, it: any) => acc + (Number(it.qty) || 0), 0);

  return (
    <div className={`print-container p-3 bg-white text-black font-mono print-${format}`}>
      <style type="text/css" media="print">{`
        @page { 
          size: ${format === 'a4' ? 'A4' : (format === '58mm' ? '58mm auto' : '80mm auto')}; 
          margin: ${format === 'a4' ? '1cm' : '0.2cm'}; 
        }
        body { -webkit-print-color-adjust: exact; }
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

      <div className="center">
        <div className="bold">{userProfile?.companyName || 'Loja'}</div>
        <div className="bold">VIA DO CAIXA</div>
        <div style={{ fontSize: '9pt' }}>Venda: #{String(order.orderNumber || order.id || '').toString().slice(-8)}</div>
        <div style={{ fontSize: '9pt' }}>{date}</div>
      </div>

      <div className="dash" />

      <div style={{ fontSize: '9pt' }}>
        <div><span className="bold">Itens:</span> {itemsCount}</div>
        {order.customerName ? <div><span className="bold">Cliente:</span> {order.customerName}</div> : <div><span className="bold">Cliente:</span> Não identificado</div>}
      </div>

      <div className="dash" />

      <table>
        <tbody>
          {(order.items || []).map((item: any, idx: number) => (
            <tr key={idx}>
              <td style={{ width: '10%' }}>{item.qty}x</td>
              <td style={{ width: '55%' }}>{item.name}</td>
              <td className="right" style={{ width: '35%' }}>
                {formatCurrency(Number(item.salePrice || 0) * Number(item.qty || 0))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="dash" />

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span className="bold">TOTAL</span>
        <span className="bold">{formatCurrency(total)}</span>
      </div>

      {payments.length > 0 && (
        <>
          <div className="dash" />
          <div className="bold" style={{ fontSize: '9pt' }}>PAGAMENTOS</div>
          {payments.map((p: any, i: number) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9pt' }}>
              <span>{String(p.method || 'dinheiro').toUpperCase()}</span>
              <span>{formatCurrency(Number(p.amountPaid || 0))}</span>
            </div>
          ))}
        </>
      )}

      <div className="dash" />
      <div className="center" style={{ fontSize: '8pt' }}>
        Conferência interna • {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};