import React, { useState, useMemo, useEffect } from 'react';
import {
    PlusCircle, Edit, Trash2, Package, Search, DollarSign,
    Archive, AlertTriangle, Tag, Hash, Layers, Barcode,
    Printer
} from 'lucide-react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../../../config/firebase'; // Ajuste os ... conforme sua pasta
import { useBusiness } from '../../../../../contexts/BusinessContext';
import { useUI } from '../../../../../contexts/UIContext';
import { useLocalProducts } from '../../../../../hooks/useLocalProducts';
// Importa o Modal "Gerente" que já sabe lidar com Retail
import { ProductFormModal } from '../../../modules/ProductFormModal';
import { formatCurrency } from '../../../../../utils/formatters';
import { Product } from '../../../../../types';
import { StatCard } from '../../../../../components/ui/StatCard';
import { FormField } from '../../../../../components/ui/FormField';

import { Modal } from '../../../../../../components/ui/Modal'; // Importe o Modal
import { LabelDesigner } from '../labels/LabelDesigner'; // <--- Importe o Designer

export const RetailProductsManager: React.FC = () => {
    const { products, categories, subcategories, onDeleteProductImage } = useBusiness();
    const { saveProductLocal } = useLocalProducts();
    const { showAlert, showConfirmation } = useUI();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);

    // --- ESTADO PARA ETIQUETAS ---
    const [labelProduct, setLabelProduct] = useState<Product | null>(null);

    // --- FILTROS RETAIL ---
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedSubcategory, setSelectedSubcategory] = useState('all');
    const [stockStatus, setStockStatus] = useState('all');

    // Subcategorias dinâmicas
    const availableSubcategories = useMemo(() => {
        if (selectedCategory === 'all') return [];
        return subcategories.filter(sub => sub.categoryId === selectedCategory);
    }, [subcategories, selectedCategory]);

    // Lógica de Salvamento (A mesma que corrigimos antes)
    const handleSaveProduct = async (productData: any) => {
        console.log("RetailProductsManager - Salvando:", productData); // DEBUG
        try {
            await saveProductLocal(productData);
            setIsModalOpen(false);
            setSelectedProduct(undefined);
            showAlert('Produto salvo com sucesso!', 'success');
        } catch (error) {
            console.error("Erro ao salvar:", error);
            showAlert('Erro ao salvar produto.', 'error');
        }
    };

    // Lógica de Exclusão
    const handleDelete = (product: Product) => {
        showConfirmation(`Excluir "${product.name}"?`, async () => {
            try {
                if (product.imagePath) await onDeleteProductImage(product.imagePath);
                await deleteDoc(doc(db, 'products', product.id));
                showAlert('Produto excluído!');
            } catch (error) {
                console.error(error);
                showAlert('Erro ao excluir.', 'error');
            }
        });
    };

    // --- ANÁLISE DE ESTOQUE VAREJO ---
    const retailStats = useMemo(() => {
        const totalProducts = products.length;
        // Soma o estoque de produtos simples + variantes de grade
        const totalItemsInStock = products.reduce((acc, p) => {
            const variantStock = p.variants?.reduce((sum: number, v: any) => sum + (v.stock || 0), 0) || 0;
            return acc + (p.stockQuantity || 0) + variantStock;
        }, 0);

        const lowStockProducts = products.filter(p => {
            const totalStock = (p.stockQuantity || 0) + (p.variants?.reduce((s: number, v: any) => s + v.stock, 0) || 0);
            return totalStock < 5; // Exemplo: Alerta se tiver menos de 5
        }).length;

        return { totalProducts, totalItemsInStock, lowStockProducts };
    }, [products]);

    // --- FILTRAGEM ---
    const filteredProducts = useMemo(() => {
        const search = searchTerm.toLowerCase();
        return products.filter(p => {
            const matchSearch = p.name.toLowerCase().includes(search) ||
                p.sku?.toLowerCase().includes(search);
            const matchCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
            const matchSub = selectedSubcategory === 'all' || p.subcategoryId === selectedSubcategory;

            // Lógica de estoque para Retail
            const totalStock = (p.stockQuantity || 0) + (p.variants?.reduce((s: number, v: any) => s + v.stock, 0) || 0);
            const matchStock = stockStatus === 'all' ||
                (stockStatus === 'low' && totalStock < 5) ||
                (stockStatus === 'ok' && totalStock >= 5);

            return matchSearch && matchCat && matchSub && matchStock;
        });
    }, [products, searchTerm, selectedCategory, selectedSubcategory, stockStatus]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Estoque & Produtos (Varejo)</h1>
                    <p className="text-gray-500">Gerencie grade, variações e inventário.</p>
                </div>
                <button
                    onClick={() => { setSelectedProduct(undefined); setIsModalOpen(true); }}
                    className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center hover:bg-blue-700 transition"
                >
                    <PlusCircle size={20} className="mr-2" /> Novo Produto
                </button>
            </div>

            {/* Cards de Métricas Varejo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total de SKUs" value={retailStats.totalProducts} icon={<Package />} color="bg-blue-500" />
                <StatCard title="Peças em Estoque" value={retailStats.totalItemsInStock} subValue="Total Físico" icon={<Layers />} color="bg-green-500" />
                <StatCard title="Estoque Baixo" value={retailStats.lowStockProducts} subValue="< 5 unidades" icon={<AlertTriangle />} color="bg-yellow-500" />
            </div>

            {/* Filtros */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                        placeholder="Buscar por nome ou SKU..."
                        className="w-full pl-10 p-2 border rounded-lg"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <select className="p-2 border rounded-lg" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                    <option value="all">Categorias</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select className="p-2 border rounded-lg" value={stockStatus} onChange={e => setStockStatus(e.target.value)}>
                    <option value="all">Status Estoque</option>
                    <option value="ok">Normal</option>
                    <option value="low">Baixo</option>
                </select>
            </div>

            {/* Lista Visual de Varejo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map(product => {
                    const hasVariants = product.variants && product.variants.length > 0;
                    const totalStock = (product.stockQuantity || 0) + (product.variants?.reduce((s: number, v: any) => s + (v.stock || 0), 0) || 0);

                    return (
                        <div key={product.id} className="bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-shadow group relative">
                            {/* Imagem */}
                            <div className="h-48 bg-gray-100 relative">
                                {product.imageUrl ? (
                                    <img src={product.imageUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <Package size={48} />
                                    </div>
                                )}
                                {/* Badge de Estoque */}
                                <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold shadow-sm flex items-center gap-1">
                                    <Layers size={12} className="text-blue-600" />
                                    {totalStock} un
                                </div>
                            </div>

                            <div className="p-4">
                                <h3 className="font-bold text-gray-800 mb-1 truncate">{product.name}</h3>
                                <div className="text-sm text-gray-500 mb-3 flex items-center gap-2">
                                    <Tag size={12} /> {product.category || 'Geral'}
                                    {product.sku && <span className="text-xs bg-gray-100 px-1 rounded flex items-center gap-1"><Barcode size={10} /> {product.sku}</span>}
                                </div>

                                {/* Resumo da Grade (Se tiver) */}
                                {hasVariants && (
                                    <div className="text-xs bg-blue-50 text-blue-700 p-2 rounded mb-3">
                                        {product.variants.length} variações (Cores/Tamanhos)
                                    </div>
                                )}

                                <div className="flex justify-between items-end border-t pt-3 mt-auto">
                                    <div>
                                        <p className="text-xs text-gray-400">Preço Venda</p>
                                        <p className="text-lg font-bold text-green-600">{formatCurrency(product.salePrice)}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {/* BOTÃO DE ETIQUETA - VISIBILIDADE REFORÇADA */}
                                        <button
                                            onClick={() => setLabelProduct(product)}
                                            className="p-2 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-full transition-colors border border-purple-200"
                                            title="Imprimir Etiquetas"
                                        >
                                            <Printer size={18} />
                                        </button>
                                        <button onClick={() => { setSelectedProduct(product); setIsModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"><Edit size={18} /></button>
                                        <button onClick={() => handleDelete(product)} className="p-2 text-red-600 hover:bg-red-50 rounded-full"><Trash2 size={18} /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* O MODAL GERENTE (Ainda usamos o mesmo modal, pois ele sabe chamar o RetailForm) */}
            {isModalOpen && (
                <ProductFormModal
                    isOpen={isModalOpen}
                    onClose={() => { setIsModalOpen(false); setSelectedProduct(undefined); }}
                    product={selectedProduct}
                    onSave={handleSaveProduct}
                />
            )}
            {/* MODAL DE ETIQUETAS (LABEL DESIGNER) - NOVO */}
            {labelProduct && (
                <Modal
                    isOpen={!!labelProduct}
                    onClose={() => setLabelProduct(null)}
                    title={`Etiquetas: ${labelProduct.name}`}
                    maxWidth="max-w-[95vw]" // Modal Gigante
                >
                    <LabelDesigner
                        product={labelProduct}
                        onClose={() => setLabelProduct(null)}
                    />
                </Modal>
            )}
        </div>
    );
};