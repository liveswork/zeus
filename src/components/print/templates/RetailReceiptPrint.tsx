import React from 'react';
import { Order } from '../../../types';
import { formatCurrency, formatDateTime } from '../../../utils/formatters';
import { useAuth } from '../../../contexts/AuthContext';

interface RetailReceiptPrintProps {
  order: Order;
  format?: 'a4' | '80mm' | '58mm';
}

function normalizePayments(order: any) {
  // compat com seu CustomerPrint
  if (Array.isArray(order.paymentDetails)) return order.paymentDetails;
  if (order.paymentDetails?.allPayments && Array.isArray(order.paymentDetails.allPayments)) return order.paymentDetails.allPayments;
  if (order.paymentDetails?.method) return [order.paymentDetails];
  return [];
}

export const RetailReceiptPrint: React.FC<RetailReceiptPrintProps> = ({ order, format = '80mm' }) => {
  const { userProfile } = useAuth();
  const date = formatDateTime(order.createdAt || new Date());
  const payments = normalizePayments(order);

  const subtotal = Number(order.totalAmount || 0);
  const total = Number(order.finalAmount || order.totalAmount || 0);

  const change = payments.find((p: any) => typeof p.change === 'number' && p.change > 0)?.change ?? 0;

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
        <div className="bold" style={{ fontSize: format === 'a4' ? '16pt' : '12pt' }}>
          {userProfile?.companyName || 'Loja'}
        </div>
        <div style={{ fontSize: '9pt' }}>COMPROVANTE DE VENDA</div>
        <div style={{ fontSize: '9pt' }}>Venda: #{String(order.orderNumber || order.id || '').toString().slice(-8)}</div>
        <div style={{ fontSize: '9pt' }}>{date}</div>
      </div>

      <div className="dash" />

      {order.customerName && (
        <>
          <div style={{ fontSize: '9pt' }}>
            <span className="bold">Cliente:</span> {order.customerName}
          </div>
          {order.customerPhone && (
            <div style={{ fontSize: '9pt' }}>
              <span className="bold">Telefone:</span> {order.customerPhone}
            </div>
          )}
          <div className="dash" />
        </>
      )}

      <table>
        <tbody>
          {(order.items || []).map((item: any, idx: number) => (
            <React.Fragment key={idx}>
              <tr>
                <td style={{ width: '10%' }}>{item.qty}x</td>
                <td style={{ width: '60%' }}>{item.name}</td>
                <td className="right" style={{ width: '30%' }}>
                  {formatCurrency(Number(item.salePrice || 0) * Number(item.qty || 0))}
                </td>
              </tr>
              {item.observation ? (
                <tr>
                  <td></td>
                  <td colSpan={2} style={{ fontSize: '8pt' }}>↳ obs: {item.observation}</td>
                </tr>
              ) : null}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      <div className="dash" />

      <table>
        <tbody>
          <tr>
            <td className="bold">Subtotal</td>
            <td className="right">{formatCurrency(subtotal)}</td>
          </tr>
          <tr>
            <td className="bold" style={{ fontSize: format === 'a4' ? '14pt' : '12pt' }}>TOTAL</td>
            <td className="right bold" style={{ fontSize: format === 'a4' ? '14pt' : '12pt' }}>
              {formatCurrency(total)}
            </td>
          </tr>
        </tbody>
      </table>

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
          {change > 0 ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9pt' }}>
              <span className="bold">TROCO</span>
              <span className="bold">{formatCurrency(Number(change))}</span>
            </div>
          ) : null}
        </>
      )}

      <div className="dash" />
      <div className="center" style={{ fontSize: '9pt' }}>
        Obrigado pela preferência!
      </div>
      <div className="center" style={{ fontSize: '8pt' }}>
        Impresso em: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};