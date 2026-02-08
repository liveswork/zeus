import { useState, useEffect } from 'react';
import { getDatabase } from '../database/db';
import { Product } from '../types';

export const useLocalProducts = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let subscription: any = null;

        const init = async () => {
            try {
                const db = await getDatabase();
                
                // Observa mudanças em tempo real no banco local
                // O RxDB magicamente atualiza a UI quando algo muda
                subscription = db.products.find().$.subscribe(documents => {
                    const cleanProducts = documents.map(doc => doc.toJSON());
                    setProducts(cleanProducts as Product[]);
                    setLoading(false);
                });
            } catch (error) {
                console.error("Erro ao conectar no ZeusDB:", error);
                setLoading(false);
            }
        };

        init();
        
        // Cleanup para evitar vazamento de memória
        return () => {
            if (subscription && subscription.unsubscribe) {
                subscription.unsubscribe();
            }
        };
    }, []);

    // Salva (Funciona Offline e Online)
    const saveProductLocal = async (productData: Product) => {
        const db = await getDatabase();
        // Upsert: Atualiza se existe, Cria se não existe
        return await db.products.upsert(productData);
    };

    // Deleta (Funciona Offline e Online)
    const deleteProductLocal = async (id: string) => {
        const db = await getDatabase();
        const doc = await db.products.findOne(id).exec();
        if (doc) {
            await doc.remove();
        }
    };

    return { 
        products, 
        loading, 
        saveProductLocal, 
        deleteProductLocal 
    };
};