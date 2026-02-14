import React, { useState, useMemo, useCallback } from 'react';
import { 
    PlusCircle, Edit, Trash2, Package, Search, 
    AlertTriangle, Tag, Layers, Printer 
} from 'lucide-react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../../../config/firebase'; 
import { useBusiness } from '../../../../../contexts/BusinessContext';
import { useUI } from '../../../../../contexts/UIContext';
import { useLocalProducts } from '../../../../../hooks/useLocalProducts';
// Verifique se este caminho está correto no seu projeto
import { ProductFormModal } from '../../../modules/ProductFormModal'; 
import { formatCurrency } from '../../../../../utils/formatters';
import { Product } from '../../../../../types';
import { StatCard } from '../../../../ui/StatCard';
import { Modal } from '../../../../ui/Modal'; 
import { LabelDesigner } from '../labels/LabelDesigner'; 

export const RetailProductsManager: React.FC = () => {
    const { products, categories, onDeleteProductImage } = useBusiness();
    const { saveProductLocal } = useLocalProducts();
    const { showAlert, showConfirmation } = useUI();
    
    // Estados
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
    const [labelProduct, setLabelProduct] = useState<Product | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [stockStatus, setStockStatus] = useState('all');

    // --- FUNÇÃO DE SALVAR BLINDADA ---
    const handleSaveProduct = useCallback(async (productData: any) => {
        console.log("RetailManager: Executando save...", productData);
        try {
            await saveProductLocal(productData);
            setIsModalOpen(false);
            setSelectedProduct(undefined);
            showAlert('Produto salvo com sucesso!', 'success');
        } catch (error) {
            console.error("RetailManager: Erro ao salvar:", error);
            showAlert('Erro ao salvar produto.', 'error');
        }
    }, [saveProductLocal, showAlert]);

    // Funções de Ação
    const handleEditProduct = (product: Product) => {
        console.log("RetailManager: Abrindo edição para", product.name);
        setSelectedProduct(product);
        setTimeout(() => setIsModalOpen(true), 10);
    };

    const handleNewProduct = () => {
        setSelectedProduct(undefined);
        setIsModalOpen(true);
    };

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

    // Filtros e Stats
    const filteredProducts = useMemo(() => {
        const search = searchTerm.toLowerCase();
        return products.filter(p => {
            const matchSearch = p.name.toLowerCase().includes(search) || p.sku?.toLowerCase().includes(search);
            const matchCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
            const totalStock = (p.stockQuantity || 0) + (p.variants?.reduce((s: number, v: any) => s + v.stock, 0) || 0);
            const matchStock = stockStatus === 'all' || 
                (stockStatus === 'low' && totalStock < 5) || 
                (stockStatus === 'ok' && totalStock >= 5);
            return matchSearch && matchCat && matchStock;
        });
    }, [products, searchTerm, selectedCategory, stockStatus]);

    const retailStats = useMemo(() => {
        const totalProducts = products.length;
        const totalItemsInStock = products.reduce((acc, p) => {
            const variantStock = p.variants?.reduce((sum: number, v: any) => sum + (v.stock || 0), 0) || 0;
            return acc + (p.stockQuantity || 0) + variantStock;
        }, 0);
        const lowStockProducts = products.filter(p => {
            const totalStock = (p.stockQuantity || 0) + (p.variants?.reduce((s: number, v: any) => s + v.stock, 0) || 0);
            return totalStock < 5;
        }).length;
        return { totalProducts, totalItemsInStock, lowStockProducts };
    }, [products]);

    // Debug no render
    if (isModalOpen) {
        console.log("RetailManager Render: Modal Aberto. onSave é função?", typeof handleSaveProduct === 'function');
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Estoque & Produtos</h1>
                    <p className="text-gray-500">Gestão de Varejo</p>
                </div>
                <button onClick={handleNewProduct} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center hover:bg-blue-700 transition">
                    <PlusCircle size={20} className="mr-2" /> Novo Produtos
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total de SKUs" value={retailStats.totalProducts} icon={<Package />} color="bg-blue-500" />
                <StatCard title="Peças em Estoque" value={retailStats.totalItemsInStock} subValue="Físico" icon={<Layers />} color="bg-green-500" />
                <StatCard title="Estoque Baixo" value={retailStats.lowStockProducts} subValue="< 5 un" icon={<AlertTriangle />} color="bg-yellow-500" />
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4">
                 <div className="md:col-span-2 relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input placeholder="Buscar por nome ou SKU..." className="w-full pl-10 p-2 border rounded-lg" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                 </div>
                 <select className="p-2 border rounded-lg" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                    <option value="all">Todas as Categorias</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
                 <select className="p-2 border rounded-lg" value={stockStatus} onChange={e => setStockStatus(e.target.value)}>
                    <option value="all">Todos os Status</option>
                    <option value="low">Estoque Baixo</option>
                    <option value="ok">Estoque Normal</option>
                 </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map(product => {
                    const totalStock = (product.stockQuantity || 0) + (product.variants?.reduce((s: number, v: any) => s + (v.stock || 0), 0) || 0);
                    const hasVariants = product.variants && product.variants.length > 0;

                    return (
                        <div key={product.id} className="bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-shadow group relative">
                            <div className="h-48 bg-gray-100 relative group">
                                {product.imageUrl ? (
                                    <img src={product.imageUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300"><Package size={48} /></div>
                                )}
                                <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold shadow-sm flex items-center gap-1">
                                    <Layers size={12} className="text-blue-600"/> {totalStock} un
                                </div>
                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                     <button onClick={(e) => { e.stopPropagation(); setLabelProduct(product); }} className="bg-white text-purple-600 p-2 rounded-full shadow-md hover:bg-purple-50 transition-colors" title="Etiquetas">
                                        <Printer size={18} />
                                    </button>
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-gray-800 mb-1 truncate">{product.name}</h3>
                                <div className="text-sm text-gray-500 mb-3 flex items-center gap-2">
                                    <Tag size={12} /> {product.category || 'Geral'}
                                    {product.sku && <span className="text-xs bg-gray-100 px-1 rounded font-mono">{product.sku}</span>}
                                </div>
                                {hasVariants && (<div className="text-xs bg-blue-50 text-blue-700 p-2 rounded mb-3">{product.variants.length} variações</div>)}
                                <div className="flex justify-between items-end border-t pt-3 mt-auto">
                                    <div><p className="text-xs text-gray-400">Preço Venda</p><p className="text-lg font-bold text-green-600">{formatCurrency(product.salePrice)}</p></div>
                                    <div className="flex gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); handleEditProduct(product); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full bg-gray-50 transition-colors"><Edit size={18} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(product); }} className="p-2 text-red-600 hover:bg-red-50 rounded-full bg-gray-50 transition-colors"><Trash2 size={18} /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {isModalOpen && (
                <ProductFormModal 
                    isOpen={isModalOpen}
                    onClose={() => { setIsModalOpen(false); setSelectedProduct(undefined); }}
                    product={selectedProduct}
                    onSave={handleSaveProduct} 
                />
            )}

            {labelProduct && (
                <Modal isOpen={!!labelProduct} onClose={() => setLabelProduct(null)} title={`Etiquetas: ${labelProduct.name}`} maxWidth="max-w-[95vw]">
                    <LabelDesigner product={labelProduct} onClose={() => setLabelProduct(null)} />
                </Modal>
            )}
        </div>
    );
};