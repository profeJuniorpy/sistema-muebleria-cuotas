"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Check } from "lucide-react";
import { useCart } from "./cart-context";
import { cn } from "@/lib/utils";
import { calculateInstallmentQuote } from "@/lib/calculations";
import type { InterestMode } from "@prisma/client";

interface Props {
  product: {
    id: string;
    name: string;
    category: string;
    categoryLabel: string;
    brand: string | null;
    cashPrice: number;
    creditPrice: number;
    stock: number;
    imageUrl: string | null;
    description: string | null;
  };
  /** Config del simulador de cuotas — si se pasa, muestra "Desde Gs. X en N cuotas" */
  creditConfig?: {
    interestRate: number;
    interestMode: InterestMode;
    installmentOptions: string;
  };
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(n);

export function ProductCard({ product, creditConfig }: Props) {
  const { addItem, isInCart } = useCart();
  const inCart = isInCart(product.id);

  const bestInstallmentQuote = (() => {
    if (!creditConfig || product.creditPrice <= 0) return null;
    const periodsList = creditConfig.installmentOptions
      .split(",")
      .map((v) => parseInt(v.trim(), 10))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (periodsList.length === 0) return null;
    const maxPeriods = Math.max(...periodsList);
    return calculateInstallmentQuote(
      product.creditPrice,
      creditConfig.interestRate,
      maxPeriods,
      creditConfig.interestMode
    );
  })();

  return (
    <div className="group flex flex-col rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Image */}
      <Link href={`/tienda/producto/${product.id}`} className="relative block aspect-square bg-zinc-50 overflow-hidden">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-300">
            <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {/* Stock badge */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-semibold text-white">
              Sin stock
            </span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <div>
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">
            {product.categoryLabel}{product.brand ? ` · ${product.brand}` : ""}
          </p>
          <Link href={`/tienda/producto/${product.id}`}>
            <h3 className="font-semibold text-zinc-900 leading-snug mt-0.5 line-clamp-2 hover:underline">
              {product.name}
            </h3>
          </Link>
        </div>

        <div className="mt-auto space-y-1">
          <p className="text-lg font-bold text-zinc-900">{fmt(product.cashPrice)}</p>
          {product.creditPrice > 0 && product.creditPrice !== product.cashPrice && (
            <p className="text-xs text-zinc-500">
              Crédito: {fmt(product.creditPrice)}
            </p>
          )}
          {bestInstallmentQuote && (
            <p className="text-xs font-semibold text-emerald-700">
              {bestInstallmentQuote.installments}x de {fmt(bestInstallmentQuote.installmentAmount)}
            </p>
          )}
        </div>

        <button
          onClick={() =>
            addItem({
              id: product.id,
              name: product.name,
              cashPrice: product.cashPrice,
              imageUrl: product.imageUrl,
            })
          }
          disabled={product.stock === 0}
          className={cn(
            "mt-2 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors",
            inCart
              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              : "bg-zinc-900 text-white hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
          )}
        >
          {inCart ? (
            <><Check className="h-4 w-4" /> En el carrito</>
          ) : (
            <><ShoppingCart className="h-4 w-4" /> Agregar</>
          )}
        </button>
      </div>
    </div>
  );
}
