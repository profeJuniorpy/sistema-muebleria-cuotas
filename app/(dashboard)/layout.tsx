import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Sidebar from "@/components/sidebar";
import SidebarServer from "@/components/sidebar-server";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const role = (session.user as any)?.role || "VENDEDOR";

  return (
    <div className="flex h-screen overflow-hidden bg-secondary/30">
      {/* SidebarServer fetches logo asynchronously — fallback renders immediately */}
      <Suspense fallback={<Sidebar role={role} />}>
        <SidebarServer role={role} />
      </Suspense>
      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0 lg:pl-64">
        <div className="container mx-auto p-4 md:p-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
