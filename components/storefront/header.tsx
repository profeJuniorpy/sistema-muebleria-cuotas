"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Search, Store } from "lucide-react";
import { CartSheet } from "./cart-sheet";

interface Props {
  companyName: string;
  phone: string | null;
  logoUrl?: string | null;
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
        className="w-full rounded-xl border border-blue-200 bg-blue-50/50 pl-9 pr-4 py-2 text-sm placeholder:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-800/20 focus:border-blue-400"
      />
    </form>
  );
}

export function StorefrontHeader({ companyName, phone, logoUrl }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-blue-100 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/tienda"
          className="flex items-center gap-2.5 shrink-0"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full overflow-hidden border-2 border-blue-800 bg-white shadow-sm shrink-0">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={companyName} className="h-full w-full object-contain" />
            ) : (
              <span className="text-[#1a3a8c] font-bold text-lg">
                {companyName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <span className="hidden sm:block text-sm font-bold text-[#1a3a8c]">{companyName}</span>
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
            className="rounded-lg px-3 py-2 text-[#1a3a8c] hover:text-white hover:bg-[#1a3a8c] transition-colors"
          >
            Inicio
          </Link>
          <Link
            href="/tienda/catalogo"
            className="rounded-lg px-3 py-2 text-[#1a3a8c] hover:text-white hover:bg-[#1a3a8c] transition-colors"
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
