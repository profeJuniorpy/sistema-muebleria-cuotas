import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MAX_SIZE = 3 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const BUCKET = "product-images";

function getStorageBase() {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1`;
}

function authHeader() {
  return { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` };
}

async function ensureBucket() {
  const base = getStorageBase();
  const check = await fetch(`${base}/bucket/${BUCKET}`, { headers: authHeader() });
  if (check.status === 200) return;
  await fetch(`${base}/bucket`, {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true, fileSizeLimit: MAX_SIZE }),
  });
}

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

    await ensureBucket();

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const slug = productCode.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const path = `${slug}-${Date.now()}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();

    const uploadRes = await fetch(
      `${getStorageBase()}/object/${BUCKET}/${path}?`,
      {
        method: "POST",
        headers: {
          ...authHeader(),
          "Content-Type": file.type,
          "x-upsert": "true",
        },
        body: arrayBuffer,
      }
    );

    if (!uploadRes.ok) {
      const err = await uploadRes.json().catch(() => ({}));
      return NextResponse.json({ error: err?.message ?? "Error al subir archivo" }, { status: 500 });
    }

    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
    return NextResponse.json({ url: publicUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Error interno" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ ok: true });

    const match = url.match(/product-images\/(.+)$/);
    if (!match) return NextResponse.json({ ok: true });

    await fetch(`${getStorageBase()}/object/${BUCKET}`, {
      method: "DELETE",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ prefixes: [match[1]] }),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
