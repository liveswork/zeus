import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Card } from "../ui/Card";

export const FoodLoverBanner: React.FC = () => {
  return (
    <section className="pb-12">
      <div className="container mx-auto px-4">
        <Card className="overflow-hidden rounded-3xl">
          <div className="grid md:grid-cols-[1.3fr_1fr]">
            <div className="min-h-[220px] bg-gradient-to-br from-red-50 to-neutral-100 flex items-center justify-center">
              <div className="text-center px-6">
                <p className="text-sm font-semibold text-neutral-700">Banner</p>
                <p className="text-sm text-neutral-600 mt-1">
                  Troque por imagem real (ex: /assets/food-lover.jpg).
                </p>
              </div>
            </div>

            <div className="p-7">
              <h3 className="text-2xl font-extrabold">Você tem fome do quê?</h3>
              <p className="mt-2 text-neutral-600">
                Descubra como é fazer parte do ecossistema e impulsione seu negócio.
              </p>
              <Link
                to="/cadastro"
                className="mt-5 inline-flex items-center gap-2 font-semibold text-red-600 hover:text-red-700"
              >
                Saiba mais <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};
