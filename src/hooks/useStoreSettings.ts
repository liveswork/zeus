import { useState, useEffect } from 'react';
import { db, storage } from '../config/firebase';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytesResumable } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export const useStoreSettings = () => {
    const { userProfile } = useAuth();
    const [saving, setSaving] = useState(false);
    const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
    const [checkingSlug, setCheckingSlug] = useState(false);
    
    // Estado Genérico (funciona pra tudo)
    const [config, setConfig] = useState({
        slug: '',
        primaryColor: '#3B82F6',
        secondaryColor: '#FFFFFF',
        description: '',
        footerText: '',
        whatsappContact: '',
        instagramUrl: '',
        logoUrl: '',
        // Campos Retail
        retailBannersDesktop: [] as string[],
        retailBannersMobile: [] as string[],
        // Campos Food
        foodCoverUrl: '',
        // ... outros campos futuros
        // --- FUNCIONAIS / TOGGLES (Novos) ---
        isActive: true, // Loja/Cardápio Ativado
        allowOrders: true, // Aceitar Pedidos
        askForName: true, // Pedir nome no checkout
        showOutOfStock: false, // Mostrar produtos esgotados
        featuredProductIds: [] as string[] // IDs dos produtos em destaque
    });

    useEffect(() => {
        if (userProfile?.publicSettings) {
            setConfig(prev => ({ ...prev, ...userProfile.publicSettings }));
        } else if (userProfile?.companyName) {
            const suggested = userProfile.companyName.toLowerCase().replace(/[^a-z0-9]/g, '-');
            setConfig(prev => ({ ...prev, slug: suggested }));
            checkSlug(suggested);
        }
    }, [userProfile]);

    const checkSlug = async (slug: string) => {
        if (!slug || slug.length < 3) {
            setSlugAvailable(null);
            return;
        }
        if (userProfile?.publicSettings?.slug === slug) {
            setSlugAvailable(true);
            return;
        }
        setCheckingSlug(true);
        try {
            const q = query(collection(db, 'users'), where('publicSettings.slug', '==', slug));
            const snapshot = await getDocs(q);
            setSlugAvailable(snapshot.empty);
        } finally {
            setCheckingSlug(false);
        }
    };

    const handleUpload = async (file: File, field: string, isArray = false) => {
        if (!userProfile?.uid) return;
        const toastId = toast.loading("Enviando...");
        try {
            const fileName = `${Date.now()}_${field}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
            const path = `uploads/public_assets/${userProfile.uid}/${fileName}`;
            const storageRef = ref(storage, path);
            await uploadBytesResumable(storageRef, file, { contentType: file.type });
            const bucket = 'zeuspdv.firebasestorage.app';
            const encodedPath = encodeURIComponent(path);
            const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`;

            if (isArray) {
                setConfig(prev => ({
                    ...prev,
                    [field]: [...(prev[field as keyof typeof prev] as string[]), publicUrl]
                }));
            } else {
                setConfig(prev => ({ ...prev, [field]: publicUrl }));
            }
            toast.success("Imagem enviada!", { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error("Erro no upload", { id: toastId });
        }
    };

    const handleSave = async () => {
        if (slugAvailable === false) return toast.error("Link indisponível");
        setSaving(true);
        try {
            const userRef = doc(db, 'users', userProfile!.uid);
            await updateDoc(userRef, {
                publicSettings: config,
                updatedAt: new Date().toISOString()
            });
            toast.success("Configurações salvas!");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar");
        } finally {
            setSaving(false);
        }
    };

    return {
        config,
        setConfig,
        saving,
        handleSave,
        handleUpload,
        slugAvailable,
        checkSlug,
        checkingSlug,
        userProfile
    };
};