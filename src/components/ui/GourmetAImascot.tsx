// src/components/ui/GourmetAImascot.tsx

import React from 'react';

export const GourmetAImascot: React.FC = () => {
  return (
    <div className="w-24 h-24 relative animate-float">
      {/* Sombra */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-2 bg-black/20 rounded-full blur-md"></div>
      
      {/* Corpo do Robô */}
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Chapéu de Chef */}
        <path d="M50 20 Q30 5, 20 25 T30 45 Q50 35, 70 45 T80 25 Q70 5, 50 20 Z" fill="#FFFFFF"/>
        <rect x="18" y="42" width="64" height="8" rx="4" fill="#FFFFFF"/>

        {/* Cabeça */}
        <circle cx="50" cy="65" r="25" fill="#E0E7FF"/>
        
        {/* Olho (visor) */}
        <rect x="30" y="58" width="40" height="12" rx="6" fill="#4338CA"/>
        
        {/* Brilho no visor */}
        <circle cx="62" cy="64" r="2" fill="#FFFFFF"/>
      </svg>
    </div>
  );
};