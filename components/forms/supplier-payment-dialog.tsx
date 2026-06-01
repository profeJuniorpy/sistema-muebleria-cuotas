"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { differenceInDays } from "date-fns";
import { CheckCircle, Loader2, Printer, Truck } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  getSupplierInstallments,
  registerSupplierPayment,
} from "@/lib/actions/purchases";

type Installment = {
  id: string;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  paidAmount: number;
  balance: number;
  status: string;
};

interface SupplierPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  purchaseId: string;
  supplierId: string;
  purchaseNumber: string;
  supplierName: string;
  userId: string;
}

export function SupplierPaymentDialog({
  open,
  onClose,
  purchaseId,
  supplierId,
  purchaseNumber,
  supplierName,
  userId,
}: SupplierPaymentDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  const [installments, setInstallments] = useState<Installment[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("EFECTIVO");
  const [notes, setNotes] = useState("");
  const [paid, setPaid] = useState<{ id: string; number: string } | null>(null);

  const now = new Date();

  useEffect(() => {
    if (open) {
      setLoading(true);
      getSupplierInstallments(purchaseId).then((rows) => {
        setInstallments(rows);
        setLoading(false);
      });
    } else {
      resetForm();
    }
  }, [open, purchaseId]);

  function resetForm() {
    setInstallments([]);
    setSelectedIds([]);
    setAmount("");
    setPaymentMethod("EFECTIVO");
    setNotes("");
    setPaid(null);
  }

  function toggleInstallment(id: string) {
    setSelectedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      const total = installments
        .filter((i) => next.includes(i.id))
        .reduce((s, i) => s + i.balance, 0);
      setAmount(String(Math.round(total)));
      return next;
    });
  }

  function handleSubmit() {
    if (selectedIds.length === 0 || !amount) {
      toast.error("Selecciona al menos una cuota y el monto");
      return;
    }

    startTransition(async () => {
      const result = await registerSupplierPayment({
        purchaseId,
        supplierId,
        installmentIds: selectedIds,
        amount: Number(amount),
        paymentMethod: paymentMethod as any,
        notes: notes || undefined,
        userId,
      });

      if (result.success && result.payment) {
        router.refresh();
        setPaid({ id: result.payment.id, number: result.payment.number });
      } else {
        toast.error(result.error ?? "Error al registrar el pago");
      }
    });
  }

  const totalSelected = installments
    .filter((i) => selectedIds.includes(i.id))
    .reduce((s, i) => s + i.balance, 0);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) { onClose(); resetForm(); }
      }}
    >
      <DialogContent
        className={cn(
          "flex flex-col max-h-[88vh]",
          paid ? "sm:max-w-xs" : "sm:max-w-xl"
        )}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            {paid ? "Pago Registrado" : "Pagar a Proveedor"}
          </DialogTitle>
        </DialogHeader>

        {/* Estado de éxito */}
        {paid ? (
          <div className="flex flex-col items-center gap-5 py-6 text-center">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Pago registrado</p>
              <p className="font-mono font-bold text-xl">{paid.number}</p>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() =>
                  window.open(`/rpt/recibo-proveedor/${paid.id}`, "_blank")
                }
              >
                <Printer className="h-4 w-4" /> Imprimir Comprobante
              </Button>
              <Button
                className="w-full"
                onClick={() => { onClose(); resetForm(); }}
              >
                Cerrar
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-y-auto flex-1 min-h-0 space-y-4 py-1">
              {/* Info */}
              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Proveedor</span>
                  <span className="font-medium">{supplierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Compra N°</span>
                  <span className="font-mono">{purchaseNumber}</span>
                </div>
              </div>

              {/* Cuotas */}
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                  <Loader2 className="h-4 w-4 animate-spin" /> Cargando cuotas...
                </div>
              ) : installments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No hay cuotas pendientes
                </p>
              ) : (
                <div className="space-y-1.5">
                  <Label>Seleccionar cuotas *</Label>
                  <div className="border rounded-lg overflow-hidden text-sm">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted border-b">
                          <th className="p-2 w-10" />
                          <th className="p-2 text-left font-medium">Cuota</th>
                          <th className="p-2 text-left font-medium">Vencimiento</th>
                          <th className="p-2 text-right font-medium">Saldo GS</th>
                          <th className="p-2 text-center font-medium">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {installments.map((inst) => {
                          const dueDate = new Date(inst.dueDate);
                          const daysLate =
                            now > dueDate ? differenceInDays(now, dueDate) : 0;
                          const checked = selectedIds.includes(inst.id);

                          return (
                            <tr
                              key={inst.id}
                              className={cn(
                                "border-t cursor-pointer hover:bg-muted/50",
                                checked && "bg-primary/5"
                              )}
                              onClick={() => toggleInstallment(inst.id)}
                            >
                              <td className="p-2 text-center">
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={() => toggleInstallment(inst.id)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </td>
                              <td className="p-2 font-medium">#{inst.installmentNumber}</td>
                              <td className="p-2">
                                {dueDate.toLocaleDateString("es-PY")}
                                {daysLate > 0 && (
                                  <span className="text-red-500 text-xs ml-1">
                                    ({daysLate}d)
                                  </span>
                                )}
                              </td>
                              <td className="p-2 text-right font-semibold">
                                {new Intl.NumberFormat("es-PY").format(inst.balance)}
                              </td>
                              <td className="p-2 text-center">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-xs",
                                    inst.status === "VENCIDA"
                                      ? "border-red-300 text-red-700 bg-red-50"
                                      : inst.status === "PARCIAL"
                                      ? "border-amber-300 text-amber-700 bg-amber-50"
                                      : "border-slate-300 text-slate-700"
                                  )}
                                >
                                  {inst.status}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Monto y método */}
              {selectedIds.length > 0 && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Monto a Pagar (GS) *</Label>
                      <Input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min="1"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Método *</Label>
                      <Select
                        value={paymentMethod}
                        onValueChange={(v) => { if (v) setPaymentMethod(v); }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                          <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                          <SelectItem value="TARJETA">Tarjeta</SelectItem>
                          <SelectItem value="CHEQUE">Cheque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Observaciones</Label>
                    <Input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Opcional..."
                    />
                  </div>
                  <div className="bg-slate-50 border rounded-lg p-3 text-sm space-y-1">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Cuotas seleccionadas</span>
                      <span className="font-medium text-foreground">{selectedIds.length}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Saldo cuotas</span>
                      <span className="font-medium text-foreground">
                        {new Intl.NumberFormat("es-PY").format(Math.round(totalSelected))} GS
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Monto a registrar</span>
                      <span className="text-primary">
                        {new Intl.NumberFormat("es-PY").format(Number(amount) || 0)} GS
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { onClose(); resetForm(); }}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isPending || selectedIds.length === 0 || !amount}
              >
                {isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Procesando...</>
                ) : (
                  "Registrar Pago"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
