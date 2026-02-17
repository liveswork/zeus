import React, { useState, useEffect } from 'react';
import { 
    collection, getDocs, doc, setDoc, deleteDoc, updateDoc 
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { FEATURE_MAP } from '../../../config/features';
import { 
    Layers, Plus, Trash2, ChevronRight, 
    Check, Settings 
} from 'lucide-react';

export const TaxonomyManager: React.FC = () => {
    // Estados
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    
    // Estado para Formulário de Categoria
    const [catForm, setCatForm] = useState({ id: '', label: '', order: 0 });
    
    // Estado para Formulário de Subcategoria
    const [isSubEditing, setIsSubEditing] = useState(false);
    const [subForm, setSubForm] = useState({ key: '', label: '', features: [] as string[] });

    // --- CARREGAMENTO INICIAL ---
    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setLoading(true);
        try {
            // CONECTADO AO BANCO ANTIGO: 'business_categories'
            const snap = await getDocs(collection(db, 'business_categories'));
            const data = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .sort((a: any, b: any) => (a.order || 99) - (b.order || 99));
            setCategories(data);
        } catch (error) {
            console.error("Erro ao carregar categorias:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- GERENCIAMENTO DE CATEGORIAS (PAI) ---
    const handleSaveCategory = async () => {
        if (!catForm.id || !catForm.label) return alert("Preencha ID e Nome");
        
        try {
            await setDoc(doc(db, 'business_categories', catForm.id), {
                label: catForm.label,
                order: Number(catForm.order),
                subCategories: selectedCategory?.subCategories || [] // Mantém subs se for edição
            }, { merge: true });
            
            setIsEditing(false);
            loadCategories();
            setCatForm({ id: '', label: '', order: 0 });
        } catch (error) {
            console.error("Erro ao salvar categoria:", error);
            alert("Erro ao salvar.");
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm("Tem certeza? Isso apagará todas as subcategorias também.")) return;
        try {
            await deleteDoc(doc(db, 'business_categories', id));
            loadCategories();
            setSelectedCategory(null);
        } catch (error) {
            console.error(error);
        }
    };

    // --- GERENCIAMENTO DE SUBCATEGORIAS (FILHO) ---
    const handleSaveSubcategory = async () => {
        if (!selectedCategory) return;
        if (!subForm.key || !subForm.label) return alert("Preencha Chave e Nome");

        try {
            const categoryRef = doc(db, 'business_categories', selectedCategory.id);
            const newSub = {
                key: subForm.key,
                label: subForm.label,
                features: subForm.features // Aqui salva as permissões marcadas
            };

            let updatedSubs = [...(selectedCategory.subCategories || [])];
            
            // Verifica se está editando (já existe) ou criando
            const index = updatedSubs.findIndex((s: any) => s.key === subForm.key);
            
            if (index >= 0) {
                updatedSubs[index] = newSub; // Atualiza
            } else {
                updatedSubs.push(newSub); // Adiciona novo
            }

            await updateDoc(categoryRef, { subCategories: updatedSubs });
            
            // Atualiza estado local
            const updatedCategory = { ...selectedCategory, subCategories: updatedSubs };
            setSelectedCategory(updatedCategory);
            setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
            
            setIsSubEditing(false);
            setSubForm({ key: '', label: '', features: [] });
        } catch (error) {
            console.error("Erro ao salvar subcategoria:", error);
            alert("Erro ao salvar subcategoria.");
        }
    };

    const handleDeleteSubcategory = async (subKey: string) => {
        if (!confirm("Remover esta subcategoria?")) return;
        try {
            const categoryRef = doc(db, 'business_categories', selectedCategory.id);
            const updatedSubs = selectedCategory.subCategories.filter((s: any) => s.key !== subKey);
            
            await updateDoc(categoryRef, { subCategories: updatedSubs });
            
            const updatedCategory = { ...selectedCategory, subCategories: updatedSubs };
            setSelectedCategory(updatedCategory);
            setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
        } catch (error) {
            console.error(error);
        }
    };

    const toggleFeature = (featureKey: string) => {
        setSubForm(prev => {
            const feats = prev.features || [];
            if (feats.includes(featureKey)) {
                return { ...prev, features: feats.filter(f => f !== featureKey) };
            } else {
                return { ...prev, features: [...feats, featureKey] };
            }
        });
    };

    return (
        <div className="flex h-full gap-6">
            {/* COLUNA ESQUERDA: LISTA DE CATEGORIAS */}
            <div className="w-1/3 bg-white rounded-lg shadow p-4 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <Layers className="text-blue-600" /> Segmentos de Negócios
                    </h2>
                    <button 
                        onClick={() => { 
                            setCatForm({ id: '', label: '', order: categories.length + 1 }); 
                            setIsEditing(true); 
                            setSelectedCategory(null);
                        }}
                        className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2">
                    {categories.map(cat => (
                        <div 
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat)}
                            className={`p-3 rounded-lg cursor-pointer border transition-all flex justify-between items-center ${
                                selectedCategory?.id === cat.id 
                                    ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-200' 
                                    : 'hover:bg-gray-50 border-gray-200'
                            }`}
                        >
                            <div>
                                <h3 className="font-bold text-gray-800">{cat.label}</h3>
                                <code className="text-xs text-gray-400">{cat.id}</code>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs bg-gray-200 px-2 py-1 rounded-full text-gray-600">
                                    {cat.subCategories?.length || 0} subs
                                </span>
                                <ChevronRight size={16} className="text-gray-400" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* COLUNA DIREITA: DETALHES & SUBCATEGORIAS */}
            <div className="flex-1 bg-white rounded-lg shadow p-6 flex flex-col">
                {isEditing ? (
                    // FORMULÁRIO DE CATEGORIA (PAI)
                    <div className="space-y-4">
                        <h3 className="font-bold text-xl border-b pb-2">Nova Categoria Principal</h3>
                        <div>
                            <label className="block text-sm font-bold mb-1">ID (Sem espaços, ex: food_service)</label>
                            <input className="input-zeus w-full border p-2 rounded" value={catForm.id} onChange={e => setCatForm({...catForm, id: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">Nome (Ex: Alimentação)</label>
                            <input className="input-zeus w-full border p-2 rounded" value={catForm.label} onChange={e => setCatForm({...catForm, label: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">Ordem</label>
                            <input type="number" className="input-zeus w-full border p-2 rounded" value={catForm.order} onChange={e => setCatForm({...catForm, order: Number(e.target.value)})} />
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setIsEditing(false)} className="btn-secondary px-4 py-2 bg-gray-200 rounded">Cancelar</button>
                            <button onClick={handleSaveCategory} className="btn-primary px-4 py-2 bg-blue-600 text-white rounded">Salvar</button>
                        </div>
                    </div>
                ) : selectedCategory ? (
                    // VISUALIZAÇÃO DA CATEGORIA SELECIONADA
                    <>
                        <div className="flex justify-between items-start mb-6 border-b pb-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">{selectedCategory.label}</h1>
                                <p className="text-gray-500 text-sm">Gerencie as subcategorias e permissões</p>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleDeleteCategory(selectedCategory.id)}
                                    className="text-red-500 hover:bg-red-50 p-2 rounded"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>

                        {isSubEditing ? (
                            // FORMULÁRIO DE SUBCATEGORIA & PERMISSÕES
                            <div className="flex-1 overflow-y-auto">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <Settings className="text-blue-600" /> Configurar Subcategoria
                                </h3>
                                
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-bold mb-1">ID (ex: pizzaria)</label>
                                        <input 
                                            className="w-full border p-2 rounded" 
                                            value={subForm.key} 
                                            onChange={e => setSubForm({...subForm, key: e.target.value})}
                                            disabled={!!selectedCategory.subCategories?.find((s:any) => s.key === subForm.key)} // Trava ID se for edição
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-1">Nome (ex: Pizzaria)</label>
                                        <input className="w-full border p-2 rounded" value={subForm.label} onChange={e => setSubForm({...subForm, label: e.target.value})} />
                                    </div>
                                </div>

                                <div className="mb-2">
                                    <h4 className="font-bold text-sm text-gray-700 mb-2">Menus e Módulos Habilitados:</h4>
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                        {Object.entries(FEATURE_MAP).map(([key, feature]: [string, any]) => (
                                            <div 
                                                key={key}
                                                onClick={() => toggleFeature(key)}
                                                className={`
                                                    cursor-pointer p-2 rounded border flex items-center gap-2 text-sm
                                                    ${subForm.features.includes(key) ? 'bg-green-50 border-green-500 text-green-700' : 'hover:bg-gray-50 border-gray-200'}
                                                `}
                                            >
                                                <div className={`w-4 h-4 border rounded flex items-center justify-center ${subForm.features.includes(key) ? 'bg-green-500 border-green-500' : 'bg-white'}`}>
                                                    {subForm.features.includes(key) && <Check size={12} className="text-white" />}
                                                </div>
                                                {feature.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                                    <button onClick={() => setIsSubEditing(false)} className="px-4 py-2 text-gray-600 font-bold">Cancelar</button>
                                    <button onClick={handleSaveSubcategory} className="px-6 py-2 bg-green-600 text-white rounded font-bold shadow-lg hover:bg-green-700">
                                        Salvar Configuração
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // LISTA DE SUBCATEGORIAS
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-gray-700">Subcategorias</h3>
                                    <button 
                                        onClick={() => { 
                                            setSubForm({ key: '', label: '', features: [] }); 
                                            setIsSubEditing(true); 
                                        }}
                                        className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-bold flex items-center gap-2"
                                    >
                                        <Plus size={16} /> Adicionar
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {selectedCategory.subCategories?.length > 0 ? (
                                        selectedCategory.subCategories.map((sub: any) => (
                                            <div key={sub.key} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center bg-gray-50 hover:bg-white transition-colors">
                                                <div>
                                                    <h4 className="font-bold text-gray-800">{sub.label}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <code className="text-xs bg-gray-200 px-1 rounded">{sub.key}</code>
                                                        <span className="text-xs text-blue-600 font-medium">
                                                            {sub.features?.length || 0} menus ativos
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => {
                                                            setSubForm({ key: sub.key, label: sub.label, features: sub.features || [] });
                                                            setIsSubEditing(true);
                                                        }}
                                                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                                                        title="Configurar Menus"
                                                    >
                                                        <Settings size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteSubcategory(sub.key)}
                                                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-10 text-gray-400 border-2 border-dashed rounded-lg">
                                            Nenhuma subcategoria cadastrada.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <Layers size={48} className="mb-4 opacity-20" />
                        <p>Selecione uma categoria ao lado para gerenciar.</p>
                    </div>
                )}
            </div>
        </div>
    );
};