// src/components/admin/modules/ExtensionsManager.tsx

import React, { useState, useEffect } from 'react';
import { db } from '../../../config/firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { useUI } from '../../../contexts/UIContext';
import { formatCurrency } from '../../../utils/formatters';
import { PlusCircle, Edit, Trash2, Package, Check, X } from 'lucide-react';
import { ExtensionFormModal } from './ExtensionFormModal'; // Criaremos a seguir

export const ExtensionsManager: React.FC = () => {
    const { showAlert, showConfirmation } = useUI();
    const [extensions, setExtensions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentExtension, setCurrentExtension] = useState<any | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'extensions'), orderBy('name'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setExtensions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
            if (currentExtension) {
                await updateDoc(doc(db, 'extensions', currentExtension.id), data);
                showAlert("Extensão atualizada!");
            } else {
                await addDoc(collection(db, 'extensions'), data);
                showAlert("Extensão criada!");
            }
            setIsModalOpen(false);
        } catch (e) {
            console.error(e);
            showAlert("Erro ao salvar.", 'error');
        }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        await updateDoc(doc(db, 'extensions', id), { status });
        showAlert(`Status da extensão alterado para ${status}.`);
    };
    
    const handleDelete = (id: string) => {
        showConfirmation("Tem certeza que deseja excluir esta extensão?", async () => {
             await deleteDoc(doc(db, 'extensions', id));
             showAlert("Extensão excluída.");
        });
    };

    if (loading) return <p>Carregando extensões...</p>;

    return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">Gerenciar Extensões</h1>
            <button onClick={() => handleOpenModal()} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center hover:bg-blue-700">
                <PlusCircle size={20} className="mr-2" /> Nova Extensão
            </button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="px-6 py-3">Nome</th>
                            <th className="px-6 py-3">Feature Key</th>
                            <th className="px-6 py-3">Preço</th>
                            <th className="px-6 py-3 text-center">Status</th>
                            <th className="px-6 py-3 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {extensions.map(ext => (
                            <tr key={ext.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4 font-bold text-gray-900">{ext.name}</td>
                                <td className="px-6 py-4 font-mono text-xs">{ext.featureKey}</td>
                                <td className="px-6 py-4">{formatCurrency(ext.priceMonthly || 0)}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        ext.status === 'approved' ? 'bg-green-100 text-green-800' :
                                        ext.status === 'pending_review' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                        {ext.status?.replace('_', ' ').toUpperCase() || 'N/A'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center space-x-2">
                                     {ext.status === 'pending_review' && <button onClick={() => handleUpdateStatus(ext.id, 'approved')} className="p-2 text-green-600 hover:bg-green-100 rounded-full" title="Aprovar"><Check size={18}/></button>}
                                     {ext.status === 'approved' && <button onClick={() => handleUpdateStatus(ext.id, 'rejected')} className="p-2 text-red-600 hover:bg-red-100 rounded-full" title="Rejeitar/Pausar"><X size={18}/></button>}
                                     <button onClick={() => handleOpenModal(ext)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full" title="Editar"><Edit size={18} /></button>
                                     <button onClick={() => handleDelete(ext.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-full" title="Excluir"><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {isModalOpen && <ExtensionFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} initialData={currentExtension} />}
    </div>
);
};