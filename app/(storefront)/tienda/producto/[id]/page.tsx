import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, CheckCircle, XCircle, ShoppingCart } from "lucide-react";
import { getStorefrontProductDetail, getStorefrontProducts, getCompanyContact } from "@/lib/actions/storefront";
import { ProductCard } from "@/components/storefront/product-card";
import { AddToCartButton } from "./add-to-cart-button";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(n);

export default async function ProductoDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [product, company] = await Promise.all([
    getStorefrontProductDetail(params.id),
    getCompanyContact(),
  ]);

  if (!product) notFound();

  // Related: same category, different product
  const { products: related } = await getStorefrontProducts({
    category: product.category,
    limit: 4,
  });
  const relatedFiltered = related.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-zinc-500">
        <Link href="/tienda" className="hover:text-zinc-900 transition-colors">Inicio</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/tienda/catalogo?category=${product.category}`} className="hover:text-zinc-900 transition-colors">
          {product.categoryLabel}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-zinc-900 font-medium line-clamp-1">{product.name}</span>
      </nav>

      {/* Main section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        {/* Image */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-300 gap-3">
              <ShoppingCart className="h-20 w-20" />
              <p className="text-sm text-zinc-400">Sin imagen disponible</p>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-6">
          {/* Category & brand */}
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600">
              {product.categoryLabel}
            </span>
            {product.brand && (
              <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600">
                {product.brand}
              </span>
            )}
          </div>

          {/* Name */}
          <div>
            <h1 className="text-3xl font-extrabold text-zinc-900 leading-tight">
              {product.name}
            </h1>
            {product.model && (
              <p className="text-sm text-zinc-500 mt-1">Modelo: {product.model}</p>
            )}
          </div>

          {/* Price */}
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 space-y-3">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Precio de contado</p>
              <p className="text-4xl font-extrabold text-zinc-900">{fmt(product.cashPrice)}</p>
            </div>
            {product.creditPrice > 0 && product.creditPrice !== product.cashPrice && (
              <div className="border-t pt-3">
                <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Precio crédito</p>
                <p className="text-2xl font-bold text-zinc-700">{fmt(product.creditPrice)}</p>
                <p className="text-xs text-zinc-400 mt-0.5">Consultá las cuotas disponibles</p>
              </div>
            )}
          </div>

          {/* Stock */}
          <div className="flex items-center gap-2">
            {product.inStock ? (
              <>
                <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                <span className="text-sm font-medium text-emerald-700">
                  En stock ({product.stock} disponible{product.stock !== 1 ? "s" : ""})
                </span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-400 shrink-0" />
                <span className="text-sm font-medium text-red-600">Sin stock</span>
              </>
            )}
          </div>

          {/* Add to cart */}
          <AddToCartButton
            product={{
              id: product.id,
              name: product.name,
              cashPrice: product.cashPrice,
              imageUrl: product.imageUrl,
            }}
            inStock={product.inStock}
          />

          {/* WhatsApp direct */}
          {company.phone && (
            <a
              href={`https://wa.me/${company.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola! Me interesa el producto: ${product.name} (Gs. ${fmt(product.cashPrice)})`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-xl border border-[#25D366] px-6 py-3 text-sm font-semibold text-[#25D366] hover:bg-[#25D366] hover:text-white transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Consultar este producto
            </a>
          )}

          {/* Description */}
          {product.description && (
            <div className="border-t pt-5">
              <h3 className="text-sm font-semibold text-zinc-700 mb-2">Descripción</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Specs */}
          <div className="border-t pt-5 grid grid-cols-2 gap-3 text-sm">
            {[
              { label: "Categoría", value: product.categoryLabel },
              product.subcategory && { label: "Subcategoría", value: product.subcategory },
              product.brand && { label: "Marca", value: product.brand },
              product.model && { label: "Modelo", value: product.model },
              { label: "Unidad", value: product.unit },
            ]
              .filter(Boolean)
              .map((spec) => {
                const s = spec as { label: string; value: string };
                return (
                  <div key={s.label}>
                    <p className="text-zinc-400">{s.label}</p>
                    <p className="font-medium text-zinc-800">{s.value}</p>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Related */}
      {relatedFiltered.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-zinc-900 mb-5">
            Más productos de {product.categoryLabel}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {relatedFiltered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
