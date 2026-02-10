import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../../../ui/Modal';
import { FormField } from '../../../../ui/FormField';
import { formatCurrency } from '../../../../../utils/formatters';
import { Pizza, Search, X, Plus, Edit2, Check } from 'lucide-react';
import { ProductSelectionModal } from './ProductSelectionModal';
import { ObservationModal } from './ObservationModal';

// Este é o modal principal, o "palco" onde a pizza de dois sabores será montada. Ele é elegante, espaçoso e segue uma lógica clara da esquerda para a direita.

interface CombinationFlowModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (combinedItem: any) => void;
    products: any[];
}

export const CombinationFlowModal: React.FC<CombinationFlowModalProps> = ({ isOpen, onClose, onConfirm, products }) => {
    const [firstHalf, setFirstHalf] = useState<any | null>(null);
    const [secondHalf, setSecondHalf] = useState<any | null>(null);
    const [firstHalfObservation, setFirstHalfObservation] = useState('');
    const [secondHalfObservation, setSecondHalfObservation] = useState('');
    
    const [isSelectionModalOpen, setSelectionModalOpen] = useState(false);
    const [selectionTarget, setSelectionTarget] = useState<'first' | 'second'>('first');
    const [initialSearch, setInitialSearch] = useState('');

    const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
    const [observationTarget, setObservationTarget] = useState<{ target: 'first' | 'second', text: string } | null>(null);

    const combinableProducts = useMemo(() => products.filter(p => p.allowCombination), [products]);

    useEffect(() => {
        if (isOpen) {
            // Reset state when modal opens
            setFirstHalf(null);
            setSecondHalf(null);
            setFirstHalfObservation('');
            setSecondHalfObservation('');
            setSelectionModalOpen(true);
            setSelectionTarget('first');
        }
    }, [isOpen]);

    const handleSelectProduct = (product: any) => {
        if (selectionTarget === 'first') {
            setFirstHalf(product);
            setSelectionModalOpen(false); // Fecha o modal de seleção
            setTimeout(() => { // Abre para a segunda metade
                setSelectionTarget('second');
                setSelectionModalOpen(true);
            }, 100);
        } else {
            setSecondHalf(product);
            setSelectionModalOpen(false);
        }
    };

    const handleOpenSelection = (target: 'first' | 'second') => {
        setSelectionTarget(target);
        setSelectionModalOpen(true);
    };
    
    const handleOpenObservation = (target: 'first' | 'second', text: string) => {
        setObservationTarget({ target, text });
        setIsObservationModalOpen(true);
    };

    const handleSaveObservation = (newText: string) => {
        if (observationTarget?.target === 'first') {
            setFirstHalfObservation(newText);
        } else {
            setSecondHalfObservation(newText);
        }
        setIsObservationModalOpen(false);
    };

    const handleConfirm = () => {
        if (!firstHalf || !secondHalf) return;
        
        const finalPrice = (firstHalf.salePrice + secondHalf.salePrice) / 2;
        const finalCost = ((firstHalf.costPrice || 0) / 2) + ((secondHalf.costPrice || 0) / 2);

        const combinedItem = {
            id: `combo_${firstHalf.id}_${secondHalf.id}_${Date.now()}`,
            isCombined: true,
            qty: 1,
            name: `½ ${firstHalf.name} / ½ ${secondHalf.name}`,
            salePrice: finalPrice,
            costPrice: finalCost,
            halves: [
                { productId: firstHalf.id, name: firstHalf.name, observation: firstHalfObservation, recipe: firstHalf.recipe || [] },
                { productId: secondHalf.id, name: secondHalf.name, observation: secondHalfObservation, recipe: secondHalf.recipe || [] }
            ]
        };
        onConfirm(combinedItem);
    };
    
    const HalfDisplay = ({ product, observation, onEdit, onAddObservation }: any) => (
        <div className="relative p-4 border rounded-lg bg-white h-full flex flex-col justify-center">
            {product ? (
                <>
                    <p className="text-xl font-bold">{product.name}</p>
                    <p className="text-lg font-semibold text-green-600">{formatCurrency(product.salePrice)}</p>
                    {observation && <p className="text-sm text-blue-600 italic mt-2">Obs: {observation}</p>}
                    <div className="absolute top-2 right-2 flex gap-1">
                        <button type="button" onClick={onAddObservation} className="p-1 text-gray-500 hover:text-blue-600"><Edit2 size={16} /></button>
                        <button type="button" onClick={onEdit} className="p-1 text-gray-500 hover:text-red-600"><X size={16} /></button>
                    </div>
                </>
            ) : (
                <div className="text-center text-gray-400">
                    <p>Selecione o sabor</p>
                </div>
            )}
        </div>
    );

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="Venda Meio a Meio" size="4xl">
                <div className="grid grid-cols-5 gap-6 h-[50vh]">
                    <div className="col-span-2 space-y-4">
                        <h3 className="font-semibold">Primeiro Sabor</h3>
                        <HalfDisplay product={firstHalf} observation={firstHalfObservation} onEdit={() => { setFirstHalf(null); handleOpenSelection('first'); }} onAddObservation={() => handleOpenObservation('first', firstHalfObservation)} />
                    </div>
                    <div className="col-span-1 flex items-center justify-center">
                        <Plus size={48} className="text-gray-300" />
                    </div>
                    <div className="col-span-2 space-y-4">
                        <h3 className="font-semibold">Segundo Sabor</h3>
                        <HalfDisplay product={secondHalf} observation={secondHalfObservation} onEdit={() => { setSecondHalf(null); handleOpenSelection('second'); }} onAddObservation={() => handleOpenObservation('second', secondHalfObservation)} />
                    </div>
                </div>
                <div className="flex justify-end space-x-4 pt-6 border-t mt-6">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 transition">Cancelar</button>
                    <button type="button" onClick={handleConfirm} disabled={!firstHalf || !secondHalf} className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition flex items-center disabled:bg-gray-400">
                        <Check size={20} className="mr-2" /> Confirmar e Adicionar
                    </button>
                </div>
            </Modal>

            <ProductSelectionModal
                isOpen={isSelectionModalOpen}
                onClose={() => setSelectionModalOpen(false)}
                onSelect={handleSelectProduct}
                products={combinableProducts}
                title={`Selecione o ${selectionTarget === 'first' ? 'Primeiro' : 'Segundo'} Sabor`}
            />

            {observationTarget && (
                <ObservationModal
                    isOpen={isObservationModalOpen}
                    onClose={() => setIsObservationModalOpen(false)}
                    onSave={handleSaveObservation}
                    initialValue={observationTarget.text}
                />
            )}
        </>
    );
};