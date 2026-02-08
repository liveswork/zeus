import { useState, useEffect } from 'react';

export const useCachedImage = (src: string | undefined) => {
    const [cachedSrc, setCachedSrc] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const cacheImage = async () => {
            if (!src) {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setIsError(false);

                // 1. Abre o cofre de cache específico para imagens
                const cache = await caches.open('zeus-images-v1');
                
                // 2. Tenta encontrar a imagem no cofre
                const cachedResponse = await cache.match(src);

                if (cachedResponse) {
                    // ✅ ACHOOU NO COFRE (OFFLINE)
                    const blob = await cachedResponse.blob();
                    const objectUrl = URL.createObjectURL(blob);
                    if (isMounted) setCachedSrc(objectUrl);
                } else {
                    // ❌ NÃO TEM NO COFRE -> BAIXAR DA NUVEM
                    if (navigator.onLine) {
                        try {
                            // Faz o fetch da imagem
                            const response = await fetch(src, { mode: 'cors' });
                            
                            if (!response.ok) throw new Error('Falha no download');

                            // Clona a resposta para salvar no cache
                            const responseToCache = response.clone();
                            await cache.put(src, responseToCache);

                            const blob = await response.blob();
                            const objectUrl = URL.createObjectURL(blob);
                            if (isMounted) setCachedSrc(objectUrl);
                        } catch (err) {
                            console.warn('Falha ao baixar/cachear imagem:', err);
                            setIsError(true);
                        }
                    } else {
                        // Sem internet e sem cache
                        setIsError(true);
                    }
                }
            } catch (error) {
                console.error('Erro no mecanismo de cache:', error);
                setIsError(true);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        cacheImage();

        return () => {
            isMounted = false;
            // Limpa URLs de objeto para evitar vazamento de memória
            if (cachedSrc) URL.revokeObjectURL(cachedSrc);
        };
    }, [src]);

    return { cachedSrc, isLoading, isError };
};