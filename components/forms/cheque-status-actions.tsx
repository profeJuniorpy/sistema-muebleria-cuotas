"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, CheckCircle2, Loader2, RotateCcw, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { updateChequeStatus } from "@/lib/actions/cheques";
import type { ChequeStatus } from "@prisma/client";

interface Props {
  chequeId: string;
  status: string;
}

export function ChequeStatusActions({ chequeId, status }: Props) {
  const [loading, setLoading] = useState<ChequeStatus | null>(null);
  const router = useRouter();

  async function handleUpdate(next: ChequeStatus) {
    setLoading(next);
    try {
      const result = await updateChequeStatus(chequeId, next);
      if (result.success) {
        toast.success("Estado del cheque actualizado");
        router.refresh();
      } else {
        toast.error(result.error || "Error al actualizar el estado");
      }
    } catch {
      toast.error("Error inesperado");
    } finally {
      setLoading(null);
    }
  }

  if (status === "PENDIENTE") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button
          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          disabled={loading !== null}
          onClick={() => handleUpdate("COBRADO")}
        >
          {loading === "COBRADO" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Marcar Cobrado
        </Button>
        <Button
          variant="outline"
          className="gap-2 border-red-300 text-red-700 hover:bg-red-50"
          disabled={loading !== null}
          onClick={() => handleUpdate("RECHAZADO")}
        >
          {loading === "RECHAZADO" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
          Marcar Rechazado
        </Button>
        <Button
          variant="ghost"
          className="gap-2 text-muted-foreground"
          disabled={loading !== null}
          onClick={() => handleUpdate("ANULADO")}
        >
          {loading === "ANULADO" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
          Anular
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      className="gap-2"
      disabled={loading !== null}
      onClick={() => handleUpdate("PENDIENTE")}
    >
      {loading === "PENDIENTE" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
      Volver a Pendiente
    </Button>
  );
}
