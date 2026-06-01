"use client";

import { useState } from "react";
import Image from "next/image";
import { ShoppingCart, Trash2, Plus, Minus, X } from "lucide-react";
import { useCart } from "./cart-context";
import { WhatsAppButton } from "./whatsapp-button";
import { cn } from "@/lib/utils";

interface Props {
  phone: string | null;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(n);

export function CartSheet({ phone }: Props) {
  const [open, setOpen] = useState(false);
  const { items, totalItems, totalAmount, removeItem, updateQty, clearCart } = useCart();

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="relative flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
        aria-label="Abrir carrito"
      >
        <ShoppingCart className="h-5 w-5" />
        <span className="hidden sm:inline">Carrito</span>
        {totalItems > 0 && (
          <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white leading-none">
            {totalItems > 99 ? "99+" : totalItems}
          </span>
        )}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer — flex column con header fijo + scroll en items + footer fijo */}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 flex h-dvh w-[min(100vw,24rem)] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header — fijo, no se encoge */}
        <div className="shrink-0 flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-bold text-base flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Mi carrito
            {totalItems > 0 && (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600">
                {totalItems} {totalItems === 1 ? "producto" : "productos"}
              </span>
            )}
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-1.5 hover:bg-zinc-100 transition-colors"
            aria-label="Cerrar carrito"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items — ocupa todo el espacio disponible y hace scroll */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
              <div className="rounded-full bg-zinc-100 p-5">
                <ShoppingCart className="h-8 w-8 text-zinc-400" />
              </div>
              <div>
                <p className="font-semibold text-zinc-700">Tu carrito está vacío</p>
                <p className="text-sm text-zinc-400 mt-1">
                  Explorá el catálogo y agregá productos.
                </p>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 px-4 py-3">
                  {/* Imagen */}
                  <div className="relative h-18 w-18 shrink-0 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200"
                       style={{ width: 72, height: 72 }}>
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="72px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ShoppingCart className="h-6 w-6 text-zinc-300" />
                      </div>
                    )}
                  </div>

                  {/* Nombre + precio + controles */}
                  <div className="flex flex-1 min-w-0 flex-col justify-between py-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-zinc-900 leading-snug line-clamp-2 flex-1">
                        {item.name}
                      </p>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="shrink-0 rounded-lg p-1 text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Controles de cantidad */}
                      <div className="flex items-center rounded-lg border border-zinc-200 overflow-hidden">
                        <button
                          onClick={() => updateQty(item.id, item.quantity - 1)}
                          className="flex h-7 w-7 items-center justify-center hover:bg-zinc-100 transition-colors text-zinc-600"
                          aria-label="Reducir cantidad"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold text-zinc-900 border-x border-zinc-200 h-7 flex items-center justify-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, item.quantity + 1)}
                          className="flex h-7 w-7 items-center justify-center hover:bg-zinc-100 transition-colors text-zinc-600"
                          aria-label="Aumentar cantidad"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Subtotal del ítem */}
                      <div className="text-right">
                        {item.quantity > 1 && (
                          <p className="text-[11px] text-zinc-400 leading-none mb-0.5">
                            {fmt(item.cashPrice)} c/u
                          </p>
                        )}
                        <p className="text-sm font-bold text-zinc-900">
                          {fmt(item.cashPrice * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer — fijo en el fondo, no se encoge */}
        {items.length > 0 && (
          <div className="shrink-0 border-t bg-zinc-50 px-5 py-4 space-y-3">
            {/* Resumen */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm text-zinc-500">
                <span>{totalItems} {totalItems === 1 ? "artículo" : "artículos"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-700">Total estimado</span>
                <span className="text-xl font-extrabold text-zinc-900">{fmt(totalAmount)}</span>
              </div>
            </div>

            {/* WhatsApp */}
            <WhatsAppButton
              phone={phone}
              onSent={() => { clearCart(); setOpen(false); }}
              className="w-full"
            />

            {/* Vaciar */}
            <button
              onClick={clearCart}
              className="w-full text-xs text-zinc-400 hover:text-zinc-600 transition-colors py-1"
            >
              Vaciar carrito
            </button>
          </div>
        )}
      </div>
    </>
  );
}
