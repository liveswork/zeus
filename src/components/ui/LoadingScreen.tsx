import React from 'react';
import { Loader, Utensils  } from 'lucide-react';

// 🟢 1. Definimos a interface das props aceitas
interface LoadingScreenProps {
  message?: string; // O '?' torna a mensagem opcional
}

// 🟢 2. Passamos a interface para o React.FC e desestruturamos a prop
export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Carregando..." // Valor padrão caso nenhuma mensagem seja passada
}) => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-50 z-50">
      <div className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-xl border border-gray-100">
        <Loader className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600 font-medium text-sm animate-pulse">
          {message}
        </p>
        <span className="text-xs text-gray-400 mt-2">Nexus OS</span>
      </div>
    </div>
  );
};