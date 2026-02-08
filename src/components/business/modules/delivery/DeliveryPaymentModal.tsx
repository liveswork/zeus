import React, { useState, useEffect, useMemo } from 'react';
import { CreditCard, DollarSign, Smartphone, PlusCircle, Trash2 } from 'lucide-react';
import { Modal } from '../../../ui/Modal';
import { formatCurrency } from '../../../../utils/formatters';

interface DeliveryPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: any;
  onPaymentProcessed: (paymentData: any, updatedOrderData: any) => void;
}

// Sub-componente para o Recibo Amarelo
const OrderReceipt = ({ items, orderData, discount, surcharge, onRemoveItem }: { items: any[], orderData: any, discount: number, surcharge: number, onRemoveItem: (itemId: string) => void }) => {
    const subtotal = useMemo(() => items.reduce((sum, item) => sum + (item.salePrice * item.qty), 0), [items]);
    const finalTotal = subtotal + orderData.deliveryFee - discount + surcharge;
    
    return (
        <div className="bg-yellow-50 p-6 rounded-lg h-full flex flex-col font-mono text-black border border-yellow-200">
            <h3 className="text-lg font-bold mb-4 text-center border-b-2 border-dashed border-gray-400 pb-2">RESUMO DO PEDIDO</h3>
            <div className="flex-grow overflow-y-auto space-y-2 text-sm pr-2">
                {items.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center group">
                        <span className="flex-1">{item.qty}x {item.name}</span>
                        <span className="mr-4">{formatCurrency(item.salePrice * item.qty)}</span>
                        {/* ✅ Botão de exclusão aparece ao passar o mouse */}
                        <button onClick={() => onRemoveItem(item.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
            <div className="border-t-2 border-dashed border-gray-400 pt-4 mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="font-semibold">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                <div className="flex justify-between"><span className="font-semibold">Entrega</span><span>{formatCurrency(orderData.deliveryFee)}</span></div>
                {discount > 0 && <div className="flex justify-between text-red-600"><span className="font-semibold">Desconto</span><span>-{formatCurrency(discount)}</span></div>}
                {surcharge > 0 && <div className="flex justify-between text-green-600"><span className="font-semibold">Acréscimo</span><span>+{formatCurrency(surcharge)}</span></div>}
                <div className="flex justify-between font-bold text-xl pt-2 mt-2"><span >TOTAL</span><span>{formatCurrency(finalTotal)}</span></div>
            </div>
        </div>
    );
};

export const DeliveryPaymentModal: React.FC<DeliveryPaymentModalProps> = ({ isOpen, onClose, orderData, onPaymentProcessed }) => {
    // ✅ Estado local para gerenciar os itens do pedido de forma editável
    const [currentItems, setCurrentItems] = useState<any[]>([]);
    // Estados para o novo fluxo
    const [payments, setPayments] = useState<any[]>([]);
    const [currentPaymentMethod, setCurrentPaymentMethod] = useState('dinheiro');
    const [currentPaymentAmount, setCurrentPaymentAmount] = useState<number | string>('');
    const [discount, setDiscount] = useState(0);
    const [surcharge, setSurcharge] = useState(0);

    // ✅ Recalcula os totais com base nos itens atuais
    const currentSubtotal = useMemo(() => currentItems.reduce((sum, item) => sum + (item.salePrice * item.qty), 0), [currentItems]);
    const totalDue = useMemo(() => currentSubtotal + orderData.deliveryFee - discount + surcharge, [currentSubtotal, orderData.deliveryFee, discount, surcharge]);
    const totalPaid = useMemo(() => payments.reduce((sum, p) => sum + p.amountPaid, 0), [payments]);
    const remainingAmount = useMemo(() => Math.max(0, totalDue - totalPaid), [totalDue, totalPaid]);
    
    // Verifica se o pagamento foi iniciado, Condição para desabilitar campos
    const isPaymentStarted = payments.length > 0;

    useEffect(() => {
        if (isOpen) {
            // Inicializa o estado local com os itens do pedido original
            setCurrentItems(orderData?.items || []);
            setPayments([]);
            setCurrentPaymentMethod('dinheiro');
            setCurrentPaymentAmount('');
            setDiscount(0);
            setSurcharge(0);
        }
    }, [isOpen, orderData]);

    // ✅ Nova função para remover um item do pedido
    const handleRemoveItem = (itemId: string) => {
        setCurrentItems(prev => prev.filter(item => item.id !== itemId));
    };

    // ✅ Nova função para adicionar um pagamento
    const handleAddPayment = () => {
        const amount = Number(currentPaymentAmount) || remainingAmount;
        if (amount <= 0) return;

        const newPayment = { 
            method: currentPaymentMethod, 
            amountPaid: amount, 
            // Combina o tempo atual com um número aleatório para garantir unicidade
            id: Date.now() + Math.random() 
        };

        setPayments(prev => [...prev, newPayment]);
        setCurrentPaymentAmount(''); // Limpa o input
    };

    // ✅ NOVA FUNÇÃO: Lógica para remover um pagamento
    const handleRemovePayment = (paymentId: number) => {
        setPayments(prev => prev.filter(p => p.id !== paymentId));
    };
    
    const handleProcessPayment = () => {
  if (remainingAmount > 0.01) {
    alert('Ainda falta pagar ' + formatCurrency(remainingAmount));
    return;
  }

  // ✅ CORREÇÃO: Converter array de pagamentos para o formato esperado
  const primaryPayment = payments[0]; // Pega o primeiro método de pagamento
  const paymentDetails = {
    method: primaryPayment?.method || 'dinheiro',
    // Se for dinheiro e houver troco, calcular needChange e changeFor
    needChange: primaryPayment?.method === 'dinheiro' && totalPaid > totalDue,
    changeFor: primaryPayment?.method === 'dinheiro' && totalPaid > totalDue ? totalPaid - totalDue : 0,
    // Mantém o array completo para referência se necessário
    allPayments: payments
  };

  const updatedOrderData = {
    ...orderData,
    items: currentItems,
    totalAmount: currentSubtotal,
    finalAmount: totalDue,
  };

  // ✅ CORREÇÃO: Envia paymentDetails no formato correto
  onPaymentProcessed(paymentDetails, updatedOrderData);
};

    // ✅ MELHORIA 2: Função para adicionar pagamento com a tecla Enter
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Impede o comportamento padrão do Enter
            handleAddPayment();
        }
    };

    const paymentMethods = [
        { id: 'dinheiro', label: 'Dinheiro', icon: DollarSign },
        { id: 'pix', label: 'Pix', icon: Smartphone },
        { id: 'debito', label: 'Débito', icon: CreditCard },
        { id: 'credito', label: 'Crédito', icon: CreditCard },
    ];
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Fechamento de Pedido Delivery" size="4xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[70vh]">
                {/* Coluna Esquerda: Recibo */}
                <OrderReceipt 
                    items={currentItems}
                    orderData={orderData} 
                    discount={discount} 
                    surcharge={surcharge}
                    onRemoveItem={handleRemoveItem}
                />
                
                {/* Coluna Direita: Pagamento */}
                <div className="flex flex-col">
                    {/* Descontos e Acréscimos */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="font-semibold text-sm">Desconto (R$)</label>
                            <input 
                                type="number" 
                                value={discount || ''} 
                                onChange={e => setDiscount(Number(e.target.value))} 
                                placeholder="0,00" className="w-full p-3 border rounded-lg mt-1" 
                                disabled={isPaymentStarted}
                            />
                        </div>
                        <div>
                            <label className="font-semibold text-sm">Acréscimo (R$)</label>
                            <input 
                                type="number" 
                                value={surcharge || ''} 
                                onChange={e => setSurcharge(Number(e.target.value))} 
                                placeholder="0,00" className="w-full p-3 border rounded-lg mt-1" 
                                disabled={isPaymentStarted}
                            />
                        </div>
                    </div>

                    {/* Pagamento */}
                    <div className="border-t pt-4">
                        <h3 className="text-lg font-bold text-gray-800">Adicionar Pagamento</h3>
                        <div className="grid grid-cols-4 gap-2 my-4">
                            {paymentMethods.map(method => (
                                <button key={method.id} onClick={() => setCurrentPaymentMethod(method.id)} className={`p-3 rounded-lg border-2 flex flex-col items-center justify-center transition ${currentPaymentMethod === method.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white hover:border-gray-400'}`}>
                                    <method.icon size={20} />
                                    <span className="text-xs font-semibold mt-1">{method.label}</span>
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <input 
                                type="number" 
                                value={currentPaymentAmount} 
                                onChange={e => setCurrentPaymentAmount(e.target.value)} 
                                placeholder={formatCurrency(remainingAmount)} 
                                className="flex-grow w-full p-3 border rounded-lg" 
                                onKeyDown={handleKeyDown}
                            />

                            <button onClick={handleAddPayment} className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                <PlusCircle size={20} />
                            </button>
                        </div>
                    </div>
                    
                    {/* Grid de Pagamentos Adicionados */}
                    <div className="flex-grow mt-4 pt-4 border-t overflow-y-auto">
                        <h4 className="font-semibold mb-2">Pagamentos Efetuados</h4>
                        {payments.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-4">Nenhum pagamento adicionado.</p>
                        ) : (
                            <div className="space-y-2">
                                {payments.map((p, i) => {
                                    const Icon = paymentMethods.find(m => m.id === p.method)?.icon || DollarSign;
                                    return (
                                        <div key={i} className="flex justify-between items-center bg-gray-100 p-3 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <Icon size={16} />
                                                <span className="font-semibold capitalize">{p.method}</span>
                                            </div>
                                            <span className="font-bold">{formatCurrency(p.amountPaid)}</span>

                                            <button onClick={() => handleRemovePayment(p.id)} className="text-red-500 hover:text-red-700">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    
                    {/* Totalização e Finalização */}
                    <div className="flex-shrink-0 mt-auto pt-4 space-y-4">
                        <div className={`p-4 rounded-lg text-center font-bold text-xl ${remainingAmount > 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                            {remainingAmount > 0.01 ? `Falta Pagar: ${formatCurrency(remainingAmount)}` : 'Pagamento Concluído!'}
                        </div>
                        <button onClick={handleProcessPayment} className="w-full bg-green-600 text-white font-bold py-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400" disabled={remainingAmount > 0.01}>
                            Finalizar Pedido
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};