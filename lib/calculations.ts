import { addDays, addMonths, addWeeks } from "date-fns";
import { InterestMode, Frequency } from "@prisma/client";
import { Decimal } from "decimal.js";

export interface AmortizationRow {
  installmentNumber: number;
  dueDate: Date;
  principal: number;
  interest: number;
  total: number;
  balance: number;
}

export function calculateAmortization(
  amount: number,
  annualRate: number,
  periods: number,
  frequency: Frequency,
  mode: InterestMode,
  startDate: Date
): AmortizationRow[] {
  const schedule: AmortizationRow[] = [];
  let balance = new Decimal(amount);
  const rate = new Decimal(annualRate).dividedBy(100);

  // Ajustar tasa según frecuencia (Asumiendo que la tasa ingresada es mensual para simplicidad del ERP, o anual si se requiere)
  // Requerimiento dice "tasa mensual / 100" para Francés. Usaremos tasa mensual.
  const r = rate; 

  const getNextDate = (date: Date, index: number) => {
    switch (frequency) {
      case "SEMANAL":
        return addWeeks(date, index);
      case "QUINCENAL":
        return addDays(date, index * 15);
      case "MENSUAL":
      default:
        return addMonths(date, index);
    }
  };

  if (mode === "FRANCES") {
    // M = capital * (r * (1+r)^n) / ((1+r)^n - 1)
    const power = new Decimal(1).plus(r).pow(periods);
    const denominator = power.minus(1);
    const numerator = r.times(power);
    const installmentAmount = balance.times(numerator.dividedBy(denominator));

    for (let i = 1; i <= periods; i++) {
      const interestInst = balance.times(r);
      const principalInst = installmentAmount.minus(interestInst);
      balance = balance.minus(principalInst);

      schedule.push({
        installmentNumber: i,
        dueDate: getNextDate(startDate, i - 1),
        principal: principalInst.toDecimalPlaces(0).toNumber(), // 0 decimales para Guaraníes
        interest: interestInst.toDecimalPlaces(0).toNumber(),
        total: installmentAmount.toDecimalPlaces(0).toNumber(),
        balance: Decimal.max(0, balance).toDecimalPlaces(0).toNumber(),
      });
    }
  } else if (mode === "SIMPLE") {
    // Cuota = (capital + capital * tasa/100 * plazo) / plazo
    const totalInterest = balance.times(r).times(periods);
    const totalAmount = balance.plus(totalInterest);
    const installmentAmount = totalAmount.dividedBy(periods);
    const principalPerInst = balance.dividedBy(periods);
    const interestPerInst = totalInterest.dividedBy(periods);

    for (let i = 1; i <= periods; i++) {
      balance = balance.minus(principalPerInst);
      schedule.push({
        installmentNumber: i,
        dueDate: getNextDate(startDate, i - 1),
        principal: principalPerInst.toDecimalPlaces(0).toNumber(),
        interest: interestPerInst.toDecimalPlaces(0).toNumber(),
        total: installmentAmount.toDecimalPlaces(0).toNumber(),
        balance: Decimal.max(0, balance).toDecimalPlaces(0).toNumber(),
      });
    }
  } else if (mode === "SALDO_DECRECIENTE") {
    // interés = saldo_anterior * tasa/100
    // Capital por cuota = monto_financiado / plazo
    const principalPerInst = balance.dividedBy(periods);

    for (let i = 1; i <= periods; i++) {
      const interestInst = balance.times(r);
      const installmentAmount = principalPerInst.plus(interestInst);
      balance = balance.minus(principalPerInst);

      schedule.push({
        installmentNumber: i,
        dueDate: getNextDate(startDate, i - 1),
        principal: principalPerInst.toDecimalPlaces(0).toNumber(),
        interest: interestInst.toDecimalPlaces(0).toNumber(),
        total: installmentAmount.toDecimalPlaces(0).toNumber(),
        balance: Decimal.max(0, balance).toDecimalPlaces(0).toNumber(),
      });
    }
  }

  return schedule;
}

export interface InstallmentQuote {
  installments: number;
  installmentAmount: number;
  totalAmount: number;
  totalInterest: number;
}

/**
 * Cotización rápida de cuotas (sin fechas), para simuladores de vitrina
 * (ej. tienda online). Para FRANCES/SIMPLE la cuota es fija; para
 * SALDO_DECRECIENTE se informa la primera cuota (la más alta).
 */
export function calculateInstallmentQuote(
  amount: number,
  annualRate: number,
  periods: number,
  mode: InterestMode
): InstallmentQuote {
  const balance = new Decimal(amount);
  const r = new Decimal(annualRate).dividedBy(100);

  let installmentAmount: Decimal;
  let totalAmount: Decimal;

  if (mode === "FRANCES") {
    const power = new Decimal(1).plus(r).pow(periods);
    const denominator = power.minus(1);
    const numerator = r.times(power);
    installmentAmount = denominator.isZero()
      ? balance.dividedBy(periods)
      : balance.times(numerator.dividedBy(denominator));
    totalAmount = installmentAmount.times(periods);
  } else if (mode === "SIMPLE") {
    const totalInterest = balance.times(r).times(periods);
    totalAmount = balance.plus(totalInterest);
    installmentAmount = totalAmount.dividedBy(periods);
  } else {
    // SALDO_DECRECIENTE: la primera cuota es la más alta (capital fijo + interés sobre saldo total)
    const principalPerInst = balance.dividedBy(periods);
    installmentAmount = principalPerInst.plus(balance.times(r));
    let runningBalance = balance;
    let totalInterest = new Decimal(0);
    for (let i = 0; i < periods; i++) {
      totalInterest = totalInterest.plus(runningBalance.times(r));
      runningBalance = runningBalance.minus(principalPerInst);
    }
    totalAmount = balance.plus(totalInterest);
  }

  return {
    installments: periods,
    installmentAmount: installmentAmount.toDecimalPlaces(0).toNumber(),
    totalAmount: totalAmount.toDecimalPlaces(0).toNumber(),
    totalInterest: totalAmount.minus(balance).toDecimalPlaces(0).toNumber(),
  };
}
