import { auth } from "@/lib/auth";
import {
  updateOverdueInstallments,
  getCobranzasStats,
  getPendingInstallments,
  getPaymentHistory,
  getCustomersWithPendingInstallments,
} from "@/lib/actions/payments";
import { CobranzasView } from "./cobranzas-view";

export const dynamic = "force-dynamic";


export default async function CobranzasPage() {
  try {
    await updateOverdueInstallments();
  } catch (e) {
    console.error("[cobranzas] updateOverdueInstallments:", e);
  }

  const session = await auth();
  const userId = (session?.user as any)?.id ?? "";

  let stats, pendingInstallments, paymentHistory, customers;
  try {
    [stats, pendingInstallments, paymentHistory, customers] = await Promise.all([
      getCobranzasStats(),
      getPendingInstallments(),
      getPaymentHistory(),
      getCustomersWithPendingInstallments(),
    ]);
  } catch (e: any) {
    console.error("[cobranzas] DB error:", e?.message, e?.code);
    throw e;
  }

  return (
    <CobranzasView
      stats={stats}
      pendingInstallments={pendingInstallments}
      paymentHistory={paymentHistory}
      customers={customers}
      userId={userId}
    />
  );
}
