import React, { useState } from 'react';
import { FormField } from '../../../../../ui/FormField';
import { Plus, Trash2, Tag, Layers } from 'lucide-react';

interface RetailProductFormProps {
    initialData?: any;
    onSave: (data: any) => Promise<void>;
    onCancel: () => void;
    loading: boolean;
}

export const RetailProductForm: React.FC<RetailProductFormProps> = ({ initialData, onSave, onCancel, loading }) => {
    const [formData, setFormData] = useState(initialData || {
        name: '',
        description: '',
        price: '',
        costPrice: '',
        sku: '',
        category: '',
        stock: 0,
        variants: [] // Grade: Cor, Tamanho
    });

    // Estado para gerador de grade
    const [grid, setGrid] = useState<any>({ color: '', sizes: '' });

    const handleGenerateGrid = () => {
        if (!grid.color || !grid.sizes) return;
        const sizes = grid.sizes.split(',').map((s: string) => s.trim()); // Ex: P, M, G
        
        const newVariants = sizes.map((size: string) => ({
            name: `${formData.name} - ${grid.color} - ${size}`,
            color: grid.color,
            size: size,
            sku: `${formData.sku}-${grid.color.substring(0,3).toUpperCase()}-${size}`,
            stock: 0,
            price: formData.price
        }));

        setFormData({ ...formData, variants: [...formData.variants, ...newVariants] });
        setGrid({ color: '', sizes: '' });
    };

    return (
        <div className="space-y-6">
            {/* DADOS BÁSICOS */}
            <div className="grid grid-cols-2 gap-4">
                <FormField label="Nome do Produto">
                    <input 
                        className="w-full border p-2 rounded" 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        placeholder="Ex: Camiseta Polo Básica"
                    />
                </FormField>
                <FormField label="Referência / SKU">
                    <input 
                        className="w-full border p-2 rounded" 
                        value={formData.sku} 
                        onChange={e => setFormData({...formData, sku: e.target.value})}
                    />
                </FormField>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <FormField label="Preço de Venda">
                    <input type="number" className="w-full border p-2 rounded" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </FormField>
                <FormField label="Preço de Custo">
                    <input type="number" className="w-full border p-2 rounded" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: e.target.value})} />
                </FormField>
                <FormField label="Categoria">
                    <select className="w-full border p-2 rounded" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                        <option value="">Selecione...</option>
                        <option value="roupas">Roupas</option>
                        <option value="calcados">Calçados</option>
                        <option value="acessorios">Acessórios</option>
                    </select>
                </FormField>
            </div>

            {/* GERADOR DE GRADE (O GRANDE DIFERENCIAL DO VAREJO) */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                    <Layers size={18} /> Grade de Variações
                </h3>
                <div className="flex gap-2 items-end mb-4">
                    <div className="flex-1">
                        <label className="text-xs font-bold text-gray-600">Cor / Estampa</label>
                        <input 
                            className="w-full border p-2 rounded" 
                            placeholder="Ex: Azul Marinho"
                            value={grid.color}
                            onChange={e => setGrid({...grid, color: e.target.value})}
                        />
                    </div>
                    <div className="flex-1">
                        <label className="text-xs font-bold text-gray-600">Tamanhos (separar por vírgula)</label>
                        <input 
                            className="w-full border p-2 rounded" 
                            placeholder="Ex: P, M, G, GG"
                            value={grid.sizes}
                            onChange={e => setGrid({...grid, sizes: e.target.value})}
                        />
                    </div>
                    <button 
                        type="button"
                        onClick={handleGenerateGrid}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-bold"
                    >
                        Gerar
                    </button>
                </div>

                {/* LISTA DE VARIAÇÕES GERADAS */}
                {formData.variants.length > 0 && (
                    <div className="bg-white rounded border overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 text-gray-600">
                                <tr>
                                    <th className="p-2">Variação</th>
                                    <th className="p-2">SKU</th>
                                    <th className="p-2 w-24">Estoque</th>
                                    <th className="p-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.variants.map((variant: any, idx: number) => (
                                    <tr key={idx} className="border-t">
                                        <td className="p-2 font-medium">{variant.name}</td>
                                        <td className="p-2 text-gray-500">{variant.sku}</td>
                                        <td className="p-2">
                                            <input 
                                                type="number" 
                                                className="w-full border rounded p-1 text-center"
                                                value={variant.stock}
                                                onChange={(e) => {
                                                    const newVariants = [...formData.variants];
                                                    newVariants[idx].stock = Number(e.target.value);
                                                    setFormData({...formData, variants: newVariants});
                                                }}
                                            />
                                        </td>
                                        <td className="p-2 text-center">
                                            <button onClick={() => {
                                                const newVariants = formData.variants.filter((_, i) => i !== idx);
                                                setFormData({...formData, variants: newVariants});
                                            }} className="text-red-500 hover:text-red-700">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
                <button onClick={onCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
                <button onClick={() => onSave(formData)} disabled={loading} className="px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700">
                    {loading ? 'Salvando...' : 'Salvar Produto'}
                </button>
            </div>
        </div>
    );
};