import React, { useState, useEffect, useMemo } from 'react';
import { db, functions } from '../../../config/firebase';
import { collection, onSnapshot, query, where, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from '../../../contexts/AuthContext';
import { useUI } from '../../../contexts/UIContext';
import { Search, Package } from 'lucide-react';
import { ExtensionCard } from './subscription/ExtensionCard';
import { ExtensionDetailModal } from './subscription/ExtensionDetailModal';

const createExtensionSubscriptionCallable = httpsCallable(functions, 'createExtensionSubscription');

export const ExtensionStore: React.FC = () => {
    const { userProfile } = useAuth();
    const { showAlert } = useUI();
    const [extensions, setExtensions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedExtension, setSelectedExtension] = useState<any | null>(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState<string | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'extensions'), where("status", "==", "approved"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setExtensions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleAcquire = async (extension: any) => {
        if (!userProfile) return;
        setIsProcessingPayment(extension.id);
        const price = extension.promoActive ? extension.promoPrice : extension.priceMonthly;

        try {
            if (price <= 0) {
                const userRef = doc(db, 'users', userProfile.uid);
                await updateDoc(userRef, { activeExtensions: arrayUnion(extension.featureKey) });
                showAlert(`Extensão "${extension.name}" ativada com sucesso!`, 'success');
            } else {
                showAlert("Preparando seu checkout seguro...", "info");
                const result = await createExtensionSubscriptionCallable({ extensionId: extension.id });
                const data = result.data as { init_point: string };
                if (data.init_point) {
                    window.location.href = data.init_point;
                } else {
                    showAlert("Não foi possível gerar o link de pagamento.", "error");
                }
            }
        } catch (error: any) {
            console.error(error);
            showAlert(error.message || "Ocorreu um erro.", 'error');
        } finally {
            setIsProcessingPayment(null);
        }
    };

    const handleOpenDetailModal = (extension: any) => {
        setSelectedExtension(extension);
        setIsDetailModalOpen(true);
    };

    const filteredExtensions = useMemo(() => {
        return extensions.filter(ext =>
            ext.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [extensions, searchTerm]);

    if (loading) return <p>Carregando loja de extensões...</p>;

    return (
        // Princípio da Simplicidade: Aumentamos o padding e o espaçamento geral.
        <div className="p-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Loja de Extensões</h1>
                    <p className="text-gray-500 mt-1">Adicione novas funcionalidades ao seu sistema.</p>
                </div>
                <div className="relative w-full md:w-auto">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Pesquisar extensões..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-80 p-3 pl-12 border rounded-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-400"
                    />
                </div>
            </div>
            
            {filteredExtensions.length > 0 ? (
                // Princípio do Artesanato: Um grid consistente que se adapta a diferentes telas.
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredExtensions.map(ext => {
                        const isActivated = userProfile?.activeExtensions?.includes(ext.featureKey);
                        return (
                            <ExtensionCard
                                key={ext.id}
                                extension={ext}
                                onAcquire={handleAcquire}
                                isActivated={isActivated}
                                onShowDetails={handleOpenDetailModal}
                                isProcessing={isProcessingPayment === ext.id}
                            />
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-50 rounded-lg">
                    <Package size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">Nenhuma extensão encontrada com o termo "{searchTerm}"</p>
                </div>
            )}


            {selectedExtension && (
                <ExtensionDetailModal
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    extension={selectedExtension}
                    onAcquire={handleAcquire}
                    isActivated={userProfile?.activeExtensions?.includes(selectedExtension.featureKey)}
                    isProcessing={isProcessingPayment === selectedExtension.id}
                />
            )}
        </div>
    );
};