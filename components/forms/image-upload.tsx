"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { Upload, X, Loader2, ImageIcon, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  value: string | null | undefined;
  productCode?: string;
  onChange: (url: string | null) => void;
  className?: string;
}

export function ImageUpload({ value, productCode = "producto", onChange, className }: Props) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    async (file: File) => {
      setLoading(true);
      setError(null);
      try {
        const form = new FormData();
        form.append("file", file);
        form.append("code", productCode);

        const res = await fetch("/api/upload/product-image", {
          method: "POST",
          body: form,
        });
        const data = await res.json();

        if (!res.ok) {
          const message = data.error ?? "Error al subir la imagen";
          setError(message);
          toast.error(message);
          return;
        }

        onChange(data.url);
        toast.success("Imagen subida correctamente");
      } catch {
        const message = "Error de conexión al subir la imagen";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [productCode, onChange]
  );

  async function handleRemove() {
    if (!value) return;
    try {
      await fetch("/api/upload/product-image", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value }),
      });
    } catch {}
    setError(null);
    onChange(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = "";
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Preview */}
      {value ? (
        <div className="relative group w-full aspect-square max-w-xs rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50">
          <Image
            src={value}
            alt="Imagen del producto"
            fill
            className="object-cover"
            sizes="320px"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={loading}
              className="rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 shadow hover:bg-zinc-50 transition-colors"
            >
              Cambiar
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={loading}
              className="rounded-xl bg-red-500 p-1.5 text-white shadow hover:bg-red-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {loading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-600" />
            </div>
          )}
        </div>
      ) : (
        /* Drop zone */
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          disabled={loading}
          className={cn(
            "w-full max-w-xs aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 text-sm transition-colors",
            dragging
              ? "border-zinc-600 bg-zinc-100"
              : "border-zinc-300 bg-zinc-50 hover:border-zinc-400 hover:bg-zinc-100",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {loading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
              <span className="text-zinc-400">Subiendo...</span>
            </>
          ) : (
            <>
              <div className="rounded-full bg-zinc-200 p-3">
                {dragging ? (
                  <ImageIcon className="h-6 w-6 text-zinc-600" />
                ) : (
                  <Upload className="h-6 w-6 text-zinc-500" />
                )}
              </div>
              <span className="font-medium text-zinc-700">
                {dragging ? "Soltar aquí" : "Subir imagen"}
              </span>
              <span className="text-xs text-zinc-400 text-center px-4">
                JPG, PNG o WebP · Máximo 5 MB<br />
                Clic o arrastrá la imagen aquí
              </span>
            </>
          )}
        </button>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 max-w-xs">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
