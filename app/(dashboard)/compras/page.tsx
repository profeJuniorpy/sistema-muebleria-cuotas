import {
  updateOverdueSupplierInstallments,
  getPurchaseStats,
  getPurchases,
} from "@/lib/actions/purchases";
import { ComprasView } from "./compras-view";

export default async function ComprasPage() {
  await updateOverdueSupplierInstallments();

  const [stats, purchases] = await Promise.all([
    getPurchaseStats(),
    getPurchases(),
  ]);

  return <ComprasView stats={stats} purchases={purchases} />;
}
