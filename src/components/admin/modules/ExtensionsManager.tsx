import React, { useState, useEffect } from 'react';
import { db } from '../../../config/firebase';
import { collection, onSnapshot, query, orderBy, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { useUI } from '../../../contexts/UIContext';
import { formatCurrency } from '../../../utils/formatters';
import { PlusCircle, Edit, Trash2, Package, Check, X, ImageOff } from 'lucide-react';
import { ExtensionFormModal } from './ExtensionFormModal';

export const ExtensionsManager: React.FC = () => {
    const { showAlert, showConfirmation } = useUI();
    const [extensions, setExtensions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentExtension, setCurrentExtension] = useState<any | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'extensions'), orderBy('name'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Remove duplicatas por ID para evitar erro de key
            const unique = Array.from(new Map(list.map(item => [item['id'], item])).values());
            setExtensions(unique);
            setLoading(false);
        }, (error) => {
            console.error("Erro ao buscar:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleOpenModal = (ext: any = null) => {
        setCurrentExtension(ext);
        setIsModalOpen(true);
    };

    const handleSave = async (data: any) => {
        try {
            // Se já tem ID, usa. Se não, gera um novo.
            const docId = data.id || doc(collection(db, 'extensions')).id;
            const docRef = doc(db, 'extensions', docId);

            await setDoc(docRef, {
                ...data,
                id: docId, // Garante que o ID fique salvo no documento também
                updatedAt: new Date().toISOString()
            }, { merge: true });

            showAlert(currentExtension ? "Extensão atualizada!" : "Extensão criada!");
            setIsModalOpen(false);
            setCurrentExtension(null);
        } catch (e: any) {
            console.error("Erro ao salvar:", e);
            showAlert(`Erro: ${e.message}`, 'error');
        }
    };

    const handleDelete = (id: string) => {
        if (!id) return;
        showConfirmation("Tem certeza que deseja excluir esta extensão permanentemente?", async () => {
             try {
                await deleteDoc(doc(db, 'extensions', id));
                showAlert("Extensão excluída com sucesso.");
             } catch (e: any) {
                 console.error("Erro ao excluir:", e);
                 showAlert(`Erro ao excluir: ${e.message}`, 'error');
             }
        });
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            await setDoc(doc(db, 'extensions', id), { status }, { merge: true });
            showAlert(`Status alterado para ${status}.`);
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div className="p-10 text-center">Carregando...</div>;

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Gerenciar Extensões</h1>
                <button onClick={() => handleOpenModal()} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center hover:bg-blue-700 shadow transition-all">
                    <PlusCircle size={20} className="mr-2" /> Nova Extensão
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs border-b">
                        <tr>
                            <th className="px-6 py-4">Extensão</th>
                            <th className="px-6 py-4">Chave</th>
                            <th className="px-6 py-4">Preço</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {extensions.map(ext => (
                            <tr key={ext.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg border bg-gray-50 flex items-center justify-center overflow-hidden">
                                            {ext.mediaAssets?.logo ? (
                                                <img src={ext.mediaAssets.logo} alt="" className="w-full h-full object-contain" />
                                            ) : (
                                                <Package size={20} className="text-gray-400" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">{ext.name}</div>
                                            <div className="text-xs text-gray-500">{ext.author}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-mono text-xs text-gray-600">{ext.featureKey}</td>
                                <td className="px-6 py-4 font-bold text-gray-800">
                                    {Number(ext.priceMonthly) > 0 ? formatCurrency(ext.priceMonthly) : 'Grátis'}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${ext.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {ext.status === 'approved' ? 'Ativo' : 'Pendente'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => handleOpenModal(ext)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Editar">
                                            <Edit size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(ext.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Excluir">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {extensions.length === 0 && <div className="p-10 text-center text-gray-400">Nenhuma extensão encontrada.</div>}
            </div>

            {isModalOpen && (
                <ExtensionFormModal 
                    isOpen={isModalOpen} 
                    onClose={() => { setIsModalOpen(false); setCurrentExtension(null); }} 
                    onSave={handleSave} 
                    initialData={currentExtension} 
                />
            )}
        </div>
    );
};