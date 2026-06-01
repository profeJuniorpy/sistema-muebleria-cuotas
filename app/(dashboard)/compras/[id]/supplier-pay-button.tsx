"use client";

import { useState } from "react";
import { Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SupplierPaymentDialog } from "@/components/forms/supplier-payment-dialog";

interface SupplierPayButtonProps {
  purchaseId: string;
  supplierId: string;
  purchaseNumber: string;
  supplierName: string;
  userId: string;
  purchaseStatus: string;
}

export function SupplierPayButton({
  purchaseId,
  supplierId,
  purchaseNumber,
  supplierName,
  userId,
  purchaseStatus,
}: SupplierPayButtonProps) {
  const [open, setOpen] = useState(false);

  if (purchaseStatus === "COMPLETADA" || purchaseStatus === "CANCELADA") return null;

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Truck className="h-4 w-4" /> Registrar Pago a Proveedor
      </Button>
      <SupplierPaymentDialog
        open={open}
        onClose={() => setOpen(false)}
        purchaseId={purchaseId}
        supplierId={supplierId}
        purchaseNumber={purchaseNumber}
        supplierName={supplierName}
        userId={userId}
      />
    </>
  );
}
