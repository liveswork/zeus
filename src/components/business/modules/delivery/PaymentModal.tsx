import React, { useState } from 'react';
import { CreditCard, DollarSign, Smartphone, Gift, Calculator } from 'lucide-react';
import { Modal } from '../../../ui/Modal';
import { FormField } from '../../../ui/FormField';
import { useUI } from '../../../../contexts/UIContext';
import { formatCurrency } from '../../../../utils/formatters';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: any;
  onPaymentProcessed: (paymentData: any[]) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  orderData,
  onPaymentProcessed
}) => {
  const { showAlert } = useUI();
  
  const [payments, setPayments] = useState([
    {
      method: 'dinheiro',
      amountPaid: orderData.finalAmount,
      change: 0
    }
  ]);

  const paymentMethods = [
    { id: 'dinheiro', label: 'Dinheiro', icon: DollarSign, color: 'bg-green-500' },
    { id: 'cartao', label: 'Cartão', icon: CreditCard, color: 'bg-blue-500' },
    { id: 'pix', label: 'PIX', icon: Smartphone, color: 'bg-purple-500' },
    { id: 'voucher', label: 'Voucher', icon: Gift, color: 'bg-orange-500' }
  ];

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amountPaid, 0);
  const remaining = orderData.finalAmount - totalPaid;

  const updatePayment = (index: number, field: string, value: number) => {
    setPayments(prev => prev.map((payment, i) => {
      if (i === index) {
        const updated = { ...payment, [field]: value };
        
        // Calcular troco automaticamente para dinheiro
        if (field === 'amountPaid' && payment.method === 'dinheiro') {
          updated.change = Math.max(0, value - orderData.finalAmount);
        }
        
        return updated;
      }
      return payment;
    }));
  };

  const updatePaymentMethod = (index: number, method: string) => {
    setPayments(prev => prev.map((payment, i) => {
      if (i === index) {
        return {
          ...payment,
          method,
          change: method === 'dinheiro' ? Math.max(0, payment.amountPaid - orderData.finalAmount) : 0
        };
      }
      return payment;
    }));
  };

  const addPaymentMethod = () => {
    if (remaining > 0) {
      setPayments(prev => [
        ...prev,
        {
          method: 'dinheiro',
          amountPaid: remaining,
          change: 0
        }
      ]);
    }
  };

  const removePaymentMethod = (index: number) => {
    if (payments.length > 1) {
      setPayments(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleProcessPayment = () => {

    handleProcessPayment
    
    if (Math.abs(remaining) > 0.01) { // Tolerância para arredondamento
      showAlert('O valor total pago deve ser igual ao valor do pedido', 'error');
      return;
    }

    // Validar se todos os pagamentos têm valores válidos
    const hasInvalidPayment = payments.some(p => p.amountPaid <= 0);
    if (hasInvalidPayment) {
      showAlert('Todos os pagamentos devem ter valores válidos', 'error');
      return;
    }

    onPaymentProcessed(payments);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Formas de Pagamento" 
      size="lg"
    >
      <div className="space-y-6">
        {/* Resumo do Pedido */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">Resumo do Pedido</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(orderData.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Taxa de Entrega:</span>
              <span>{formatCurrency(orderData.deliveryFee)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-1">
              <span>Total a Pagar:</span>
              <span>{formatCurrency(orderData.finalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Formas de Pagamento */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Formas de Pagamento</h3>
            {remaining > 0.01 && (
              <button
                onClick={addPaymentMethod}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition"
              >
                + Adicionar
              </button>
            )}
          </div>

          {payments.map((payment, index) => {
            const methodInfo = paymentMethods.find(m => m.id === payment.method);
            const Icon = methodInfo?.icon || DollarSign;

            return (
              <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-gray-700">Pagamento {index + 1}</h4>
                  {payments.length > 1 && (
                    <button
                      onClick={() => removePaymentMethod(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remover
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Forma de Pagamento">
                    <div className="grid grid-cols-2 gap-2">
                      {paymentMethods.map(method => {
                        const MethodIcon = method.icon;
                        return (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => updatePaymentMethod(index, method.id)}
                            className={`p-3 rounded-lg border-2 transition flex flex-col items-center gap-1 ${
                              payment.method === method.id
                                ? `${method.color} text-white border-transparent`
                                : 'bg-white hover:bg-gray-50 border-gray-200'
                            }`}
                          >
                            <MethodIcon size={20} />
                            <span className="text-xs font-medium">{method.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </FormField>

                  <FormField label="Valor Pago (R$)">
                    <input
                      type="number"
                      step="0.01"
                      value={payment.amountPaid}
                      onChange={(e) => updatePayment(index, 'amountPaid', parseFloat(e.target.value) || 0)}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </FormField>

                  {payment.method === 'dinheiro' && payment.change > 0 && (
                    <div className="md:col-span-2">
                      <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                        <div className="flex items-center gap-2 text-yellow-800">
                          <Calculator size={16} />
                          <span className="font-medium">
                            Troco: {formatCurrency(payment.change)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Status do Pagamento */}
        <div className={`p-4 rounded-lg border ${
          Math.abs(remaining) < 0.01 
            ? 'bg-green-50 border-green-200' 
            : remaining > 0 
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex justify-between items-center">
            <span className="font-medium">
              {Math.abs(remaining) < 0.01 
                ? 'Pagamento Completo' 
                : remaining > 0 
                  ? 'Falta Pagar'
                  : 'Valor Excedente'
              }
            </span>
            <span className={`font-bold text-lg ${
              Math.abs(remaining) < 0.01 
                ? 'text-green-600' 
                : remaining > 0 
                  ? 'text-yellow-600'
                  : 'text-red-600'
            }`}>
              {Math.abs(remaining) < 0.01 ? '✓' : formatCurrency(Math.abs(remaining))}
            </span>
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Total Pago: {formatCurrency(totalPaid)} / {formatCurrency(orderData.finalAmount)}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleProcessPayment}
            disabled={Math.abs(remaining) > 0.01}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-medium"
          >
            Finalizar Pedido
          </button>
        </div>
      </div>
    </Modal>
  );
};