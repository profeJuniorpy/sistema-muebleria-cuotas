import {
  getSalesReport,
  getCollectionsReport,
  getDelinquencyReport,
  getInventoryReport,
  getProfitReport,
} from "@/lib/actions/reports";
import { getPeriodDates } from "@/lib/period-utils";
import { ReportesView } from "./reportes-view";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: { period?: string };
}) {
  const period = searchParams.period ?? "thisMonth";
  const { from, to, label } = getPeriodDates(period);

  const [salesReport, collectionsReport, delinquencyReport, inventoryReport, profitReport] =
    await Promise.all([
      getSalesReport(from, to),
      getCollectionsReport(from, to),
      getDelinquencyReport(),
      getInventoryReport(from, to),
      getProfitReport(from, to),
    ]);

  return (
    <ReportesView
      period={period}
      periodLabel={label}
      salesReport={salesReport}
      collectionsReport={collectionsReport}
      delinquencyReport={delinquencyReport}
      inventoryReport={inventoryReport}
      profitReport={profitReport}
    />
  );
}
