import React, { useState, useMemo } from 'react';
import { Modal } from '../../ui/Modal';
import { formatCurrency } from '../../../utils/formatters';

interface CombinationModalProps {
    isOpen: boolean;
    onClose: () => void;
    firstHalf: any;
    allProducts: any[];
    onCombine: (combinedItem: any) => void;
}

export const CombinationModal: React.FC<CombinationModalProps> = ({ isOpen, onClose, firstHalf, allProducts, onCombine }) => {
    const [secondHalf, setSecondHalf] = useState<any | null>(null);

    const availableOptions = useMemo(() => {
        return allProducts.filter(p => p.allowCombination && p.id !== firstHalf.id);
    }, [allProducts, firstHalf]);

    const handleConfirmCombination = () => {
        if (!secondHalf) {
            alert("Por favor, selecione a segunda metade.");
            return;
        }

        
        const finalPrice = (firstHalf.salePrice + secondHalf.salePrice) / 2;
        const finalCost = (firstHalf.costPrice / 2) + (secondHalf.costPrice / 2);

        const combinedItem = {
            id: `combo_${firstHalf.id}_${secondHalf.id}_${Date.now()}`,
            type: 'combined',
            qty: 1,
            name: `Metade ${firstHalf.name} / Metade ${secondHalf.name}`,
            salePrice: finalPrice,
            costPrice: finalCost,
            // Guardamos os produtos originais para referência na impressão e baixa de estoque
            halves: [
                { productId: firstHalf.id, name: firstHalf.name, recipe: firstHalf.recipe || [] },
                { productId: secondHalf.id, name: secondHalf.name, recipe: secondHalf.recipe || [] }
            ]
        };

        onCombine(combinedItem);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Montar Produto Meio a Meio" size="3xl">
            <div className="space-y-6">
                <div className="p-4 bg-gray-100 rounded-lg">
                    <p className="font-semibold">1ª Metade: <span className="text-blue-600 font-bold">{firstHalf.name}</span></p>
                </div>
                <div>
                    <h3 className="font-semibold mb-2">Selecione a 2ª Metade:</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-64 overflow-y-auto p-2">
                        {availableOptions.map(p => (
                            <button
                                key={p.id}
                                onClick={() => setSecondHalf(p)}
                                className={`p-3 border-2 rounded-lg text-center transition ${secondHalf?.id === p.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-blue-400'}`}
                            >
                                <p className="font-semibold">{p.name}</p>
                                <p className="text-sm">{formatCurrency(p.salePrice)}</p>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end pt-4 border-t">
                    <button
                        onClick={handleConfirmCombination}
                        disabled={!secondHalf}
                        className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                    >
                        Adicionar ao Pedido
                    </button>
                </div>
            </div>
        </Modal>
    );
};