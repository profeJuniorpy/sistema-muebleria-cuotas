"use client";

import { ShoppingCart, Check } from "lucide-react";
import { useCart } from "@/components/storefront/cart-context";
import { cn } from "@/lib/utils";

interface Props {
  product: {
    id: string;
    name: string;
    cashPrice: number;
    imageUrl: string | null;
  };
  inStock: boolean;
}

export function AddToCartButton({ product, inStock }: Props) {
  const { addItem, isInCart } = useCart();
  const inCart = isInCart(product.id);

  return (
    <button
      onClick={() => addItem(product)}
      disabled={!inStock}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition-colors",
        inCart
          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
          : "bg-zinc-900 text-white hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
      )}
    >
      {inCart ? (
        <><Check className="h-5 w-5" /> Agregado al carrito</>
      ) : (
        <><ShoppingCart className="h-5 w-5" /> Agregar al carrito</>
      )}
    </button>
  );
}
