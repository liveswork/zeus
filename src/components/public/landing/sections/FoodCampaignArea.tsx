import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type FoodCampaignItem = {
  id: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  href?: string;
  // opcional: imagem real (se quiser trocar o placeholder depois)
  imageUrl?: string;
};

type Props = {
  items?: FoodCampaignItem[];
  autoPlayMs?: number; // default 4500
  className?: string;
};

export const FoodCampaignArea: React.FC<Props> = ({
  items = defaultCampaigns,
  autoPlayMs = 4500,
  className,
}) => {
  const [index, setIndex] = React.useState(0);
  const [isHovering, setIsHovering] = React.useState(false);

  const safeItems = items?.length ? items : defaultCampaigns;

  const prev = React.useCallback(() => {
    setIndex((i) => (i - 1 + safeItems.length) % safeItems.length);
  }, [safeItems.length]);

  const next = React.useCallback(() => {
    setIndex((i) => (i + 1) % safeItems.length);
  }, [safeItems.length]);

  // autoplay
  React.useEffect(() => {
    if (safeItems.length <= 1) return;
    if (isHovering) return;

    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % safeItems.length);
    }, autoPlayMs);

    return () => window.clearInterval(t);
  }, [autoPlayMs, isHovering, safeItems.length]);

  // acessibilidade: teclas esquerda/direita
  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  };

  const current = safeItems[index];

  return (
    <section className={className ?? "pb-6"}>
      <div className="container mx-auto px-4">
        <div
          className="rounded-3xl bg-gradient-to-br from-red-50 to-neutral-100 border border-neutral-200 overflow-hidden shadow-sm"
          tabIndex={0}
          onKeyDown={onKeyDown}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          aria-label="Campanhas em destaque"
        >
          <div className="p-6 md:p-8">
            <div className="relative rounded-2xl bg-white/80 border border-white shadow-sm overflow-hidden">
              {/* slide */}
              <div className="min-h-[240px] md:min-h-[280px] flex items-center">
                <div className="w-full px-6 md:px-10 py-10">
                  <p className="text-sm font-semibold text-neutral-700">Campanha</p>
                  <h3 className="mt-2 text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-900">
                    {current.title}
                  </h3>

                  {current.subtitle ? (
                    <p className="mt-2 text-neutral-600 max-w-2xl">
                      {current.subtitle}
                    </p>
                  ) : null}

                  <div className="mt-6 flex flex-wrap gap-3">
                    {current.href ? (
                      <a
                        href={current.href}
                        className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700"
                      >
                        {current.ctaLabel ?? "Ver oferta"}
                      </a>
                    ) : (
                      <button
                        type="button"
                        className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700"
                      >
                        {current.ctaLabel ?? "Ver oferta"}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setIndex(0)}
                      className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-white text-neutral-900 font-semibold border border-neutral-200 hover:bg-neutral-50"
                    >
                      Todas as campanhas
                    </button>
                  </div>
                </div>
              </div>

              {/* controls */}
              {safeItems.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-white/90 border border-neutral-200 hover:bg-white flex items-center justify-center shadow-sm"
                    aria-label="Campanha anterior"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={next}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-white/90 border border-neutral-200 hover:bg-white flex items-center justify-center shadow-sm"
                    aria-label="Próxima campanha"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}

              {/* indicators */}
              {safeItems.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                  {safeItems.map((it, i) => (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => setIndex(i)}
                      className={[
                        "h-2.5 rounded-full transition-all",
                        i === index ? "w-8 bg-red-600" : "w-2.5 bg-neutral-300 hover:bg-neutral-400",
                      ].join(" ")}
                      aria-label={`Ir para campanha ${i + 1}`}
                      aria-current={i === index ? "true" : "false"}
                    />
                  ))}
                </div>
              )}
            </div>

            <p className="mt-3 text-xs text-neutral-500">
              *Auto-play pausa ao passar o mouse. Use as setas do teclado para navegar.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

const defaultCampaigns: FoodCampaignItem[] = [
  {
    id: "c1",
    title: "Almoço a partir de R$ 10",
    subtitle: "Ofertas especiais dos seus FoodPartners para hoje.",
    ctaLabel: "Ver ofertas",
    href: "#/restaurantes",
  },
  {
    id: "c2",
    title: "Até 70% OFF em pratos selecionados",
    subtitle: "Descontos por tempo limitado — aproveite enquanto dura.",
    ctaLabel: "Quero desconto",
    href: "#/restaurantes",
  },
  {
    id: "c3",
    title: "Entrega rápida em lojas parceiras",
    subtitle: "Mercados, farmácias e conveniências perto de você.",
    ctaLabel: "Buscar lojas",
    href: "#/lojas",
  },
];
