"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  className?: string;
}

export function LogoUpload({ value, onChange, className }: Props) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    async (file: File) => {
      setLoading(true);
      try {
        const form = new FormData();
        form.append("file", file);

        const res = await fetch("/api/upload/logo", {
          method: "POST",
          body: form,
        });
        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error ?? "Error al subir el logo");
          return;
        }

        onChange(data.url);
        toast.success("Logo subido correctamente");
      } catch {
        toast.error("Error de conexión al subir el logo");
      } finally {
        setLoading(false);
      }
    },
    [onChange]
  );

  async function handleRemove() {
    if (!value) return;
    try {
      await fetch("/api/upload/logo", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value }),
      });
    } catch {}
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
    <div className={cn("flex flex-col items-center gap-3", className)}>
      {value ? (
        /* Preview circular */
        <div className="relative group">
          <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-[#1a3a8c] shadow-md bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Logo de la empresa"
              className="w-full h-full object-contain"
            />
          </div>
          {loading && (
            <div className="absolute inset-0 rounded-full bg-white/70 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#1a3a8c]" />
            </div>
          )}
          <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={loading}
              title="Cambiar logo"
              className="rounded-full bg-white p-1.5 text-[#1a3a8c] shadow hover:bg-blue-50 transition-colors"
            >
              <Upload className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={loading}
              title="Eliminar logo"
              className="rounded-full bg-red-500 p-1.5 text-white shadow hover:bg-red-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Drop zone circular */
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          disabled={loading}
          className={cn(
            "w-28 h-28 rounded-full border-4 border-dashed flex flex-col items-center justify-center gap-1 text-xs transition-colors",
            dragging
              ? "border-[#1a3a8c] bg-blue-50 text-[#1a3a8c]"
              : "border-blue-300 bg-blue-50/50 text-blue-400 hover:border-[#1a3a8c] hover:text-[#1a3a8c]",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : dragging ? (
            <>
              <ImageIcon className="h-6 w-6" />
              <span className="font-medium">Soltar</span>
            </>
          ) : (
            <>
              <Upload className="h-6 w-6" />
              <span className="font-medium text-center leading-tight px-2">Subir Logo</span>
            </>
          )}
        </button>
      )}

      <p className="text-xs text-muted-foreground text-center">
        PNG, JPG o WebP · Máx 3 MB<br />
        Clic o arrastrá la imagen
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
