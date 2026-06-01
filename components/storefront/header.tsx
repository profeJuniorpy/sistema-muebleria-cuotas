"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Search, Store } from "lucide-react";
import { CartSheet } from "./cart-sheet";

interface Props {
  companyName: string;
  phone: string | null;
}

function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("search") ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (value.trim()) p.set("search", value.trim());
    router.push(`/tienda/catalogo?${p.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex-1 max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar productos..."
        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-4 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-400"
      />
    </form>
  );
}

export function StorefrontHeader({ companyName, phone }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/tienda"
          className="flex items-center gap-2 font-bold text-zinc-900 shrink-0"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
            <Store className="h-4 w-4" />
          </div>
          <span className="hidden sm:block text-sm">{companyName}</span>
        </Link>

        {/* Search */}
        <div className="flex-1">
          <Suspense>
            <SearchBar />
          </Suspense>
        </div>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          <Link
            href="/tienda"
            className="rounded-lg px-3 py-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
          >
            Inicio
          </Link>
          <Link
            href="/tienda/catalogo"
            className="rounded-lg px-3 py-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
          >
            Catálogo
          </Link>
        </nav>

        {/* Cart */}
        <CartSheet phone={phone} />
      </div>
    </header>
  );
}
