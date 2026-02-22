// src/components/business/retail/modules/products/forms/RetailProductForm.tsx

import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Trash2,
  Tag,
  Layers,
  Check,
  Info,
  Box,
  Barcode,
  RefreshCw,
  Truck,
  Settings,
  List,
  Link as LinkIcon,
  Printer,
  Image as ImageIcon,
  Loader,
  X,
  Search,
  Eye,
  EyeOff,
  Store as StoreIcon,
  ShoppingBag,
  Megaphone,
  PackageSearch,
  Sparkles, // ✅ IA
} from 'lucide-react';

import { v4 as uuidv4 } from 'uuid';
import imageCompression from 'browser-image-compression';

// ✅ Firebase Functions (IA)
import { getFunctions, httpsCallable } from 'firebase/functions';

import { Product } from '../../../../../../types';
import { Modal } from '../../../../../../components/ui/Modal';
import { FormField } from '../../../../../../components/ui/FormField';
import { LabelDesigner } from '../../labels/LabelDesigner';
import { LabelManager } from '../../labels/LabelManager';

import { useProductForm } from '../../../../../../hooks/useProductForm';
import { useBusiness } from '../../../../../../contexts/BusinessContext';

type TabId = 'dados' | 'grade' | 'fiscal';
type SubTabId = 'precos' | 'inventario' | 'entrega' | 'produtos' | 'atributos' | 'avancado';

type RetailVariant = {
  id?: string;
  name?: string;
  color?: string;
  size?: string;
  sku?: string;
  stock?: number;
  price?: number;
};

interface Props {
  initialData?: Product | null;
  onClose: () => void;
}

