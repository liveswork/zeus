import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Store, Truck } from "lucide-react";
import { Card } from "../ui/Card";

export const PartnerCTA: React.FC = () => {
  return (
    <section className="py-10">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-6 flex gap-5 items-center">
            <div className="w-14 h-14 rounded-2xl bg-neutral-900 text-white flex items-center justify-center">
              <Truck size={24} />
            </div>
            <div className="flex-1">
              <p className="text-lg font-extrabold">Quer fazer entregas?</p>
              <p className="text-sm text-neutral-600 mt-1">
                Faça seu cadastro e comece o quanto antes.
              </p>
              <Link
                to="/cadastro"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 text-white font-semibold hover:bg-neutral-800"
              >
                Saiba mais <ArrowRight size={18} />
              </Link>
            </div>
          </Card>

          <Card className="p-6 flex gap-5 items-center">
            <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center">
              <Store size={24} />
            </div>
            <div className="flex-1">
              <p className="text-lg font-extrabold">Cresça com o Nexxus</p>
              <p className="text-sm text-neutral-600 mt-1">
                Cadastre seu restaurante ou sua loja e venda mais.
              </p>
              <Link
                to="/cadastro"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700"
              >
                Saiba mais <ArrowRight size={18} />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};
