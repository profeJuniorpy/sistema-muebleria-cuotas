"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface Props {
  category: string;
  label: string;
  count?: number;
  basePath?: string;
}

export function CategoryBadge({ category, label, count, basePath = "/tienda/catalogo" }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const active = params.get("category") === category;

  function handleClick() {
    const p = new URLSearchParams(params.toString());
    if (active) {
      p.delete("category");
    } else {
      p.set("category", category);
      p.delete("page");
    }
    router.push(`${basePath}?${p.toString()}`);
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors border",
        active
          ? "bg-zinc-900 text-white border-zinc-900"
          : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50"
      )}
    >
      {label}
      {count !== undefined && (
        <span className={cn("text-xs", active ? "text-zinc-300" : "text-zinc-400")}>
          ({count})
        </span>
      )}
    </button>
  );
}
