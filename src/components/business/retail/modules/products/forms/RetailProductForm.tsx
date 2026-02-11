import React, { useState, useEffect } from 'react';
import { FormField } from '../../../../../../components/ui/FormField';
import { 
    Plus, Trash2, Tag, Layers, Save, X, 
    Loader, Image as ImageIcon, Check, 
    Info, Box, Barcode, RefreshCw, Truck, 
    Settings, List, Link as LinkIcon, Printer // <--- Ícone Printer
} from 'lucide-react';
import { Product } from '../../../../../../types';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { v4 as uuidv4 } from 'uuid';

// --- IMPORTAÇÕES PARA ETIQUETAS ---
import { Modal } from '../../../../../../components/ui/Modal';
import { LabelDesigner } from '../../labels/LabelDesigner'; // Ajuste o caminho se necessário (../../labels/LabelDesigner)

interface RetailProductFormProps {
    initialData?: Product;
    onSave: (data: any) => Promise<void>;
    onCancel: () => void;
    loading: boolean;
}

export const RetailProductForm: React.FC<RetailProductFormProps> = ({ 
    initialData, 
    onSave, 
    onCancel, 
    loading 
}) => {
    // --- ESTADOS GERAIS ---
    const [activeTab, setActiveTab] = useState('dados'); 
    const [activeSubTab, setActiveSubTab] = useState('precos'); 
    const [showLabelDesigner, setShowLabelDesigner] = useState(false); // <--- Estado do Modal de Etiquetas

    const [formData, setFormData] = useState({
        // Básico
        name: '',
        shortDescription: '', 
        description: '',
        category: '',
        
        // Preços
        salePrice: '' as string | number,
        promotionalPrice: '' as string | number,
        promoStartDate: '',
        promoEndDate: '',
        costPrice: '' as string | number,
        
        // Identificação & Estoque
        sku: '',
        gtin: '', 
        stockQuantity: 0,
        
        // Entrega
        weight: '' as string | number,
        length: '' as string | number,
        width: '' as string | number,
        height: '' as string | number,

        // Avançado
        purchaseNote: '',
        
        // Estruturas
        variants: [] as any[],
        attributes: [] as { name: string, options: string }[],
        
        // Fiscal
        ncm: '',
        cest: '',
        origin: '0'
    });

    // Imagens
    const [mainImage, setMainImage] = useState<{ file: File | null, preview: string }>({ file: null, preview: '' });
    const [galleryImages, setGalleryImages] = useState<{ file: File | null, preview: string }[]>([
        { file: null, preview: '' }, { file: null, preview: '' }, { file: null, preview: '' }
    ]);
    const [isUploading, setIsUploading] = useState(false);
    const [grid, setGrid] = useState({ color: '', sizes: '' });

    // --- CARREGAR DADOS ---
    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                shortDescription: (initialData as any).shortDescription || '',
                description: initialData.description || '',
                category: initialData.category || '',
                
                salePrice: initialData.salePrice || '',
                promotionalPrice: initialData.promotionalPrice || '',
                promoStartDate: initialData.promoStartDate || '',
                promoEndDate: initialData.promoEndDate || '',
                costPrice: initialData.costPrice || '',
                
                sku: initialData.sku || '',
                gtin: initialData.gtin || '',
                stockQuantity: initialData.stockQuantity || 0,
                
                weight: initialData.weight || '',
                length: initialData.length || '',
                width: initialData.width || '',
                height: initialData.height || '',
                
                purchaseNote: initialData.purchaseNote || '',
                
                variants: initialData.variants || [],
                attributes: initialData.attributes || [],
                
                ncm: initialData.ncm || '',
                cest: initialData.cest || '',
                origin: initialData.origin || '0'
            });

            if (initialData.imageUrl) setMainImage({ file: null, preview: initialData.imageUrl });
            if (initialData.gallery && Array.isArray(initialData.gallery)) {
                const loadedGallery = [
                    { file: null, preview: initialData.gallery[0] || '' },
                    { file: null, preview: initialData.gallery[1] || '' },
                    { file: null, preview: initialData.gallery[2] || '' }
                ];
                setGalleryImages(loadedGallery);
            }
        }
    }, [initialData]);

    // --- FUNÇÕES AUXILIARES ---
    const generateEAN13 = () => {
        const prefix = "7891000"; 
        const randomPart = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
        const code12 = prefix + randomPart;
        let sumOdd = 0; let sumEven = 0;
        for (let i = 0; i < 12; i++) {
            const digit = parseInt(code12[i]);
            if (i % 2 === 0) sumOdd += digit; else sumEven += digit;
        }
        const total = sumOdd + (sumEven * 3);
        const remainder = total % 10;
        const checkDigit = remainder === 0 ? 0 : 10 - remainder;
        setFormData(prev => ({ ...prev, gtin: code12 + checkDigit }));
    };

    const processImage = async (file: File) => {
        try { return await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1024, useWebWorker: true }); } catch { return file; }
    };

    const handleMainImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = await processImage(e.target.files[0]);
            setMainImage({ file, preview: URL.createObjectURL(file) });
        }
    };

    const handleGalleryImageChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = await processImage(e.target.files[0]);
            setGalleryImages(prev => {
                const newGallery = [...prev];
                newGallery[index] = { file, preview: URL.createObjectURL(file) };
                return newGallery;
            });
        }
    };

    const handleGenerateGrid = () => {
        if (!grid.color || !grid.sizes) return;
        const sizes = grid.sizes.split(',').map(s => s.trim());
        const newVariants = sizes.map(size => ({
            id: uuidv4(),
            name: `${formData.name} - ${grid.color} - ${size}`,
            color: grid.color,
            size: size,
            sku: `${formData.sku}-${grid.color.substring(0,3).toUpperCase()}-${size}`,
            stock: 0,
            price: Number(formData.salePrice) || 0
        }));
        setFormData(prev => ({ ...prev, variants: [...prev.variants, ...newVariants] }));
        setGrid({ color: '', sizes: '' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUploading(true);
        try {
            const storage = getStorage();
            const productId = initialData?.id || uuidv4();
            
            let mainImageUrl = initialData?.imageUrl || '';
            let mainImagePath = initialData?.imagePath || '';
            if (mainImage.file) {
                const path = `products/retail/${productId}/main_${Date.now()}.webp`;
                const storageRef = ref(storage, path);
                await uploadBytes(storageRef, mainImage.file);
                mainImageUrl = await getDownloadURL(storageRef);
                mainImagePath = path;
            }

            const galleryUrls: string[] = [];
            for (let i = 0; i < 3; i++) {
                const img = galleryImages[i];
                if (img.file) {
                    const path = `products/retail/${productId}/gallery_${i}_${Date.now()}.webp`;
                    const storageRef = ref(storage, path);
                    await uploadBytes(storageRef, img.file);
                    galleryUrls.push(await getDownloadURL(storageRef));
                } else if (img.preview && img.preview.startsWith('http')) {
                    galleryUrls.push(img.preview);
                }
            }

            const finalProduct = {
                ...initialData,
                ...formData,
                id: productId,
                salePrice: Number(formData.salePrice),
                promotionalPrice: Number(formData.promotionalPrice),
                costPrice: Number(formData.costPrice),
                stockQuantity: Number(formData.stockQuantity),
                weight: Number(formData.weight),
                length: Number(formData.length),
                width: Number(formData.width),
                height: Number(formData.height),
                imageUrl: mainImageUrl,
                imagePath: mainImagePath,
                gallery: galleryUrls,
                updatedAt: new Date().toISOString()
            };

            await onSave(finalProduct);
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar produto.");
        } finally {
            setIsUploading(false);
        }
    };

    // --- COMPONENTES UI ---
    const TabButton = ({ id, label, icon: Icon }: any) => (
        <button type="button" onClick={() => setActiveTab(id)} className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${activeTab === id ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
            <Icon size={18} /> {label}
        </button>
    );

    const VerticalTabButton = ({ id, label, icon: Icon }: any) => (
        <button type="button" onClick={() => setActiveSubTab(id)} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-l-4 ${activeSubTab === id ? 'border-blue-600 bg-white text-blue-700 shadow-sm' : 'border-transparent text-gray-500 hover:bg-gray-100'}`}>
            <Icon size={16} /> {label}
        </button>
    );

    return (
        <>
            <form onSubmit={handleSubmit} className="flex flex-col h-full bg-white">
                {/* ABAS PRINCIPAIS */}
                <div className="flex border-b overflow-x-auto bg-gray-50">
                    <TabButton id="dados" label="Dados do Produto" icon={Info} />
                    <TabButton id="grade" label="Grade / Variações" icon={Layers} />
                    <TabButton id="fiscal" label="Fiscal" icon={Barcode} />
                </div>

                {/* CONTEÚDO PRINCIPAL */}
                <div className="flex-1 overflow-y-auto">
                    
                    {activeTab === 'dados' && (
                        <div className="p-6 space-y-6">
                            {/* --- BLOCO SUPERIOR (IMAGENS + INFO BÁSICA) --- */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-6 border-b border-gray-200">
                                {/* Coluna da Esquerda: Imagens */}
                                <div className="lg:col-span-1 space-y-4">
                                    <label className="block text-sm font-bold text-gray-700">Imagem Principal</label>
                                    <div className="relative aspect-square bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden hover:border-blue-500 cursor-pointer group">
                                        {mainImage.preview ? (
                                            <img src={mainImage.preview} className="w-full h-full object-cover" />
                                        ) : <ImageIcon className="text-gray-300" size={48} />}
                                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleMainImageChange} />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">Alterar</div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[0, 1, 2].map(idx => (
                                            <div key={idx} className="relative aspect-square bg-white border border-dashed border-gray-300 rounded-md flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-500">
                                                {galleryImages[idx].preview ? (
                                                    <img src={galleryImages[idx].preview} className="w-full h-full object-cover" />
                                                ) : <Plus className="text-gray-300" />}
                                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleGalleryImageChange(idx, e)} />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Coluna da Direita: Campos de Texto */}
                                <div className="lg:col-span-2 space-y-4">
                                    <FormField label="Nome do Produto">
                                        <input className="w-full border p-2.5 rounded-lg font-medium text-gray-800" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="Ex: Camiseta Básica Algodão" />
                                    </FormField>
                                    <FormField label="Breve Descrição">
                                        <textarea className="w-full border p-2.5 rounded-lg h-20 resize-none text-sm" value={formData.shortDescription} onChange={e => setFormData({...formData, shortDescription: e.target.value})} placeholder="Resumo para vitrine..." />
                                    </FormField>
                                    <FormField label="Descrição Completa">
                                        <textarea className="w-full border p-2.5 rounded-lg h-32 text-sm" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Detalhes técnicos, material, cuidados..." />
                                    </FormField>
                                </div>
                            </div>

                            {/* --- BLOCO INFERIOR (ABAS VERTICAIS) --- */}
                            <div className="flex h-full min-h-[400px] border border-gray-200 rounded-lg overflow-hidden">
                                {/* Menu Vertical */}
                                <div className="w-64 bg-gray-50 border-r border-gray-200 pt-4 flex-shrink-0">
                                    <VerticalTabButton id="precos" label="Preços e Promoção" icon={Tag} />
                                    <VerticalTabButton id="inventario" label="Inventário" icon={Box} />
                                    <VerticalTabButton id="entrega" label="Entrega" icon={Truck} />
                                    <VerticalTabButton id="produtos" label="Produtos Relacionados" icon={LinkIcon} />
                                    <VerticalTabButton id="atributos" label="Atributos" icon={List} />
                                    <VerticalTabButton id="avancado" label="Avançado" icon={Settings} />
                                </div>

                                {/* Conteúdo das Sub-Abas */}
                                <div className="flex-1 p-6 overflow-y-auto bg-white">
                                    {activeSubTab === 'precos' && (
                                        <div className="space-y-6 max-w-2xl">
                                            <div className="grid grid-cols-2 gap-6">
                                                <FormField label="Preço de Venda (R$)">
                                                    <input type="number" step="0.01" className="w-full border p-2 rounded font-bold text-lg" value={formData.salePrice} onChange={e => setFormData({...formData, salePrice: e.target.value})} required />
                                                </FormField>
                                                <FormField label="Preço de Custo (R$)">
                                                    <input type="number" step="0.01" className="w-full border p-2 rounded" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: e.target.value})} />
                                                </FormField>
                                            </div>
                                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                                <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2"><Tag size={16}/> Promoção Agendada</h4>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <FormField label="Preço Promo">
                                                        <input type="number" step="0.01" className="w-full border p-2 rounded bg-white" value={formData.promotionalPrice} onChange={e => setFormData({...formData, promotionalPrice: e.target.value})} />
                                                    </FormField>
                                                    <FormField label="Início">
                                                        <input type="date" className="w-full border p-2 rounded bg-white" value={formData.promoStartDate} onChange={e => setFormData({...formData, promoStartDate: e.target.value})} />
                                                    </FormField>
                                                    <FormField label="Fim">
                                                        <input type="date" className="w-full border p-2 rounded bg-white" value={formData.promoEndDate} onChange={e => setFormData({...formData, promoEndDate: e.target.value})} />
                                                    </FormField>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeSubTab === 'inventario' && (
                                        <div className="space-y-6 max-w-2xl">
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField label="SKU (Stock Keeping Unit)">
                                                    <input className="w-full border p-2 rounded" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="Ex: CAM-001" />
                                                </FormField>
                                                <FormField label="Categoria">
                                                    <input className="w-full border p-2 rounded" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                                                </FormField>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                                        <Barcode size={16} /> Código de Barras (GTIN/EAN)
                                                    </label>
                                                    <button type="button" onClick={generateEAN13} className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold bg-blue-100 px-2 py-1 rounded">
                                                        <RefreshCw size={12} /> Gerar
                                                    </button>
                                                </div>
                                                <input className="w-full border p-2 rounded font-mono text-lg tracking-widest bg-white" value={formData.gtin} onChange={e => setFormData({...formData, gtin: e.target.value})} placeholder="0000000000000" maxLength={13} />
                                            </div>
                                            <FormField label="Gerenciar Estoque?">
                                                <div className="flex items-center gap-4 border p-3 rounded bg-gray-50">
                                                    <input type="number" className="w-32 border p-2 rounded bg-white" value={formData.stockQuantity} onChange={e => setFormData({...formData, stockQuantity: Number(e.target.value)})} placeholder="Qtd" />
                                                    <span className="text-sm text-gray-500">Unidades disponíveis</span>
                                                </div>
                                            </FormField>
                                        </div>
                                    )}

                                    {activeSubTab === 'entrega' && (
                                        <div className="space-y-6 max-w-2xl">
                                            <FormField label="Peso (kg)">
                                                <input type="number" step="0.001" className="w-full border p-2 rounded" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} placeholder="0.000" />
                                            </FormField>
                                            <h4 className="font-bold text-gray-700 pt-4 border-t">Dimensões da Embalagem</h4>
                                            <div className="grid grid-cols-3 gap-4">
                                                <FormField label="Comprimento (cm)">
                                                    <input type="number" className="w-full border p-2 rounded" value={formData.length} onChange={e => setFormData({...formData, length: e.target.value})} />
                                                </FormField>
                                                <FormField label="Largura (cm)">
                                                    <input type="number" className="w-full border p-2 rounded" value={formData.width} onChange={e => setFormData({...formData, width: e.target.value})} />
                                                </FormField>
                                                <FormField label="Altura (cm)">
                                                    <input type="number" className="w-full border p-2 rounded" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} />
                                                </FormField>
                                            </div>
                                        </div>
                                    )}

                                    {activeSubTab === 'produtos' && (
                                        <div className="text-center py-10 text-gray-500">
                                            <LinkIcon size={48} className="mx-auto mb-4 text-gray-300"/>
                                            <p>Upsell e Cross-sell (Em desenvolvimento)</p>
                                        </div>
                                    )}

                                    {activeSubTab === 'atributos' && (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h3 className="font-bold">Atributos Personalizados</h3>
                                                <button type="button" onClick={() => setFormData(prev => ({...prev, attributes: [...prev.attributes, {name: '', options: ''}]}))} className="text-blue-600 text-sm font-bold flex items-center gap-1"><Plus size={14}/> Adicionar</button>
                                            </div>
                                            {formData.attributes.map((attr, idx) => (
                                                <div key={idx} className="flex gap-2 items-start p-3 bg-gray-50 rounded border">
                                                    <div className="w-1/3">
                                                        <label className="text-xs font-bold text-gray-500">Nome</label>
                                                        <input className="w-full border p-1 rounded" placeholder="Ex: Tecido" value={attr.name} onChange={e => { const newAttrs = [...formData.attributes]; newAttrs[idx].name = e.target.value; setFormData({...formData, attributes: newAttrs}); }} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="text-xs font-bold text-gray-500">Valores (separados por |)</label>
                                                        <textarea className="w-full border p-1 rounded h-9 resize-none" placeholder="Algodão | Poliéster" value={attr.options} onChange={e => { const newAttrs = [...formData.attributes]; newAttrs[idx].options = e.target.value; setFormData({...formData, attributes: newAttrs}); }} />
                                                    </div>
                                                    <button type="button" onClick={() => setFormData(prev => ({...prev, attributes: prev.attributes.filter((_, i) => i !== idx)}))} className="text-red-500 mt-5"><Trash2 size={16}/></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {activeSubTab === 'avancado' && (
                                        <div className="space-y-4 max-w-2xl">
                                            <FormField label="Nota de Compra">
                                                <textarea className="w-full border p-2 rounded h-24" placeholder="Nota opcional para enviar ao cliente após a compra..." value={formData.purchaseNote} onChange={e => setFormData({...formData, purchaseNote: e.target.value})} />
                                            </FormField>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- OUTRAS ABAS PRINCIPAIS (GRADE, FISCAL) --- */}
                    {activeTab === 'grade' && (
                        <div className="p-6">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                                <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2"><Layers size={18}/> Gerador de Grade</h3>
                                <div className="flex gap-2 items-end">
                                    <div className="flex-1"><label className="text-xs font-bold text-gray-600">Cor</label><input className="w-full border p-2 rounded" placeholder="Ex: Azul" value={grid.color} onChange={e => setGrid({...grid, color: e.target.value})} /></div>
                                    <div className="flex-1"><label className="text-xs font-bold text-gray-600">Tamanhos</label><input className="w-full border p-2 rounded" placeholder="P, M, G" value={grid.sizes} onChange={e => setGrid({...grid, sizes: e.target.value})} /></div>
                                    <button type="button" onClick={handleGenerateGrid} className="bg-blue-600 text-white px-4 py-2 rounded font-bold h-[42px]">Gerar</button>
                                </div>
                            </div>
                            {formData.variants.length > 0 ? (
                                <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-100 text-gray-600"><tr><th className="p-3">Variação</th><th className="p-3">SKU</th><th className="p-3">Estoque</th><th className="p-3 text-center">Ação</th></tr></thead>
                                        <tbody>
                                            {formData.variants.map((v, i) => (
                                                <tr key={i} className="border-t">
                                                    <td className="p-3 font-medium">{v.name}</td>
                                                    <td className="p-3 text-gray-500">{v.sku}</td>
                                                    <td className="p-3 w-24"><input type="number" className="w-full border rounded p-1 text-center" value={v.stock} onChange={e => { const newVars = [...formData.variants]; newVars[i].stock = Number(e.target.value); const total = newVars.reduce((acc, curr) => acc + (curr.stock || 0), 0); setFormData({...formData, variants: newVars, stockQuantity: total}); }} /></td>
                                                    <td className="p-3 text-center"><button type="button" onClick={() => setFormData(prev => ({...prev, variants: prev.variants.filter((_, idx) => idx !== i)}))} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16}/></button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : <div className="text-center text-gray-400 py-8">Nenhuma variação criada.</div>}
                        </div>
                    )}

                    {activeTab === 'fiscal' && (
                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="NCM"><input className="w-full border p-2 rounded" value={formData.ncm} onChange={e => setFormData({...formData, ncm: e.target.value})} /></FormField>
                                <FormField label="CEST"><input className="w-full border p-2 rounded" value={formData.cest} onChange={e => setFormData({...formData, cest: e.target.value})} /></FormField>
                                <FormField label="EAN/GTIN"><input className="w-full border p-2 rounded" value={formData.gtin} onChange={e => setFormData({...formData, gtin: e.target.value})} /></FormField>
                                <FormField label="Origem">
                                    <select className="w-full border p-2 rounded" value={formData.origin} onChange={e => setFormData({...formData, origin: e.target.value})}>
                                        <option value="0">0 - Nacional</option>
                                        <option value="1">1 - Estrangeira</option>
                                    </select>
                                </FormField>
                            </div>
                        </div>
                    )}
                </div>

                {/* RODAPÉ FIXO */}
                <div className="border-t p-4 flex justify-between items-center bg-gray-50 mt-auto">
                    {/* BOTÃO DE ETIQUETA (SÓ APARECE SE TIVER DADOS) */}
                    <div>
                        {initialData && (
                            <button 
                                type="button" 
                                onClick={() => setShowLabelDesigner(true)} 
                                className="flex items-center gap-2 px-4 py-2 text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg font-medium transition-colors"
                            >
                                <Printer size={18} /> Imprimir Etiquetas
                            </button>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded font-medium">Cancelar</button>
                        <button type="submit" disabled={loading || isUploading} className="px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 flex items-center gap-2">
                            {loading || isUploading ? <Loader className="animate-spin" size={18}/> : <Check size={18}/>}
                            {initialData ? 'Atualizar Produto' : 'Criar Produto'}
                        </button>
                    </div>
                </div>
            </form>

            {/* MODAL DE ETIQUETAS (LABEL DESIGNER) */}
            {showLabelDesigner && initialData && (
                <Modal 
                    isOpen={showLabelDesigner} 
                    onClose={() => setShowLabelDesigner(false)} 
                    title={`Etiquetas: ${initialData.name}`}
                    maxWidth="max-w-[95vw]" 
                >
                    <LabelDesigner 
                        product={{...initialData, ...formData} as Product} // Passa dados mesclados
                        onClose={() => setShowLabelDesigner(false)} 
                    />
                </Modal>
            )}
        </>
    );
};