export const RetailProductForm: React.FC<Props> = ({ initialData, onClose }) => {
  const { categories, subcategories, products } = useBusiness();

  const { formData, handleChange, handleUpload, handleSubmit, saving, uploading } = useProductForm(
    initialData ?? undefined,
    onClose
  );

  const [activeTab, setActiveTab] = useState<TabId>('dados');
  const [activeSubTab, setActiveSubTab] = useState<SubTabId>('precos');
  const [showLabelDesigner, setShowLabelDesigner] = useState(false);
  const [grid, setGrid] = useState<{ color: string; sizes: string }>({ color: '', sizes: '' });

  // Relacionados UI
  const [relatedSearch, setRelatedSearch] = useState('');
  const [relatedPreviewOpen, setRelatedPreviewOpen] = useState(false);

  // ✅ IA
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const images: string[] = Array.isArray((formData as any).images) ? ((formData as any).images as string[]) : [];
  const variants: RetailVariant[] = Array.isArray((formData as any).variants)
    ? (((formData as any).variants as RetailVariant[]) ?? [])
    : [];

  const relatedProductIds: string[] = Array.isArray((formData as any).relatedProductIds)
    ? ((formData as any).relatedProductIds as string[])
    : [];

  // VISIBILIDADE (campos “profissionais”)
  const visibility = useMemo(() => {
    const d: any = formData;
    return {
      isActive: Boolean(d?.isActive ?? true),

      // catálogo
      showInCatalog: Boolean(d?.showInCatalog ?? false),

      // apenas físico / oculto / pré-venda / etc
      physicalOnly: Boolean(d?.physicalOnly ?? false),
      isHidden: Boolean(d?.isHidden ?? false),
      isPreorder: Boolean(d?.isPreorder ?? false),
      hideWhenOutOfStock: Boolean(d?.hideWhenOutOfStock ?? true),
      isSponsored: Boolean(d?.isSponsored ?? false),
    };
  }, [formData]);

  const categoryId: string = String((formData as any)?.categoryId ?? '');
  const subcategoryId: string = String((formData as any)?.subcategoryId ?? '');

  const activeCategories = useMemo(() => categories.filter((c) => c.isActive !== false), [categories]);
  const activeSubcategories = useMemo(() => subcategories.filter((s) => s.isActive !== false), [subcategories]);

  const subcategoriesForCategory = useMemo(() => {
    if (!categoryId) return activeSubcategories;
    return activeSubcategories.filter((s) => s.categoryId === categoryId);
  }, [activeSubcategories, categoryId]);

  const getCategoryName = (id?: string) => categories.find((c) => c.id === id)?.name ?? '';
  const getSubcategoryName = (id?: string) => subcategories.find((s) => s.id === id)?.name ?? '';

  // compat: se vier dado antigo (imageUrl/gallery) popular images
  useEffect(() => {
    const d: any = formData;
    if (d?.imageUrl && images.length === 0) handleChange('images' as any, [d.imageUrl]);
    if (Array.isArray(d?.gallery) && d.gallery.length) {
      const merged = Array.from(new Set([...(images || []), ...d.gallery.filter(Boolean)]));
      if (merged.length !== images.length) handleChange('images' as any, merged);
    }

    // defaults de visibilidade (não quebra dados antigos)
    // - isActive já existe
    // - showInCatalog: false por padrão (você decide no cadastro)
    // - hideWhenOutOfStock: true por padrão
    const dd: any = d;
    if (dd?.showInCatalog === undefined) handleChange('showInCatalog' as any, false);
    if (dd?.hideWhenOutOfStock === undefined) handleChange('hideWhenOutOfStock' as any, true);
    if (dd?.isHidden === undefined) handleChange('isHidden' as any, false);
    if (dd?.physicalOnly === undefined) handleChange('physicalOnly' as any, false);
    if (dd?.isPreorder === undefined) handleChange('isPreorder' as any, false);
    if (dd?.isSponsored === undefined) handleChange('isSponsored' as any, false);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ helper de alerta (mantém compatibilidade caso você já tenha um showAlert global no app)
  const showAlert = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const anyWin = window as any;
    if (typeof anyWin?.showAlert === 'function') return anyWin.showAlert(message, type);
    if (type === 'error') console.error(message);
    else console.log(message);
    // fallback simples:
    if (typeof anyWin?.toast === 'function') return anyWin.toast(message, type);
    try {
      alert(message);
    } catch {
      /* noop */
    }
  };

  // ✅ IA: gerar descrições com Cloud Function
  const handleGenerateWithAI = async () => {
    if (!v.name) {
      return showAlert('Introduza o nome do produto primeiro!', 'error');
    }

    setIsGeneratingAI(true);
    try {
      const functions = getFunctions();
      const generateContent = httpsCallable(functions, 'generateProductContent');

      const result = await generateContent({
        name: v.name,
        category: getCategoryName(categoryId),
        attributes: v.attributes,
      });

      const { shortDescription, description } = (result.data as any) ?? {};

      if (typeof shortDescription === 'string') handleChange('shortDescription' as any, shortDescription);
      if (typeof description === 'string') handleChange('description' as any, description);

      showAlert('Descrição gerada com sucesso!', 'success');
    } catch (error) {
      console.error(error);
      showAlert('Erro ao contactar a inteligência artificial.', 'error');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const processImage = async (file: File) => {
    const options = { maxSizeMB: 1, maxWidthOrHeight: 1280, useWebWorker: false as const };
    try {
      const compressed = await imageCompression(file, options);
      return new File([compressed], file.name, { type: (compressed as any).type || file.type });
    } catch {
      return file;
    }
  };

  const handleAddImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      const processed = await processImage(files[i]);
      await handleUpload(processed, true);
    }
  };

  const handleRemoveImage = (index: number) => {
    const next = images.filter((_, i) => i !== index);
    handleChange('images' as any, next);
    // capa compat (catálogo antigo usa imageUrl)
    handleChange('imageUrl' as any, next[0] || '');
  };

  const generateEAN13 = () => {
    const prefix = '7891000';
    const randomPart = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, '0');
    const code12 = prefix + randomPart;

    let sumOdd = 0;
    let sumEven = 0;
    for (let i = 0; i < 12; i++) {
      const digit = Number(code12[i]);
      if (i % 2 === 0) sumOdd += digit;
      else sumEven += digit;
    }
    const total = sumOdd + sumEven * 3;
    const remainder = total % 10;
    const checkDigit = remainder === 0 ? 0 : 10 - remainder;

    handleChange('gtin' as any, code12 + String(checkDigit));
  };

  const handleGenerateGrid = () => {
    if (!grid.color.trim() || !grid.sizes.trim()) return;

    const color = grid.color.trim();
    const sizes = grid.sizes
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const baseName = String((formData as any)?.name ?? '').trim();
    const baseSku = String((formData as any)?.sku ?? '').trim();
    const salePrice = Number((formData as any)?.salePrice ?? 0) || 0;

    const newVariants: RetailVariant[] = sizes.map((size) => ({
      id: uuidv4(),
      name: baseName ? `${baseName} - ${color} - ${size}` : `${color} - ${size}`,
      color,
      size,
      sku: baseSku ? `${baseSku}-${color.substring(0, 3).toUpperCase()}-${size}` : `${color}-${size}`,
      stock: 0,
      price: salePrice,
    }));

    handleChange('variants' as any, [...variants, ...newVariants] as any);
    setGrid({ color: '', sizes: '' });
  };

  const updateVariantStock = (idx: number, value: number) => {
    const next = [...variants];
    next[idx] = { ...next[idx], stock: value };
    handleChange('variants' as any, next as any);

    const total = next.reduce((acc, v) => acc + (Number(v.stock) || 0), 0);
    handleChange('stockQuantity' as any, total as any);
  };

  const removeVariant = (idx: number) => {
    const next = variants.filter((_, i) => i !== idx);
    handleChange('variants' as any, next as any);
    const total = next.reduce((acc, v) => acc + (Number(v.stock) || 0), 0);
    handleChange('stockQuantity' as any, total as any);
  };

  const canOpenLabels = Boolean(initialData?.id || (formData as any)?.id);

  const TabButton = ({ id, label, icon: Icon }: any) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
        activeTab === id
          ? 'border-blue-600 text-blue-600 bg-blue-50/50'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
      }`}
    >
      <Icon size={18} /> {label}
    </button>
  );

  const VerticalTabButton = ({ id, label, icon: Icon }: any) => (
    <button
      type="button"
      onClick={() => setActiveSubTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-l-4 ${
        activeSubTab === id
          ? 'border-blue-600 bg-white text-blue-700 shadow-sm'
          : 'border-transparent text-gray-500 hover:bg-gray-100'
      }`}
    >
      <Icon size={16} /> {label}
    </button>
  );

  const d: any = formData;
  const v = useMemo(
    () => ({
      name: d.name ?? '',
      shortDescription: d.shortDescription ?? '',
      description: d.description ?? '',
      salePrice: d.salePrice ?? 0,
      costPrice: d.costPrice ?? 0,
      promotionalPrice: d.promotionalPrice ?? '',
      promoStartDate: d.promoStartDate ?? '',
      promoEndDate: d.promoEndDate ?? '',
      sku: d.sku ?? '',
      gtin: d.gtin ?? '',
      stockQuantity: d.stockQuantity ?? 0,
      minStockLevel: d.minStockLevel ?? 5,
      weight: d.weight ?? '',
      length: d.length ?? '',
      width: d.width ?? '',
      height: d.height ?? '',
      purchaseNote: d.purchaseNote ?? '',
      ncm: d.ncm ?? '',
      cest: d.cest ?? '',
      origin: d.origin ?? '0',
      attributes: Array.isArray(d.attributes) ? d.attributes : [],
    }),
    [d]
  );

  // ------------------------
  // RELACIONADOS: helpers
  // ------------------------
  const currentProductId = String((initialData as any)?.id ?? (formData as any)?.id ?? '');
  const productsForRelatedPicker = useMemo(() => {
    const q = relatedSearch.trim().toLowerCase();

    const base = (products || [])
      .filter((p: any) => String(p?.id ?? '') !== currentProductId)
      .filter((p: any) => Boolean(p?.name));

    const filtered = q
      ? base.filter((p: any) => {
          const name = String(p.name ?? '').toLowerCase();
          const sku = String(p.sku ?? '').toLowerCase();
          const gtin = String(p.gtin ?? p.barcode ?? '').toLowerCase();
          return name.includes(q) || sku.includes(q) || gtin.includes(q);
        })
      : base;

    // prioriza já relacionados no topo
    return filtered.sort((a: any, b: any) => {
      const aRel = relatedProductIds.includes(a.id);
      const bRel = relatedProductIds.includes(b.id);
      if (aRel && !bRel) return -1;
      if (!aRel && bRel) return 1;
      return String(a.name ?? '').localeCompare(String(b.name ?? ''));
    });
  }, [products, relatedSearch, relatedProductIds, currentProductId]);

  const relatedSelectedProducts = useMemo(() => {
    const map = new Map((products || []).map((p: any) => [p.id, p]));
    return relatedProductIds.map((id) => map.get(id)).filter(Boolean);
  }, [products, relatedProductIds]);

  const toggleRelated = (pid: string) => {
    const next = relatedProductIds.includes(pid)
      ? relatedProductIds.filter((id) => id !== pid)
      : [...relatedProductIds, pid];

    handleChange('relatedProductIds' as any, next as any);
  };

  const clearRelated = () => handleChange('relatedProductIds' as any, [] as any);

  // ------------------------
  // CATEGORIA / SUBCATEGORIA
  // ------------------------
  const setCategory = (newCategoryId: string) => {
    handleChange('categoryId' as any, newCategoryId as any);

    // reseta subcategoria se não pertence
    const allowed = activeSubcategories.filter((s) => s.categoryId === newCategoryId).map((s) => s.id);
    if (subcategoryId && !allowed.includes(subcategoryId)) {
      handleChange('subcategoryId' as any, '' as any);
    }

    // compat antigo (campo category string)
    const cname = getCategoryName(newCategoryId);
    handleChange('category' as any, cname as any);
  };

  const setSubcategory = (newSubId: string) => {
    handleChange('subcategoryId' as any, newSubId as any);
  };

  return (
    <>
      <div className="flex flex-col h-full bg-white">
        <div className="flex border-b overflow-x-auto bg-gray-50">
          <TabButton id="dados" label="Dados do Produto" icon={Info} />
          <TabButton id="grade" label="Grade / Variações" icon={Layers} />
          <TabButton id="fiscal" label="Fiscal" icon={Barcode} />
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'dados' && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-6 border-b border-gray-200">
                <div className="lg:col-span-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-bold text-gray-700">Imagens</label>
                    <label className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer">
                      + Adicionar
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        onChange={(e) => handleAddImages(e.target.files)}
                      />
                    </label>
                  </div>

                  <div className="relative aspect-square bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                    {images[0] ? (
                      <img src={images[0]} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="text-gray-300" size={48} />
                    )}

                    <label className="absolute inset-0 cursor-pointer group">
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const processed = await processImage(file);
                          await handleUpload(processed, true);
                        }}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                        {uploading ? 'Enviando...' : images[0] ? 'Alterar capa' : 'Enviar capa'}
                      </div>
                    </label>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {images.slice(0, 6).map((url, idx) => (
                      <div key={`${url}-${idx}`} className="relative aspect-square border rounded-md overflow-hidden group">
                        <img src={url} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                          title="Remover"
                        >
                          <X size={12} />
                        </button>
                        {idx === 0 && (
                          <div className="absolute bottom-1 left-1 bg-white/90 text-[10px] px-1.5 py-0.5 rounded font-bold">
                            CAPA
                          </div>
                        )}
                      </div>
                    ))}

                    <label className="aspect-square border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 text-blue-500 transition">
                      {uploading ? <Loader className="animate-spin" size={18} /> : <Plus size={20} />}
                      <span className="text-[10px] font-bold mt-1">Add</span>
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        multiple
                        onChange={(e) => handleAddImages(e.target.files)}
                      />
                    </label>
                  </div>

                  <p className="text-xs text-gray-400">A primeira imagem é usada como capa.</p>

                  {/* Quick badges de visibilidade (resumo) */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-700">Status</span>
                      <span
                        className={`px-2 py-1 rounded font-bold ${
                          visibility.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {visibility.isActive ? 'ATIVO' : 'INATIVO'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {visibility.showInCatalog ? (
                        <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 font-bold inline-flex items-center gap-1">
                          <Eye size={12} /> CATÁLOGO
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded bg-gray-200 text-gray-700 font-bold inline-flex items-center gap-1">
                          <EyeOff size={12} /> FORA DO CATÁLOGO
                        </span>
                      )}

                      {visibility.physicalOnly && (
                        <span className="px-2 py-1 rounded bg-amber-100 text-amber-800 font-bold inline-flex items-center gap-1">
                          <StoreIcon size={12} /> SÓ LOJA FÍSICA
                        </span>
                      )}

                      {visibility.isHidden && (
                        <span className="px-2 py-1 rounded bg-gray-800 text-white font-bold inline-flex items-center gap-1">
                          <EyeOff size={12} /> OCULTO
                        </span>
                      )}

                      {visibility.isPreorder && (
                        <span className="px-2 py-1 rounded bg-purple-100 text-purple-800 font-bold inline-flex items-center gap-1">
                          <ShoppingBag size={12} /> PRÉ-VENDA
                        </span>
                      )}

                      {visibility.isSponsored && (
                        <span className="px-2 py-1 rounded bg-pink-100 text-pink-800 font-bold inline-flex items-center gap-1">
                          <Megaphone size={12} /> PATROCINADO
                        </span>
                      )}

                      {visibility.hideWhenOutOfStock && (
                        <span className="px-2 py-1 rounded bg-slate-100 text-slate-800 font-bold inline-flex items-center gap-1">
                          <PackageSearch size={12} /> OCULTAR SEM ESTOQUE
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <FormField label="Nome do Produto">
                    <input
                      className="w-full border p-2.5 rounded-lg font-medium text-gray-800"
                      value={v.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      required
                    />
                  </FormField>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Categoria (Departamento)">
                      <select
                        className="w-full border p-2.5 rounded-lg bg-white"
                        value={categoryId}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        <option value="">Selecione...</option>
                        {activeCategories.map((c: any) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField label="Subcategoria">
                      <select
                        className="w-full border p-2.5 rounded-lg bg-white"
                        value={subcategoryId}
                        onChange={(e) => setSubcategory(e.target.value)}
                        disabled={!categoryId}
                        title={!categoryId ? 'Selecione uma categoria antes' : ''}
                      >
                        <option value="">{categoryId ? 'Selecione...' : 'Selecione a categoria'}</option>
                        {subcategoriesForCategory.map((s: any) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </div>

                  {/* ✅ Breve Descrição com botão de IA */}
                  <FormField label="Breve Descrição">
                    <div className="relative">
                      <textarea
                        className="w-full border p-2.5 rounded-lg h-20 resize-none text-sm pr-10"
                        value={v.shortDescription}
                        onChange={(e) => handleChange('shortDescription' as any, e.target.value)}
                        placeholder="A IA pode gerar isto para si..."
                      />
                      <button
                        type="button"
                        onClick={handleGenerateWithAI}
                        disabled={isGeneratingAI}
                        className="absolute right-2 top-2 p-1.5 bg-purple-50 text-purple-600 rounded-md hover:bg-purple-100 transition-colors disabled:opacity-50"
                        title="Gerar com IA"
                      >
                        {isGeneratingAI ? <Loader className="animate-spin" size={16} /> : <Sparkles size={16} />}
                      </button>
                    </div>
                  </FormField>

                  <FormField label="Descrição Completa">
                    <div className="relative">
                      <textarea
                        className="w-full border p-2.5 rounded-lg h-32 text-sm"
                        value={v.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        placeholder="Destaque as qualidades do produto..."
                      />
                      {/* opcional: você pode duplicar o botão aqui, se quiser */}
                    </div>
                  </FormField>
                </div>
              </div>

              <div className="flex h-full min-h-[420px] border border-gray-200 rounded-lg overflow-hidden">
                <div className="w-64 bg-gray-50 border-r border-gray-200 pt-4 flex-shrink-0">
                  <VerticalTabButton id="precos" label="Preços e Promoção" icon={Tag} />
                  <VerticalTabButton id="inventario" label="Inventário" icon={Box} />
                  <VerticalTabButton id="entrega" label="Entrega" icon={Truck} />
                  <VerticalTabButton id="produtos" label="Produtos Relacionados" icon={LinkIcon} />
                  <VerticalTabButton id="atributos" label="Atributos" icon={List} />
                  <VerticalTabButton id="avancado" label="Visibilidade" icon={Settings} />
                </div>

                <div className="flex-1 p-6 overflow-y-auto bg-white">
                  {activeSubTab === 'precos' && (
                    <div className="space-y-6 max-w-2xl">
                      <div className="grid grid-cols-2 gap-6">
                        <FormField label="Preço de Venda (R$)">
                          <input
                            type="number"
                            step="0.01"
                            className="w-full border p-2 rounded font-bold text-lg"
                            value={v.salePrice}
                            onChange={(e) => handleChange('salePrice' as any, Number(e.target.value) as any)}
                            required
                          />
                        </FormField>
                        <FormField label="Preço de Custo (R$)">
                          <input
                            type="number"
                            step="0.01"
                            className="w-full border p-2 rounded"
                            value={v.costPrice}
                            onChange={(e) => handleChange('costPrice' as any, Number(e.target.value) as any)}
                          />
                        </FormField>
                      </div>

                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                          <Tag size={16} /> Promoção Agendada
                        </h4>
                        <div className="grid grid-cols-3 gap-4">
                          <FormField label="Preço Promo">
                            <input
                              type="number"
                              step="0.01"
                              className="w-full border p-2 rounded bg-white"
                              value={v.promotionalPrice}
                              onChange={(e) => handleChange('promotionalPrice' as any, e.target.value)}
                            />
                          </FormField>
                          <FormField label="Início">
                            <input
                              type="date"
                              className="w-full border p-2 rounded bg-white"
                              value={v.promoStartDate}
                              onChange={(e) => handleChange('promoStartDate' as any, e.target.value)}
                            />
                          </FormField>
                          <FormField label="Fim">
                            <input
                              type="date"
                              className="w-full border p-2 rounded bg-white"
                              value={v.promoEndDate}
                              onChange={(e) => handleChange('promoEndDate' as any, e.target.value)}
                            />
                          </FormField>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSubTab === 'inventario' && (
                    <div className="space-y-6 max-w-2xl">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField label="SKU">
                          <input
                            className="w-full border p-2 rounded"
                            value={v.sku}
                            onChange={(e) => handleChange('sku' as any, e.target.value)}
                          />
                        </FormField>

                        <FormField label="Categoria (texto legado)">
                          <input
                            className="w-full border p-2 rounded bg-gray-50"
                            value={String((formData as any)?.category ?? getCategoryName(categoryId) ?? '')}
                            onChange={(e) => handleChange('category' as any, e.target.value)}
                            title="Compatibilidade com versões antigas. O catálogo novo deve usar categoryId/subcategoryId."
                          />
                        </FormField>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <Barcode size={16} /> Código de Barras (GTIN/EAN)
                          </label>
                          <button
                            type="button"
                            onClick={generateEAN13}
                            className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold bg-blue-100 px-2 py-1 rounded"
                          >
                            <RefreshCw size={12} /> Gerar
                          </button>
                        </div>
                        <input
                          className="w-full border p-2 rounded font-mono text-lg tracking-widest bg-white"
                          value={v.gtin}
                          onChange={(e) => handleChange('gtin' as any, e.target.value)}
                          maxLength={13}
                        />
                      </div>

                      <FormField label="Estoque">
                        <div className="flex items-center gap-4 border p-3 rounded bg-gray-50">
                          <input
                            type="number"
                            className="w-32 border p-2 rounded bg-white"
                            value={v.stockQuantity}
                            onChange={(e) => handleChange('stockQuantity' as any, Number(e.target.value) as any)}
                          />
                          <span className="text-sm text-gray-500">Unidades disponíveis</span>
                          <div className="ml-auto flex items-center gap-2">
                            <span className="text-xs text-gray-400">Mínimo:</span>
                            <input
                              type="number"
                              className="w-20 border p-2 rounded bg-white"
                              value={v.minStockLevel}
                              onChange={(e) => handleChange('minStockLevel' as any, Number(e.target.value) as any)}
                            />
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          {visibility.hideWhenOutOfStock ? (
                            <span>
                              ⚙️ <b>Ocultar automaticamente</b> quando estoque for 0 (se estiver marcado em Visibilidade).
                            </span>
                          ) : (
                            <span>Produto continua visível mesmo sem estoque.</span>
                          )}
                        </div>
                      </FormField>
                    </div>
                  )}

                  {activeSubTab === 'entrega' && (
                    <div className="space-y-6 max-w-2xl">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField label="Peso (kg)">
                          <input
                            type="number"
                            step="0.001"
                            className="w-full border p-2 rounded"
                            value={v.weight}
                            onChange={(e) => handleChange('weight' as any, e.target.value)}
                          />
                        </FormField>
                        <FormField label="Comprimento (cm)">
                          <input
                            type="number"
                            step="0.1"
                            className="w-full border p-2 rounded"
                            value={v.length}
                            onChange={(e) => handleChange('length' as any, e.target.value)}
                          />
                        </FormField>
                        <FormField label="Largura (cm)">
                          <input
                            type="number"
                            step="0.1"
                            className="w-full border p-2 rounded"
                            value={v.width}
                            onChange={(e) => handleChange('width' as any, e.target.value)}
                          />
                        </FormField>
                        <FormField label="Altura (cm)">
                          <input
                            type="number"
                            step="0.1"
                            className="w-full border p-2 rounded"
                            value={v.height}
                            onChange={(e) => handleChange('height' as any, e.target.value)}
                          />
                        </FormField>
                      </div>
                      <FormField label="Nota de Compra / Interno">
                        <textarea
                          className="w-full border p-2.5 rounded-lg h-24 resize-none text-sm"
                          value={v.purchaseNote}
                          onChange={(e) => handleChange('purchaseNote' as any, e.target.value)}
                        />
                      </FormField>
                    </div>
                  )}

                  {activeSubTab === 'atributos' && (
                    <div className="space-y-4 max-w-2xl">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-gray-800">Atributos</h3>
                        <button
                          type="button"
                          className="text-xs font-bold text-blue-600 hover:text-blue-800"
                          onClick={() => handleChange('attributes' as any, [...v.attributes, { name: '', options: '' }])}
                        >
                          + Adicionar
                        </button>
                      </div>

                      {v.attributes.length === 0 ? (
                        <div className="text-sm text-gray-400 bg-gray-50 border rounded-lg p-4">
                          Nenhum atributo adicionado.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {v.attributes.map((a: any, idx: number) => (
                            <div key={idx} className="border rounded-lg p-3 bg-white">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs font-bold text-gray-500 block mb-1">Nome</label>
                                  <input
                                    className="w-full border p-2 rounded"
                                    value={a.name}
                                    onChange={(e) => {
                                      const next = [...v.attributes];
                                      next[idx] = { ...next[idx], name: e.target.value };
                                      handleChange('attributes' as any, next);
                                    }}
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-bold text-gray-500 block mb-1">
                                    Opções (vírgula)
                                  </label>
                                  <input
                                    className="w-full border p-2 rounded"
                                    value={a.options}
                                    onChange={(e) => {
                                      const next = [...v.attributes];
                                      next[idx] = { ...next[idx], options: e.target.value };
                                      handleChange('attributes' as any, next);
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="mt-2 flex justify-end">
                                <button
                                  type="button"
                                  className="text-red-600 hover:bg-red-50 px-2 py-1 rounded text-sm flex items-center gap-1"
                                  onClick={() =>
                                    handleChange('attributes' as any, v.attributes.filter((_: any, i: number) => i !== idx))
                                  }
                                >
                                  <Trash2 size={16} /> Remover
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeSubTab === 'avancado' && (
                    <div className="max-w-2xl space-y-6">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h3 className="font-bold text-gray-900 mb-1">Visibilidade (Profissional)</h3>
                        <p className="text-sm text-gray-600">
                          Essas opções controlam como o produto aparece no catálogo online e no PDV.
                        </p>
                      </div>

                      {/* 1) Ativo/Inativo */}
                      <FormField label="Produto Ativo">
                        <div className="flex items-center gap-3 bg-gray-50 border rounded-lg p-3">
                          <input
                            type="checkbox"
                            checked={visibility.isActive}
                            onChange={(e) => handleChange('isActive' as any, e.target.checked as any)}
                          />
                          <div className="flex-1">
                            <div className="text-sm font-bold text-gray-800">
                              {visibility.isActive ? 'Ativo' : 'Inativo'}
                            </div>
                            <div className="text-xs text-gray-500">Inativo não deve ser vendido nem exibido.</div>
                          </div>
                        </div>
                      </FormField>

                      {/* 2) Mostrar no catálogo */}
                      <FormField label="Mostrar no Catálogo Online">
                        <div className="flex items-center gap-3 bg-gray-50 border rounded-lg p-3">
                          <input
                            type="checkbox"
                            checked={visibility.showInCatalog}
                            onChange={(e) => handleChange('showInCatalog' as any, e.target.checked as any)}
                          />
                          <div className="flex-1">
                            <div className="text-sm font-bold text-gray-800">
                              {visibility.showInCatalog ? 'Visível no catálogo' : 'Não aparece no catálogo'}
                            </div>
                            <div className="text-xs text-gray-500">
                              Seu catálogo público filtra por <b>showInCatalog == true</b>.
                            </div>
                          </div>
                        </div>
                      </FormField>

                      {/* 3) Loja física apenas */}
                      <FormField label="Mostrar só na Loja Física (PDV)">
                        <div className="flex items-center gap-3 bg-gray-50 border rounded-lg p-3">
                          <input
                            type="checkbox"
                            checked={visibility.physicalOnly}
                            onChange={(e) => handleChange('physicalOnly' as any, e.target.checked as any)}
                          />
                          <div className="flex-1">
                            <div className="text-sm font-bold text-gray-800">
                              {visibility.physicalOnly ? 'Apenas loja física' : 'Online + loja física'}
                            </div>
                            <div className="text-xs text-gray-500">
                              Se marcado, o catálogo deve filtrar <b>physicalOnly == false</b>.
                            </div>
                          </div>
                        </div>
                      </FormField>

                      {/* 4) Oculto */}
                      <FormField label="Produto Oculto">
                        <div className="flex items-center gap-3 bg-gray-50 border rounded-lg p-3">
                          <input
                            type="checkbox"
                            checked={visibility.isHidden}
                            onChange={(e) => handleChange('isHidden' as any, e.target.checked as any)}
                          />
                          <div className="flex-1">
                            <div className="text-sm font-bold text-gray-800">
                              {visibility.isHidden ? 'Oculto' : 'Visível'}
                            </div>
                            <div className="text-xs text-gray-500">
                              Oculto sempre fica fora do catálogo, mesmo se “Mostrar no Catálogo” estiver ligado.
                            </div>
                          </div>
                        </div>
                      </FormField>

                      {/* 5) Pré-venda */}
                      <FormField label="Pré-venda">
                        <div className="flex items-center gap-3 bg-gray-50 border rounded-lg p-3">
                          <input
                            type="checkbox"
                            checked={visibility.isPreorder}
                            onChange={(e) => handleChange('isPreorder' as any, e.target.checked as any)}
                          />
                          <div className="flex-1">
                            <div className="text-sm font-bold text-gray-800">
                              {visibility.isPreorder ? 'Produto em pré-venda' : 'Venda normal'}
                            </div>
                            <div className="text-xs text-gray-500">
                              Você pode usar isso no catálogo para exibir selo “Pré-venda”.
                            </div>
                          </div>
                        </div>
                      </FormField>

                      {/* 6) Ocultar quando sem estoque */}
                      <FormField label="Sem estoque → ocultar automaticamente">
                        <div className="flex items-center gap-3 bg-gray-50 border rounded-lg p-3">
                          <input
                            type="checkbox"
                            checked={visibility.hideWhenOutOfStock}
                            onChange={(e) => handleChange('hideWhenOutOfStock' as any, e.target.checked as any)}
                          />
                          <div className="flex-1">
                            <div className="text-sm font-bold text-gray-800">
                              {visibility.hideWhenOutOfStock ? 'Oculta quando estoque = 0' : 'Permite sem estoque'}
                            </div>
                            <div className="text-xs text-gray-500">
                              Catálogo deve filtrar no frontend: se <b>hideWhenOutOfStock</b> e{' '}
                              <b>stockQuantity &lt;= 0</b>, não renderiza.
                            </div>
                          </div>
                        </div>
                      </FormField>

                      {/* 7) Patrocinado */}
                      <FormField label="Patrocinado">
                        <div className="flex items-center gap-3 bg-gray-50 border rounded-lg p-3">
                          <input
                            type="checkbox"
                            checked={visibility.isSponsored}
                            onChange={(e) => handleChange('isSponsored' as any, e.target.checked as any)}
                          />
                          <div className="flex-1">
                            <div className="text-sm font-bold text-gray-800">
                              {visibility.isSponsored ? 'Produto patrocinado' : 'Normal'}
                            </div>
                            <div className="text-xs text-gray-500">
                              Use isso no catálogo para ordenar/realçar (ex.: aparece primeiro).
                            </div>
                          </div>
                        </div>
                      </FormField>

                      {/* Guard rails */}
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
                        <div className="font-bold mb-1">Regras recomendadas no catálogo</div>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>isActive == true</li>
                          <li>showInCatalog == true</li>
                          <li>isHidden == false</li>
                          <li>physicalOnly == false</li>
                          <li>Se hideWhenOutOfStock e stockQuantity &lt;= 0, ocultar</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {activeSubTab === 'produtos' && (
                    <div className="space-y-4 max-w-3xl">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-bold text-gray-900">Produtos Relacionados</h3>
                          <p className="text-sm text-gray-600">
                            Selecione itens para sugerir no detalhe do produto (cross-sell).
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setRelatedPreviewOpen((s) => !s)}
                            className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
                          >
                            {relatedPreviewOpen ? 'Ocultar seleção' : 'Ver seleção'} ({relatedProductIds.length})
                          </button>
                          <button
                            type="button"
                            onClick={clearRelated}
                            className="px-3 py-2 text-sm border border-red-200 text-red-700 rounded-lg hover:bg-red-50"
                            disabled={relatedProductIds.length === 0}
                          >
                            Limpar
                          </button>
                        </div>
                      </div>

                      {relatedPreviewOpen && (
                        <div className="border rounded-lg p-3 bg-white">
                          {relatedSelectedProducts.length === 0 ? (
                            <div className="text-sm text-gray-500">Nenhum produto relacionado selecionado.</div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {relatedSelectedProducts.map((p: any) => (
                                <div key={p.id} className="flex items-center gap-3 border rounded-lg p-2 bg-gray-50">
                                  <div className="w-10 h-10 rounded bg-white border flex items-center justify-center overflow-hidden">
                                    <img
                                      src={String(p.imageUrl ?? (Array.isArray(p.images) ? p.images?.[0] : '') ?? '')}
                                      onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                                      className="w-full h-full object-cover"
                                    />
                                    <ShoppingBag className="text-gray-300" size={18} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-gray-800 truncate">{p.name}</div>
                                    <div className="text-xs text-gray-500 truncate">
                                      {getCategoryName(p.categoryId) || p.category || '—'}
                                      {p.subcategoryId ? ` • ${getSubcategoryName(p.subcategoryId)}` : ''}
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => toggleRelated(p.id)}
                                    className="text-red-600 hover:bg-red-50 p-2 rounded"
                                    title="Remover"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          className="w-full border rounded-lg pl-10 pr-3 py-2"
                          placeholder="Buscar produto por nome, SKU ou GTIN..."
                          value={relatedSearch}
                          onChange={(e) => setRelatedSearch(e.target.value)}
                        />
                      </div>

                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 border-b px-3 py-2 text-xs font-bold text-gray-600">
                          Clique para adicionar/remover
                        </div>
                        <div className="max-h-[340px] overflow-y-auto">
                          {productsForRelatedPicker.length === 0 ? (
                            <div className="p-4 text-sm text-gray-500">Nenhum produto encontrado.</div>
                          ) : (
                            <ul className="divide-y">
                              {productsForRelatedPicker.slice(0, 200).map((p: any) => {
                                const selected = relatedProductIds.includes(p.id);
                                const thumb = String(p.imageUrl ?? (Array.isArray(p.images) ? p.images?.[0] : '') ?? '');

                                return (
                                  <li key={p.id}>
                                    <button
                                      type="button"
                                      onClick={() => toggleRelated(p.id)}
                                      className={`w-full flex items-center gap-3 px-3 py-2 text-left transition ${
                                        selected ? 'bg-blue-50' : 'hover:bg-gray-50'
                                      }`}
                                    >
                                      <div className="w-10 h-10 rounded bg-white border flex items-center justify-center overflow-hidden">
                                        {thumb ? (
                                          <img src={thumb} className="w-full h-full object-cover" />
                                        ) : (
                                          <ShoppingBag className="text-gray-300" size={18} />
                                        )}
                                      </div>

                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-gray-800 truncate">{p.name}</div>
                                        <div className="text-xs text-gray-500 truncate">
                                          {getCategoryName(p.categoryId) || p.category || '—'}
                                          {p.subcategoryId ? ` • ${getSubcategoryName(p.subcategoryId)}` : ''}
                                          {p.sku ? ` • SKU: ${p.sku}` : ''}
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        {selected ? (
                                          <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded">
                                            Selecionado
                                          </span>
                                        ) : (
                                          <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                            Adicionar
                                          </span>
                                        )}
                                      </div>
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-gray-500">
                        Selecionados: <b>{relatedProductIds.length}</b>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'grade' && (
            <div className="p-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                  <Layers size={18} /> Gerador de Grade
                </h3>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-gray-600">Cor</label>
                    <input
                      className="w-full border p-2 rounded"
                      value={grid.color}
                      onChange={(e) => setGrid((p) => ({ ...p, color: e.target.value }))}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-bold text-gray-600">Tamanhos</label>
                    <input
                      className="w-full border p-2 rounded"
                      value={grid.sizes}
                      onChange={(e) => setGrid((p) => ({ ...p, sizes: e.target.value }))}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateGrid}
                    className="bg-blue-600 text-white px-4 py-2 rounded font-bold h-[42px]"
                  >
                    Gerar
                  </button>
                </div>
              </div>

              {variants.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-600">
                      <tr>
                        <th className="p-3">Variação</th>
                        <th className="p-3">SKU</th>
                        <th className="p-3">Estoque</th>
                        <th className="p-3 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map((vitem, i) => (
                        <tr key={vitem.id ?? i} className="border-t">
                          <td className="p-3 font-medium">{vitem.name || `Variação ${i + 1}`}</td>
                          <td className="p-3 text-gray-500">{vitem.sku || '-'}</td>
                          <td className="p-3 w-28">
                            <input
                              type="number"
                              className="w-full border rounded p-1 text-center"
                              value={Number(vitem.stock ?? 0)}
                              onChange={(e) => updateVariantStock(i, Number(e.target.value))}
                            />
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeVariant(i)}
                              className="text-red-500 hover:bg-red-50 p-1 rounded"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="bg-gray-50 border-t px-4 py-3 text-sm text-gray-600">
                    Estoque total (somado das variações):{' '}
                    <b>{variants.reduce((acc, vv) => acc + (Number(vv.stock) || 0), 0)}</b>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">Nenhuma variação criada.</div>
              )}
            </div>
          )}

          {activeTab === 'fiscal' && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
                <FormField label="NCM">
                  <input
                    className="w-full border p-2 rounded"
                    value={v.ncm}
                    onChange={(e) => handleChange('ncm' as any, e.target.value)}
                  />
                </FormField>
                <FormField label="CEST">
                  <input
                    className="w-full border p-2 rounded"
                    value={v.cest}
                    onChange={(e) => handleChange('cest' as any, e.target.value)}
                  />
                </FormField>
                <FormField label="Origem">
                  <select
                    className="w-full border p-2 rounded"
                    value={v.origin}
                    onChange={(e) => handleChange('origin' as any, e.target.value)}
                  >
                    <option value="0">0 - Nacional</option>
                    <option value="1">1 - Estrangeira (importação direta)</option>
                    <option value="2">2 - Estrangeira (adquirida no mercado interno)</option>
                  </select>
                </FormField>
                <FormField label="EAN/GTIN">
                  <input
                    className="w-full border p-2 rounded font-mono"
                    value={v.gtin}
                    onChange={(e) => handleChange('gtin' as any, e.target.value)}
                    maxLength={13}
                  />
                </FormField>
              </div>
            </div>
          )}
        </div>

        <div className="border-t p-4 flex justify-between items-center bg-gray-50 mt-auto">
          <div>
            {canOpenLabels && (
              <button
                type="button"
                onClick={() => setShowLabelDesigner(true)}
                className="flex items-center gap-2 px-4 py-2 text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg font-medium transition-colors"
              >
                <Printer size={18} /> Etiquetas
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded font-medium"
              disabled={saving || uploading}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || uploading}
              className="px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 flex items-center gap-2"
            >
              {saving || uploading ? <Loader className="animate-spin" size={18} /> : <Check size={18} />}
              {initialData ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DE ETIQUETAS - SINCRONIZADO */}
      {showLabelDesigner && canOpenLabels && (
        <Modal
          isOpen={showLabelDesigner}
          onClose={() => setShowLabelDesigner(false)}
          title={`Etiquetas: ${v.name}`}
          size="5xl"
        >
          <LabelManager product={{ ...initialData, ...formData } as Product} onClose={() => setShowLabelDesigner(false)} />
        </Modal>
      )}
    </>
  );
};

export default RetailProductForm;