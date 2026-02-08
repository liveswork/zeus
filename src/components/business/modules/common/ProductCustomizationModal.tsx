import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Modal } from '../../../ui/Modal';
import { formatCurrency } from '../../../../utils/formatters';
import { SlidersHorizontal, ArrowRight } from 'lucide-react';
import { ProductAddonsModal } from './ProductAddonsModal';
import { Product } from '../../../../types';

interface ProductCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onConfirm: (customizedProduct: any) => void;
}

export const ProductCustomizationModal: React.FC<ProductCustomizationModalProps> = ({ isOpen, onClose, product, onConfirm }) => {
  const [quantity, setQuantity] = useState(1);
  const [observation, setObservation] = useState('');
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);
  const [isAddonsModalOpen, setIsAddonsModalOpen] = useState(false);
  const [isConfirmButtonFocused, setIsConfirmButtonFocused] = useState(false);

  // Refs para os elementos focáveis
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const observationInputRef = useRef<HTMLTextAreaElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setObservation('');
      setSelectedAddons([]);
      setIsConfirmButtonFocused(false);
      // Foca e seleciona o texto no campo de quantidade ao abrir o modal
      setTimeout(() => {
        quantityInputRef.current?.focus();
        quantityInputRef.current?.select();
      }, 100);
    }
  }, [isOpen]);

  const addonsPrice = useMemo(() => {
    return selectedAddons.reduce((total, addon) => total + (addon.price || 0), 0);
  }, [selectedAddons]);

  const totalItemPrice = useMemo(() => {
    return (product.salePrice + addonsPrice) * quantity;
  }, [product, addonsPrice, quantity]);

  const hasAddons = product.addonGroupIds && product.addonGroupIds.length > 0;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      
      const activeElement = document.activeElement;
      
      if (activeElement === quantityInputRef.current) {
        // 1º Enter: Quantidade → Observação
        observationInputRef.current?.focus();
      } else if (activeElement === observationInputRef.current) {
        // 2º Enter: Observação → Botão de Confirmação
        setIsConfirmButtonFocused(true);
        confirmButtonRef.current?.focus();
      } else if (activeElement === confirmButtonRef.current && isConfirmButtonFocused) {
        // 3º Enter: Confirma o pedido
        handleFinalConfirm();
      }
    } else if (e.key === 'Escape') {
      if (isConfirmButtonFocused) {
        // Se estiver no botão de confirmação, volta para a observação
        setIsConfirmButtonFocused(false);
        observationInputRef.current?.focus();
      } else {
        onClose();
      }
    }
  };

  const handleQuantityInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Seleciona todo o texto quando o input recebe foco
    e.target.select();
    setIsConfirmButtonFocused(false);
  };

  const handleObservationFocus = () => {
    setIsConfirmButtonFocused(false);
  };

  const handleConfirmButtonFocus = () => {
    setIsConfirmButtonFocused(true);
  };

  const handleConfirmButtonBlur = () => {
    setIsConfirmButtonFocused(false);
  };

  const handleConfirmAddons = (customizedProductData: any) => {
    setSelectedAddons(customizedProductData.selectedAddons || []);
    setIsAddonsModalOpen(false);
  };
  
  const handleFinalConfirm = () => {
    const addonsText = selectedAddons.map(a => a.name).join(', ');
    const finalObservation = [observation, addonsText].filter(Boolean).join('; ');

    const finalProduct = {
      ...product,
      productId: product.id,
      qty: quantity,
      salePrice: product.salePrice + addonsPrice,
      observation: finalObservation,
      selectedAddons: selectedAddons,
      cartItemId: Date.now() + Math.random(),
    };
    onConfirm(finalProduct);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`Adicionar ${product.name}`} size="lg">
        <div className="space-y-6" onKeyDown={handleKeyDown}>
          {/* Seção de Quantidade */}
          <div className="flex justify-between items-center">
            <label className="text-lg font-semibold text-gray-800">Quantidade</label>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setQuantity(q => Math.max(1, q - 1))} 
                className="w-10 h-10 border rounded-full text-2xl flex items-center justify-center"
                type="button"
              >
                -
              </button>
              <input
                ref={quantityInputRef}
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                onFocus={handleQuantityInputFocus}
                className="font-bold text-2xl w-16 text-center border-2 border-blue-500 rounded-lg bg-white"
                min="1"
                step="1"
              />
              <button 
                onClick={() => setQuantity(q => q + 1)} 
                className="w-10 h-10 border rounded-full text-2xl flex items-center justify-center"
                type="button"
              >
                +
              </button>
            </div>
          </div>

          {/* Seção de Observação */}
          <div>
            <label className="text-lg font-semibold text-gray-800">Observações</label>
            <textarea
              ref={observationInputRef}
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              onFocus={handleObservationFocus}
              rows={3}
              placeholder="Ex: Sem cebola, ponto da carne mal passado..."
              className="w-full p-2 border rounded-lg mt-2"
            />
          </div>

          {/* Seção de Complementos (apenas mouse) */}
          {hasAddons && (
            <div className="border-t pt-4">
              <button
                onClick={() => setIsAddonsModalOpen(true)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 border"
                type="button"
              >
                <div className="flex items-center gap-3">
                  <SlidersHorizontal className="text-blue-600" />
                  <div>
                    <p className="font-semibold text-gray-800">Adicionar Complementos (Opcional)</p>
                    {selectedAddons.length > 0 ? (
                      <p className="text-xs text-gray-500">{selectedAddons.length} selecionado(s)</p>
                    ) : (
                      <p className="text-xs text-gray-500">Clique para adicionar complementos</p>
                    )}
                  </div>
                </div>
                <ArrowRight />
              </button>
            </div>
          )}

          {/* Footer com Total e Confirmação */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div>
              <p className="text-gray-600">Total do Item</p>
              <p className="text-3xl font-bold">{formatCurrency(totalItemPrice)}</p>
            </div>
            <button 
              ref={confirmButtonRef}
              onClick={handleFinalConfirm} 
              onFocus={handleConfirmButtonFocus}
              onBlur={handleConfirmButtonBlur}
              className={`font-bold py-3 px-8 rounded-lg transition-all duration-200 ${
                isConfirmButtonFocused 
                  ? 'bg-blue-700 text-white shadow-lg ring-4 ring-blue-300 scale-105' 
                  : 'bg-blue-600 text-white'
              }`}
              type="button"
            >
              Adicionar ao Pedido
            </button>
          </div>

          {/* Dicas de navegação por teclado */}
          <div className="text-xs text-gray-500 text-center space-y-1">
            <p>💡 Dica: Pressione <kbd className="px-1 bg-gray-200 rounded">Enter</kbd> para navegar</p>
            <p><kbd className="px-1 bg-gray-200 rounded">Esc</kbd> para voltar/cancelar</p>
            {isConfirmButtonFocused && (
              <p className="text-green-600 font-semibold">Pressione Enter novamente para confirmar o pedido!</p>
            )}
          </div>
        </div>
      </Modal>

      {/* O modal de complementos é renderizado a partir daqui */}
      {product && (
          <ProductAddonsModal
            isOpen={isAddonsModalOpen}
            onClose={() => setIsAddonsModalOpen(false)}
            product={product}
            onConfirm={handleConfirmAddons}
          />
      )}
    </>
  );
};