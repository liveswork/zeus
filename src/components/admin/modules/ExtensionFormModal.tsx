// src/components/admin/modules/ExtensionFormModal.tsx

import React, { useState, useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import { FormField } from '../../ui/FormField';
import { PlusCircle, Trash2, UploadCloud, Loader, PackageOpen } from 'lucide-react';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import { useAuth } from '../../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface ExtensionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (extensionData: any) => void;
  initialData?: any;
}


// Helper para upload de mídia
const handleFileUpload = async (file, extensionId, imageType, storage) => {
    if (!extensionId) {
        toast.error("Salve a extensão primeiro para obter um ID e poder enviar imagens.");
        return null;
    }
    const toastId = toast.loading(`Enviando ${imageType}...`);
    try {
        const filePath = `uploads/extensions/${extensionId}_${imageType}_${Date.now()}`;
        const storageRef = ref(storage, filePath);
        // A Cloud Function irá processar a imagem e atualizar o documento da extensão.
        await uploadBytes(storageRef, file);
        toast.success(`Upload de ${imageType} concluído! A imagem aparecerá após o processamento.`, { id: toastId });
        return; // A URL será atualizada por uma função de back-end
    } catch (error) {
        console.error("Upload error:", error);
        toast.error(`Falha no upload de ${imageType}.`, { id: toastId });
        return null;
    }
};

