import type { ReactNode } from "react";
import { CartProvider } from "@/components/storefront/cart-context";
import { StorefrontHeader } from "@/components/storefront/header";
import { getCompanyContact } from "@/lib/actions/storefront";
import Link from "next/link";

export default async function StorefrontLayout({ children }: { children: ReactNode }) {
  const company = await getCompanyContact();

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-zinc-50">
        <StorefrontHeader companyName={company.name} phone={company.phone} />

        <main className="flex-1">
          {children}
        </main>

        <footer className="border-t border-zinc-200 bg-white mt-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div>
                <p className="font-bold text-zinc-900 text-lg">{company.name}</p>
                {company.address && (
                  <p className="text-sm text-zinc-500 mt-1">{company.address}</p>
                )}
                {company.city && (
                  <p className="text-sm text-zinc-500">{company.city}</p>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-700 mb-2">Contacto</p>
                {company.phone && (
                  <a
                    href={`https://wa.me/${company.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-zinc-500 hover:text-[#25D366] transition-colors"
                  >
                    WhatsApp: {company.phone}
                  </a>
                )}
                {company.email && (
                  <p className="text-sm text-zinc-500 mt-1">{company.email}</p>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-700 mb-2">Tienda</p>
                <nav className="flex flex-col gap-1 text-sm text-zinc-500">
                  <Link href="/tienda" className="hover:text-zinc-900 transition-colors">Inicio</Link>
                  <Link href="/tienda/catalogo" className="hover:text-zinc-900 transition-colors">Catálogo</Link>
                  <Link href="/tienda/catalogo?category=MUEBLES" className="hover:text-zinc-900 transition-colors">Muebles</Link>
                  <Link href="/tienda/catalogo?category=ELECTRODOMESTICOS" className="hover:text-zinc-900 transition-colors">Electrodomésticos</Link>
                </nav>
              </div>
            </div>
            <div className="mt-8 border-t pt-6 text-xs text-zinc-400 text-center">
              © {new Date().getFullYear()} {company.name}. Todos los derechos reservados.
            </div>
          </div>
        </footer>
      </div>
    </CartProvider>
  );
}
