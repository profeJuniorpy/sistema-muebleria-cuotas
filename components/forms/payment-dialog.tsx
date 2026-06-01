"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { differenceInDays } from "date-fns";
import { CheckCircle, CreditCard, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { registerPayment, getSalesWithPendingInstallments } from "@/lib/actions/payments";

type Customer = {
  id: string;
  name: string;
  ruc: string;
  mobile: string | null;
};

type SerializedInstallment = {
  id: string;
  installmentNumber: number;
  dueDate: string;
  total: number;
  paidAmount: number;
  balance: number;
  status: string;
};

type SerializedSale = {
  id: string;
  number: string;
  lateInterestRate: number;
  installments: SerializedInstallment[];
};

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  customers: Customer[];
  userId: string;
  initialCustomerId?: string;
  initialSaleId?: string;
  initialInstallmentId?: string;
}

export function PaymentDialog({
  open,
  onClose,
  customers,
  userId,
  initialCustomerId,
  initialSaleId,
  initialInstallmentId,
}: PaymentDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingSales, setLoadingSales] = useState(false);

  const [registeredPayment, setRegisteredPayment] = useState<{
    id: string;
    number: string;
  } | null>(null);

  const [customerId, setCustomerId] = useState("");
  const [sales, setSales] = useState<SerializedSale[]>([]);
  const [saleId, setSaleId] = useState("");
  const [selectedInstallmentIds, setSelectedInstallmentIds] = useState<string[]>([]);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("EFECTIVO");
  const [notes, setNotes] = useState("");

  const selectedSale = sales.find((s) => s.id === saleId);
  const installments = selectedSale?.installments ?? [];
  const now = new Date();

  useEffect(() => {
    if (open && initialCustomerId) {
      void loadSalesForCustomer(initialCustomerId, initialSaleId, initialInstallmentId);
    }
    if (!open) {
      resetForm();
    }
  }, [open]);

  async function loadSalesForCustomer(
    custId: string,
    preselectSaleId?: string,
    preselectInstId?: string
  ) {
    setCustomerId(custId);
    setLoadingSales(true);
    const result = await getSalesWithPendingInstallments(custId);
    setSales(result);
    setLoadingSales(false);

    if (preselectSaleId) {
      setSaleId(preselectSaleId);
      if (preselectInstId) {
        const sale = result.find((s) => s.id === preselectSaleId);
        const inst = sale?.installments.find((i) => i.id === preselectInstId);
        if (inst) {
          setSelectedInstallmentIds([preselectInstId]);
          setAmount(String(Math.round(inst.balance)));
        }
      }
    }
  }

  function resetForm() {
    setRegisteredPayment(null);
    setCustomerId("");
    setSales([]);
    setSaleId("");
    setSelectedInstallmentIds([]);
    setAmount("");
    setPaymentMethod("EFECTIVO");
    setNotes("");
  }

  async function handleCustomerChange(id: string) {
    setSaleId("");
    setSales([]);
    setSelectedInstallmentIds([]);
    setAmount("");
    await loadSalesForCustomer(id);
  }

  function handleSaleChange(id: string) {
    setSaleId(id);
    setSelectedInstallmentIds([]);
    setAmount("");
  }

  function toggleInstallment(id: string) {
    setSelectedInstallmentIds((prev) => {
      const next = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      const total = installments
        .filter((i) => next.includes(i.id))
        .reduce((sum, i) => sum + i.balance, 0);
      setAmount(String(Math.round(total)));
      return next;
    });
  }

  function handleSubmit() {
    if (!customerId || !saleId || selectedInstallmentIds.length === 0 || !amount) {
      toast.error("Complete todos los campos requeridos");
      return;
    }
    if (!userId) {
      toast.error("Sesión inválida. Refresque la página.");
      return;
    }

    startTransition(async () => {
      const result = await registerPayment({
        customerId,
        saleId,
        installmentIds: selectedInstallmentIds,
        amount: Number(amount),
        paymentMethod: paymentMethod as any,
        notes: notes || undefined,
        receivedBy: userId,
      });

      if (result.success && result.payment) {
        router.refresh();
        setRegisteredPayment({ id: result.payment.id, number: result.payment.number });
      } else {
        toast.error(result.error ?? "Error al registrar el pago");
      }
    });
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      onClose();
      resetForm();
    }
  }

  const totalSelected = installments
    .filter((i) => selectedInstallmentIds.includes(i.id))
    .reduce((s, i) => s + i.balance, 0);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "flex flex-col max-h-[88vh]",
          registeredPayment
            ? "sm:max-w-xs"
            : saleId && installments.length > 0
            ? "sm:max-w-2xl"
            : "sm:max-w-md"
        )}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {registeredPayment ? "Pago Registrado" : "Registrar Pago"}
          </DialogTitle>
        </DialogHeader>

        {/* ── Estado de éxito ── */}
        {registeredPayment ? (
          <div className="flex flex-col items-center gap-5 py-6 px-2 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-9 w-9 text-emerald-600" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Número de recibo</p>
              <p className="font-mono font-bold text-xl">{registeredPayment.number}</p>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <Button
                className="w-full gap-2"
                onClick={() =>
                  window.open(`/rpt/recibo/${registeredPayment.id}`, "_blank")
                }
              >
                <Printer className="h-4 w-4" /> Imprimir Recibo (Ticket)
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => { onClose(); resetForm(); }}
              >
                Cerrar
              </Button>
            </div>
          </div>
        ) : (
        <div className="overflow-y-auto flex-1 min-h-0 space-y-5 py-1">
          {/* Cliente */}
          <div className="space-y-1.5">
            <Label>Cliente *</Label>
            <Select
              value={customerId}
              onValueChange={(value) => { if (value) void handleCustomerChange(value); }}
              disabled={!!initialCustomerId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cliente...">
                  {customerId ? (customers.find((c) => c.id === customerId)?.name ?? null) : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Venta */}
          {customerId && (
            <>
              {loadingSales ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Cargando ventas...
                </div>
              ) : sales.length === 0 ? (
                <p className="text-sm text-amber-600">
                  No hay ventas con cuotas pendientes para este cliente.
                </p>
              ) : (
                <div className="space-y-1.5">
                  <Label>Venta / Crédito *</Label>
                  <Select value={saleId} onValueChange={(value) => { if (value) handleSaleChange(value); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar venta...">
                        {saleId
                          ? (() => {
                              const s = sales.find((x) => x.id === saleId);
                              return s ? `${s.number} — ${s.installments.length} cuota(s) pendiente(s)` : null;
                            })()
                          : null}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {sales.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.number} — {s.installments.length} cuota(s) pendiente(s)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          {/* Cuotas */}
          {saleId && installments.length > 0 && (
            <div className="space-y-1.5">
              <Label>Seleccionar cuotas a pagar *</Label>
              <div className="border rounded-lg overflow-hidden text-sm">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted border-b">
                      <th className="p-2 w-10" />
                      <th className="p-2 text-left font-medium">Cuota</th>
                      <th className="p-2 text-left font-medium">Vencimiento</th>
                      <th className="p-2 text-right font-medium">Total GS</th>
                      <th className="p-2 text-right font-medium">Saldo GS</th>
                      <th className="p-2 text-center font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {installments.map((inst) => {
                      const dueDate = new Date(inst.dueDate);
                      const daysLate = now > dueDate ? differenceInDays(now, dueDate) : 0;
                      const checked = selectedInstallmentIds.includes(inst.id);

                      return (
                        <tr
                          key={inst.id}
                          className={cn(
                            "border-t cursor-pointer hover:bg-muted/50 transition-colors",
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
                                ({daysLate}d atraso)
                              </span>
                            )}
                          </td>
                          <td className="p-2 text-right">
                            {new Intl.NumberFormat("es-PY").format(inst.total)}
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
          {selectedInstallmentIds.length > 0 && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Monto a Cobrar (GS) *</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    min="1"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Método de Pago *</Label>
                  <Select value={paymentMethod} onValueChange={(value) => { if (value) setPaymentMethod(value); }}>
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
                  placeholder="Notas opcionales..."
                />
              </div>

              {/* Resumen */}
              <div className="bg-slate-50 border rounded-lg p-3 text-sm space-y-1.5">
                <div className="flex justify-between text-muted-foreground">
                  <span>Cuotas seleccionadas</span>
                  <span className="font-medium text-foreground">{selectedInstallmentIds.length}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Saldo total de cuotas</span>
                  <span className="font-medium text-foreground">
                    {new Intl.NumberFormat("es-PY").format(Math.round(totalSelected))} GS
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-base">
                  <span>Monto a registrar</span>
                  <span className="text-primary">
                    {new Intl.NumberFormat("es-PY").format(Number(amount) || 0)} GS
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
        )}

        {!registeredPayment && (
          <DialogFooter>
            <Button variant="outline" onClick={() => { onClose(); resetForm(); }}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                isPending ||
                !customerId ||
                !saleId ||
                selectedInstallmentIds.length === 0 ||
                !amount
              }
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Registrar Pago"
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
