import { updateOverdueInstallments } from "@/lib/actions/payments";
import { syncCreditStatuses, getCreditStats, getCreditsPortfolio } from "@/lib/actions/credits";
import { CreditsView } from "./credits-view";

export default async function CreditosPage() {
  await updateOverdueInstallments();
  await syncCreditStatuses();

  const [stats, credits] = await Promise.all([
    getCreditStats(),
    getCreditsPortfolio(),
  ]);

  return <CreditsView stats={stats} credits={credits} />;
}
