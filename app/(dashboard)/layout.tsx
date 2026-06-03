import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Sidebar from "@/components/sidebar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;
  try {
    session = await auth();
  } catch (e: any) {
    const msg = e?.message ?? String(e);
    return (
      <div style={{padding:24,fontFamily:"monospace",background:"#fee2e2",color:"#991b1b",borderRadius:8,margin:16}}>
        <b>Error en auth():</b><br/>{msg}
      </div>
    );
  }

  if (!session) {
    redirect("/login");
  }

  const role = (session.user as any)?.role || "VENDEDOR";

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <Sidebar role={role} />
      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0 lg:pl-64">
        <div className="container mx-auto p-4 md:p-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
