import prisma from "@/lib/prisma";
import Sidebar from "./sidebar";

interface Props {
  role: string;
}

export default async function SidebarServer({ role }: Props) {
  let logoUrl: string | null = null;
  let companyName: string | null = null;

  try {
    const c = await prisma.companyConfig.findFirst({ orderBy: { updatedAt: "desc" } }) as any;
    logoUrl = c?.logoUrl ?? null;
    companyName = c?.name ?? null;
  } catch (err) {
    console.error("[SidebarServer] company fetch failed:", err);
  }

  return <Sidebar role={role} logoUrl={logoUrl} companyName={companyName} />;
}
