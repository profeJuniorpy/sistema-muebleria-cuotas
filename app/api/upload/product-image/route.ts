import { NextResponse } from "next/server";
import { supabaseServer, BUCKET } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const MAX_SIZE = 3 * 1024 * 1024; // 3 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const productCode = (form.get("code") as string | null) ?? "unknown";

    if (!file) {
      return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
    }
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: "Formato no permitido. Usá JPG, PNG o WebP." }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "El archivo supera los 3 MB" }, { status: 400 });
    }

    const sb = supabaseServer();

    // Crear bucket si no existe
    const { data: buckets } = await sb.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === BUCKET);
    if (!exists) {
      await sb.storage.createBucket(BUCKET, { public: true, fileSizeLimit: MAX_SIZE });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const slug = productCode.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const path = `${slug}-${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await sb.storage
      .from(BUCKET)
      .upload(path, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrl } = sb.storage.from(BUCKET).getPublicUrl(path);

    return NextResponse.json({ url: publicUrl.publicUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Error interno" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ ok: true });

    // Extraer path del URL público: .../storage/v1/object/public/product-images/PATH
    const match = url.match(/product-images\/(.+)$/);
    if (!match) return NextResponse.json({ ok: true });

    const path = match[1];
    const sb = supabaseServer();
    await sb.storage.from(BUCKET).remove([path]);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
