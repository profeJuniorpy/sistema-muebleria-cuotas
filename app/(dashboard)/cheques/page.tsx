import { getChequeStats, getCheques } from "@/lib/actions/cheques";
import { ChequesView } from "./cheques-view";

export const dynamic = "force-dynamic";

export default async function ChequesPage() {
  const [stats, cheques] = await Promise.all([getChequeStats(), getCheques()]);

  return <ChequesView stats={stats} cheques={cheques} />;
}
