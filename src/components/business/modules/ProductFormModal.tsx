// src/components/business/modules/registrations/ProductFormModal.tsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useBusiness } from '../../../contexts/BusinessContext';
import { useUI } from '../../../contexts/UIContext';
import { Modal } from '../../ui/Modal';
import { FormField } from '../../ui/FormField';
import { getStorage, ref, uploadBytes, deleteObject, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import imageCompression from 'browser-image-compression';

// Hook do Banco Local
import { useLocalProducts } from '../../../hooks/useLocalProducts';

// Ícones e gráficos
import {
    Info, FileText, Beaker, BarChart2, UploadCloud, Loader, Trash2,
    PlusCircle, SlidersHorizontal, Check, X, ChevronDown, ChevronUp, Tag, Hash,
    Package, ChefHat, Zap, TrendingUp
} from 'lucide-react';
import { 
    ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
    BarChart, Bar
} from 'recharts';

import { Product, Supply, AddonGroup, Category, Subcategory } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';

// --- Subcomponentes Internos ---

const SettingsCheckbox = ({ id, label, checked, onChange, description }: { 
    id: string; 
    label: string; 
    checked: boolean; 
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    description?: string;
}) => (
    <label htmlFor={id} className="flex items-start justify-between cursor-pointer bg-gray-50 p-4 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors duration-200">
        <div className="flex-1">
            <span className="text-gray-800 font-medium block">{label}</span>
            {description && (
                <span className="text-sm text-gray-600 mt-1 block">{description}</span>
            )}
        </div>
        <div className="relative ml-4">
            <input id={id} name={id} type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
            <div className={`block w-14 h-8 rounded-full transition ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform ${checked ? 'translate-x-6' : ''}`}></div>
        </div>
    </label>
);

const RecipeTab = ({ recipe, supplies, onRecipeChange, onAddItem, onRemoveItem }: any) => {
    const totalCost = useMemo(() => {
        return recipe?.reduce((total: number, item: any) => {
            const supply = supplies.find((s: Supply) => s.id === item.supplyId);
            if (!supply || !supply.packageCost || !supply.packageSize) return total;
            const costPerUnit = supply.packageCost / (supply.packageSize || 1);
            return total + (costPerUnit * item.quantity);
        }, 0) || 0;
    }, [recipe, supplies]);

    return (
        <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-center">
                    <div>
                        <h4 className="font-semibold text-blue-800">Custo Total da Receita</h4>
                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalCost)}</p>
                    </div>
                    <Beaker className="text-blue-500" size={32} />
                </div>
            </div>

            <div className="p-4 border rounded-lg bg-white">
                <div className="grid grid-cols-10 gap-3 mb-3 text-sm font-semibold text-gray-700 sticky top-0 bg-white py-3 border-b">
                    <div className="col-span-5">Insumo / Ingrediente</div>
                    <div className="col-span-2">Quantidade</div>
                    <div className="col-span-2">Custo Unitário</div>
                    <div className="col-span-1"></div>
                </div>
                <div className="space-y-3">
                    {recipe?.map((item: any, index: number) => {
                        const selectedSupply = supplies.find((s: Supply) => s.id === item.supplyId);
                        const itemCost = selectedSupply && item.quantity && selectedSupply.packageCost && selectedSupply.packageSize 
                            ? (selectedSupply.packageCost / (selectedSupply.packageSize || 1)) * item.quantity 
                            : 0;

                        return (
                            <div key={index} className="grid grid-cols-10 gap-3 items-center p-3 rounded-lg bg-gray-50 border">
                                <div className="col-span-5">
                                    <select 
                                        value={item.supplyId} 
                                        onChange={(e) => onRecipeChange(index, 'supplyId', e.target.value)} 
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    >
                                        <option value="">Selecione um insumo</option>
                                        {supplies.map((s: Supply) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name} {s.packageCost ? `(${formatCurrency(s.packageCost / (s.packageSize || 1))}/${s.unit})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2 flex items-center gap-2">
                                    <input 
                                        type="number" 
                                        step="0.001" 
                                        min="0"
                                        value={item.quantity} 
                                        onChange={(e) => onRecipeChange(index, 'quantity', parseFloat(e.target.value) || 0)} 
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" 
                                    />
                                    <span className="text-xs text-gray-500 whitespace-nowrap">
                                        {item.unit || selectedSupply?.unit}
                                    </span>
                                </div>
                                <div className="col-span-2">
                                    <input 
                                        type="text" 
                                        value={formatCurrency(itemCost)} 
                                        readOnly 
                                        className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-700 font-semibold text-sm text-center" 
                                    />
                                </div>
                                <div className="col-span-1 flex justify-center">
                                    <button 
                                        type="button" 
                                        onClick={() => onRemoveItem(index)} 
                                        className="text-red-500 hover:text-red-700 p-1 transition-colors"
                                        title="Remover insumo"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <button 
                    type="button" 
                    onClick={onAddItem} 
                    className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                    <PlusCircle size={16} />
                    Adicionar Insumo
                </button>
            </div>
        </div>
    );
};

const FiscalTab = ({ formData, onFormChange }: any) => (
    <div className="space-y-6">
        <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-bold text-lg text-blue-800 mb-2">Informações Fiscais</h3>
            <p className="text-blue-700">Preencha os dados fiscais para emissão de notas e cupons fiscais.</p>
        </div>

        <div className="p-6 bg-white border border-gray-200 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField 
                    label="NCM" 
                    description="Nomenclatura Comum do Mercosul"
                >
                    <input 
                        name="ncm" 
                        value={formData.ncm || ''} 
                        onChange={onFormChange} 
                        placeholder="Ex: 2106.90.90"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    />
                </FormField>
                
                <FormField 
                    label="CEST" 
                    description="Código Especificador da Substituição Tributária"
                >
                    <input 
                        name="cest" 
                        value={formData.cest || ''} 
                        onChange={onFormChange} 
                        placeholder="Ex: 17.001.00"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    />
                </FormField>
                
                <FormField 
                    label="GTIN/EAN" 
                    description="Código de barras do produto"
                >
                    <input 
                        name="gtin" 
                        value={formData.gtin || ''} 
                        onChange={onFormChange} 
                        placeholder="Ex: 7891234567890"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    />
                </FormField>
                
                <FormField 
                    label="Origem da Mercadoria"
                    description="Origem do produto para cálculo de impostos"
                >
                    <select 
                        name="origin" 
                        value={formData.origin || '0'} 
                        onChange={onFormChange} 
                        className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="0">0 - Nacional</option>
                        <option value="1">1 - Estrangeira - Importação direta</option>
                        <option value="2">2 - Estrangeira - Adquirida no mercado interno</option>
                        <option value="3">3 - Nacional com 40%+ de conteúdo estrangeiro</option>
                        <option value="4">4 - Nacional via conformidade básica</option>
                        <option value="5">5 - Nacional com 70%+ do conteúdo nacional</option>
                        <option value="6">6 - Estrangeira sem similar nacional</option>
                        <option value="7">7 - Estrangeira via importação direta</option>
                        <option value="8">8 - Nacional com 70%+ conteúdo nacional</option>
                    </select>
                </FormField>
            </div>
        </div>
    </div>
);

const PerformanceTab = ({ product, performanceData }: { product: Product | null, performanceData: any }) => {
    
    // Estado de "Carregando" ou "Novo Produto"
    if (!product || !product.id) {
        return (
            <div className="p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-center">
                <BarChart2 size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Análise de Desempenho</h3>
                <p className="text-gray-500">Salve o produto para ver gráficos de vendas e métricas de lucratividade.</p>
            </div>
        );
    }
    
    // Recomendações da IA
    const AILowMarginRecommendation = () => {
        const margin = performanceData.avgMargin;
        if (margin <= 0 && performanceData.totalSold > 0 && product.costPrice > 0) {
            return (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <Zap className="text-red-500 h-5 w-5 mt-1 flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold text-red-800">Preço</h4>
                        <p className="text-red-700 text-sm">
                            A margem de {margin.toFixed(1)}% está negativa. Você está pagando para vender este produto. 
                            Revise o preço de custo e o preço de venda imediatamente.
                        </p>
                    </div>
                </div>
            );
        }
        if (margin > 0 && margin < 15) { // Limite de 15% para margem baixa
            const idealPrice = (product.costPrice || 0) / (1 - 0.35); // Sugere 35% de margem
            return (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                    <Zap className="text-yellow-500 h-5 w-5 mt-1 flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold text-yellow-800">Preço</h4>
                        <p className="text-yellow-700 text-sm">
                            A margem média de {margin.toFixed(1)}% está baixa. 
                            Baseado nos custos, um preço ideal para uma margem saudável (35%) seria <strong>{formatCurrency(idealPrice)}</strong>.
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    const AILowSalesRecommendation = () => {
        if (performanceData.totalSold > 0 && performanceData.totalSold < 10) { // Menos de 10 vendas
             return (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                    <TrendingUp className="text-blue-500 h-5 w-5 mt-1 flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold text-blue-800">Vendas</h4>
                        <p className="text-blue-700 text-sm">
                            Este produto tem poucas vendas ({performanceData.totalSold} un). 
                            Considere criar uma campanha de marketing ou vinculá-lo como "Cross-Sell" em outros produtos.
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Grid com 2 gráficos principais */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Card: Desempenho de Vendas */}
                <div className="p-6 bg-white border border-gray-200 rounded-lg">
                    <h3 className="font-bold text-lg text-gray-800 mb-4">Desempenho de Vendas</h3>
                    <div className="h-64">
                        {performanceData.salesOverTime.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={performanceData.salesOverTime} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                    <XAxis dataKey="date" fontSize={12} tickFormatter={(dateStr) => new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR')} />
                                    <YAxis fontSize={12} />
                                    <Tooltip formatter={(value, name) => [name === 'sales' ? `${value} un` : formatCurrency(value as number), name === 'sales' ? 'Vendas' : 'Receita']} />
                                    <Legend wrapperStyle={{ fontSize: '14px' }} />
                                    <Bar dataKey="sales" name="Vendas" fill="#3B82F6" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">Nenhum dado de venda</div>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4 border-t pt-4">
                        <div className="text-center">
                            <p className="text-sm text-gray-500">Total Vendido</p>
                            <p className="text-2xl font-bold text-gray-800">{performanceData.totalSold} un</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-500">Receita Total</p>
                            <p className="text-2xl font-bold text-green-600">{formatCurrency(performanceData.totalRevenue)}</p>
                        </div>
                    </div>
                </div>

                {/* Card: Análise de Lucratividade */}
                <div className="p-6 bg-white border border-gray-200 rounded-lg">
                    <h3 className="font-bold text-lg text-gray-800 mb-4">Análise de Lucratividade</h3>
                    <div className="h-64">
                         {performanceData.salesOverTime.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={performanceData.salesOverTime} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                    <XAxis dataKey="date" fontSize={12} tickFormatter={(dateStr) => new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR')} />
                                    <YAxis fontSize={12} tickFormatter={(value) => formatCurrency(value)} />
                                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                                    <Legend wrapperStyle={{ fontSize: '14px' }} />
                                    <Line type="monotone" dataKey="revenue" name="Receita" stroke="#8884d8" activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">Nenhum dado de lucratividade</div>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4 border-t pt-4">
                        <div className="text-center">
                            <p className="text-sm text-gray-500">Margem Média</p>
                            <p className={`text-2xl font-bold ${performanceData.avgMargin > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {performanceData.avgMargin.toFixed(1)}%
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-500">Lucro Total</p>
                            <p className={`text-2xl font-bold ${performanceData.totalProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(performanceData.totalProfit)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Recomendações Inteligentes */}
            <div className="space-y-4">
                 <h3 className="font-bold text-lg text-gray-800">Recomendações Inteligentes</h3>
                 <AILowMarginRecommendation />
                 <AILowSalesRecommendation />
                 {performanceData.totalSold === 0 && (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-start gap-3">
                        <Info className="text-gray-500 h-5 w-5 mt-1 flex-shrink-0" />
                        <div>
                            <h4 className="font-semibold text-gray-800">Sem dados</h4>
                            <p className="text-gray-700 text-sm">
                                Nenhuma venda foi registrada para este produto. 
                                {product.costPrice <= 0 && ' Cadastre o "Preço de Custo" para receber sugestões de preço.'}
                            </p>
                        </div>
                    </div>
                 )}
            </div>
        </div>
    );
};

const AddonsTab = ({ selectedGroupIds, onToggleGroup }: { 
    selectedGroupIds: string[];
    onToggleGroup: (groupId: string) => void;
}) => {
    const { addonGroups } = useBusiness();
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    const toggleExpandGroup = (groupId: string) => {
        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupId)) {
                newSet.delete(groupId);
            } else {
                newSet.add(groupId);
            }
            return newSet;
        });
    };

    const availableGroups = addonGroups.filter(group => group.isActive !== false);
    const selectedGroups = availableGroups.filter(group => selectedGroupIds.includes(group.id));

    if (availableGroups.length === 0) {
        return (
            <div className="p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-center">
                <SlidersHorizontal size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum Grupo de Complementos</h3>
                <p className="text-gray-500 mb-4">
                    Você ainda não criou nenhum grupo de complementos para vincular a este produto.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3">
                    <SlidersHorizontal className="text-blue-600" size={24} />
                    <div>
                        <h3 className="font-bold text-lg text-blue-800">Complementos do Produto</h3>
                        <p className="text-blue-700">
                            Vincule grupos de complementos para que os clientes possam personalizar este produto.
                        </p>
                    </div>
                </div>
            </div>

            {/* Grupos Selecionados */}
            {selectedGroups.length > 0 && (
                <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800 text-lg">Grupos Vinculados ({selectedGroups.length})</h4>
                    {selectedGroups.map(group => (
                        <div key={group.id} className="bg-white border border-green-200 rounded-lg shadow-sm">
                            <div className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <div>
                                        <h5 className="font-semibold text-gray-800">{group.name}</h5>
                                        <p className="text-sm text-gray-600">
                                            {group.items?.filter((item: any) => item.isAvailable).length || 0} itens disponíveis • 
                                            {group.isRequired ? ' Obrigatório' : ' Opcional'} • 
                                            Seleção: {group.minSelection}-{group.maxSelection}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => toggleExpandGroup(group.id)}
                                        className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                                    >
                                        {expandedGroups.has(group.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onToggleGroup(group.id)}
                                        className="p-2 text-red-500 hover:text-red-700 transition-colors"
                                        title="Desvincular grupo"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                            
                            {expandedGroups.has(group.id) && (
                                <div className="px-4 pb-4">
                                    <div className="border-t pt-4">
                                        <h6 className="font-medium text-gray-700 mb-2">Itens do Grupo:</h6>
                                        <div className="grid gap-2">
                                            {group.items?.filter((item: any) => item.isAvailable).map((item: any) => (
                                                <div key={item.id} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                                                    <span className="text-sm text-gray-700">{item.name}</span>
                                                    <span className="text-sm font-semibold text-gray-800">
                                                        +{formatCurrency(item.price || 0)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Grupos Disponíveis */}
            <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 text-lg">
                    Grupos Disponíveis ({availableGroups.length - selectedGroups.length})
                </h4>
                {availableGroups
                    .filter(group => !selectedGroupIds.includes(group.id))
                    .map(group => (
                        <div key={group.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:border-gray-300 transition-colors">
                            <div className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                                    <div>
                                        <h5 className="font-semibold text-gray-800">{group.name}</h5>
                                        <p className="text-sm text-gray-600">
                                            {group.items?.filter((item: any) => item.isAvailable).length || 0} itens • 
                                            {group.isRequired ? ' Obrigatório' : ' Opcional'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onToggleGroup(group.id)}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                    <Check size={16} />
                                    Vincular
                                </button>
                            </div>
                        </div>
                    ))
                }
            </div>
        </div>
    );
};

interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Product | null;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, initialData }) => {
    const { supplies, userProfile, onDeleteProductImage, businessId, addonGroups, categories, subcategories, sales } = useBusiness();
    const { saveProductLocal } = useLocalProducts();
    const { showAlert, showConfirmation } = useUI();
    const storage = getStorage();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState('dados');

    const getInitialState = useCallback((): Product => ({
        id: '',
        name: '', 
        salePrice: 0, 
        costPrice: 0, 
        stockQuantity: 0, 
        category: '',
        categoryId: '',
        subcategoryId: '',
        productStructure: userProfile?.businessProfile?.type === 'food_service' ? 'producao' : 'simples',
        showInCatalog: true, 
        allowCombination: false, 
        imageUrl: '', 
        imagePath: '',
        recipe: [], 
        variants: [], 
        businessId: businessId || '',
        ncm: '', 
        cest: '', 
        gtin: '', 
        origin: '0',
        addonGroupIds: [],
    }), [userProfile, businessId]);

    const [formData, setFormData] = useState<Product>(getInitialState());
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [availableSubcategories, setAvailableSubcategories] = useState<Subcategory[]>([]);

    useEffect(() => {
        if (isOpen) {
            const data = initialData ? { ...getInitialState(), ...initialData } : getInitialState();
            setFormData(data);
            setImagePreview(data.imageUrl || '');
            setImageFile(null);
            setIsUploading(false);
            setActiveTab('dados');
            
            // Carregar subcategorias iniciais se uma categoria já estiver definida
            if (data.categoryId && subcategories) {
                setAvailableSubcategories(subcategories.filter(sub => sub.categoryId === data.categoryId));
            } else {
                setAvailableSubcategories([]);
            }
        }
    }, [isOpen, initialData, getInitialState, subcategories]);

    const calculateCost = useCallback((recipe: any[]) => {
        if (!recipe) return 0;
        return recipe.reduce((total, item) => {
            const supply = supplies.find((s: Supply) => s.id === item.supplyId);
            if (!supply || !supply.packageCost || !supply.packageSize) return total;
            const costPerUnit = supply.packageCost / (supply.packageSize || 1);
            return total + (costPerUnit * item.quantity);
        }, 0);
    }, [supplies]);

    useEffect(() => {
        if (formData.productStructure === 'producao' && formData.recipe && formData.recipe.length > 0) {
            const newCost = calculateCost(formData.recipe);
            setFormData(prev => ({ ...prev, costPrice: newCost }));
        }
    }, [formData.recipe, formData.productStructure, calculateCost]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        const finalValue = type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value;
        
        // Lógica de atualização de categoria/subcategoria
        if (name === 'categoryId') {
            const selectedCat = categories.find(cat => cat.id === value);
            const newSubcategories = subcategories.filter(sub => sub.categoryId === value);
            
            setFormData(prev => ({
                ...prev,
                categoryId: value,
                category: selectedCat ? selectedCat.name : '',
                subcategoryId: ''
            }));
            setAvailableSubcategories(newSubcategories);
        } else {
            setFormData(prev => ({ ...prev, [name]: finalValue }));
        }
    };

    const handleToggleAddonGroup = (groupId: string) => {
        setFormData(prev => {
            const currentGroupIds = prev.addonGroupIds || [];
            if (currentGroupIds.includes(groupId)) {
                return { ...prev, addonGroupIds: currentGroupIds.filter(id => id !== groupId) };
            } else {
                return { ...prev, addonGroupIds: [...currentGroupIds, groupId] };
            }
        });
    };

    const handleFileChange = async (file: File) => {
        if (!file) return;
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1024, useWebWorker: true, fileType: 'image/webp' };
        try {
            showAlert("Otimizando imagem...", "info");
            const compressedFile = await imageCompression(file, options);
            setImageFile(compressedFile);
            setImagePreview(URL.createObjectURL(compressedFile));
        } catch (error) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveImage = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (!formData.imageUrl && !imagePreview) return;

        showConfirmation('Deseja remover a imagem deste produto?', async () => {
            try {
                setImageFile(null);
                setImagePreview('');

                if (formData.imagePath) {
                    await onDeleteProductImage(formData.imagePath);
                }

                setFormData(prev => ({ ...prev, imageUrl: '', imagePath: '' }));

            } catch (error) {
                console.error('Erro ao remover imagem:', error);
                setFormData(prev => ({ ...prev, imageUrl: '', imagePath: '' }));
            }
        });
    };

    const handleRecipeChange = (index: number, field: string, value: string | number) => {
        const newItems = [...(formData.recipe || [])];
        (newItems[index] as any)[field] = value;
        if (field === 'supplyId') {
            const selected = supplies.find((s: Supply) => s.id === value);
            if (selected) (newItems[index] as any).unit = selected.unit;
        }
        setFormData(prev => ({ ...prev, recipe: newItems }));
    };

    const addRecipeItem = () => setFormData(prev => ({ 
        ...prev, 
        recipe: [...(prev.recipe || []), { supplyId: '', quantity: 0, unit: '' }] 
    }));

    const removeRecipeItem = (index: number) => setFormData(prev => ({ 
        ...prev, 
        recipe: prev.recipe?.filter((_, i) => i !== index) 
    }));

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!businessId) {
            showAlert("Erro: ID do negócio não encontrado. Recarregue a página.", "error");
            return;
        }
        
        // Validação de categoria
        if (!formData.categoryId) {
            showAlert("Por favor, selecione uma categoria.", "error");
            setActiveTab('dados');
            return;
        }

        setIsUploading(true);
        
        // 1. Gera ID se for novo
        const finalProductId = initialData?.id || formData.id || uuidv4();
        
        // Prepara objeto para salvar
        let productToSave: Product = {
            ...formData,
            id: finalProductId,
            updatedAt: new Date().toISOString(),
            createdAt: initialData?.createdAt || new Date().toISOString()
        };

        try {
            // 2. Tenta Upload de Imagem (se houver internet)
            if (imageFile) {
                const filePath = `uploads/product_${finalProductId}_${Date.now()}.webp`;
                const storageRef = ref(storage, filePath);
                const metadata = { 
                    customMetadata: { 
                        productId: finalProductId, 
                        businessId: businessId 
                    } 
                };

                try {
                    await uploadBytes(storageRef, imageFile, metadata);
                    const downloadUrl = await getDownloadURL(storageRef);
                    
                    productToSave.imageUrl = downloadUrl;
                    productToSave.imagePath = filePath;
                } catch (uploadError) {
                    console.warn("Sem internet para upload de imagem. Salvando sem atualizar foto.", uploadError);
                    showAlert("Modo Offline: Produto salvo, mas a imagem pendente.", "info");
                    // Mantém a imagem antiga se existir
                    if (!productToSave.imageUrl && initialData?.imageUrl) {
                        productToSave.imageUrl = initialData.imageUrl;
                        productToSave.imagePath = initialData.imagePath;
                    }
                }
            }

            // 3. SALVA NO BANCO LOCAL (Instantâneo)
            await saveProductLocal(productToSave);

            showAlert("Produto salvo com sucesso!", "success");
            onClose();

        } catch (error) {
            console.error("Erro fatal ao salvar:", error);
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro.";
            showAlert(`Falha ao salvar: ${errorMessage}`, "error");
        } finally {
            setIsUploading(false);
        }
    };
    
    const productPerformanceData = useMemo(() => {
        if (!initialData || !initialData.id || !sales) {
            return {
                totalSold: 0,
                totalRevenue: 0,
                totalProfit: 0,
                avgMargin: 0,
                salesOverTime: [],
            };
        }

        const productId = initialData.id;
        
        // Filtra todas as vendas para encontrar itens deste produto
        const productSales = sales
            .flatMap(sale => 
                (Array.isArray(sale.items) ? sale.items : []).map(item => ({ 
                    ...item, 
                    saleDate: sale.finishedAt?.toDate() || new Date(sale.date || sale.createdAt) 
                }))
            )
            .filter(item => item.productId === productId);

        let totalSold = 0;
        let totalRevenue = 0;
        let totalProfit = 0;
        const salesByDay: { [key: string]: { date: string, sales: number, revenue: number } } = {};

        for (const item of productSales) {
            const salePrice = item.salePrice || 0;
            const costPrice = item.costPrice || initialData.costPrice || 0;
            const profit = salePrice - costPrice;
            const itemRevenue = salePrice * (item.qty || 1);
            const itemProfit = profit * (item.qty || 1);
            
            totalSold += (item.qty || 1);
            totalRevenue += itemRevenue;
            totalProfit += itemProfit;

            // Agrupa vendas por dia para o gráfico
            const day = item.saleDate.toISOString().split('T')[0];
            if (!salesByDay[day]) {
                salesByDay[day] = { date: day, sales: 0, revenue: 0 };
            }
            salesByDay[day].sales += (item.qty || 1);
            salesByDay[day].revenue += itemRevenue;
        }

        const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
        const salesOverTime = Object.values(salesByDay).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return {
            totalSold,
            totalRevenue,
            totalProfit,
            avgMargin,
            salesOverTime
        };

    }, [initialData, sales]);

    const TabButton = ({ tabId, label, icon }: { tabId: string, label: string, icon: React.ReactNode }) => (
        <button
            type="button"
            onClick={() => setActiveTab(tabId)}
            className={`flex items-center gap-2 whitespace-nowrap py-4 px-3 border-b-2 font-medium text-sm transition-colors ${activeTab === tabId
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
        >
            {icon} {label}
        </button>
    );

    const margin = formData.salePrice && formData.costPrice 
        ? ((formData.salePrice - formData.costPrice) / formData.salePrice) * 100 
        : 0;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Editar Produto' : 'Criar Novo Produto'} size="6xl">
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
                {/* Abas de Navegação */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <TabButton tabId="dados" label="Dados Cadastrais" icon={<Info size={16} />} />
                        <TabButton tabId="addons" label="Complementos" icon={<SlidersHorizontal size={16} />} />
                        <TabButton tabId="fiscal" label="Informações Fiscais" icon={<FileText size={16} />} />
                        {formData.productStructure === 'producao' && (
                            <TabButton tabId="receita" label="Ficha Técnica" icon={<Beaker size={16} />} />
                        )}
                        {initialData && (
                            <TabButton tabId="desempenho" label="Análise de Desempenho" icon={<BarChart2 size={16} />} />
                        )}
                    </nav>
                </div>

                <div className="py-6 flex-grow overflow-y-auto max-h-[60vh]">
                    {/* Aba de Dados Cadastrais */}
                    <div className={activeTab === 'dados' ? 'block space-y-6' : 'hidden'}>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1 space-y-6">
                                <FormField label="Imagem do Produto">
                                    <div
                                        onClick={() => !isUploading && fileInputRef.current?.click()}
                                        onDrop={(e) => { e.preventDefault(); e.dataTransfer.files && handleFileChange(e.dataTransfer.files[0]); }}
                                        onDragOver={(e) => e.preventDefault()}
                                        className="relative w-full aspect-square bg-gray-50 border-2 border-dashed rounded-lg flex items-center justify-center text-center text-gray-500 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
                                            className="hidden"
                                            accept="image/png, image/jpeg, image/webp"
                                            disabled={isUploading}
                                        />
                                        {isUploading ? (
                                            <div className="flex flex-col items-center text-blue-600">
                                                <Loader className="animate-spin" size={48} />
                                                <p className="mt-2 font-semibold">Enviando...</p>
                                            </div>
                                        ) : imagePreview ? (
                                            <>
                                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                                                <button type="button" onClick={handleRemoveImage} className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 shadow-lg hover:bg-red-700 transition-transform hover:scale-110">
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center p-4 text-gray-400">
                                                <UploadCloud size={40} />
                                                <p className="mt-2 font-semibold text-gray-600">Arraste a imagem aqui</p>
                                                <p className="text-sm">ou clique para selecionar</p>
                                            </div>
                                        )}
                                    </div>
                                </FormField>
                                
                                <div className="space-y-4 p-4 bg-slate-50 rounded-lg border">
                                    <SettingsCheckbox 
                                        id="showInCatalog" 
                                        label="Exibir na vitrine/cardápio online" 
                                        checked={formData.showInCatalog} 
                                        onChange={handleChange}
                                        description="Produto visível para clientes"
                                    />
                                    {userProfile?.businessProfile?.type === 'food_service' && (
                                        <SettingsCheckbox 
                                            id="allowCombination" 
                                            label="Permitir venda meio-a-meio" 
                                            checked={formData.allowCombination} 
                                            onChange={handleChange}
                                            description="Cliente pode combinar duas opções"
                                        />
                                    )}
                                </div>
                            </div>
                            
                            <div className="lg:col-span-2 space-y-6">
                                <FormField label="Nome do Produto *">
                                    <input 
                                        name="name" 
                                        value={formData.name} 
                                        onChange={handleChange} 
                                        placeholder="Ex: Pizza Margherita, Hamburguer Artesanal"
                                        className="w-full p-3 border border-gray-300 rounded-lg text-lg font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                                        required 
                                    />
                                </FormField>

                                {/* Campo Tipo de Produto */}
                                {userProfile?.businessProfile?.type === 'food_service' && (
                                    <FormField label="Tipo de Produto *">
                                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 rounded-lg bg-gray-100 p-2">
                                            <label className={`flex-1 text-center px-4 py-3 rounded-md cursor-pointer transition-all flex items-center gap-3 ${formData.productStructure === 'producao' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}>
                                                <input
                                                    type="radio"
                                                    name="productStructure"
                                                    value="producao"
                                                    checked={formData.productStructure === 'producao'}
                                                    onChange={handleChange}
                                                    className="sr-only"
                                                />
                                                <ChefHat className="text-blue-600" size={24} />
                                                <div>
                                                    <span className="font-semibold">Produção Própria</span>
                                                    <p className="text-xs text-gray-500 text-left">Ex: Pratos, Lanches (usa Ficha Técnica)</p>
                                                </div>
                                            </label>
                                            <label className={`flex-1 text-center px-4 py-3 rounded-md cursor-pointer transition-all flex items-center gap-3 ${formData.productStructure === 'simples' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}>
                                                <input
                                                    type="radio"
                                                    name="productStructure"
                                                    value="simples"
                                                    checked={formData.productStructure === 'simples'}
                                                    onChange={handleChange}
                                                    className="sr-only"
                                                />
                                                <Package className="text-green-600" size={24} />
                                                <div>
                                                    <span className="font-semibold">Revenda / Simples</span>
                                                    <p className="text-xs text-gray-500 text-left">Ex: Bebidas, Sobremesas (usa Estoque)</p>
                                                </div>
                                            </label>
                                        </div>
                                    </FormField>
                                )}
                                
                                <div className="grid grid-cols-2 gap-6">
                                    <FormField label="Preço de Venda (R$) *">
                                        <input 
                                            name="salePrice" 
                                            type="number" 
                                            step="0.01" 
                                            min="0"
                                            value={formData.salePrice} 
                                            onChange={handleChange} 
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                                            required 
                                        />
                                    </FormField>
                                    
                                    <FormField 
                                        label="Preço de Custo (R$)"
                                        description={formData.productStructure === 'producao' ? 'Calculado pela Ficha Técnica' : 'Custo de aquisição'}
                                    >
                                        <input 
                                            name="costPrice" 
                                            type="number" 
                                            step="0.01" 
                                            min="0"
                                            value={formData.costPrice} 
                                            onChange={handleChange} 
                                            className={`w-full p-3 border rounded-lg ${formData.productStructure === 'producao' ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'}`} 
                                            readOnly={formData.productStructure === 'producao'} 
                                        />
                                    </FormField>
                                    
                                    {/* Campo de Categoria */}
                                    <FormField label="Categoria *">
                                        <div className="flex items-center gap-2">
                                            <Tag className="text-gray-400 flex-shrink-0" size={20} />
                                            <select
                                                name="categoryId"
                                                value={formData.categoryId || ''}
                                                onChange={handleChange}
                                                className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                                                required
                                            >
                                                <option value="" disabled>Selecione uma categoria</option>
                                                {categories.map((cat: Category) => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {cat.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </FormField>
                                    
                                    {/* Campo de Subcategoria */}
                                    <FormField label="Subcategoria (Opcional)">
                                        <div className="flex items-center gap-2">
                                            <Hash className="text-gray-400 flex-shrink-0" size={20} />
                                            <select
                                                name="subcategoryId"
                                                value={formData.subcategoryId || ''}
                                                onChange={handleChange}
                                                className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                                                disabled={availableSubcategories.length === 0}
                                            >
                                                <option value="">
                                                    {availableSubcategories.length === 0 ? (formData.categoryId ? 'Nenhuma subcategoria' : 'Selecione uma categoria') : 'Opcional / Nenhuma'}
                                                </option>
                                                {availableSubcategories.map((sub: Subcategory) => (
                                                    <option key={sub.id} value={sub.id}>
                                                        {sub.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </FormField>
                                    
                                    {formData.productStructure === 'simples' && (
                                        <FormField label="Estoque Atual">
                                            <input 
                                                name="stockQuantity" 
                                                type="number" 
                                                min="0"
                                                value={formData.stockQuantity} 
                                                onChange={handleChange} 
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                                            />
                                        </FormField>
                                    )}
                                </div>
                                
                                {formData.salePrice > 0 && formData.costPrice > 0 && (
                                    <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h4 className="font-semibold text-gray-800">Margem de Lucro</h4>
                                                <p className="text-2xl font-bold text-green-600">{margin.toFixed(1)}%</p>
                                                <p className="text-sm text-gray-600">
                                                    Lucro: {formatCurrency(formData.salePrice - formData.costPrice)}
                                                </p>
                                            </div>
                                            <BarChart2 className="text-green-500" size={32} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Aba de Complementos */}
                    <div className={activeTab === 'addons' ? 'block' : 'hidden'}>
                        <AddonsTab 
                            selectedGroupIds={formData.addonGroupIds || []} 
                            onToggleGroup={handleToggleAddonGroup} 
                        />
                    </div>

                    <div className={activeTab === 'fiscal' ? 'block' : 'hidden'}>
                        <FiscalTab formData={formData} onFormChange={handleChange} />
                    </div>
                    
                    <div className={activeTab === 'receita' ? 'block' : 'hidden'}>
                        <RecipeTab 
                            recipe={formData.recipe} 
                            supplies={supplies} 
                            onRecipeChange={handleRecipeChange} 
                            onAddItem={addRecipeItem} 
                            onRemoveItem={removeRecipeItem} 
                        />
                    </div>
                    
                    {/* Aba de Análise de Desempenho */}
                    <div className={activeTab === 'desempenho' ? 'block' : 'hidden'}>
                        <PerformanceTab 
                            product={initialData} 
                            performanceData={productPerformanceData}
                        />
                    </div>
                </div>

                <div className="flex justify-end space-x-4 pt-5 mt-auto border-t">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        disabled={isUploading}
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        disabled={isUploading} 
                        className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                        {isUploading ? (
                            <>
                                <Loader className="animate-spin" size={18} />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Check size={18} />
                                {initialData ? 'Atualizar Produto' : 'Criar Produto'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
};