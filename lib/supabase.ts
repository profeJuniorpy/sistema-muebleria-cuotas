export const BUCKET = "product-images";

function storageBase() {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1`;
}

function authHeaders() {
  return { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` };
}

export async function uploadFile(path: string, data: ArrayBuffer, contentType: string) {
  const res = await fetch(`${storageBase()}/object/${BUCKET}/${path}?`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": contentType, "x-upsert": "true" },
    body: data,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Upload failed");
  }
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

export async function deleteFile(path: string) {
  await fetch(`${storageBase()}/object/${BUCKET}`, {
    method: "DELETE",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: [path] }),
  });
}

export async function ensureBucket() {
  const check = await fetch(`${storageBase()}/bucket/${BUCKET}`, { headers: authHeaders() });
  if (check.status === 200) return;
  await fetch(`${storageBase()}/bucket`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
  });
}
