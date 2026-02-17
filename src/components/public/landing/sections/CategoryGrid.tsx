import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ShoppingCart, Utensils, Truck, Store } from "lucide-react";
import { Card } from "../ui/Card";

export const CategoryGrid: React.FC = () => {
  return (
    <section className="mt-16 md:mt-20 pb-10">
      <div className="container mx-auto px-4">
        {/* WRAPPER: limita largura para os cards grandes não ficarem gigantes */}
        <div className="max-w-5xl mx-auto">
          {/* 2 big cards (menos largos + mais “premium”) */}
          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            <Link
              to="/restaurantes"
              className="group relative overflow-hidden rounded-3xl border border-neutral-200 bg-gradient-to-br from-red-50 to-white hover:shadow-md transition-shadow"
            >
              <div className="p-6 md:p-8 min-h-[150px] md:min-h-[170px] flex items-center">
                <div className="flex w-full items-start justify-between gap-6">
                  <div>
                    <p className="text-sm font-semibold text-red-700">Categoria</p>
                    <h3 className="mt-1 text-2xl md:text-3xl font-extrabold">Restaurante</h3>

                    <div className="mt-5 inline-flex items-center gap-2 text-red-700 font-semibold">
                      Ver opções
                      <ArrowRight
                        size={18}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </div>
                  </div>

                  <div className="shrink-0 w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-sm">
                    <Utensils />
                  </div>
                </div>
              </div>

              {/* detalhe decorativo */}
              <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-red-100" />
            </Link>

            <Link
              to="/lojas"
              className="group relative overflow-hidden rounded-3xl border border-neutral-200 bg-gradient-to-br from-emerald-50 to-white hover:shadow-md transition-shadow"
            >
              <div className="p-6 md:p-8 min-h-[150px] md:min-h-[170px] flex items-center">
                <div className="flex w-full items-start justify-between gap-6">
                  <div>
                    <p className="text-sm font-semibold text-emerald-700">Categoria</p>
                    <h3 className="mt-1 text-2xl md:text-3xl font-extrabold">Lojas</h3>

                    <div className="mt-5 inline-flex items-center gap-2 text-emerald-700 font-semibold">
                      Buscar lojas
                      <ArrowRight
                        size={18}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </div>
                  </div>

                  <div className="shrink-0 w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                    <ShoppingCart />
                  </div>
                </div>
              </div>

              {/* detalhe decorativo */}
              <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-emerald-100" />
            </Link>
          </div>

          {/* small row */}
          <div className="mt-6">
            {/* Desktop: vira grid (fica mais alinhado e “premium”) */}
            <div className="hidden md:grid grid-cols-3 gap-4">
              <Link to="/fornecedores">
                <Card className="p-4 hover:bg-neutral-50 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                        <Truck size={20} />
                      </div>
                      <div>
                        <p className="font-bold">Fornecedores</p>
                        <p className="text-sm text-neutral-600">Conecte parceiros</p>
                      </div>
                    </div>
                    <ArrowRight size={18} className="text-neutral-400" />
                  </div>
                </Card>
              </Link>

              <Link to="/restaurantes">
                <Card className="p-4 hover:bg-neutral-50 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-rose-600 text-white flex items-center justify-center">
                        <Store size={20} />
                      </div>
                      <div>
                        <p className="font-bold">Destaques</p>
                        <p className="text-sm text-neutral-600">Promoções e combos</p>
                      </div>
                    </div>
                    <ArrowRight size={18} className="text-neutral-400" />
                  </div>
                </Card>
              </Link>

              <Link to="/cadastro">
                <Card className="p-4 hover:bg-neutral-50 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                        <Utensils size={20} />
                      </div>
                      <div>
                        <p className="font-bold">Seja parceiro</p>
                        <p className="text-sm text-neutral-600">Cadastre seu negócio</p>
                      </div>
                    </div>
                    <ArrowRight size={18} className="text-neutral-400" />
                  </div>
                </Card>
              </Link>
            </div>

            {/* Mobile: continua scroll horizontal, com espaçamento e “snap” */}
            <div className="md:hidden -mx-4 px-4 flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
              <Link to="/fornecedores" className="min-w-[260px] snap-start inline-flex">
                <Card className="w-full p-4 hover:bg-neutral-50 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                        <Truck size={20} />
                      </div>
                      <div>
                        <p className="font-bold">Fornecedores</p>
                        <p className="text-sm text-neutral-600">Conecte parceiros</p>
                      </div>
                    </div>
                    <ArrowRight size={18} className="text-neutral-400" />
                  </div>
                </Card>
              </Link>

              <Link to="/restaurantes" className="min-w-[260px] snap-start inline-flex">
                <Card className="w-full p-4 hover:bg-neutral-50 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-rose-600 text-white flex items-center justify-center">
                        <Store size={20} />
                      </div>
                      <div>
                        <p className="font-bold">Destaques</p>
                        <p className="text-sm text-neutral-600">Promoções e combos</p>
                      </div>
                    </div>
                    <ArrowRight size={18} className="text-neutral-400" />
                  </div>
                </Card>
              </Link>

              <Link to="/cadastro" className="min-w-[260px] snap-start inline-flex">
                <Card className="w-full p-4 hover:bg-neutral-50 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                        <Utensils size={20} />
                      </div>
                      <div>
                        <p className="font-bold">Seja parceiro</p>
                        <p className="text-sm text-neutral-600">Cadastre seu negócio</p>
                      </div>
                    </div>
                    <ArrowRight size={18} className="text-neutral-400" />
                  </div>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
