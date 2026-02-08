import React from 'react';
import { Star, CheckCircle } from 'lucide-react';

// Princípio do Artesanato: Componente dedicado para as estrelas, com lógica correta.
const StarRating = ({ rating = 0, reviewCount = 0 }) => {
    // Princípio da Clareza: Só mostra estrelas se houver avaliações.
    if (rating === 0 && reviewCount === 0) {
        return <div className="h-5 text-xs text-gray-400">Sem avaliações</div>;
    }

    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars;

    return (
        <div className="flex items-center gap-1">
            <div className="flex items-center text-yellow-500">
                {[...Array(fullStars)].map((_, i) => <Star key={`full-${i}`} size={16} fill="currentColor" />)}
                {[...Array(emptyStars)].map((_, i) => <Star key={`empty-${i}`} size={16} className="text-gray-300" />)}
            </div>
            <span className="text-gray-500 text-xs ml-1">({reviewCount})</span>
        </div>
    );
};

export const ExtensionCard: React.FC<any> = ({ extension, onAcquire, isActivated, onShowDetails, isProcessing }) => {
    // Princípio do Foco: A ação principal muda com base no estado (Instalado vs. Instalar).
    const MainActionButton = () => {
        if (isActivated) {
            return (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                    <CheckCircle size={16} />
                    Instalado
                </div>
            );
        }
        return (
            <button
                onClick={() => onAcquire(extension)}
                disabled={isProcessing}
                className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-semibold hover:bg-blue-700 transition-all transform hover:scale-105"
            >
                {isProcessing ? 'Processando...' : 'Instalar'}
            </button>
        );
    };

    return (
        // Princípio da Simplicidade Sofisticada: Menos bordas, mais sombra e espaço.
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="p-6 flex flex-col flex-grow">
                {/* Princípio da Clareza: Hierarquia visual clara. */}
                <div className="flex items-start gap-5">
                    <div className="w-16 h-16 flex-shrink-0">
                        <img 
                            src={extension.mediaAssets?.logo || 'https://via.placeholder.com/100'} 
                            alt={`Logo de ${extension.name}`} 
                            className="w-full h-full object-contain rounded-xl border p-1" 
                        />
                    </div>
                    <div className="flex-grow">
                        <h3 className="text-lg font-bold text-gray-900">{extension.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                            Por <span className="font-semibold">{extension.author || 'Desconhecido'}</span>
                        </p>
                    </div>
                </div>

                <p className="text-sm text-gray-600 mt-4 h-20 flex-grow">
                    {extension.description}
                </p>

                {/* Princípio do Artesanato: Métricas bem organizadas e alinhadas. */}
                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Avaliação</span>
                        <StarRating rating={extension.rating} reviewCount={extension.reviewCount} />
                    </div>
                    <div className="flex flex-col text-right">
                        <span className="text-xs text-gray-500">Instalações</span>
                        <span className="font-semibold text-gray-800">
                            {(extension.activeInstalls || 0).toLocaleString('pt-BR')}+
                        </span>
                    </div>
                </div>
            </div>

            {/* Princípio do Foco: Separação clara entre ação primária e secundária. */}
            <div className="bg-gray-50/70 border-t border-gray-100 px-6 py-4 flex justify-between items-center">
                <button 
                    onClick={() => onShowDetails(extension)} 
                    className="text-sm font-semibold text-blue-600 hover:underline"
                >
                    Mais detalhes
                </button>
                <MainActionButton />
            </div>
        </div>
    );
};