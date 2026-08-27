"use client";

import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { calculateInstallmentQuote } from "@/lib/calculations";
import type { InterestMode } from "@prisma/client";
import { cn } from "@/lib/utils";

interface Props {
  /** Monto financiado (precio a crédito del producto) */
  amount: number;
  interestRate: number;
  interestMode: InterestMode;
  /** Cantidades de cuotas ofrecidas, ej: [3, 6, 12, 18, 24] */
  installmentOptions: number[];
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(n);

export function InstallmentCalculator({ amount, interestRate, interestMode, installmentOptions }: Props) {
  const options = installmentOptions.filter((n) => n > 0);
  const [selected, setSelected] = useState<number>(options[Math.floor(options.length / 2)] ?? options[0]);

  const quotes = useMemo(() => {
    const map = new Map<number, ReturnType<typeof calculateInstallmentQuote>>();
    for (const periods of options) {
      map.set(periods, calculateInstallmentQuote(amount, interestRate, periods, interestMode));
    }
    return map;
  }, [amount, interestRate, interestMode, options]);

  const activeQuote = quotes.get(selected);

  if (amount <= 0 || options.length === 0) return null;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Calculator className="h-4 w-4 text-zinc-500" />
        <p className="text-sm font-semibold text-zinc-800">Simulá tus cuotas</p>
      </div>

      {/* Installment count selector */}
      <div className="flex flex-wrap gap-2">
        {options.map((periods) => (
          <button
            key={periods}
            type="button"
            onClick={() => setSelected(periods)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              selected === periods
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
            )}
          >
            {periods}x
          </button>
        ))}
      </div>

      {/* Selected quote */}
      {activeQuote && (
        <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium">
            {selected} cuota{selected !== 1 ? "s" : ""} {interestMode === "SALDO_DECRECIENTE" ? "de (1ra, decrece)" : "de"}
          </p>
          <p className="text-2xl font-extrabold text-zinc-900">{fmt(activeQuote.installmentAmount)}</p>
          <p className="text-xs text-zinc-500 mt-1">
            Total financiado: {fmt(activeQuote.totalAmount)}
            {activeQuote.totalInterest > 0 && ` (incluye ${fmt(activeQuote.totalInterest)} de interés)`}
          </p>
        </div>
      )}

      {/* All options table */}
      <div className="border-t pt-3">
        <table className="w-full text-sm">
          <tbody>
            {options.map((periods) => {
              const q = quotes.get(periods);
              if (!q) return null;
              return (
                <tr
                  key={periods}
                  onClick={() => setSelected(periods)}
                  className={cn(
                    "cursor-pointer border-b border-zinc-100 last:border-0",
                    selected === periods && "bg-zinc-50"
                  )}
                >
                  <td className="py-1.5 pr-2 font-medium text-zinc-700">{periods} cuotas</td>
                  <td className="py-1.5 text-right text-zinc-900 font-semibold">
                    {fmt(q.installmentAmount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-zinc-400 leading-relaxed">
        Valores estimados a modo informativo. El plan de crédito final se define al momento de la compra.
      </p>
    </div>
  );
}
