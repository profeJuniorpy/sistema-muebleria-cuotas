"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaymentDialog } from "@/components/forms/payment-dialog";

type Customer = {
  id: string;
  name: string;
  ruc: string;
  mobile: string | null;
};

interface CreditPayButtonProps {
  saleId: string;
  customerId: string;
  customers: Customer[];
  userId: string;
  saleStatus: string;
}

export function CreditPayButton({
  saleId,
  customerId,
  customers,
  userId,
  saleStatus,
}: CreditPayButtonProps) {
  const [open, setOpen] = useState(false);

  if (saleStatus === "COMPLETADA" || saleStatus === "CANCELADA") return null;

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <CreditCard className="h-4 w-4" /> Registrar Pago
      </Button>
      <PaymentDialog
        open={open}
        onClose={() => setOpen(false)}
        customers={customers}
        userId={userId}
        initialCustomerId={customerId}
        initialSaleId={saleId}
      />
    </>
  );
}
