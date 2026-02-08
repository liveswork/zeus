import React from 'react';
import { ImageOff, Loader, ImageIcon } from 'lucide-react';
import { useCachedImage } from '../../hooks/useCachedImage';

interface SecureImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    fallbackText?: string;
    fallbackIcon?: 'product' | 'user' | 'default';
}

export const SecureImage: React.FC<SecureImageProps> = ({ 
    src, 
    alt, 
    className, 
    fallbackText,
    fallbackIcon = 'default',
    ...props 
}) => {
    // 🟢 USA O HOOK DE CACHE
    const { cachedSrc, isLoading, isError } = useCachedImage(src);

    // Renderiza Loader enquanto busca no disco ou baixa
    if (isLoading) {
        return (
            <div className={`flex items-center justify-center bg-gray-100 animate-pulse ${className}`}>
                <Loader className="animate-spin text-gray-400" size={20} />
            </div>
        );
    }

    // Renderiza Erro ou Fallback se não conseguiu imagem
    if (isError || !cachedSrc) {
        return (
            <div className={`flex flex-col items-center justify-center bg-gray-100 text-gray-400 ${className}`}>
                {fallbackIcon === 'product' ? <ImageIcon size={24} /> : <ImageOff size={24} />}
                {fallbackText && <span className="text-[10px] mt-1 text-center px-1">{fallbackText}</span>}
            </div>
        );
    }

    // Renderiza a Imagem Real (vinda do Cache Local ou Internet)
    return <img src={cachedSrc} alt={alt} className={className} {...props} />;
};