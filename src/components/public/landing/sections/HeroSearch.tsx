import React from "react";
import { MapPin, Search } from "lucide-react";

type Props = {
  onSearch?: (address: string) => void;
};

export const HeroSearch: React.FC<Props> = ({ onSearch }) => {
  const [address, setAddress] = React.useState("");

  return (
    <section className="pt-12 md:pt-16">
      <div className="container mx-auto px-4">
        
        {/* 🔥 CENTRALIZADOR */}
        <div className="max-w-3xl mx-auto text-center">
          
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Tudo pra facilitar seu dia a dia
          </h1>

          <p className="mt-3 text-neutral-600 text-lg">
            O que você precisa está aqui. Peça e receba onde estiver.
          </p>

          {/* 🔍 BUSCA */}
          <form
            className="mt-7 flex flex-col sm:flex-row gap-3 justify-center"
            onSubmit={(e) => {
              e.preventDefault();
              onSearch?.(address.trim());
            }}
          >
            <div className="flex-1 relative max-w-xl">
              <MapPin
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />

              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full h-12 pl-10 pr-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 bg-white"
                placeholder="Endereço de entrega e número"
                autoComplete="street-address"
              />
            </div>

            <button
              type="submit"
              className="h-12 px-6 rounded-xl bg-red-600 text-white font-semibold inline-flex items-center justify-center gap-2 hover:bg-red-700"
            >
              <Search size={18} />
              Buscar
            </button>
          </form>

          <p className="mt-3 text-sm text-neutral-500">
            Depois você conecta isso ao seu state global de endereço (header) e à busca real.
          </p>
        </div>
      </div>
    </section>
  );
};
