import React, { useState, useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import { FormField } from '../../ui/FormField';
import { PlusCircle, Trash2, UploadCloud, Loader, X, Image as ImageIcon, PackageOpen } from 'lucide-react';
// Importação correta das instâncias
import { storage, db } from '../../../config/firebase'; 
import { ref, uploadBytesResumable } from 'firebase/storage';
import { doc, collection } from 'firebase/firestore'; 
import { useAuth } from '../../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface ExtensionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (extensionData: any) => void;
    initialData?: any;
}

export const ExtensionFormModal: React.FC<ExtensionFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const { user } = useAuth();

    // ID do documento (Gerado ou Existente)
    const [docId, setDocId] = useState('');

    const getInitialState = () => ({
        name: '',
        featureKey: '',
        author: 'Oficial FoodPDV',
        priceMonthly: 0,
        description: '',
        description_long: '<p>Descreva os benefícios e funcionalidades em detalhes aqui.</p>',
        installation_guide: '<p>1. Ative a extensão.<br>2. Acesse o novo menu no painel.<br>3. Siga as instruções na tela.</p>',
        faq: '<h3>Pergunta Comum?</h3><p>Resposta da pergunta.</p>',
        changelog: '<h4>Versão 1.0.0</h4><ul><li>Lançamento inicial da extensão.</li></ul>',
        version: '1.0.0',
        pricingPlans: [],
        authorWebsite: '',
        repositoryUrl: '',
        lastUpdated: new Date().toLocaleDateString('pt-BR'),
        isCompatible: true,
        status: 'approved',
        mediaAssets: { logo: '', banner: '' },
        screenshots: [], // Array de URLs (Strings)
        createdBy: user?.uid || 'unknown',
        createdAt: new Date().toISOString(),
        ...initialData
    });

    const [formData, setFormData] = useState(getInitialState());
    const [activeTab, setActiveTab] = useState('geral');
    
    // Controle de Loading
    const [uploading, setUploading] = useState({ logo: false, banner: false, screenshot: false });
    
    // Previews locais (apenas para logo e banner, screenshots vão direto pro array)
    const [previews, setPreviews] = useState({ logo: '', banner: '' });

    useEffect(() => {
        if (isOpen) {
            if (initialData && initialData.id) {
                setDocId(initialData.id);
                setFormData({
                    ...getInitialState(),
                    ...initialData,
                    mediaAssets: initialData.mediaAssets || { logo: '', banner: '' },
                    pricingPlans: Array.isArray(initialData.pricingPlans) ? initialData.pricingPlans : [],
                    screenshots: Array.isArray(initialData.screenshots) ? initialData.screenshots : []
                });
                setPreviews({
                    logo: initialData.mediaAssets?.logo || '',
                    banner: initialData.mediaAssets?.banner || ''
                });
            } else {
                const newId = doc(collection(db, 'extensions')).id;
                setDocId(newId);
                setFormData(getInitialState());
                setPreviews({ logo: '', banner: '' });
            }
            setActiveTab('geral');
        }
    }, [isOpen, initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(p => ({ ...p, [name]: value }));
    };

    // --- UPLOAD LOGO & BANNER ---
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Máximo 5MB");
            return;
        }

        setUploading(prev => ({ ...prev, [type]: true }));
        const toastId = toast.loading(`Enviando ${type}...`);

        try {
            // Preview Local Imediato
            const localPreview = URL.createObjectURL(file);
            setPreviews(prev => ({ ...prev, [type]: localPreview }));

            // Nome único
            const fileName = `${Date.now()}_${type}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
            const folderPath = 'uploads/extensions'; 
            const fullPath = `${folderPath}/${fileName}`;
            
            // Referência
            const storageRef = ref(storage, fullPath);

            // Metadados para a Cloud Function (Otimização futura)
            const metadata = {
                contentType: file.type,
                customMetadata: {
                    extensionId: docId,
                    imageType: type
                }
            };

            // Upload
            await uploadBytesResumable(storageRef, file, metadata);

            // --- TRUQUE DA URL PÚBLICA ---
            // Em vez de getDownloadURL (que gera token), construímos a URL pública persistente.
            // Para isso funcionar, sua regra de storage deve ter: allow read: if true;
            const bucketName = 'zeuspdv.firebasestorage.app'; // Seu bucket
            const encodedPath = encodeURIComponent(fullPath);
            const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media`;

            console.log(`[Upload URL]`, publicUrl);

            // Salva no State
            setFormData(prev => ({
                ...prev,
                mediaAssets: {
                    ...prev.mediaAssets,
                    [type]: publicUrl
                }
            }));

            toast.success("Upload concluído!", { id: toastId });

        } catch (error: any) {
            console.error("Erro upload:", error);
            toast.error(`Erro: ${error.message}`, { id: toastId });
        } finally {
            setUploading(prev => ({ ...prev, [type]: false }));
            e.target.value = '';
        }
    };

    // --- NOVO: UPLOAD DE SCREENSHOTS ---
    const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("A imagem deve ter no máximo 5MB");
            return;
        }

        setUploading(prev => ({ ...prev, screenshot: true }));
        const toastId = toast.loading("Enviando tela...");

        try {
            const fileName = `${Date.now()}_screen_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
            const folder = 'uploads/extensions/screenshots'; // Subpasta organizada
            const storagePath = `${folder}/${fileName}`;
            const storageRef = ref(storage, storagePath);

            const metadata = {
                contentType: file.type,
                customMetadata: {
                    extensionId: docId,
                    imageType: 'screenshot',
                    action: 'optimize'
                }
            };

            const snapshot = await uploadBytesResumable(storageRef, file, metadata);
            const bucketName = snapshot.ref.bucket;
            const publicUrl = `https://storage.googleapis.com/${bucketName}/${folder}/${fileName}`;

            // Adiciona a nova URL ao array existente
            setFormData(prev => ({
                ...prev,
                screenshots: [...(prev.screenshots || []), publicUrl]
            }));

            toast.success("Tela adicionada!", { id: toastId });

        } catch (error: any) {
            console.error("Erro upload screenshot:", error);
            toast.error("Falha no upload.", { id: toastId });
        } finally {
            setUploading(prev => ({ ...prev, screenshot: false }));
            e.target.value = '';
        }
    };

    const removeScreenshot = (indexToRemove: number) => {
        setFormData(prev => ({
            ...prev,
            screenshots: prev.screenshots.filter((_, index) => index !== indexToRemove)
        }));
    };

    // --- PLANOS ---
    const handlePlanChange = (index: number, field: string, value: any) => {
        setFormData(prev => {
            const newPlans = [...(prev.pricingPlans || [])];
            if (newPlans[index]) newPlans[index] = { ...newPlans[index], [field]: value };
            return { ...prev, pricingPlans: newPlans };
        });
    };
    const addPlan = () => setFormData(prev => ({ ...prev, pricingPlans: [...(prev.pricingPlans || []), { name: 'Padrão', price: '0.00', description: '', features: '' }] }));
    const removePlan = (index: number) => setFormData(prev => ({ ...prev, pricingPlans: prev.pricingPlans.filter((_, i) => i !== index) }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ 
            ...formData, 
            id: docId, 
            pricingPlans: formData.pricingPlans || [],
            screenshots: formData.screenshots || []
        });
    };

    const tabs = [
        { key: 'geral', label: 'Geral' },
        { key: 'conteudo', label: 'Conteúdo' },
        { key: 'midia', label: 'Mídia' },
        { key: 'planos', label: 'Planos' },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={formData.id ? "Editar Extensão" : "Nova Extensão"} size="5xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <nav className="flex space-x-4 border-b border-gray-200">
                    {tabs.map(tab => (
                        <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className={`py-3 px-1 text-sm font-semibold ${activeTab === tab.key ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                            {tab.label}
                        </button>
                    ))}
                </nav>

                {/* ABA GERAL */}
                <div className={activeTab === 'geral' ? 'block' : 'hidden'}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Nome da Extensão">
                            <input name="name" value={formData.name} onChange={handleChange} required className="w-full p-2 border rounded" />
                        </FormField>
                        <FormField label="Feature Key">
                            <input name="featureKey" value={formData.featureKey} onChange={handleChange} placeholder="ex: integration_ifood" required className="w-full p-2 border rounded bg-gray-50 font-mono text-sm" />
                        </FormField>
                    </div>
                    <FormField label="Descrição Curta">
                        <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full p-2 border rounded mt-4"/>
                    </FormField>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <FormField label="Preço Mensal (R$)">
                            <input name="priceMonthly" type="number" step="0.01" value={formData.priceMonthly} onChange={handleChange} className="w-full p-2 border rounded"/>
                        </FormField>
                        <FormField label="Autor">
                            <input name="author" value={formData.author} onChange={handleChange} className="w-full p-2 border rounded"/>
                        </FormField>
                        <FormField label="Versão">
                            <input name="version" value={formData.version} onChange={handleChange} className="w-full p-2 border rounded"/>
                        </FormField>
                    </div>
                </div>

                {/* ABA CONTEÚDO */}
                <div className={`${activeTab === 'conteudo' ? 'block' : 'hidden'} space-y-4`}>
                    <FormField label="Descrição Detalhada (HTML)">
                        <textarea name="description_long" value={formData.description_long} onChange={handleChange} rows={6} className="w-full p-2 border rounded font-mono text-xs"/>
                    </FormField>
                    <FormField label="Guia de Instalação (HTML)">
                        <textarea name="installation_guide" value={formData.installation_guide} onChange={handleChange} rows={4} className="w-full p-2 border rounded font-mono text-xs"/>
                    </FormField>
                </div>

                {/* ABA MÍDIA */}
                <div className={`${activeTab === 'midia' ? 'block' : 'hidden'} space-y-6`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* UPLOAD LOGO */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Logo (Quadrado)</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition relative h-48 flex flex-col items-center justify-center bg-gray-50">
                                {uploading.logo ? (
                                    <div className="flex flex-col items-center">
                                        <Loader className="animate-spin text-blue-500 mb-2" />
                                        <span className="text-xs text-gray-500">Enviando...</span>
                                    </div>
                                ) : previews.logo ? (
                                    <div className="relative group w-full h-full flex items-center justify-center">
                                        <img src={previews.logo} alt="Logo Preview" className="max-w-full max-h-full object-contain rounded shadow-sm" />
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setPreviews(p => ({...p, logo: ''}));
                                                setFormData(p => ({...p, mediaAssets: {...p.mediaAssets, logo: ''}}));
                                            }}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-md"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="py-4 w-full">
                                        <UploadCloud className="mx-auto text-gray-400 mb-2" />
                                        <label className="cursor-pointer bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-200 transition block w-fit mx-auto">
                                            Escolher Logo
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* UPLOAD BANNER */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Banner (Retangular)</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition relative h-48 flex flex-col items-center justify-center bg-gray-50">
                                {uploading.banner ? (
                                    <div className="flex flex-col items-center">
                                        <Loader className="animate-spin text-blue-500 mb-2" />
                                        <span className="text-xs text-gray-500">Enviando...</span>
                                    </div>
                                ) : previews.banner ? (
                                    <div className="relative group w-full h-full flex items-center justify-center">
                                        <img src={previews.banner} alt="Banner Preview" className="max-w-full max-h-full object-cover rounded shadow-sm" />
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setPreviews(p => ({...p, banner: ''}));
                                                setFormData(p => ({...p, mediaAssets: {...p.mediaAssets, banner: ''}}));
                                            }}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-md"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="py-4 w-full">
                                        <ImageIcon className="mx-auto text-gray-400 mb-2" />
                                        <label className="cursor-pointer bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-200 transition block w-fit mx-auto">
                                            Escolher Banner
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'banner')} />
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* GALERIA DE SCREENSHOTS (NOVA IMPLEMENTAÇÃO) */}
                    <FormField label="Galeria de Telas (Screenshots)">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {/* Card de Adicionar Novo */}
                            <div className="border-2 border-dashed border-gray-300 rounded-lg h-32 flex flex-col items-center justify-center hover:bg-gray-50 transition cursor-pointer relative">
                                {uploading.screenshot ? (
                                    <Loader className="animate-spin text-blue-500" />
                                ) : (
                                    <>
                                        <PlusCircle className="text-blue-500 mb-1" size={24} />
                                        <span className="text-xs text-gray-600 font-medium">Adicionar Tela</span>
                                        <input 
                                            type="file" 
                                            className="absolute inset-0 opacity-0 cursor-pointer" 
                                            accept="image/*"
                                            onChange={handleScreenshotUpload}
                                        />
                                    </>
                                )}
                            </div>

                            {/* Lista de Imagens */}
                            {(formData.screenshots || []).map((url: string, index: number) => (
                                <div key={index} className="relative group border rounded-lg overflow-hidden h-32 bg-gray-100">
                                    <img src={url} alt={`Tela ${index}`} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                        <button 
                                            type="button" 
                                            onClick={() => removeScreenshot(index)}
                                            className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transform hover:scale-110 transition"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </FormField>
                </div>

                {/* ABA PLANOS */}
                <div className={`${activeTab === 'planos' ? 'block' : 'hidden'} space-y-4`}>
                    <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-700">Planos de Assinatura</h3>
                            <button type="button" onClick={addPlan} className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm">
                                <PlusCircle size={16} /> Adicionar Plano
                            </button>
                        </div>
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {(formData.pricingPlans || []).map((plan: any, index: number) => (
                                <div key={index} className="bg-white p-4 rounded-lg border relative">
                                    <button type="button" onClick={() => removePlan(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <FormField label="Nome">
                                            <input value={plan.name || ''} onChange={(e) => handlePlanChange(index, 'name', e.target.value)} className="w-full p-2 border rounded" placeholder="Ex: Básico" />
                                        </FormField>
                                        <FormField label="Preço (R$)">
                                            <input type="number" step="0.01" value={plan.price || ''} onChange={(e) => handlePlanChange(index, 'price', e.target.value)} className="w-full p-2 border rounded" placeholder="0.00" />
                                        </FormField>
                                    </div>
                                    <FormField label="Recursos">
                                        <input value={plan.features || ''} onChange={(e) => handlePlanChange(index, 'features', e.target.value)} className="w-full p-2 border rounded" placeholder="Recursos separados por vírgula" />
                                    </FormField>
                                </div>
                            ))}
                            {(!formData.pricingPlans || formData.pricingPlans.length === 0) && (
                                <div className="text-center py-8 text-gray-500"><PackageOpen size={48} className="mx-auto mb-2 opacity-50" /><p>Nenhum plano configurado</p></div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">Cancelar</button>
                    <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition">
                        {formData.id ? 'Atualizar' : 'Criar Extensão'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};