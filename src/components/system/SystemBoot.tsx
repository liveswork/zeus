import React, { useEffect, useRef, useState } from 'react';

interface SystemBootProps {
  onComplete: () => void;
}

export const SystemBoot: React.FC<SystemBootProps> = ({ onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    // Tenta iniciar o vídeo automaticamente
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.error("Erro ao reproduzir vídeo de boot:", error);
        // Se falhar o autoplay (raro no Electron), pula a intro
        onComplete();
      });
    }
  }, []);

  const handleEnded = () => {
    // Efeito de Fade Out antes de remover
    setOpacity(0);
    setTimeout(() => {
      onComplete();
    }, 500); // 500ms para a transição suave
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center transition-opacity duration-500"
      style={{ opacity: opacity }}
    >
      <video
        ref={videoRef}
        src="/boot.mp4" // O caminho relativo à pasta public
        className="w-full h-full object-cover"
        autoPlay
        muted={false} // Se quiser som, deixe false. Se o navegador bloquear, mude para true.
        playsInline
        onEnded={handleEnded}
      />
      
      {/* Botão de Pular (Opcional, para desenvolvimento) */}
      <button 
        onClick={handleEnded}
        className="absolute bottom-4 right-4 text-white/20 hover:text-white/80 text-xs uppercase tracking-widest transition-colors"
      >
        Pular Boot
      </button>
    </div>
  );
};