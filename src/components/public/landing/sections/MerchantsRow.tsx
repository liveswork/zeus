import React from "react";
import { Link } from "react-router-dom";
import { Utensils, ShoppingCart } from "lucide-react";
import { Card } from "../ui/Card";

type Merchant = {
  name: string;
  subtitle: string;
  href: string;
};

type Props = {
  title: string;
  actionHref: string;
  actionLabel: string;
  kind: "restaurant" | "store";
  items: Merchant[];
};

export const MerchantsRow: React.FC<Props> = ({
  title,
  actionHref,
  actionLabel,
  kind,
  items,
}) => {
  const Icon = kind === "restaurant" ? Utensils : ShoppingCart;

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-xl md:text-2xl font-extrabold">{title}</h2>
          <Link
            to={actionHref}
            className="text-sm font-semibold text-red-600 hover:text-red-700"
          >
            {actionLabel}
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
          {items.map((m) => (
            <Link key={m.name} to={m.href}>
              <Card className="p-3 hover:bg-neutral-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center">
                    <Icon size={18} className="text-neutral-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{m.name}</p>
                    <p className="text-xs text-neutral-500 truncate">{m.subtitle}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
