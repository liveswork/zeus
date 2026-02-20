// src/components/business/retail/modules/pdv/PdvPaymentModal.tsx

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CreditCard, DollarSign, Smartphone, PlusCircle, Trash2, User, Search } from 'lucide-react';
import { Modal } from '../../../../ui/Modal';
import { formatCurrency } from '../../../../../utils/formatters';

type PaymentMethod = 'dinheiro' | 'pix' | 'debito' | 'credito';

interface PdvPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;

  businessId: string;

  customers: any[];
  selectedCustomer: any | null;
  onSelectCustomer: (c: any | null) => void;

  items: any[];
  onUpdateItems: (items: any[]) => void;
  onRemoveItem: (itemId: string) => void;

  onConfirm: (payload: {
    payments: Array<{ method: string; amountPaid: number; change: number }>;
    discount: number;
    surcharge: number;
    finalAmount: number;
    items: any[];
  }) => void;
}

/* ------------------------ receipt component ------------------------ */
const Receipt = ({
  items,
  discount,
  surcharge,
  onRemoveItem,
}: {
  items: any[];
  discount: number;
  surcharge: number;
  onRemoveItem: (itemId: string) => void;
}) => {
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.salePrice * item.qty, 0), [items]);
  const total = useMemo(() => subtotal - discount + surcharge, [subtotal, discount, surcharge]);

  return (
    <div className="bg-yellow-50 p-6 rounded-lg h-full flex flex-col font-mono text-black border border-yellow-200">
      <h3 className="text-lg font-bold mb-4 text-center border-b-2 border-dashed border-gray-400 pb-2">
        RESUMO DA VENDA
      </h3>

      <div className="flex-grow overflow-y-auto space-y-2 text-sm pr-2">
        {items.map((item: any) => (
          <div key={item.id} className="flex justify-between items-center group">
            <span className="flex-1">
              {item.qty}x {item.name}
            </span>
            <span className="mr-4">{formatCurrency(item.salePrice * item.qty)}</span>

            <button
              type="button"
              onClick={() => onRemoveItem(item.id)}
              className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Remover item"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="border-t-2 border-dashed border-gray-400 pt-4 mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="font-semibold">Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-red-600">
            <span className="font-semibold">Desconto</span>
            <span>-{formatCurrency(discount)}</span>
          </div>
        )}

        {surcharge > 0 && (
          <div className="flex justify-between text-green-600">
            <span className="font-semibold">Acréscimo</span>
            <span>+{formatCurrency(surcharge)}</span>
          </div>
        )}

        <div className="flex justify-between font-bold text-xl pt-2 mt-2">
          <span>TOTAL</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
};

export const PdvPaymentModal: React.FC<PdvPaymentModalProps> = ({
  isOpen,
  onClose,

  customers,
  selectedCustomer,
  onSelectCustomer,

  items,
  onUpdateItems,
  onRemoveItem,

  onConfirm,
}) => {
  // itens “editáveis” dentro do modal
  const [currentItems, setCurrentItems] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState<PaymentMethod>('pix');
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState<number | string>('');
  const [discount, setDiscount] = useState(0);
  const [surcharge, setSurcharge] = useState(0);

  // cliente (busca)
  const [customerTerm, setCustomerTerm] = useState('');

  // ✅ evita resetar estado a cada re-render/prop update:
  const wasOpenRef = useRef(false);

  useEffect(() => {
    // Inicializa SOMENTE quando abre (transição false -> true)
    if (isOpen && !wasOpenRef.current) {
      setCurrentItems(items || []);
      setPayments([]);
      setCurrentPaymentMethod('pix');
      setCurrentPaymentAmount('');
      setDiscount(0);
      setSurcharge(0);
      setCustomerTerm('');
      wasOpenRef.current = true;
    }

    if (!isOpen) {
      wasOpenRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const filteredCustomers = useMemo(() => {
    if (!customerTerm.trim()) return customers.slice(0, 30);
    const t = customerTerm.trim().toLowerCase();
    const digits = t.replace(/\D/g, '');
    return customers
      .filter((c: any) => {
        const name = String(c?.name || '').toLowerCase();
        const phone = String(c?.phone || c?.phoneNumber || c?.mobile || c?.whatsapp || c?.customerPhone || '');
        const phoneDigits = phone.replace(/\D/g, '');
        return name.includes(t) || (digits && phoneDigits.includes(digits));
      })
      .slice(0, 30);
  }, [customers, customerTerm]);

  const currentSubtotal = useMemo(
    () => currentItems.reduce((sum, item) => sum + item.salePrice * item.qty, 0),
    [currentItems]
  );

  const totalDue = useMemo(
    () => Math.max(0, currentSubtotal - (Number(discount) || 0) + (Number(surcharge) || 0)),
    [currentSubtotal, discount, surcharge]
  );

  const totalPaid = useMemo(
    () => payments.reduce((sum: number, p: any) => sum + (Number(p.amountPaid) || 0), 0),
    [payments]
  );

  const remaining = useMemo(() => Math.max(0, totalDue - totalPaid), [totalDue, totalPaid]);
  const change = useMemo(() => Math.max(0, totalPaid - totalDue), [totalPaid, totalDue]);

  const isPaymentStarted = payments.length > 0;

  const paymentMethods = [
    { id: 'dinheiro', label: 'Dinheiro', icon: DollarSign },
    { id: 'pix', label: 'Pix', icon: Smartphone },
    { id: 'debito', label: 'Débito', icon: CreditCard },
    { id: 'credito', label: 'Crédito', icon: CreditCard },
  ];

  const handleRemoveItemLocal = (itemId: string) => {
    // ✅ remove no modal
    setCurrentItems((prev) => prev.filter((i) => i.id !== itemId));

    // ✅ mantém compat com integrações existentes (opcional)
    // Não causa loop porque NÃO temos mais useEffect "currentItems -> parent"
    const next = (currentItems || []).filter((i) => i.id !== itemId);
    onUpdateItems(next);

    // Mantém callback legado
    onRemoveItem(itemId);
  };

  const handleAddPayment = () => {
    const fallback = remaining > 0 ? remaining : 0;
    const amount = Number(currentPaymentAmount) || fallback;
    if (amount <= 0) return;

    const newPayment = {
      id: Date.now() + Math.random(),
      method: currentPaymentMethod,
      amountPaid: amount,
    };

    setPayments((prev: any[]) => [...prev, newPayment]);
    setCurrentPaymentAmount('');
  };

  const handleRemovePayment = (paymentId: number) => {
    setPayments((prev: any[]) => prev.filter((p: any) => p.id !== paymentId));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddPayment();
    }
  };

  const handleProcess = () => {
    if (currentItems.length === 0) {
      alert('Carrinho vazio.');
      return;
    }

    if (remaining > 0.01) {
      alert('Ainda falta pagar ' + formatCurrency(remaining));
      return;
    }

    // troco só se tiver dinheiro
    const hasCash = payments.some((p: any) => p.method === 'dinheiro');
    if (change > 0.01 && !hasCash) {
      alert('Há valor excedente, mas não existe pagamento em DINHEIRO para gerar troco.');
      return;
    }

    const normalizedPayments = (payments || [])
      .filter((p: any) => (Number(p.amountPaid) || 0) > 0)
      .map((p: any) => ({
        method: p.method,
        amountPaid: Number(p.amountPaid) || 0,
        change: 0,
      }));

    if (change > 0.01) {
      const idx = normalizedPayments.findIndex((p: any) => p.method === 'dinheiro');
      if (idx >= 0) normalizedPayments[idx].change = change;
    }

    onConfirm({
      payments: normalizedPayments,
      discount: Number(discount) || 0,
      surcharge: Number(surcharge) || 0,
      finalAmount: totalDue,
      items: currentItems,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Fechamento da Venda (PDV)" size="4xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[70vh]">
        {/* esquerda: recibo */}
        <Receipt
          items={currentItems}
          discount={discount}
          surcharge={surcharge}
          onRemoveItem={handleRemoveItemLocal}
        />

        {/* direita: cliente + pagamento */}
        <div className="flex flex-col">
          {/* Cliente */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <User size={18} /> Cliente
            </h3>

            <div className="mt-2 grid grid-cols-1 gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  value={customerTerm}
                  onChange={(e) => setCustomerTerm(e.target.value)}
                  placeholder="Buscar por nome ou telefone..."
                  className="w-full pl-9 pr-3 py-2.5 border rounded-lg"
                />
              </div>

              <div className="border rounded-lg overflow-hidden bg-white">
                <div className="max-h-40 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => onSelectCustomer(null)}
                    className={`w-full text-left px-3 py-2 text-sm font-semibold border-b hover:bg-gray-50 ${
                      !selectedCustomer ? 'bg-blue-50 text-blue-700' : ''
                    }`}
                  >
                    Cliente Balcão (Não identificado)
                  </button>

                  {filteredCustomers.map((c: any) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => onSelectCustomer(c)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                        selectedCustomer?.id === c.id ? 'bg-blue-50 text-blue-700 font-bold' : ''
                      }`}
                    >
                      {c.name || '(Sem nome)'}{' '}
                      <span className="text-xs text-gray-500 ml-2">
                        {String(c?.phone || c?.phoneNumber || c?.mobile || c?.whatsapp || c?.customerPhone || '')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* desconto/acréscimo */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="font-semibold text-sm">Desconto (R$)</label>
              <input
                type="number"
                value={discount || ''}
                onChange={(e) => setDiscount(Number(e.target.value))}
                placeholder="0,00"
                className="w-full p-3 border rounded-lg mt-1"
                disabled={isPaymentStarted}
              />
            </div>
            <div>
              <label className="font-semibold text-sm">Acréscimo (R$)</label>
              <input
                type="number"
                value={surcharge || ''}
                onChange={(e) => setSurcharge(Number(e.target.value))}
                placeholder="0,00"
                className="w-full p-3 border rounded-lg mt-1"
                disabled={isPaymentStarted}
              />
            </div>
          </div>

          {/* pagamentos */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-bold text-gray-800">Adicionar Pagamento (Misto)</h3>

            <div className="grid grid-cols-4 gap-2 my-4">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setCurrentPaymentMethod(method.id as PaymentMethod)}
                  className={`p-3 rounded-lg border-2 flex flex-col items-center justify-center transition ${
                    currentPaymentMethod === method.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-400'
                  }`}
                >
                  <method.icon size={20} />
                  <span className="text-xs font-semibold mt-1">{method.label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                value={currentPaymentAmount}
                onChange={(e) => setCurrentPaymentAmount(e.target.value)}
                placeholder={formatCurrency(remaining)}
                className="flex-grow w-full p-3 border rounded-lg"
                onKeyDown={handleKeyDown}
              />

              <button
                type="button"
                onClick={handleAddPayment}
                className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                title="Adicionar pagamento"
              >
                <PlusCircle size={20} />
              </button>
            </div>
          </div>

          {/* lista pagamentos */}
          <div className="flex-grow mt-4 pt-4 border-t overflow-y-auto">
            <h4 className="font-semibold mb-2">Pagamentos Efetuados</h4>

            {payments.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Nenhum pagamento adicionado.</p>
            ) : (
              <div className="space-y-2">
                {payments.map((p: any) => {
                  const Icon = paymentMethods.find((m) => m.id === p.method)?.icon || DollarSign;
                  return (
                    <div key={p.id} className="flex justify-between items-center bg-gray-100 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Icon size={16} />
                        <span className="font-semibold capitalize">{p.method}</span>
                      </div>

                      <span className="font-bold">{formatCurrency(p.amountPaid)}</span>

                      <button
                        type="button"
                        onClick={() => handleRemovePayment(p.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Remover pagamento"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* totalização */}
          <div className="flex-shrink-0 mt-auto pt-4 space-y-4">
            <div
              className={`p-4 rounded-lg text-center font-bold text-xl ${
                remaining > 0.01 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
              }`}
            >
              {remaining > 0.01
                ? `Falta Pagar: ${formatCurrency(remaining)}`
                : change > 0.01
                ? `Pagamento OK! Troco: ${formatCurrency(change)}`
                : 'Pagamento Concluído!'}
            </div>

            <button
              type="button"
              onClick={handleProcess}
              className="w-full bg-green-600 text-white font-bold py-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              disabled={remaining > 0.01}
            >
              Finalizar Venda
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PdvPaymentModal;