import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Modal } from '../../../../ui/Modal';
import { formatCurrency } from '../../../../../utils/formatters';
import { Search, Package } from 'lucide-react';
import { Product } from '../../../../../types';

interface ProductSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (product: Product) => void;
    onDoubleClick: (product: Product) => void;
    products: Product[];
    initialSearchTerm: string;
}

export const ProductSearchModal: React.FC<ProductSearchModalProps> = ({ 
    isOpen, onClose, onConfirm, onDoubleClick, products, initialSearchTerm 
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [isConfirmButtonFocused, setIsConfirmButtonFocused] = useState(false);

    const searchInputRef = useRef<HTMLInputElement>(null);
    const confirmButtonRef = useRef<HTMLButtonElement>(null);
    const tableBodyRef = useRef<HTMLTableSectionElement>(null);

    useEffect(() => {
        if (isOpen) {
            setSearchTerm(initialSearchTerm);
            setSelectedProduct(null);
            setSelectedIndex(-1);
            setIsConfirmButtonFocused(false);
            // Foca no campo de busca ao abrir
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    }, [isOpen, initialSearchTerm]);

    const filteredProducts = useMemo(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        if (!lowercasedFilter) return products;
        return products.filter(p => p.name.toLowerCase().includes(lowercasedFilter));
    }, [searchTerm, products]);

    // Atualiza o índice selecionado quando os produtos filtrados mudam
    useEffect(() => {
        if (filteredProducts.length > 0 && selectedIndex === -1) {
            setSelectedIndex(0);
            setSelectedProduct(filteredProducts[0]);
        } else if (filteredProducts.length === 0) {
            setSelectedIndex(-1);
            setSelectedProduct(null);
        }
    }, [filteredProducts, selectedIndex]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                // Desseleciona o botão Confirmar quando usar setas
                setIsConfirmButtonFocused(false);
                if (selectedIndex < filteredProducts.length - 1) {
                    const newIndex = selectedIndex + 1;
                    setSelectedIndex(newIndex);
                    setSelectedProduct(filteredProducts[newIndex]);
                    scrollToRow(newIndex);
                }
                break;

            case 'ArrowUp':
                e.preventDefault();
                // Desseleciona o botão Confirmar quando usar setas
                setIsConfirmButtonFocused(false);
                if (selectedIndex > 0) {
                    const newIndex = selectedIndex - 1;
                    setSelectedIndex(newIndex);
                    setSelectedProduct(filteredProducts[newIndex]);
                    scrollToRow(newIndex);
                }
                break;

            case 'Enter':
                e.preventDefault();
                if (isConfirmButtonFocused) {
                    // 2º Enter: Confirma e abre o modal
                    handleConfirm();
                } else if (selectedProduct) {
                    // 1º Enter: Seleciona e vai para o botão Confirmar
                    setIsConfirmButtonFocused(true);
                    confirmButtonRef.current?.focus();
                }
                break;

            case 'Escape':
                if (isConfirmButtonFocused) {
                    // Volta para a lista se estiver no botão de confirmação
                    setIsConfirmButtonFocused(false);
                    searchInputRef.current?.focus();
                } else {
                    onClose();
                }
                break;

            default:
                break;
        }
    };

    const scrollToRow = (index: number) => {
        if (tableBodyRef.current) {
            const rows = tableBodyRef.current.children;
            if (rows[index]) {
                rows[index].scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                });
            }
        }
    };

    const handleConfirm = () => {
        if (selectedProduct) {
            onConfirm(selectedProduct);
        }
    };

    const handleProductClick = (product: Product, index: number) => {
        setSelectedProduct(product);
        setSelectedIndex(index);
        // Desseleciona o botão Confirmar quando clicar em um produto
        setIsConfirmButtonFocused(false);
    };

    const handleSearchInputFocus = () => {
        // Desseleciona o botão Confirmar quando focar no campo de busca
        setIsConfirmButtonFocused(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Localizar Produto" maxWidth="max-w-7xl">
            <div className="flex flex-col h-[70vh]" onKeyDown={handleKeyDown}>
                <div className="relative mb-4">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        onFocus={handleSearchInputFocus}
                        placeholder="Buscar por nome..."
                        className="w-full p-3 pl-12 border rounded-lg text-lg"
                        autoFocus
                    />
                </div>
                
                <div className="flex-grow overflow-y-auto border rounded-lg">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 w-16">Imagem</th>
                                <th className="px-6 py-3">Produto</th>
                                <th className="px-6 py-3">Categoria</th>
                                <th className="px-6 py-3">Estoque</th>
                                <th className="px-6 py-3 text-right">Preço</th>
                            </tr>
                        </thead>
                        <tbody ref={tableBodyRef} className="divide-y">
                            {filteredProducts.map((product, index) => (
                                <tr 
                                    key={product.id} 
                                    onClick={() => handleProductClick(product, index)}
                                    onDoubleClick={() => onDoubleClick(product)}
                                    className={`cursor-pointer transition-colors ${
                                        selectedIndex === index 
                                            ? 'bg-blue-200 ring-2 ring-blue-400' 
                                            : 'hover:bg-blue-50'
                                    }`}
                                >
                                    <td className="px-6 py-2">
                                        {product.imageUrl ? (
                                            <img src={product.imageUrl} alt={product.name} className="w-10 h-10 object-cover rounded-md" />
                                        ) : (
                                            <div className="w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center">
                                                <Package size={20} className="text-gray-400" />
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-2 font-medium text-gray-900">{product.name}</td>
                                    <td className="px-6 py-2">
                                        <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                            Lanches
                                        </span>
                                    </td>
                                    <td className="px-6 py-2 text-green-600 font-semibold">{product.stockQuantity} unidades</td>
                                    <td className="px-6 py-2 text-right font-bold text-gray-800">
                                        {formatCurrency(product.salePrice)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex-shrink-0 pt-4 mt-4 border-t flex justify-between items-center">
                    <div>
                        {selectedProduct && (
                            <p className="text-sm text-gray-600">
                                • Use <kbd className="px-1 bg-gray-200 rounded">↑↓</kbd> para navegar • 
                                <kbd className="px-1 bg-gray-200 rounded mx-1">Enter</kbd> para selecionar • 
                                Duplo clique para adicionar rapidamente
                            </p>
                        )}
                    </div>
                    <div className="flex space-x-3">
                        <button 
                            onClick={onClose} 
                            className="bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-gray-300"
                        >
                            Cancelar
                        </button>
                        <button 
                            ref={confirmButtonRef}
                            onClick={handleConfirm} 
                            disabled={!selectedProduct}
                            onFocus={() => setIsConfirmButtonFocused(true)}
                            onBlur={() => setIsConfirmButtonFocused(false)}
                            className={`font-bold py-3 px-6 rounded-lg transition-all duration-200 ${
                                isConfirmButtonFocused 
                                    ? 'bg-blue-700 text-white shadow-lg ring-4 ring-blue-300 scale-105' 
                                    : 'bg-blue-600 text-white disabled:bg-gray-400'
                            }`}
                        >
                            Confirmar
                        </button>
                    </div>
                </div>

                {/* Dicas de navegação */}
                <div className="text-xs text-gray-500 text-center mt-2 space-y-1">
                    <p>
                        💡 Navegue com <kbd className="px-1 bg-gray-200 rounded">↑↓</kbd> • 
                        Selecione com <kbd className="px-1 bg-gray-200 rounded">Enter</kbd> • 
                        <kbd className="px-1 bg-gray-200 rounded mx-1">Esc</kbd> para {isConfirmButtonFocused ? 'voltar' : 'cancelar'}
                    </p>
                    {isConfirmButtonFocused && (
                        <p className="text-green-600 font-semibold">
                            Pressione Enter novamente para abrir o modal de personalização!
                        </p>
                    )}
                </div>
            </div>
        </Modal>
    );
};