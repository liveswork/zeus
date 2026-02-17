import React from "react";

export const PromoBanners: React.FC = () => {
  return (
    <section className="pb-4">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-3">
          <div className="rounded-3xl overflow-hidden border border-neutral-200 bg-gradient-to-r from-amber-100 to-amber-50 p-6">
            <p className="text-sm font-semibold text-amber-900">Almoço</p>
            <p className="mt-1 text-2xl font-extrabold text-amber-900">A partir de R$ 10</p>
            <p className="mt-2 text-sm text-amber-900/70">Espaço de campanha</p>
          </div>

          <div className="rounded-3xl overflow-hidden border border-neutral-200 bg-gradient-to-r from-red-600 to-rose-600 p-6 text-white">
            <p className="text-sm font-semibold">Pratos</p>
            <p className="mt-1 text-2xl font-extrabold">Até 70% OFF</p>
            <p className="mt-2 text-sm text-white/80">Descontos do dia</p>
          </div>

          <div className="rounded-3xl overflow-hidden border border-neutral-200 bg-gradient-to-r from-neutral-900 to-neutral-700 p-6 text-white">
            <p className="text-sm font-semibold">Super</p>
            <p className="mt-1 text-2xl font-extrabold">Restaurantes</p>
            <p className="mt-2 text-sm text-white/80">Selos / ranking</p>
          </div>
        </div>
      </div>
    </section>
  );
};
