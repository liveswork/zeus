import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../../../../ui/Modal';
import { formatCurrency } from '../../../../../utils/formatters';

interface QuantityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (item: { qty: number, observation: string }) => void;
    product: any;
}

export const QuantityModal: React.FC<QuantityModalProps> = ({ isOpen, onClose, onConfirm, product }) => {
    const [qty, setQty] = useState(1);
    const [observation, setObservation] = useState('');

    const qtyInputRef = useRef<HTMLInputElement>(null);
    const observationInputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen) {
            setQty(1);
            setObservation('');
            // Foca o campo de quantidade ao abrir
            setTimeout(() => qtyInputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (document.activeElement === qtyInputRef.current) {
                observationInputRef.current?.focus();
            } else if (document.activeElement === observationInputRef.current) {
                handleConfirm();
            }
        }
    };
    
    const handleConfirm = () => {
        if (qty > 0) {
            onConfirm({ qty, observation });
        }
    };

    if (!isOpen || !product) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={product.name} size="md">
            <div className="space-y-4" onKeyDown={handleKeyDown}>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                    <input
                        ref={qtyInputRef}
                        type="number"
                        value={qty}
                        onChange={(e) => setQty(Number(e.target.value))}
                        className="w-full p-3 text-center text-xl border rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1 text-center">Pressione Enter para ir para observação</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observação (Opcional)</label>
                    <textarea
                        ref={observationInputRef}
                        value={observation}
                        onChange={(e) => setObservation(e.target.value)}
                        rows={3}
                        placeholder="Ex: Sem cebola, ponto da carne..."
                        className="w-full p-2 border rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1 text-center">Pressione Enter para adicionar o item</p>
                </div>

                <div className="border-t pt-4 text-right">
                    <p className="text-gray-600">Total do item</p>
                    <p className="text-3xl font-bold">{formatCurrency(product.salePrice * qty)}</p>
                </div>

                <div className="flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg">Cancelar (Esc)</button>
                    <button type="button" onClick={handleConfirm} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg">Adicionar (Enter)</button>
                </div>
            </div>
        </Modal>
    );
};