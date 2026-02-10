// src/components/business/modules/table/CancelItemsModal.tsx

import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../ui/Modal';
import { Order, OrderItem } from '../../../../../types';
import { formatCurrency } from '../../../../../utils/formatters';
import { XCircle, Trash2, Plus, Minus, AlertTriangle } from 'lucide-react';

interface CancelItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onConfirm: (itemsToCancel: { [productId: string]: number }) => void;
}

export const CancelItemsModal: React.FC<CancelItemsModalProps> = ({ isOpen, onClose, order, onConfirm }) => {
  const [itemsToCancel, setItemsToCancel] = useState<{ [productId: string]: number }>({});

  useEffect(() => {
    // Reseta o estado quando o modal é aberto
    if (isOpen) {
      setItemsToCancel({});
    }
  }, [isOpen]);

  if (!order) return null;

  const handleQuantityChange = (item: OrderItem, amount: number) => {
    const currentCancelQty = itemsToCancel[item.productId] || 0;
    const newCancelQty = Math.max(0, Math.min(item.qty, currentCancelQty + amount));

    setItemsToCancel(prev => ({
      ...prev,
      [item.productId]: newCancelQty
    }));
  };

  const handleConfirm = () => {
    if (Object.values(itemsToCancel).every(qty => qty === 0)) {
      // Se nenhuma quantidade foi selecionada, não faz nada ou mostra um alerta
      return;
    }
    onConfirm(itemsToCancel);
  };

  const totalItemsToCancel = Object.values(itemsToCancel).reduce((sum, qty) => sum + qty, 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Cancelar Itens - ${order.tableName}`} size="2xl">
      <div className="space-y-6">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="text-yellow-500 h-5 w-5 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-yellow-800">Atenção</h4>
            <p className="text-yellow-700 text-sm">
              Esta ação removerá os itens selecionados da comanda. Apenas itens já enviados para a cozinha devem ser cancelados aqui.
            </p>
          </div>
        </div>

        <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
          {order.items.map((item, index) => (
            <div
              key={`${item.productId}-${item.cartItemId || item.id || index}`}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
            >
              <div>
                <p className="font-semibold text-gray-800">{item.name}</p>
                <p className="text-sm text-gray-500">
                  {item.qty} unidade(s) na comanda
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleQuantityChange(item, -1)}
                  className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition"
                  disabled={(itemsToCancel[item.productId] || 0) === 0}
                >
                  <Minus size={16} />
                </button>
                <span className="font-bold text-lg w-8 text-center">
                  {itemsToCancel[item.productId] || 0}
                </span>
                <button
                  onClick={() => handleQuantityChange(item, 1)}
                  className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition"
                  disabled={(itemsToCancel[item.productId] || 0) >= item.qty}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 transition">
            Voltar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={totalItemsToCancel === 0}
            className="bg-red-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-700 transition flex items-center gap-2 disabled:bg-gray-400"
          >
            <XCircle size={18} />
            Confirmar Cancelamento
          </button>
        </div>
      </div>
    </Modal>
  );
};