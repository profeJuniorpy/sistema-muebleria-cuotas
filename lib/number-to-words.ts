// Conversión de números enteros a letras en español (sin acentos, mayúsculas),
// pensado para montos en Guaraníes (sin decimales). Soporta hasta 999.999.999.

const UNIDADES: Record<number, string> = {
  0: "", 1: "UN", 2: "DOS", 3: "TRES", 4: "CUATRO", 5: "CINCO",
  6: "SEIS", 7: "SIETE", 8: "OCHO", 9: "NUEVE", 10: "DIEZ",
  11: "ONCE", 12: "DOCE", 13: "TRECE", 14: "CATORCE", 15: "QUINCE",
  16: "DIECISEIS", 17: "DIECISIETE", 18: "DIECIOCHO", 19: "DIECINUEVE", 20: "VEINTE",
};

const DECENAS: Record<number, string> = {
  3: "TREINTA", 4: "CUARENTA", 5: "CINCUENTA", 6: "SESENTA",
  7: "SETENTA", 8: "OCHENTA", 9: "NOVENTA",
};

const CENTENAS: Record<number, string> = {
  1: "CIENTO", 2: "DOSCIENTOS", 3: "TRESCIENTOS", 4: "CUATROCIENTOS", 5: "QUINIENTOS",
  6: "SEISCIENTOS", 7: "SETECIENTOS", 8: "OCHOCIENTOS", 9: "NOVECIENTOS",
};

function convertUpTo99(n: number): string {
  if (n <= 20) return UNIDADES[n];
  if (n < 30) {
    const u = n - 20;
    return u === 0 ? "VEINTE" : `VEINTI${UNIDADES[u]}`;
  }
  const tens = Math.floor(n / 10);
  const rest = n % 10;
  return rest > 0 ? `${DECENAS[tens]} Y ${UNIDADES[rest]}` : DECENAS[tens];
}

function convertUpTo999(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "CIEN";
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  if (hundreds === 0) return convertUpTo99(rest);
  const centWord = CENTENAS[hundreds];
  return rest > 0 ? `${centWord} ${convertUpTo99(rest)}` : centWord;
}

/** Convierte un entero (0 a 999.999.999) a letras en español, en mayúsculas. */
export function numberToWordsEs(amount: number): string {
  const n = Math.floor(Math.abs(amount));
  if (n === 0) return "CERO";

  const millones = Math.floor(n / 1_000_000);
  const restoMillones = n % 1_000_000;
  const miles = Math.floor(restoMillones / 1000);
  const unidades = restoMillones % 1000;

  const parts: string[] = [];
  if (millones > 0) {
    parts.push(millones === 1 ? "UN MILLON" : `${convertUpTo999(millones)} MILLONES`);
  }
  if (miles > 0) {
    parts.push(miles === 1 ? "MIL" : `${convertUpTo999(miles)} MIL`);
  }
  if (unidades > 0) {
    parts.push(convertUpTo999(unidades));
  }
  return parts.join(" ").trim();
}

/** Monto en letras seguido de "GUARANIES", listo para documentos legales. */
export function amountToWordsPYG(amount: number): string {
  return `${numberToWordsEs(amount)} GUARANIES`;
}
