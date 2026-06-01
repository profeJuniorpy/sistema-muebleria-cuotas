import { auth } from "@/lib/auth";
import {
  getCommissionsStats,
  getSellerSummaries,
  getAllCommissions,
  getCommissionSettings,
  getSellersWithRates,
} from "@/lib/actions/commissions";
import { ComisionesView } from "./comisiones-view";

export default async function ComisionesPage() {
  const session = await auth();
  const userId = (session?.user as any)?.id ?? "";

  const [stats, sellerSummaries, commissions, settings, sellers] = await Promise.all([
    getCommissionsStats(),
    getSellerSummaries(),
    getAllCommissions(),
    getCommissionSettings(),
    getSellersWithRates(),
  ]);

  return (
    <ComisionesView
      stats={stats}
      sellerSummaries={sellerSummaries}
      commissions={commissions}
      settings={settings}
      sellers={sellers}
      userId={userId}
    />
  );
}
