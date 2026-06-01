/**
 * Script para asignar imágenes reales a los productos ya cargados.
 * Descarga fotos de Unsplash (licencia libre) y las sube a Supabase Storage.
 * Ejecutar: npx ts-node prisma/seed_images.ts
 */

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();
const BUCKET = "product-images";

// ─── Supabase con service role ────────────────────────────────────────────────

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Faltan variables NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

// ─── Mapa producto → foto Unsplash ────────────────────────────────────────────
// IDs obtenidos directamente de unsplash.com — licencia Unsplash (uso libre)

const IMAGES: Record<string, string> = {
  // ── Muebles ──────────────────────────────────────────────────────
  "MUE-001": "photo-1550581190-9c1c48d21d6c", // juego de sala 3 cuerpos
  "MUE-002": "photo-1590251024078-8a6d9f90b02d", // sofá 2 cuerpos
  "MUE-003": "photo-1505693416388-ac5ce068fe85", // dormitorio completo
  "MUE-004": "photo-1556020685-ae41abfc9365",    // ropero / dormitorio
  "MUE-005": "photo-1604578762246-41134e37f9cc", // comedor mesa + sillas
  "MUE-006": "photo-1600623050499-84929aad17c9", // rack / mueble TV
  "MUE-007": "photo-1522771739844-6a9f6d5f14af", // cama matrimonial
  "MUE-008": "photo-1616486029423-aaa4789e8c9a", // camarote / cama
  "MUE-009": "photo-1623353283172-2518d7e6f5ab", // sillón individual
  "MUE-010": "photo-1507089947368-19c1da9775ae", // cocina integral blanca

  // ── Electrodomésticos ─────────────────────────────────────────────
  "ELE-001": "photo-1610733374054-59454fe657cd", // heladera
  "ELE-002": "photo-1668910231038-e342ad670789", // heladera french door
  "ELE-003": "photo-1626806819282-2c1dc01a5e0c", // lavarropas carga frontal
  "ELE-004": "photo-1626806787461-102c1bfaaea1", // lavarropas carga superior
  "ELE-005": "photo-1599083549933-838ea352c1cc", // microondas
  "ELE-006": "photo-1623114112815-74a4b9fe505d", // cocina a gas / hornallas
  "ELE-007": "photo-1718203862467-c33159fdc504", // aire acondicionado
  "ELE-008": "photo-1643356472833-5b1f2cd4ca3c", // heladera bajo mesada

  // ── Electrónicos ──────────────────────────────────────────────────
  "ELC-001": "photo-1593359677879-a4bb92f829d1", // smart TV 55"
  "ELC-002": "photo-1593784991095-a205069470b6", // smart TV grande
  "ELC-003": "photo-1615986200762-a1ed9610d3b1", // smart TV 43"
  "ELC-004": "photo-1496181133206-80ce9b88a853", // notebook / laptop
  "ELC-005": "photo-1589256469067-ea99122bbdc4",  // parlante bluetooth

  // ── Colchones ─────────────────────────────────────────────────────
  "COL-001": "photo-1560185893-a55cbc8c57e8",   // colchón matrimonial
  "COL-002": "photo-1583535045024-e2479a694777", // colchón memory foam
  "COL-003": "photo-1640003145169-d10a2e85a64d", // colchón 1 plaza
  "COL-004": "photo-1640003145136-f998284e11de", // colchón + almohadas

  // ── Otros ─────────────────────────────────────────────────────────
  "OTR-001": "photo-1609519479841-5fd3b2884e17", // ventilador de techo
  "OTR-002": "photo-1591632288574-a387f820a1ca", // vajilla porcelana blanca
  "OTR-003": "photo-1509644851169-2acc08aa25b5", // cortinas ventana
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function unsplashUrl(photoId: string): string {
  return `https://images.unsplash.com/${photoId}?w=800&h=800&fit=crop&auto=format&q=80`;
}

async function downloadImage(url: string): Promise<{ buffer: ArrayBuffer; contentType: string } | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ERP-Seeder/1.0)",
      },
    });
    if (!res.ok) {
      console.warn(`  ✗ HTTP ${res.status} al descargar ${url}`);
      return null;
    }
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const buffer = await res.arrayBuffer();
    return { buffer, contentType };
  } catch (err: any) {
    console.warn(`  ✗ Error al descargar: ${err?.message}`);
    return null;
  }
}

function extFromContentType(ct: string): string {
  if (ct.includes("png")) return "png";
  if (ct.includes("webp")) return "webp";
  return "jpg";
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🖼️  Iniciando carga de imágenes a Supabase Storage...\n");

  const sb = getSupabase();

  // Crear bucket si no existe
  const { data: buckets } = await sb.storage.listBuckets();
  const bucketExists = buckets?.some((b) => b.name === BUCKET);
  if (!bucketExists) {
    const { error } = await sb.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
    });
    if (error) throw new Error(`No se pudo crear el bucket: ${error.message}`);
    console.log(`✓ Bucket "${BUCKET}" creado\n`);
  } else {
    console.log(`✓ Bucket "${BUCKET}" ya existe\n`);
  }

  const products = await prisma.product.findMany({
    where: { imageUrl: null }, // solo los que aún no tienen imagen
    select: { id: true, code: true, name: true, imageUrl: true },
    orderBy: { code: "asc" },
  });

  let ok = 0, skipped = 0, failed = 0;

  for (const product of products) {
    const photoId = IMAGES[product.code];
    if (!photoId) {
      console.log(`  ⚠  ${product.code} — sin mapeo de imagen, saltando`);
      skipped++;
      continue;
    }

    process.stdout.write(`  📦 ${product.code} — ${product.name.slice(0, 40).padEnd(40)} `);

    const sourceUrl = unsplashUrl(photoId);
    const downloaded = await downloadImage(sourceUrl);

    if (!downloaded) {
      console.log("✗ fallo descarga");
      failed++;
      continue;
    }

    const ext = extFromContentType(downloaded.contentType);
    const path = `${product.code.toLowerCase()}.${ext}`;

    // Subir a Supabase Storage
    const { error: uploadErr } = await sb.storage
      .from(BUCKET)
      .upload(path, downloaded.buffer, {
        contentType: downloaded.contentType,
        upsert: true,
      });

    if (uploadErr) {
      console.log(`✗ ${uploadErr.message}`);
      failed++;
      continue;
    }

    const { data: pubUrl } = sb.storage.from(BUCKET).getPublicUrl(path);

    // Actualizar la DB
    await prisma.product.update({
      where: { id: product.id },
      data: { imageUrl: pubUrl.publicUrl },
    });

    console.log(`✓`);
    ok++;

    // Pequeña pausa para no saturar Unsplash
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\n✅ Finalizado: ${ok} imágenes subidas · ${skipped} sin mapeo · ${failed} fallidos`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
