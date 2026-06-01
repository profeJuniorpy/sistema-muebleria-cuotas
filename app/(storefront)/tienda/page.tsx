import Link from "next/link";
import { ArrowRight, Sofa, Tv, Smartphone, BedDouble, Package } from "lucide-react";
import { getStorefrontProducts, getStorefrontCategories, getCompanyContact } from "@/lib/actions/storefront";
import { ProductCard } from "@/components/storefront/product-card";

const CAT_ICONS: Record<string, React.ElementType> = {
  MUEBLES: Sofa,
  ELECTRODOMESTICOS: Tv,
  ELECTRONICOS: Smartphone,
  COLCHONES: BedDouble,
  OTROS: Package,
};

const CAT_COLORS: Record<string, string> = {
  MUEBLES: "bg-amber-50 text-amber-700 border-amber-200",
  ELECTRODOMESTICOS: "bg-blue-50 text-blue-700 border-blue-200",
  ELECTRONICOS: "bg-violet-50 text-violet-700 border-violet-200",
  COLCHONES: "bg-emerald-50 text-emerald-700 border-emerald-200",
  OTROS: "bg-zinc-50 text-zinc-700 border-zinc-200",
};

export default async function TiendaHomePage() {
  const [{ products: featured }, categories, company] = await Promise.all([
    getStorefrontProducts({ limit: 8 }),
    getStorefrontCategories(),
    getCompanyContact(),
  ]);

  return (
    <div className="space-y-16 pb-16">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-zinc-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#3f3f46_0%,_#18181b_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-24 md:py-32">
          <div className="max-w-xl space-y-6">
            <span className="inline-block rounded-full border border-zinc-700 px-4 py-1 text-xs font-medium text-zinc-400 uppercase tracking-widest">
              {company.name}
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">
              Amueblá tu hogar con estilo
            </h1>
            <p className="text-lg text-zinc-400 leading-relaxed">
              Muebles, electrodomésticos y más — con opciones de contado y crédito a tu medida.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/tienda/catalogo"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 transition-colors"
              >
                Ver catálogo <ArrowRight className="h-4 w-4" />
              </Link>
              {company.phone && (
                <a
                  href={`https://wa.me/${company.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors"
                >
                  Consultar por WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-zinc-900 mb-6">Explorar categorías</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {categories.map((cat) => {
              const Icon = CAT_ICONS[cat.category] ?? Package;
              const colorClass = CAT_COLORS[cat.category] ?? CAT_COLORS.OTROS;
              return (
                <Link
                  key={cat.category}
                  href={`/tienda/catalogo?category=${cat.category}`}
                  className={`flex flex-col items-center gap-3 rounded-2xl border p-5 hover:shadow-md transition-all ${colorClass}`}
                >
                  <Icon className="h-8 w-8" />
                  <span className="text-sm font-semibold text-center">{cat.label}</span>
                  <span className="text-xs opacity-60">{cat.count} productos</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Featured products ── */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-zinc-900">Productos destacados</h2>
            <Link
              href="/tienda/catalogo"
              className="flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              Ver todos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* ── Value props ── */}
      <section className="bg-white border-y border-zinc-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { title: "Financiación propia", desc: "Planes de crédito adaptados a tus posibilidades." },
              { title: "Stock actualizado", desc: "Todos los productos mostrados están disponibles en nuestra tienda." },
              { title: "Atención personalizada", desc: "Consultanos por WhatsApp y te respondemos al instante." },
            ].map((item) => (
              <div key={item.title} className="space-y-2">
                <p className="font-bold text-zinc-900">{item.title}</p>
                <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
