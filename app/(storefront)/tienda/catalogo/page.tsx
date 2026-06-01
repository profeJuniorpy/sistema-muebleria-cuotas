import { Suspense } from "react";
import { getStorefrontProducts, getStorefrontCategories } from "@/lib/actions/storefront";
import { ProductCard } from "@/components/storefront/product-card";
import { CategoryBadge } from "@/components/storefront/category-badge";
import { ChevronLeft, ChevronRight, SearchX } from "lucide-react";
import Link from "next/link";

interface SearchParams {
  category?: string;
  search?: string;
  page?: string;
}

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const category = searchParams.category;
  const search = searchParams.search;

  const [{ products, total, totalPages }, categories] = await Promise.all([
    getStorefrontProducts({ category, search, page, limit: 12 }),
    getStorefrontCategories(),
  ]);

  function buildPageUrl(p: number) {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (search) params.set("search", search);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/tienda/catalogo${qs ? `?${qs}` : ""}`;
  }

  const activeCategory = categories.find((c) => c.category === category);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">
          {activeCategory ? activeCategory.label : search ? `"${search}"` : "Catálogo"}
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          {total} producto{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Category filter */}
      <Suspense>
        <div className="flex flex-wrap gap-2">
          <CategoryBadgeAll active={!category} />
          {categories.map((cat) => (
            <CategoryBadge
              key={cat.category}
              category={cat.category}
              label={cat.label}
              count={cat.count}
            />
          ))}
        </div>
      </Suspense>

      {/* Grid */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <SearchX className="h-16 w-16 text-zinc-200" />
          <p className="text-zinc-500 font-medium">No encontramos productos con ese criterio.</p>
          <Link
            href="/tienda/catalogo"
            className="text-sm text-zinc-700 underline underline-offset-2 hover:text-zinc-900"
          >
            Ver todos los productos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {page > 1 ? (
            <Link
              href={buildPageUrl(page - 1)}
              className="flex items-center gap-1 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Anterior
            </Link>
          ) : (
            <span className="flex items-center gap-1 rounded-xl border border-zinc-100 px-4 py-2 text-sm font-medium text-zinc-300 cursor-not-allowed">
              <ChevronLeft className="h-4 w-4" /> Anterior
            </span>
          )}

          <span className="text-sm text-zinc-500 px-2">
            Página {page} de {totalPages}
          </span>

          {page < totalPages ? (
            <Link
              href={buildPageUrl(page + 1)}
              className="flex items-center gap-1 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50 transition-colors"
            >
              Siguiente <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <span className="flex items-center gap-1 rounded-xl border border-zinc-100 px-4 py-2 text-sm font-medium text-zinc-300 cursor-not-allowed">
              Siguiente <ChevronRight className="h-4 w-4" />
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Pill "Todos" — needs to be a separate client component because CategoryBadge uses useSearchParams
function CategoryBadgeAll({ active }: { active: boolean }) {
  return (
    <Link
      href="/tienda/catalogo"
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors border ${
        active
          ? "bg-zinc-900 text-white border-zinc-900"
          : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50"
      }`}
    >
      Todos
    </Link>
  );
}