export const ExtensionFormModal: React.FC<ExtensionFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const { user } = useAuth();
    const storage = getStorage();

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
        pricingPlans: [], // ✅ GARANTIDO: Array vazio para planos
        authorWebsite: '',
        repositoryUrl: '',
        lastUpdated: new Date().toLocaleDateString('pt-BR'),
        isCompatible: true,
        status: 'pending_review',
        mediaAssets: { logo: '', banner: '' },
        screenshots: [''],
        createdBy: user?.uid || 'unknown',
        createdAt: new Date().toISOString(),
        ...initialData
    });


    const [formData, setFormData] = useState(getInitialState());
    const [activeTab, setActiveTab] = useState('geral');

    useEffect(() => {
        if (isOpen) {
            const initialState = getInitialState();
            if (initialData) {
                // ✅ PRESERVA: Garante que pricingPlans seja sempre um array válido
                setFormData({
                    ...initialState,
                    ...initialData,
                    pricingPlans: Array.isArray(initialData.pricingPlans) ? initialData.pricingPlans : []
                });
            } else {
                setFormData(initialState);
            }
            setActiveTab('geral');
        }
    }, [isOpen, initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(p => ({ ...p, [name]: value }));
    };

    // ✅ NOVAS FUNÇÕES PARA GERENCIAR OS PLANOS DE PREÇOS
    const handlePlanChange = (index: number, field: string, value: any) => {
        setFormData(prev => {
            const newPlans = [...(prev.pricingPlans || [])];
            if (newPlans[index]) {
                newPlans[index] = { ...newPlans[index], [field]: value };
            }
            return { ...prev, pricingPlans: newPlans };
        });
    };

    const addPlan = () => {
        setFormData(prev => ({
            ...prev,
            pricingPlans: [
                ...(prev.pricingPlans || []),
                { 
                    name: 'Essencial', 
                    price: '19.90', 
                    description: 'Ideal para pequenos negócios', 
                    features: '500 scans/mês' 
                }
            ]
        }));
    };

    const removePlan = (index: number) => {
        const newPlans = formData.pricingPlans.filter((_: any, i: number) => i !== index);
        setFormData({ ...formData, pricingPlans: newPlans });
    };

    const handleScreenshotChange = (index, value) => {
        const newScreenshots = [...(formData.screenshots || [''])];
        newScreenshots[index] = value;
        setFormData(p => ({ ...p, screenshots: newScreenshots }));
    };
    
    const addScreenshotField = () => setFormData(p => ({ ...p, screenshots: [...(p.screenshots || []), ''] }));
    const removeScreenshotField = (index) => setFormData(p => ({ ...p, screenshots: p.screenshots.filter((_, i) => i !== index) }));

    const handleFileChange = (e, imageType) => {
        const file = e.target.files[0];
        if (file) {
            handleFileUpload(file, formData.id, imageType, storage);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // ✅ GARANTE: pricingPlans sempre é um array antes de salvar
        const dataToSave = {
            ...formData,
            pricingPlans: formData.pricingPlans || []
        };
        onSave(dataToSave);
    };

    const tabs = [
        { key: 'geral', label: 'Geral' },
        { key: 'conteudo', label: 'Conteúdo Detalhado' },
        { key: 'midia', label: 'Mídia e Telas' },
         { key: 'planos', label: 'Planos' },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={formData.id ? "Editar Extensão" : "Nova Extensão"} size="5xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <nav className="flex space-x-4 border-b border-gray-200">
                    {tabs.map(tab => (
                        <button 
                            key={tab.key} 
                            type="button" 
                            onClick={() => setActiveTab(tab.key)} 
                            className={`py-3 px-1 text-sm font-semibold ${activeTab === tab.key ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>

                {/* ABA GERAL - MANTIDA IDÊNTICA */}
                <div className={activeTab === 'geral' ? 'block' : 'hidden'}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Nome da Extensão">
                            <input name="name" value={formData.name} onChange={handleChange} required className="w-full p-2 border rounded" />
                        </FormField>
                        <FormField label="Feature Key (ID para código)">
                            <input name="featureKey" value={formData.featureKey} onChange={handleChange} placeholder="ex: integration_ifood" required className="w-full p-2 border rounded" />
                        </FormField>
                    </div>
                    <FormField label="Descrição Curta (para o card)">
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

                {/* ABA CONTEÚDO - MANTIDA IDÊNTICA */}
                <div className={`${activeTab === 'conteudo' ? 'block' : 'hidden'} space-y-4`}>
                    <FormField label="Descrição Detalhada (HTML permitido)">
                        <textarea name="description_long" value={formData.description_long} onChange={handleChange} rows={6} className="w-full p-2 border rounded"/>
                    </FormField>
                    <FormField label="Guia de Instalação (HTML permitido)">
                        <textarea name="installation_guide" value={formData.installation_guide} onChange={handleChange} rows={6} className="w-full p-2 border rounded"/>
                    </FormField>
                    <FormField label="FAQ (HTML permitido)">
                        <textarea name="faq" value={formData.faq} onChange={handleChange} rows={6} className="w-full p-2 border rounded"/>
                    </FormField>
                    <FormField label="Registro de Alterações (HTML permitido)">
                        <textarea name="changelog" value={formData.changelog} onChange={handleChange} rows={6} className="w-full p-2 border rounded"/>
                    </FormField>
                </div>

                {/* ABA MÍDIA - MANTIDA IDÊNTICA */}
                <div className={`${activeTab === 'midia' ? 'block' : 'hidden'} space-y-4`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md">
                        <FormField label="Logo (Quadrado, 256x256)">
                            <input type="file" onChange={(e) => handleFileChange(e, 'logo')} disabled={!formData.id} className="text-sm" />
                        </FormField>
                        <FormField label="Banner (Retangular, 772x250)">
                            <input type="file" onChange={(e) => handleFileChange(e, 'banner')} disabled={!formData.id} className="text-sm" />
                        </FormField>
                    </div>
                    <FormField label="URLs das Telas (Screenshots)">
                        <div className="space-y-2">
                            {(formData.screenshots || []).map((url, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <input 
                                        type="url" 
                                        placeholder="https://..." 
                                        value={url} 
                                        onChange={(e) => handleScreenshotChange(index, e.target.value)} 
                                        className="w-full p-2 border rounded" 
                                    />
                                    <button type="button" onClick={() => removeScreenshotField(index)} className="text-red-500">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={addScreenshotField} className="text-sm text-blue-600 font-semibold">
                                <PlusCircle size={16} className="inline mr-1" /> Adicionar URL
                            </button>
                        </div>
                    </FormField>
                </div>

                {/* ✅ ABA PLANOS - MELHORIAS DE SEGURANÇA */}
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
                                    <button 
                                        type="button" 
                                        onClick={() => removePlan(index)} 
                                        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <FormField label="Nome do Plano">
                                            <input 
                                                value={plan.name || ''} 
                                                onChange={(e) => handlePlanChange(index, 'name', e.target.value)} 
                                                className="w-full p-2 border rounded"
                                                placeholder="Ex: Básico, Profissional, Enterprise"
                                            />
                                        </FormField>
                                        <FormField label="Preço Mensal (R$)">
                                            <input 
                                                type="number" 
                                                step="0.01"
                                                value={plan.price || ''} 
                                                onChange={(e) => handlePlanChange(index, 'price', e.target.value)} 
                                                className="w-full p-2 border rounded"
                                                placeholder="0.00"
                                            />
                                        </FormField>
                                    </div>
                                    
                                    <FormField label="Descrição do Plano">
                                        <textarea 
                                            value={plan.description || ''} 
                                            onChange={(e) => handlePlanChange(index, 'description', e.target.value)} 
                                            rows={2}
                                            className="w-full p-2 border rounded"
                                            placeholder="Descreva os benefícios deste plano"
                                        />
                                    </FormField>
                                    
                                    <FormField label="Recursos Principais">
                                        <input 
                                            value={plan.features || ''} 
                                            onChange={(e) => handlePlanChange(index, 'features', e.target.value)} 
                                            className="w-full p-2 border rounded"
                                            placeholder="Ex: 500 scans/mês, Suporte 24h, Relatórios avançados"
                                        />
                                    </FormField>
                                </div>
                            ))}
                            
                            {(!formData.pricingPlans || formData.pricingPlans.length === 0) && (
                                <div className="text-center py-8 text-gray-500">
                                    <PackageOpen size={48} className="mx-auto mb-2 opacity-50" />
                                    <p>Nenhum plano de assinatura configurado</p>
                                    <p className="text-sm">Adicione planos para oferecer diferentes opções de preço</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                    <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg">
                        {formData.id ? 'Atualizar' : 'Salvar'} Extensão
                    </button>
                </div>
            </form>
        </Modal>
    );
};