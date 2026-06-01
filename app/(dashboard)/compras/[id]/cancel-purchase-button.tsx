"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cancelPurchase } from "@/lib/actions/purchases";

interface CancelPurchaseButtonProps {
  purchaseId: string;
  purchaseNumber: string;
}

export function CancelPurchaseButton({
  purchaseId,
  purchaseNumber,
}: CancelPurchaseButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleConfirm() {
    startTransition(async () => {
      const result = await cancelPurchase(purchaseId);
      if (result.success) {
        toast.success("Compra cancelada. El stock fue revertido.");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Error al cancelar");
      }
    });
  }

  return (
    <>
      <Button
        variant="outline"
        className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
        onClick={() => setOpen(true)}
      >
        <XCircle className="h-4 w-4" /> Cancelar Compra
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <XCircle className="h-5 w-5" /> Cancelar Compra {purchaseNumber}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Esta acción revertirá el stock de todos los productos ingresados en esta
            compra y marcará el registro como <strong>CANCELADA</strong>. No se puede
            deshacer.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Volver
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={isPending}
              className="gap-2"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Confirmar Cancelación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
