import React, { useState, useMemo, useEffect } from 'react'; // Adicionado useEffect
// --- ADICIONADO: ChefHat e Beaker (para Ficha Técnica/Produção) ---
import { PlusCircle, Edit, Trash2, Package, Search, DollarSign, Archive, AlertTriangle, Tag, Hash, ChefHat, Beaker } from 'lucide-react'; // Adicionado Tag e Hash
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../../../config/firebase';
import { useBusiness } from '../../../../../contexts/BusinessContext';
import { useUI } from '../../../../../contexts/UIContext';
import { ProductFormModal } from '../../../modules/ProductFormModal';
import { formatCurrency } from '../../../../../utils/formatters';
import { Product } from '../../../../../types';
import { StatCard } from '../../../../ui/StatCard';
import { FormField } from '../../../../ui/FormField';

export const FoodProductsManager: React.FC = () => {
    // --- MODIFICAÇÃO: 'categories' e 'subcategories' obtidos do context ---
    const { products, categories, subcategories, onDeleteProductImage } = useBusiness(); 
    const { showAlert, showConfirmation } = useUI();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Product | null>(null);

    // --- ESTADOS DOS FILTROS ---
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedSubcategory, setSelectedSubcategory] = useState('all'); // --- NOVO FILTRO ---
    // --- NOVO: Estado do filtro de tipo ---
    const [productType, setProductType] = useState('all');
    const [stockStatus, setStockStatus] = useState('all');
    const [sortBy, setSortBy] = useState('name-asc');
    
    // --- NOVO: Subcategorias disponíveis baseadas na categoria selecionada ---
    const availableSubcategories = useMemo(() => {
        if (selectedCategory === 'all') {
            return []; // Não mostra subcategorias se "Todas" estiver selecionado
        }
        return subcategories.filter(sub => sub.categoryId === selectedCategory);
    }, [subcategories, selectedCategory]);

    // Resetar subcategoria se a categoria mudar
    useEffect(() => {
        setSelectedSubcategory('all');
    }, [selectedCategory]);

    // --- ANÁLISES (STATS) ATUALIZADAS ---
    const productStats = useMemo(() => {
        const totalProducts = products.length;
        const totalInventoryValue = products.reduce((sum, p) => sum + (p.costPrice || 0) * (p.stockQuantity || 0), 0);
        // Filtra produtos 'simples' (que têm controle de estoque direto) e estão sem estoque
        const outOfStockProducts = products.filter(p => p.productStructure === 'simples' && (p.stockQuantity || 0) === 0).length;
        // --- ATUALIZADO: usa categoryId ---
        const uncategorizedProducts = products.filter(p => !p.categoryId).length; 

        return {
            totalProducts,
            totalInventoryValue,
            outOfStockProducts,
            uncategorizedProducts
        };
    }, [products]);

    // --- FILTRO AVANÇADO ATUALIZADO ---
    const filteredProducts = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        
        return products
            .filter(p => {
                // Filtro de Busca
                const searchMatch = lowerSearch === '' ||
                    p.name.toLowerCase().includes(lowerSearch) ||
                    (p.sku && p.sku.toLowerCase().includes(lowerSearch)) ||
                    (p.barcode && p.barcode.toLowerCase().includes(lowerSearch));

                // --- ATUALIZADO: Filtro de Categoria por ID ---
                const categoryMatch = selectedCategory === 'all' || p.categoryId === selectedCategory;

                // --- NOVO: Filtro de Subcategoria por ID ---
                const subcategoryMatch = selectedSubcategory === 'all' || p.subcategoryId === selectedSubcategory;

                // --- NOVO: Filtro de Tipo incluído ---
                const typeMatch = productType === 'all' || p.productStructure === productType;

                // Filtro de Estoque
                const stockMatch = stockStatus === 'all' ||
                    (stockStatus === 'out-of-stock' && (p.stockQuantity || 0) === 0) ||
                    (stockStatus === 'in-stock' && (p.stockQuantity || 0) > 0);

                return searchMatch && categoryMatch && subcategoryMatch && stockMatch && typeMatch;
            })
            .sort((a, b) => {
                switch (sortBy) {
                    case 'price-desc':
                        return b.salePrice - a.salePrice;
                    case 'price-asc':
                        return a.salePrice - b.salePrice;
                    case 'stock-asc':
                        return (a.stockQuantity || 0) - (b.stockQuantity || 0);
                    case 'name-asc':
                    default:
                        return a.name.localeCompare(b.name);
                }
            });
    // --- ATUALIZADO: 'productType' adicionado às dependências ---
    }, [products, searchTerm, selectedCategory, selectedSubcategory, stockStatus, sortBy, productType]);

    const handleOpenModal = (product: Product | null = null) => {
        setCurrentProduct(product);
        setIsModalOpen(true);
    };

    // Lógica de exclusão atualizada para incluir a exclusão de imagem
    const handleDelete = (product: Product) => {
        showConfirmation(`Tem certeza que deseja excluir o produto "${product.name}"? Esta ação não pode ser desfeita.`, async () => {
            try {
                // Deleta a imagem do Storage, se existir
                if (product.imagePath) {
                    await onDeleteProductImage(product.imagePath);
                }
                // Deleta o documento do Firestore
                await deleteDoc(doc(db, 'products', product.id));
                showAlert('Produto excluído com sucesso!');
            } catch (error) {
                console.error('Erro ao excluir produto:', error);
                showAlert('Erro ao excluir produto.', 'error');
            }
        });
    };
    
    // --- NOVO: Função para buscar o nome da subcategoria ---
    const getSubcategoryName = (subId: string | undefined) => {
        if (!subId) return null;
        return subcategories.find(s => s.id === subId)?.name || null;
    }

    // --- NOVO: Helper para ícone e texto do tipo de produto ---
    const getProductStructureInfo = (structure: string) => {
        switch (structure) {
            case 'producao':
                return { icon: <ChefHat size={12} />, label: 'Produção' };
            case 'simples':
                return { icon: <Package size={12} />, label: 'Revenda' };
            case 'grade':
                return { icon: <Package size={12} />, label: 'Grade' }; // Ícone precisa ser ajustado se quiser
            default:
                return { icon: <Package size={12} />, label: 'Simples' };
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Produtos e Fichas Técnicas</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg flex items-center hover:bg-green-700 transition"
                >
                    <PlusCircle size={20} className="mr-2" />
                    Novo Produtosss
                </button>
            </div>

            {/* Seção de Análise (Stats) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total de Produtos"
                    value={productStats.totalProducts}
                    icon={<Package />}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Valor do Inventário"
                    value={formatCurrency(productStats.totalInventoryValue)}
                    subValue="Baseado no Custo"
                    icon={<DollarSign />}
                    color="bg-green-500"
                />
                <StatCard
                    title="Fora de Estoque"
                    value={productStats.outOfStockProducts}
                    subValue="Produtos 'simples'"
                    icon={<Archive />}
                    color="bg-red-500"
                />
                <StatCard
                    title="Não Categorizados"
                    value={productStats.uncategorizedProducts}
                    icon={<AlertTriangle />}
                    color="bg-yellow-500"
                />
            </div>

            {/* Seção de Filtros Avançados ATUALIZADA */}
            <div className="bg-white p-4 rounded-lg shadow-md">
                {/* --- ATUALIZADO: Grid de 4 colunas para filtros --- */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Linha 1: Busca */}
                    <div className="md:col-span-4">
                        <FormField label="Buscar Produto">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Buscar por nome, SKU ou cód. de barras..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </FormField>
                    </div>
                    
                    {/* Linha 2: Filtros */}
                    {/* --- ATUALIZADO: Filtro de Categoria por ID --- */}
                    <FormField label="Filtrar por Categoria">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg bg-white"
                        >
                            <option value="all">Todas as Categorias</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option> 
                            ))}
                            <option value="">(Não Categorizados)</option>
                        </select>
                    </FormField>

                    {/* --- NOVO: Filtro de Subcategoria --- */}
                    <FormField label="Filtrar por Subcategoria">
                        <select
                            value={selectedSubcategory}
                            onChange={(e) => setSelectedSubcategory(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg bg-white"
                            disabled={availableSubcategories.length === 0}
                        >
                            <option value="all">Todas as Subcategorias</option>
                            {availableSubcategories.map(sub => (
                                <option key={sub.id} value={sub.id}>{sub.name}</option>
                            ))}
                        </select>
                    </FormField>

                    {/* Filtro de Estoque */}
                    <FormField label="Filtrar por Estoque">
                        <select
                            value={stockStatus}
                            onChange={(e) => setStockStatus(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg bg-white"
                        >
                            <option value="all">Todos</option>
                            <option value="in-stock">Em Estoque</option>
                            <option value="out-of-stock">Fora de Estoque</option>
                        </select>
                    </FormField>
                    
                    {/* --- NOVO FILTRO DE TIPO --- */}
                    <FormField label="Filtrar por Tipo">
                        <select
                            value={productType}
                            onChange={(e) => setProductType(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg bg-white"
                        >
                            <option value="all">Todos os Tipos</option>
                            <option value="producao">Produção Própria</option>
                            <option value="simples">Revenda / Simples</option>
                            <option value="grade">Grade</option>
                        </select>
                    </FormField>

                    {/* Linha 3: Ordenação */}
                    <div className="md:col-span-4">
                        <FormField label="Ordenar por">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full md:w-1/4 p-3 border border-gray-300 rounded-lg bg-white"
                            >
                                <option value="name-asc">Nome (A-Z)</option>
                                <option value="price-desc">Maior Preço</option>
                                <option value="price-asc">Menor Preço</option>
                                <option value="stock-asc">Menor Estoque</option>
                            </select>
                        </FormField>
                    </div>
                </div>
            </div>

            {/* Lista de Produtos Filtrada ATUALIZADA */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-12">
                        <Package size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">
                            {products.length === 0 ? 'Nenhum produto cadastrado' : 'Nenhum produto encontrado com esses filtros'}
                        </p>
                        {products.length === 0 && (
                            <p className="text-gray-400 text-sm">Clique em "Novo Produto" para começar</p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredProducts.map(product => {
                            const marginPercent = product.salePrice > 0
                                ? ((product.salePrice - (product.costPrice || 0)) / product.salePrice) * 100
                                : 0;
                            
                            const isLowStock = product.productStructure === 'simples' && (product.stockQuantity || 0) === 0;
                            
                            // --- ATUALIZADO: Busca nome da subcategoria ---
                            const subcategoryName = getSubcategoryName(product.subcategoryId);

                            // --- NOVO: Helper de Tipo ---
                            const structureInfo = getProductStructureInfo(product.productStructure);

                            return (
                                <div 
                                    key={product.id} 
                                    className={`flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors ${isLowStock ? 'bg-red-50 border-red-200' : ''}`}
                                >
                                    {/* ====================================================== */}
                                    {/* INÍCIO DA SEÇÃO DE IMAGEM (CÓDIGO ORIGINAL MANTIDO)  */}
                                    {/* ====================================================== */}
                                    <div className="flex items-center gap-4 flex-grow">
                                        {product.imageUrl ? (
                                            <img 
                                                src={product.imageUrl} 
                                                alt={product.name} 
                                                className="w-16 h-16 object-cover rounded-lg flex-shrink-0" 
                                            />
                                        ) : (
                                            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Package size={24} className="text-gray-400" />
                                            </div>
                                        )}
                                    {/* ====================================================== */}
                                    {/* FIM DA SEÇÃO DE IMAGEM (CÓDIGO ORIGINAL MANTIDO)     */}
                                    {/* ====================================================== */}

                                        <div>
                                            <h3 className="font-bold text-lg text-gray-800">{product.name}</h3>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                                                <span>Venda: <span className="font-semibold text-green-600">{formatCurrency(product.salePrice)}</span></span>
                                                <span>Custo: <span className="font-semibold text-red-600">{formatCurrency(product.costPrice || 0)}</span></span>
                                                <span>Margem: <span className="font-semibold text-blue-600">{marginPercent.toFixed(1)}%</span></span>
                                                {product.productStructure === 'simples' && (
                                                    <span>Estoque: <span className={`font-semibold ${isLowStock ? 'text-red-600' : 'text-gray-800'}`}>{product.stockQuantity || 0}</span></span>
                                                )}
                                            </div>
                                            {/* --- ATUALIZADO: Exibição de Categoria e Subcategoria --- */}
                                            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-1">
                                                <span className="flex items-center gap-1">
                                                    <Tag size={12} /> {product.category || 'N/A'}
                                                </span>
                                                {subcategoryName && (
                                                    <span className="flex items-center gap-1">
                                                        <Hash size={12} /> {subcategoryName}
                                                    </span>
                                                )}
                                                {/* --- NOVO BADGE DE TIPO --- */}
                                                <span className="flex items-center gap-1 font-medium">
                                                    {structureInfo.icon} {structureInfo.label}
                                                </span>
                                                {product.sku && <span>SKU: {product.sku}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => handleOpenModal(product)}
                                            className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 transition-colors"
                                            title="Editar Produto"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product)}
                                            className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition-colors"
                                            title="Excluir Produto"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {isModalOpen && (
                <ProductFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    initialData={currentProduct}
                />
            )}
        </div>
    );
};