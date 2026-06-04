"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MAX_SIZE = 1 * 1024 * 1024; // 1 MB — logo no necesita más
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

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
      if (!ALLOWED.includes(file.type)) {
        toast.error("Formato no permitido. Usá JPG, PNG o WebP.");
        return;
      }
      if (file.size > MAX_SIZE) {
        toast.error("El logo supera 1 MB. Reducí el tamaño de la imagen.");
        return;
      }

      setLoading(true);
      try {
        // Convertir a base64 data URL — se guarda directamente en la BD
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        onChange(dataUrl);
        toast.success("Logo cargado. Presioná 'Guardar' para aplicar los cambios.");
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
