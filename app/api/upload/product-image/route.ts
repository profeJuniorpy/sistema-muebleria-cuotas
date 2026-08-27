import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp", "gif"];
const HEIC_EXT = ["heic", "heif"];
const BUCKET = "product-images";

function fileExt(file: File) {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}

// Algunos navegadores (Safari/iOS) reportan file.type vacío para formatos no
// estándar, así que validamos también por extensión como respaldo.
function isAllowedFile(file: File) {
  if (ALLOWED.includes(file.type)) return true;
  return ALLOWED_EXT.includes(fileExt(file));
}

function isHeic(file: File) {
  return file.type === "image/heic" || file.type === "image/heif" || HEIC_EXT.includes(fileExt(file));
}

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

function resolveContentType(file: File) {
  if (file.type) return file.type;
  return EXT_TO_MIME[fileExt(file)] ?? "application/octet-stream";
}

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
    if (!isAllowedFile(file)) {
      if (isHeic(file)) {
        return NextResponse.json(
          {
            error:
              "Las fotos en formato HEIC (típico de iPhone) no se pueden mostrar. En el iPhone, andá a Ajustes > Cámara > Formatos y elegí \"Más compatible\", o compartí la foto por WhatsApp antes de subirla (la convierte a JPG automáticamente).",
          },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: "Formato no permitido. Usá JPG, PNG o WebP." }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "El archivo supera los 5 MB" }, { status: 400 });
    }

    await ensureBucket();

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const slug = productCode.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const path = `${slug}-${Date.now()}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const contentType = resolveContentType(file);

    const uploadRes = await fetch(
      `${getStorageBase()}/object/${BUCKET}/${path}?`,
      {
        method: "POST",
        headers: {
          ...authHeader(),
          "Content-Type": contentType,
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
