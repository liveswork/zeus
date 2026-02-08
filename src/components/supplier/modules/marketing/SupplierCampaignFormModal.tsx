import React, { useState, useEffect } from 'react';
import { Modal } from '../../../ui/Modal';
import { FormField } from '../../../ui/FormField';


// Este é o modal com o formulário específico para o Fornecedor criar sua campanha, incluindo os 
// campos para o "Alerta de Estoque Baixo".

interface SupplierCampaignFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    initialData: any;
    showAlert: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const SupplierCampaignFormModal: React.FC<SupplierCampaignFormModalProps> = ({ isOpen, onClose, onSave, initialData, showAlert }) => {
    const getInitialState = () => ({
        title: initialData?.title || '',
        description: initialData?.description || '',
        imageUrl: initialData?.imageUrl || '',
        ctaLink: initialData?.ctaLink || '',
        ctaText: initialData?.ctaText || 'Ver Produtos',
        budget: initialData?.budget || 50,
        placementOptions: initialData?.placementOptions || [],
        billingModel: initialData?.billingModel || 'cpm',
        cpmBid: initialData?.cpmBid || 5,
        cpiBid: initialData?.cpiBid || 1,
        cpcBid: initialData?.cpcBid || 2.50,
        cpagBid: initialData?.cpagBid || 0.50,
        targetIngredientTags: initialData?.targetIngredientTags || [],
        campaignObjective: initialData?.campaignObjective || 'cpm',
    });

    const [formData, setFormData] = useState(getInitialState());

    useEffect(() => {
        if (isOpen) {
            setFormData(getInitialState());
        }
    }, [initialData, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const finalValue = type === 'number' ? parseFloat(value) || 0 : value;
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handlePlacementChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        let placements = formData.placementOptions;
        if (checked) {
            placements = [...placements, value];
        } else {
            placements = placements.filter(p => p !== value);
        }
        setFormData(prev => ({ ...prev, placementOptions: placements }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.budget < 20) {
            showAlert("O orçamento mínimo é de R$ 20,00.", "error");
            return;
        }
        onSave(formData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData?.id ? "Editar Campanha" : "Nova Campanha para Parceiros"} size="2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {formData.campaignObjective === 'low_stock_alert' ? (
                     <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-4">
                        <h3 className="font-bold text-lg text-red-800">Campanha de Alerta de Estoque</h3>
                        <FormField label="Palavras-Chave do Ingrediente" tooltip="Digite as palavras que descrevem seu produto (ex: mussarela, queijo). Separe com vírgula.">
                            <input
                                name="targetIngredientTags"
                                value={formData.targetIngredientTags?.join(', ') || ''}
                                onChange={e => setFormData(prev => ({ ...prev, targetIngredientTags: e.target.value.split(',').map(tag => tag.trim().toLowerCase()) }))}
                                className="w-full p-2 border rounded"
                                placeholder="mussarela, queijo, laticinios"
                            />
                        </FormField>
                        <div className="grid grid-cols-2 gap-4">
                             <FormField label="Custo por Alerta (CPAG)" tooltip="Valor cobrado toda vez que seu anúncio é exibido em um alerta. Cobre os custos da plataforma.">
                                 <input name="cpagBid" type="number" step="0.1" value={formData.cpagBid} onChange={handleChange} className="w-full p-2 border rounded" />
                             </FormField>
                             <FormField label="Custo por Clique (CPC)" tooltip="Valor cobrado apenas quando o restaurante clica na sua oferta. Lances maiores têm prioridade.">
                                 <input name="cpcBid" type="number" step="0.1" value={formData.cpcBid} onChange={handleChange} className="w-full p-2 border rounded" />
                             </FormField>
                        </div>
                    </div>
                ) : (
                    <div>
                        <h3 className="font-bold text-lg text-gray-800 mb-2">Locais de Exibição</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                             <label className="flex items-center gap-2"><input type="checkbox" value="homepage_logo" onChange={handlePlacementChange} checked={formData.placementOptions.includes('homepage_logo')} /> Logo na Página Inicial</label>
                             <label className="flex items-center gap-2"><input type="checkbox" value="supplier_directory_banner" onChange={handlePlacementChange} checked={formData.placementOptions.includes('supplier_directory_banner')} /> Banner no Diretório</label>
                        </div>
                    </div>
                )}
                
                <FormField label="Título do Anúncio"><input name="title" value={formData.title} onChange={handleChange} className="w-full p-2 border rounded" required /></FormField>
                <FormField label="URL da Imagem do Anúncio"><input name="imageUrl" type="url" placeholder="https://..." value={formData.imageUrl} onChange={handleChange} className="w-full p-2 border rounded" required /></FormField>
                <FormField label="Orçamento Total (R$)"><input name="budget" type="number" step="10" min="20" value={formData.budget} onChange={handleChange} className="w-full p-2 border rounded" /></FormField>
                
                <div className="flex justify-end space-x-4 pt-4 border-t">
                    <button type="button" onClick={onClose} className="bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Cancelar</button>
                    <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg">Ativar Campanha</button>
                </div>
            </form>
        </Modal>
    );
};