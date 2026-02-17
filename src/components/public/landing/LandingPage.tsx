import React from "react";

import { PremiumHeroShell } from "./sections/PremiumHeroShell";
import { HeroSearch } from "./sections/HeroSearch";
import { FoodCampaignArea } from "./sections/FoodCampaignArea";
import { CategoryGrid } from "./sections/CategoryGrid";
import { MerchantsRow } from "./sections/MerchantsRow";
import { PromoBanners } from "./sections/PromoBanners";
import { PartnerCTA } from "./sections/PartnerCTA";
import { FoodLoverBanner } from "./sections/FoodLoverBanner";

export const LandingPage: React.FC = () => {
  const bestRestaurants = [
    { name: "McD", subtitle: "Lanchonete • 20-40 min", href: "/restaurantes" },
    { name: "Pizza", subtitle: "Pizzaria • 30-55 min", href: "/restaurantes" },
    { name: "Árabe", subtitle: "Culinária árabe • 25-45 min", href: "/restaurantes" },
    { name: "Hambúrguer", subtitle: "Burger • 20-35 min", href: "/restaurantes" },
    { name: "Sushi", subtitle: "Japonesa • 35-60 min", href: "/restaurantes" },
  ];

  const bestStores = [
    { name: "Mercado", subtitle: "Entrega rápida", href: "/lojas" },
    { name: "Farmácia", subtitle: "24h/Plantão", href: "/lojas" },
    { name: "Padaria", subtitle: "Pães e cafés", href: "/lojas" },
    { name: "Bebidas", subtitle: "Geladas agora", href: "/lojas" },
    { name: "Pet", subtitle: "Ração e cuidados", href: "/lojas" },
  ];

  return (
    <div className="bg-white text-neutral-900">
      <PremiumHeroShell grayHeightPx={590}>
        <HeroSearch
          onSearch={(address) => {
            console.log("search address:", address);
          }}
        />

        <CategoryGrid />
      </PremiumHeroShell>
      <MerchantsRow
        title="Os melhores restaurantes"
        actionHref="/restaurantes"
        actionLabel="Ver todos"
        kind="restaurant"
        items={bestRestaurants}
      />

      <PromoBanners />

      {/* NOVO: campanha abaixo */}
      <FoodCampaignArea />

      <MerchantsRow
        title="As melhores lojas"
        actionHref="/lojas"
        actionLabel="Ver todas"
        kind="store"
        items={bestStores}
      />

      <PartnerCTA />
      <FoodLoverBanner />
    </div>
  );
};
