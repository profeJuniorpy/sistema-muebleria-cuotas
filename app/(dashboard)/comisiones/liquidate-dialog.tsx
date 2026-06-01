"use client";

import { useTransition } from "react";
import { Loader2, BadgeDollarSign } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { liquidateCommissions } from "@/lib/actions/commissions";

interface LiquidateDialogProps {
  open: boolean;
  onClose: () => void;
  sellerName: string;
  pendingAmount: number;
  pendingCount: number;
  commissionIds: string[];
  userId: string;
}

export function LiquidateDialog({
  open,
  onClose,
  sellerName,
  pendingAmount,
  pendingCount,
  commissionIds,
  userId,
}: LiquidateDialogProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleConfirm() {
    startTransition(async () => {
      const result = await liquidateCommissions(commissionIds, userId);
      if (result.success) {
        toast.success(
          `${result.count} comisión(es) de ${sellerName} liquidadas correctamente`
        );
        router.refresh();
        onClose();
      } else {
        toast.error(result.error ?? "Error al liquidar comisiones");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BadgeDollarSign className="h-5 w-5" /> Liquidar Comisiones
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Estás a punto de marcar como <strong>PAGADAS</strong> todas las
            comisiones pendientes del siguiente vendedor:
          </p>

          <div className="bg-muted/50 border rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Vendedor</span>
              <span className="font-semibold">{sellerName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Comisiones pendientes</span>
              <span className="font-medium">{pendingCount}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total a pagar</span>
              <span className="text-emerald-600">
                {new Intl.NumberFormat("es-PY").format(pendingAmount)} GS
              </span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Esta acción es irreversible. Asegúrate de haber realizado el pago
            correspondiente antes de confirmar.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              "Confirmar Liquidación"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
