import React from "react";

type Props = {
  children: React.ReactNode;
};

export const PremiumHeroShell: React.FC<Props> = ({ children }) => {
  return (
    <div className="relative">
      {/* FUNDO CINZA */}
      <div className="absolute inset-x-0 top-0 bg-neutral-100 h-full" />

      {/* CONTEÚDO */}
      <div className="relative z-10 pb-5">
        {children}
      </div>

      {/* CORTE BRANCO (para parar no meio da categoria) */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-white" />
    </div>
  );
};
