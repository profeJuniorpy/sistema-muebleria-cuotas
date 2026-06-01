import { NextResponse } from "next/server";
import { runNotifications } from "@/lib/actions/notificaciones";

// Llamado por Vercel Cron a las 08:00 ART (12:00 UTC) todos los días.
// Requiere header: Authorization: Bearer <CRON_SECRET>
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const stats = await runNotifications();
    return NextResponse.json({ ok: true, stats });
  } catch (err: any) {
    console.error("[cron/notificaciones] Error:", err);
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}
