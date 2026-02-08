import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../../ui/Modal';
import { useBusiness } from '../../../../contexts/BusinessContext';
import { AddonGroup, AddonItem, Product } from '../../../../types';
import { formatCurrency } from '../../../../utils/formatters';
import { ArrowRight, CheckCircle, Circle } from 'lucide-react';
import { FormField } from '../../../ui/FormField';

interface ProductAddonsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onConfirm: (customizedProduct: any) => void;
}

const AddonGroupDisplay: React.FC<{
  group: AddonGroup;
  selection: { [itemId: string]: number };
  onSelectionChange: (itemId: string, newQuantity: number) => void;
}> = ({ group, selection, onSelectionChange }) => {

  const totalSelected = useMemo(() => {
    return Object.values(selection).reduce((sum, qty) => sum + qty, 0);
  }, [selection]);

  const canSelectMore = totalSelected < group.maxSelection;

  const handleSelect = (item: AddonItem) => {
    const currentQty = selection[item.id] || 0;
    
    if (group.maxSelection === 1) { // Lógica de Rádio (seleção única)
      const newSelection: { [itemId: string]: number } = {};
      if (currentQty === 0) {
        newSelection[item.id] = 1;
      }
      // Se já estiver selecionado, clicar de novo desmarca (se não for obrigatório)
      onSelectionChange(item.id, group.isRequired && currentQty > 0 ? 1 : (currentQty > 0 ? 0 : 1));
    } else { // Lógica de Checkbox (seleção múltipla)
      if (currentQty > 0) {
        onSelectionChange(item.id, 0); // Desmarcar
      } else if (canSelectMore) {
        onSelectionChange(item.id, 1); // Marcar
      }
    }
  };

  return (
    <div className="py-4 border-b last:border-b-0">
      <div className="flex justify-between items-center">
        <h4 className="font-bold text-lg text-gray-800">{group.name}</h4>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${group.isRequired ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
          {group.isRequired ? 'Obrigatório' : 'Opcional'}
        </span>
      </div>
      <p className="text-sm text-gray-500">
        Selecione {group.minSelection > 0 ? `no mínimo ${group.minSelection} e ` : ''}no máximo {group.maxSelection} {group.maxSelection > 1 ? 'opções' : 'opção'}.
      </p>

      <div className="space-y-3 mt-3">
        {group.items.filter(item => item.isAvailable).map(item => (
          <div
            key={item.id}
            onClick={() => handleSelect(item)}
            className={`p-3 border rounded-lg flex items-center justify-between cursor-pointer transition-all ${selection[item.id] ? 'bg-blue-50 border-blue-500' : 'bg-white hover:bg-gray-50'}`}
          >
            <div className="flex items-center gap-3">
                {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-cover rounded-md" />}
                <div>
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                </div>
            </div>
            <div className="flex items-center gap-4">
              {item.price > 0 && <span className="font-semibold text-green-600 text-sm">+{formatCurrency(item.price)}</span>}
              {selection[item.id] ? <CheckCircle className="text-blue-600" /> : <Circle className="text-gray-300" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


export const ProductAddonsModal: React.FC<ProductAddonsModalProps> = ({ isOpen, onClose, product, onConfirm }) => {
  const { addonGroups } = useBusiness();
  const [selections, setSelections] = useState<Record<string, Record<string, number>>>({});
  const [quantity, setQuantity] = useState(1);
  const [observation, setObservation] = useState('');

  const relevantGroups = useMemo(() => {
    return (product.addonGroupIds || [])
      .map(groupId => addonGroups.find(g => g.id === groupId))
      .filter((g): g is AddonGroup => !!g);
  }, [product, addonGroups]);

  useEffect(() => {
    if (isOpen) {
      const initialSelections: Record<string, Record<string, number>> = {};
      relevantGroups.forEach(group => {
        initialSelections[group.id] = {};
      });
      setSelections(initialSelections);
      setQuantity(1);
      setObservation('');
    }
  }, [isOpen, relevantGroups]);

  const handleSelectionChange = (groupId: string, itemId: string, newQuantity: number) => {
    setSelections(prev => {
      const newGroupSelection = { ...(prev[groupId] || {}) };
      
      if (addonGroups.find(g => g.id === groupId)?.maxSelection === 1) {
          // Lógica de rádio: desmarca outros, marca o novo
          const currentQty = newGroupSelection[itemId] || 0;
          return {
              ...prev,
              [groupId]: { [itemId]: currentQty > 0 ? 0 : 1 }
          }
      }
      
      if (newQuantity > 0) {
        newGroupSelection[itemId] = newQuantity;
      } else {
        delete newGroupSelection[itemId];
      }
      return { ...prev, [groupId]: newGroupSelection };
    });
  };

  const { totalPrice, isValid, validationError } = useMemo(() => {
    let basePrice = product.salePrice;
    let addonsPrice = 0;
    let validationError = '';

    for (const group of relevantGroups) {
      const selection = selections[group.id] || {};
      const totalSelected = Object.values(selection).reduce((sum, qty) => sum + qty, 0);

      if (group.isRequired && totalSelected < group.minSelection) {
        validationError = `Selecione ao menos ${group.minSelection} item(ns) em "${group.name}".`;
      }
      if (totalSelected > group.maxSelection) {
        validationError = `Selecione no máximo ${group.maxSelection} item(ns) em "${group.name}".`;
      }
      
      for(const itemId in selection){
          const item = group.items.find(i => i.id === itemId);
          if(item) {
              addonsPrice += (item.price || 0) * (selection[itemId] || 0);
          }
      }
    }
    
    const finalPrice = (basePrice + addonsPrice) * quantity;
    return { totalPrice: finalPrice, isValid: validationError === '', validationError };

  }, [product, relevantGroups, selections, quantity]);

  const handleConfirmClick = () => {
    if (!isValid) {
      alert(validationError);
      return;
    }
    
    const selectedAddons: any[] = [];
    let addonsText = [];

    for(const groupId in selections) {
        const group = relevantGroups.find(g => g.id === groupId);
        const selection = selections[groupId];
        for(const itemId in selection) {
            if(selection[itemId] > 0){
                const item = group?.items.find(i => i.id === itemId);
                if(item) {
                    selectedAddons.push(item);
                    addonsText.push(item.name);
                }
            }
        }
    }

    const finalObservation = [observation, ...addonsText].filter(Boolean).join(', ');

    const customizedProduct = {
      ...product,
      productId: product.id,
      qty: quantity,
      salePrice: (product.salePrice + selectedAddons.reduce((sum, item) => sum + item.price, 0)),
      observation: finalObservation,
      selectedAddons: selectedAddons,
      cartItemId: Date.now() + Math.random(),
    };
    onConfirm(customizedProduct);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Personalize seu ${product.name}`} size="4xl">
      <div className="flex h-[80vh]">
        {/* Main Content */}
        <div className="flex-1 pr-6 overflow-y-auto">
          {relevantGroups.map(group => (
            <AddonGroupDisplay
              key={group.id}
              group={group}
              selection={selections[group.id] || {}}
              onSelectionChange={(itemId, newQuantity) => handleSelectionChange(group.id, itemId, newQuantity)}
            />
          ))}
        </div>

        {/* Sidebar */}
        <aside className="w-80 flex flex-col pl-6 border-l">
          <h3 className="font-bold text-lg">Resumo</h3>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span>Produto Base:</span> <span>{formatCurrency(product.salePrice)}</span></div>
            {/* Aqui você pode listar os addons selecionados e seus preços */}
          </div>
          
          <div className="mt-6">
              <FormField label="Observações Adicionais">
                  <textarea value={observation} onChange={(e) => setObservation(e.target.value)} rows={3} className="w-full p-2 border rounded"/>
              </FormField>
          </div>

          <div className="mt-auto pt-6 border-t">
            <div className="flex items-center justify-between mb-4">
              <label className="font-semibold">Quantidade</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-2 border rounded-full">-</button>
                <span className="font-bold text-lg w-10 text-center">{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)} className="p-2 border rounded-full">+</button>
              </div>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xl font-bold">Total:</span>
              <span className="text-3xl font-bold text-green-600">{formatCurrency(totalPrice)}</span>
            </div>
            <button onClick={handleConfirmClick} disabled={!isValid} className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg disabled:bg-gray-400 flex items-center justify-center gap-2">
              Adicionar ao Pedido <ArrowRight size={20}/>
            </button>
             {!isValid && <p className="text-red-500 text-xs text-center mt-2">{validationError}</p>}
          </div>
        </aside>
      </div>
    </Modal>
  );
};