import React from 'react';
import { useProductForm } from '../../../../../../hooks/useProductForm'; // Ajuste o caminho se necessário
import { Save, Loader, Upload, Clock, DollarSign } from 'lucide-react';
import { Product } from '../../../../../../types';

interface Props {
    initialData?: Product | null;
    onClose: () => void;
}

export const FoodProductForm: React.FC<Props> = ({ initialData, onClose }) => {
    const { formData, handleChange, handleUpload, handleSubmit, saving, uploading } = useProductForm(initialData, onClose);

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-6">
                
                {/* Seção Principal */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Upload de Imagem Única */}
                    <div className="md:col-span-1">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Foto do Prato</label>
                        <div className="relative aspect-square bg-gray-50 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-blue-500 hover:bg-blue-50 transition cursor-pointer overflow-hidden group">
                            {formData.imageUrl ? (
                                <img src={formData.imageUrl} className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <Upload size={32} className="mb-2"/>
                                    <span className="text-xs">Clique para enviar</span>
                                </>
                            )}
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files && handleUpload(e.target.files[0])} />
                            {uploading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><Loader className="animate-spin text-blue-600"/></div>}
                        </div>
                    </div>

                    {/* Dados Básicos */}
                    <div className="md:col-span-2 space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Nome do Item</label>
                            <input 
                                className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-green-500" 
                                value={formData.name} 
                                onChange={e => handleChange('name', e.target.value)}
                                placeholder="Ex: Pizza Calabresa"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Descrição</label>
                            <textarea 
                                className="w-full border p-2.5 rounded-lg h-24 resize-none" 
                                value={formData.description} 
                                onChange={e => handleChange('description', e.target.value)}
                                placeholder="Ingredientes, tamanho, serve quantas pessoas..."
                            />
                        </div>
                    </div>
                </div>

                {/* Preços e Detalhes */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl border">
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs font-bold text-gray-500 mb-1">Preço Venda (R$)</label>
                        <input 
                            type="number" 
                            className="w-full border p-2 rounded font-bold text-gray-800" 
                            value={formData.salePrice} 
                            onChange={e => handleChange('salePrice', e.target.value)}
                        />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs font-bold text-gray-500 mb-1">Preço Custo (R$)</label>
                        <input 
                            type="number" 
                            className="w-full border p-2 rounded" 
                            value={formData.costPrice} 
                            onChange={e => handleChange('costPrice', e.target.value)}
                        />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs font-bold text-gray-500 mb-1">Tempo Preparo (min)</label>
                        <div className="relative">
                            <Clock size={16} className="absolute left-2 top-2.5 text-gray-400"/>
                            <input 
                                type="number" 
                                className="w-full border p-2 pl-8 rounded" 
                                value={formData.preparationTime} 
                                onChange={e => handleChange('preparationTime', e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs font-bold text-gray-500 mb-1">Categoria</label>
                        <input 
                            className="w-full border p-2 rounded" 
                            value={formData.category} 
                            onChange={e => handleChange('category', e.target.value)}
                            placeholder="Ex: Pizzas"
                        />
                    </div>
                </div>

                {/* Aqui você pode adicionar a aba de Receita Técnica no futuro */}
            </div>

            <div className="pt-4 border-t flex justify-end gap-3 mt-auto">
                <button onClick={onClose} className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button onClick={handleSubmit} disabled={saving} className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg flex items-center gap-2 hover:bg-green-700">
                    {saving ? <Loader className="animate-spin" size={18}/> : <Save size={18}/>}
                    Salvar Item
                </button>
            </div>
        </div>
    );
};