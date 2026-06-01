/**
 * Abstracción del proveedor WhatsApp.
 * Implementación actual: CallMeBot (pruebas).
 * Para migrar a Twilio/Meta: reemplazar el cuerpo de sendWhatsAppMessage().
 *
 * Requisito CallMeBot: el destinatario debe haber enviado previamente
 * "I allow callmebot to send me messages" al +34 644 59 73 07 para obtener su apiKey.
 */
export async function sendWhatsAppMessage(
  phone: string,
  apiKey: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  const enabled = process.env.CALLMEBOT_ENABLED !== "false";

  if (!enabled) {
    console.log(`[WhatsApp DRY-RUN] → ${phone}: ${message.slice(0, 80)}...`);
    return { success: true };
  }

  try {
    const clean = phone.replace(/\D/g, "");
    const url =
      `https://api.callmebot.com/whatsapp.php` +
      `?phone=${encodeURIComponent(clean)}` +
      `&text=${encodeURIComponent(message)}` +
      `&apikey=${encodeURIComponent(apiKey)}`;

    const res = await fetch(url, { method: "GET" });
    const body = await res.text();

    if (!res.ok || body.toLowerCase().includes("error")) {
      return { success: false, error: body.slice(0, 200) };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message ?? "Error desconocido" };
  }
}
