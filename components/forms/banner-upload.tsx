"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MAX_SIZE = 1.5 * 1024 * 1024; // 1.5 MB → base64 ~2 MB, bajo el límite de 5 MB del Server Action
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

interface Props {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  className?: string;
}

export function BannerUpload({ value, onChange, className }: Props) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    async (file: File) => {
      if (!ALLOWED.includes(file.type)) {
        toast.error("Formato no permitido. Usá JPG, PNG o WebP.");
        return;
      }
      if (file.size > MAX_SIZE) {
        toast.error("La imagen supera 1.5 MB. Reducí el tamaño de la imagen.");
        return;
      }

      setLoading(true);
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        onChange(dataUrl);
        toast.success("Imagen cargada. Presioná 'Guardar' para publicarla.");
      } catch {
        toast.error("Error al leer el archivo");
      } finally {
        setLoading(false);
      }
    },
    [onChange]
  );

  function handleRemove() {
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
    <div className={cn("flex flex-col gap-3", className)}>
      {value ? (
        <div className="relative group w-full aspect-[16/6] rounded-xl overflow-hidden border-2 border-zinc-200 bg-zinc-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Banner de la tienda" className="w-full h-full object-cover" />
          {loading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-700" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={loading}
              title="Cambiar imagen"
              className="rounded-full bg-white p-2 text-zinc-800 shadow hover:bg-zinc-100 transition-colors"
            >
              <Upload className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={loading}
              title="Quitar imagen"
              className="rounded-full bg-red-500 p-2 text-white shadow hover:bg-red-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          disabled={loading}
          className={cn(
            "w-full aspect-[16/6] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 text-sm transition-colors",
            dragging
              ? "border-zinc-900 bg-zinc-50 text-zinc-900"
              : "border-zinc-300 bg-zinc-50/50 text-zinc-400 hover:border-zinc-500 hover:text-zinc-700",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {loading ? (
            <Loader2 className="h-7 w-7 animate-spin" />
          ) : dragging ? (
            <>
              <ImageIcon className="h-7 w-7" />
              <span className="font-medium">Soltar imagen</span>
            </>
          ) : (
            <>
              <Upload className="h-7 w-7" />
              <span className="font-medium">Subir imagen del banner</span>
            </>
          )}
        </button>
      )}

      <p className="text-xs text-muted-foreground">
        PNG, JPG o WebP · Máx 1.5 MB · Recomendado 1600x600px aprox. (panorámico)
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
