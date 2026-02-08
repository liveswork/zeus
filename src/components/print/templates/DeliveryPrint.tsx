import React from 'react';
import { Order } from '../../../types';
import { formatCurrency, formatDateTime, formatPhoneNumber } from '../../../utils/formatters';
import { useAuth } from '../../../contexts/AuthContext';
import { User, Phone, MapPin, DollarSign, Edit2, Clock } from 'lucide-react';

interface DeliveryPrintProps {
  order: Order;
  format?: 'a4' | '80mm' | '58mm';
}

export const DeliveryPrint: React.FC<DeliveryPrintProps> = ({ order, format = '80mm' }) => {
  const { userProfile } = useAuth();
  const date = formatDateTime(order.createdAt || new Date());

  const addressDetails = order.addressDetails || {};

  const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
      <div className="section-container mt-3 pt-3 border-t-2 border-dashed border-black">
        <h3 className="text-center font-bold text-lg mb-2">{title}</h3>
        {children}
      </div>
    );

  // ✅ CORREÇÃO: Lógica para lidar com 'paymentDetails' sendo objeto ou array
  const payments = Array.isArray(order.paymentDetails)
    ? order.paymentDetails
    : (order.paymentDetails?.allPayments && Array.isArray(order.paymentDetails.allPayments))
      ? order.paymentDetails.allPayments
      : (order.paymentDetails?.method)
        ? [order.paymentDetails]
        : [];


  return (
    <div className={`print-container bg-white text-black print-${format} font-sans`}>
      <style type="text/css" media="print">{`
          body { -webkit-print-color-adjust: exact; }
          .print-80mm { 
            width: 72mm; 
            font-size: 10pt;
            line-height: 1.4;
            padding-left: 3mm;
            padding-right: 3mm;
            box-sizing: border-box;
          }
          .print-58mm { 
            width: 54mm; 
            font-size: 10pt;
            line-height: 1.4;
            padding-left: 2mm;
            padding-right: 2mm;
            box-sizing: border-box;
          }
      `}</style>

      <div className="text-center mb-3">
        <h2 className="text-xl font-bold">{userProfile?.companyName || 'FoodPDV'}</h2>
        <p className="text-base">*** VIA DO ENTREGADOR ***</p>
      </div>

      <div className="text-center bg-black text-white font-bold text-3xl py-2 my-2">
        PEDIDO #{order.orderNumber || 'N/A'}
      </div>
      <p className="text-center text-sm mb-3">{date}</p>

      <Section title="CLIENTE">
        <div className="space-y-2 text-lg">
          <p className="font-bold">{order.customerName || 'Cliente'}</p>
          <p className="font-bold">{formatPhoneNumber(order.customerPhone || '')}</p>
        </div>
      </Section>

      <Section title="ENTREGA">
        <div className="space-y-2 text-lg">
          <p className="font-bold">{addressDetails?.street || 'Endereço não informado'}</p>
          <p className="font-bold">Nº: {addressDetails?.number || 'S/N'}</p>
          {addressDetails?.neighborhood && (
            <p><strong>BAIRRO:</strong> {addressDetails.neighborhood}</p>
          )}
          {addressDetails?.reference && (
            <p><strong>REFERÊNCIA:</strong> {addressDetails.reference}</p>
          )}
          {addressDetails?.complement && (
            <p><strong>COMPLEMENTO:</strong> {addressDetails.complement}</p>
          )}

        </div>
      </Section>

      <Section title="ITENS">
        <table className="w-full font-mono text-base">
          <tbody>
            {order.items?.map((item, index) => (
              <tr key={index}>
                <td className="py-1 align-top">{item.qty}x</td>
                <td className="py-1">{item.name}</td>
                <td className="py-1 text-right">{formatCurrency(item.salePrice * item.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="VALORES">
        <div className="space-y-2 text-base">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(order.totalAmount || 0)}</span>
          </div>
          {order.deliveryFee && order.deliveryFee > 0 && (
            <div className="flex justify-between">
              <span>Taxa de Entrega:</span>
              <span>{formatCurrency(order.deliveryFee)}</span>
            </div>
          )}
        </div>
      </Section>

      <div className="mt-3 pt-3 border-t-2 border-dashed border-black">
        {/* ✅ CORREÇÃO: Utiliza a variável 'payments' que já foi tratada */}
        {payments.map((payment: { method: string; amountPaid: number; change: any; }, index: React.Key | null | undefined) => {
          const needsChange = payment.method === 'dinheiro' && payment.amountPaid > (order.finalAmount || order.totalAmount);
          return (
            <div key={index} className="bg-black text-white p-3">
              <div className="flex justify-between text-lg">
                <span className="font-bold">TOTAL:</span>
                <span className="font-bold">{formatCurrency(order.finalAmount || order.totalAmount || 0)}</span>
              </div>
              <div className="mt-2 text-base">
                <p>Forma: {payment.method.toUpperCase()}</p>
                {needsChange && (
                  <>
                    <p>Valor a cobrar: {formatCurrency(payment.amountPaid)}</p>
                    <p className="font-bold text-yellow-300">TROCO: {formatCurrency(payment.change || 0)}</p>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Section title="INSTRUÇÕES">
        <p className="text-base">1. Conferir itens e máquina de cartão.</p>
        <p className="text-base">2. Ligar para o cliente ao chegar.</p>
        {payments.some((p: { method: string; }) => p.method === 'dinheiro') && (
          <p className="font-bold text-lg">3. RECEBER DINHEIRO NO LOCAL.</p>
        )}
      </Section>

    </div>
  );
};