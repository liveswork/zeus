// src/components/business/retail/modules/products/RetailProductsManager.tsx

import React, { useMemo, useState, useCallback } from 'react';
import {
  PlusCircle,
  Edit,
  Trash2,
  Package,
  Search,
  AlertTriangle,
  Tag,
  Layers,
  Printer,
} from 'lucide-react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../../../config/firebase';

import { useBusiness } from '../../../../../contexts/BusinessContext';
import { useUI } from '../../../../../contexts/UIContext';

import { Modal } from '../../../../ui/Modal';
import { StatCard } from '../../../../ui/StatCard';
//import { LabelDesigner } from '../labels/LabelDesigner';
import { LabelManager } from '../labels/LabelManager';

import { RetailProductForm } from './forms/RetailProductForm';
import { formatCurrency } from '../../../../../utils/formatters';
import { Product } from '../../../../../types';

type StockStatus = 'all' | 'low' | 'ok';

export const RetailProductsManager: React.FC = () => {
  const { products, categories, onDeleteProductImage } = useBusiness();
  const { showAlert, showConfirmation } = useUI();

  // Modal/Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  //const [isFormOpen, setIsFormOpen] = useState(false);

  // Label modal
  const [labelProduct, setLabelProduct] = useState<Product | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockStatus, setStockStatus] = useState<StockStatus>('all');

  const getProductTotalStock = useCallback((p: Product) => {
    // Mantém a lógica antiga (estoque do produto + estoque das variações)
    const base = (p.stockQuantity || 0) as number;
    const variantStock =
      (p.variants?.reduce((sum: number, v: any) => sum + (v?.stock || 0), 0) || 0) as number;
    return base + variantStock;
  }, []);

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    (categories || []).forEach((c: any) => {
      if (c?.id) map.set(String(c.id), String(c.name ?? ''));
    });
    return map;
  }, [categories]);

  const filteredProducts = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return (products || []).filter((p) => {
      const matchSearch =
        !search ||
        p.name?.toLowerCase().includes(search) ||
        p.sku?.toLowerCase().includes(search) ||
        p.barcode?.toLowerCase().includes(search);

      const matchCat =
        selectedCategory === 'all' ||
        // alguns projetos usam categoryId, outros category (string), então tentamos ambos
        (p as any).categoryId === selectedCategory;

      const totalStock = getProductTotalStock(p);
      const matchStock =
        stockStatus === 'all' ||
        (stockStatus === 'low' && totalStock < 5) ||
        (stockStatus === 'ok' && totalStock >= 5);

      return matchSearch && matchCat && matchStock;
    });
  }, [products, searchTerm, selectedCategory, stockStatus, getProductTotalStock]);

  const retailStats = useMemo(() => {
    const list = products || [];
    const totalProducts = list.length;

    const totalItemsInStock = list.reduce((acc, p) => acc + getProductTotalStock(p), 0);

    const lowStockProducts = list.filter((p) => getProductTotalStock(p) < 5).length;

    return { totalProducts, totalItemsInStock, lowStockProducts };
  }, [products, getProductTotalStock]);

  const handleOpenNew = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    // Mantém a “robustez” do antigo (evita edge case de focus/anim)
    setTimeout(() => setIsModalOpen(true), 10);
  };

  const handleCloseForm = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = (product: Product) => {
    showConfirmation(`Excluir "${product.name}"?`, async () => {
      try {
        if ((product as any).imagePath) {
          await onDeleteProductImage?.((product as any).imagePath);
        }
        await deleteDoc(doc(db, 'products', product.id));
        showAlert('Produto excluído!');
      } catch (error) {
        console.error(error);
        showAlert('Erro ao excluir.', 'error');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Estoque & Produtos</h1>
          <p className="text-gray-500">Gestão de Varejo</p>
        </div>

        <button
          onClick={handleOpenNew}
          className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center hover:bg-blue-700 transition"
        >
          <PlusCircle size={20} className="mr-2" /> Novo Produto
        </button>
      </div>

      {/* Stats (layout antigo) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total de SKUs"
          value={retailStats.totalProducts}
          icon={<Package />}
          color="bg-blue-500"
        />
        <StatCard
          title="Peças em Estoque"
          value={retailStats.totalItemsInStock}
          subValue="Físico + Variações"
          icon={<Layers />}
          color="bg-green-500"
        />
        <StatCard
          title="Estoque Baixo"
          value={retailStats.lowStockProducts}
          subValue="< 5 un"
          icon={<AlertTriangle />}
          color="bg-yellow-500"
        />
      </div>

      {/* Filters (layout antigo + compatível com o atual) */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            placeholder="Buscar por nome, SKU ou código de barras..."
            className="w-full pl-10 p-2 border rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="p-2 border rounded-lg"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">Todas as Categorias</option>
          {(categories || []).map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          className="p-2 border rounded-lg"
          value={stockStatus}
          onChange={(e) => setStockStatus(e.target.value as StockStatus)}
        >
          <option value="all">Todos os Status</option>
          <option value="low">Estoque Baixo</option>
          <option value="ok">Estoque Normal</option>
        </select>
      </div>

      {/* Products Grid (layout antigo, com modal/form do atual) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => {
          const totalStock = getProductTotalStock(product);
          const hasVariants = !!product.variants?.length;

          const categoryLabel =
            (product as any).category ||
            categoryNameById.get(String((product as any).categoryId)) ||
            'Geral';

          return (
            <div
              key={product.id}
              className="bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-shadow group relative"
            >
              <div className="h-48 bg-gray-100 relative group">
                {product.imageUrl ? (
                  <img src={product.imageUrl} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Package size={48} />
                  </div>
                )}

                <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold shadow-sm flex items-center gap-1">
                  <Layers size={12} className="text-blue-600" /> {totalStock} un
                </div>

                {/* Hover actions (antigo) */}
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLabelProduct(product);
                    }}
                    className="bg-white text-purple-600 p-2 rounded-full shadow-md hover:bg-purple-50 transition-colors"
                    title="Etiquetas"
                  >
                    <Printer size={18} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEdit(product);
                    }}
                    className="bg-white text-blue-600 p-2 rounded-full shadow-md hover:bg-blue-50 transition-colors"
                    title="Editar"
                  >
                    <Edit size={18} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(product);
                    }}
                    className="bg-white text-red-600 p-2 rounded-full shadow-md hover:bg-red-50 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="p-4 flex flex-col">
                <h3 className="font-bold text-gray-800 mb-1 truncate">{product.name}</h3>

                <div className="text-sm text-gray-500 mb-3 flex items-center gap-2">
                  <Tag size={12} />
                  <span className="truncate">{categoryLabel}</span>
                  {product.sku && (
                    <span className="text-xs bg-gray-100 px-1 rounded font-mono">{product.sku}</span>
                  )}
                </div>

                {hasVariants && (
                  <div className="text-xs bg-blue-50 text-blue-700 p-2 rounded mb-3">
                    {product.variants!.length} variações
                  </div>
                )}

                <div className="flex justify-between items-end border-t pt-3 mt-auto">
                  <div>
                    <p className="text-xs text-gray-400">Preço Venda</p>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(product.salePrice)}
                    </p>
                  </div>

                  {/* Botões (como no antigo, porém menores e redundância ok) */}
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(product);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full bg-gray-50 transition-colors"
                      title="Editar"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(product);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full bg-gray-50 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Form (atual) */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseForm}
          title={editingProduct ? 'Editar Produto' : 'Novo Produto'}
          size="5xl"
        >
          <RetailProductForm initialData={editingProduct ?? undefined} onClose={handleCloseForm} />
        </Modal>
      )}

      {/* MODAL DE ETIQUETAS (GESTOR) */}
      {labelProduct && (
        <Modal
          isOpen={!!labelProduct}
          onClose={() => setLabelProduct(null)}
          title={`Gerenciar Etiquetas: ${labelProduct.name}`}
          size="5xl"
        >
          <LabelManager
            product={labelProduct}
            onClose={() => setLabelProduct(null)}
          />
        </Modal>
      )}
    </div>
  );
};

export default RetailProductsManager;
