import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

export const usePublicBusiness = (identifier: string | undefined) => {
    const [business, setBusiness] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!identifier) return;

        const fetchBusiness = async () => {
            setLoading(true);
            try {
                let businessData = null;
                let businessId = identifier;

                // 1. Tenta buscar pelo ID direto (Padrão antigo)
                // Verifica se tem cara de ID (20+ caracteres alfanuméricos)
                if (identifier.length > 20) {
                    const docRef = doc(db, 'users', identifier);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        businessData = { id: docSnap.id, ...docSnap.data() };
                    }
                }

                // 2. Se não achou por ID, tenta buscar pelo SLUG (Novo padrão)
                if (!businessData) {
                    const q = query(
                        collection(db, 'users'), 
                        where('publicSettings.slug', '==', identifier) // Busca no campo novo
                    );
                    const querySnapshot = await getDocs(q);
                    if (!querySnapshot.empty) {
                        const doc = querySnapshot.docs[0];
                        businessData = { id: doc.id, ...doc.data() };
                        businessId = doc.id;
                    }
                }

                if (businessData) {
                    // 3. Normaliza os dados para facilitar o uso no front
                    // Se tiver publicSettings, usa eles. Se não, usa o fallback do perfil antigo.
                    const settings = businessData.publicSettings || {};
                    
                    const normalizedData = {
                        ...businessData,
                        // Prioriza a configuração visual, fallback para dados cadastrais
                        displayName: businessData.companyName || businessData.displayName,
                        logo: settings.logoUrl || businessData.logoUrl,
                        cover: settings.foodCoverUrl || settings.retailBannersDesktop?.[0] || '', // Pega capa ou banner
                        color: settings.primaryColor || '#2563EB', // Azul padrão se não tiver cor
                        description: settings.description || businessData.profile?.description,
                        whatsapp: settings.whatsappContact || businessData.profile?.whatsapp,
                        // Configurações funcionais
                        isActive: settings.isActive !== false, // Padrão true
                        allowOrders: settings.allowOrders !== false
                    };
                    
                    setBusiness(normalizedData);
                } else {
                    setError('Estabelecimento não encontrado');
                }
            } catch (err) {
                console.error(err);
                setError('Erro ao carregar estabelecimento');
            } finally {
                setLoading(false);
            }
        };

        fetchBusiness();
    }, [identifier]);

    return { business, loading, error };
};