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
  // Marcar cuotas vencidas antes de cualquier consulta
  await updateOverdueInstallments();

  const session = await auth();
  const userId = (session?.user as any)?.id ?? "";

  const [stats, pendingInstallments, paymentHistory, customers] = await Promise.all([
    getCobranzasStats(),
    getPendingInstallments(),
    getPaymentHistory(),
    getCustomersWithPendingInstallments(),
  ]);

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
