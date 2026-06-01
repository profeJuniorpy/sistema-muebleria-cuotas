"use client";

import { MessageCircle } from "lucide-react";
import { useCart } from "./cart-context";

interface Props {
  phone: string | null;
  onSent?: () => void;
  className?: string;
}

const fmt = (n: number) => new Intl.NumberFormat("es-PY").format(n);

export function WhatsAppButton({ phone, onSent, className }: Props) {
  const { items, totalAmount, clearCart } = useCart();

  function handleClick() {
    if (!phone || items.length === 0) return;

    const lines = items
      .map((i) => `• ${i.quantity}x ${i.name} — Gs. ${fmt(i.cashPrice * i.quantity)}`)
      .join("\n");

    const message =
      `¡Hola! Me interesa consultar sobre los siguientes productos:\n\n` +
      `${lines}\n\n` +
      `*Total estimado: Gs. ${fmt(totalAmount)}*`;

    const clean = phone.replace(/\D/g, "");
    window.open(
      `https://wa.me/${clean}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
    onSent?.();
  }

  const disabled = !phone || items.length === 0;

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={
        `flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-colors
        bg-[#25D366] text-white hover:bg-[#20bb5a] disabled:opacity-40 disabled:cursor-not-allowed
        ${className ?? ""}`
      }
    >
      <MessageCircle className="h-5 w-5" />
      Consultar por WhatsApp
    </button>
  );
}
