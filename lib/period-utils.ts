import { startOfMonth, endOfMonth, subMonths, startOfYear, format } from "date-fns";
import { es } from "date-fns/locale";

export function getPeriodDates(period: string): {
  from: Date;
  to: Date;
  label: string;
} {
  const now = new Date();

  switch (period) {
    case "lastMonth": {
      const prev = subMonths(now, 1);
      return {
        from: startOfMonth(prev),
        to: endOfMonth(prev),
        label: format(prev, "MMMM yyyy", { locale: es }),
      };
    }
    case "3months":
      return {
        from: subMonths(now, 3),
        to: now,
        label: "Últimos 3 meses",
      };
    case "6months":
      return {
        from: subMonths(now, 6),
        to: now,
        label: "Últimos 6 meses",
      };
    case "thisYear":
      return {
        from: startOfYear(now),
        to: now,
        label: `Año ${now.getFullYear()}`,
      };
    default: // thisMonth
      return {
        from: startOfMonth(now),
        to: now,
        label: format(now, "MMMM yyyy", { locale: es }),
      };
  }
}
