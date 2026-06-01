import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { runNotifications } = await import("@/lib/actions/notificaciones");
    const stats = await runNotifications();
    return NextResponse.json({ ok: true, stats });
  } catch (err: any) {
    console.error("[cron/notificaciones] Error:", err);
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}
