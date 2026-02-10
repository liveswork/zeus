import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { FEATURE_MAP } from '../../../config/features';
import { Save, Trash2, Plus, Edit, Check, Briefcase } from 'lucide-react';

export const BusinessTypeManager = () => {
    const [types, setTypes] = useState<any[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentType, setCurrentType] = useState<any>({
        key: '', // ex: retail
        label: '', // ex: Varejo
        features: [] 
    });

    useEffect(() => {
        loadTypes();
    }, []);

    const loadTypes = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, 'system_business_types'));
            setTypes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (error) {
            console.error("Erro ao carregar tipos", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!currentType.key || !currentType.label) return alert("Preencha chave e nome");
        
        // Salva no Firestore usando a 'key' como ID do documento
        await setDoc(doc(db, 'system_business_types', currentType.key), {
            key: currentType.key,
            label: currentType.label,
            features: currentType.features
        });
        
        setIsEditing(false);
        loadTypes();
        alert("Tipo de negócio salvo com sucesso!");
    };

    const handleDelete = async (key: string) => {
        if(!confirm("Tem certeza? Isso afetará todos os usuários desse tipo.")) return;
        await deleteDoc(doc(db, 'system_business_types', key));
        loadTypes();
    };

    const toggleFeature = (featureKey: string) => {
        const feats = currentType.features || [];
        if (feats.includes(featureKey)) {
            setCurrentType({ ...currentType, features: feats.filter((f: string) => f !== featureKey) });
        } else {
            setCurrentType({ ...currentType, features: [...feats, featureKey] });
        }
    };

    if (loading) return <div className="p-8">Carregando gerenciador...</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Tipos de Negócio & Menus</h1>
                    <p className="text-gray-500">Defina quais módulos cada tipo de empresa pode acessar.</p>
                </div>
                {!isEditing && (
                    <button 
                        onClick={() => { setCurrentType({ key: '', label: '', features: [] }); setIsEditing(true); }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                    >
                        <Plus size={20} /> Novo Tipo
                    </button>
                )}
            </div>
            
            {!isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {types.map(t => (
                        <div key={t.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                                    <Briefcase size={24} />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => { setCurrentType(t); setIsEditing(true); }} className="p-2 text-gray-400 hover:text-blue-600">
                                        <Edit size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(t.id)} className="p-2 text-gray-400 hover:text-red-600">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                            <h3 className="font-bold text-lg text-gray-900">{t.label}</h3>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 mt-1 inline-block">{t.key}</code>
                            
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <span className="text-sm font-medium text-gray-500">{t.features?.length || 0} módulos habilitados</span>
                            </div>
                        </div>
                    ))}
                    
                    {types.length === 0 && (
                        <div className="col-span-full text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
                            <p className="text-gray-500">Nenhum tipo de negócio configurado.</p>
                            <p className="text-sm text-gray-400">Crie "retail" ou "restaurante" para começar.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-6 border-b pb-4">
                        <h2 className="text-xl font-bold">Editor de Tipo de Negócio</h2>
                        <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-gray-700">Cancelar</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Nome de Exibição</label>
                            <input 
                                placeholder="Ex: Varejo / Loja de Roupas"
                                value={currentType.label} 
                                onChange={e => setCurrentType({...currentType, label: e.target.value})} 
                                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Chave do Sistema (ID)</label>
                            <input 
                                placeholder="Ex: retail"
                                value={currentType.key} 
                                onChange={e => setCurrentType({...currentType, key: e.target.value})} 
                                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50" 
                                disabled={!!currentType.id} // Não deixa mudar a chave se for edição
                            />
                            <p className="text-xs text-gray-500 mt-1">Use 'retail' ou 'restaurante' para bater com seus usuários atuais.</p>
                        </div>
                    </div>

                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Check size={20} className="text-green-600" /> Módulos e Menus Permitidos
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                        {Object.entries(FEATURE_MAP).map(([key, config]: [string, any]) => (
                            <div 
                                key={key} 
                                onClick={() => toggleFeature(key)} 
                                className={`
                                    p-4 rounded-lg border cursor-pointer flex items-start gap-3 transition-all
                                    ${currentType.features.includes(key) 
                                        ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' 
                                        : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-gray-50'}
                                `}
                            >
                                <div className={`
                                    w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center mt-0.5
                                    ${currentType.features.includes(key) ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}
                                `}>
                                    {currentType.features.includes(key) && <Check size={14} className="text-white" />}
                                </div>
                                <div>
                                    <span className={`block text-sm font-bold ${currentType.features.includes(key) ? 'text-blue-900' : 'text-gray-700'}`}>
                                        {config.label}
                                    </span>
                                    <span className="text-xs text-gray-500 capitalize">{config.group}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-4 pt-6 border-t">
                        <button onClick={() => setIsEditing(false)} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200">
                            Cancelar
                        </button>
                        <button onClick={handleSave} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2">
                            <Save size={20} /> Salvar Configuração
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};