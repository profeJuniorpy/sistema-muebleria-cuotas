"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { createCheque } from "@/lib/actions/cheques";

// ─── Schema ───────────────────────────────────────────────────────────────────

const chequeFormSchema = z.object({
  type: z.enum(["EMITIDO", "RECIBIDO"]),
  number: z.string().min(1, "Ingresá el número de cheque"),
  bankName: z.string().min(1, "Ingresá el banco"),
  amount: z.number().positive("El monto debe ser mayor a 0"),
  issueDate: z.string().min(1, "Ingresá la fecha de emisión"),
  dueDate: z.string().min(1, "Ingresá la fecha de pago"),
  partyName: z.string().min(1, "Campo requerido"),
  partyDocument: z.string().optional(),
  customerId: z.string().optional(),
  supplierId: z.string().optional(),
  concept: z.string().optional(),
  notes: z.string().optional(),
});

type ChequeFormValues = z.infer<typeof chequeFormSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface ChequeFormProps {
  customers: { id: string; name: string }[];
  suppliers: { id: string; name: string }[];
  userId: string;
}

const TYPE_LABELS: Record<string, string> = {
  EMITIDO: "Emitido (pago a un tercero)",
  RECIBIDO: "Recibido (cobro a un cliente)",
};

const todayISO = () => new Date().toISOString().split("T")[0];

// ─── Component ────────────────────────────────────────────────────────────────

export function ChequeForm({ customers, suppliers, userId }: ChequeFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<ChequeFormValues>({
    resolver: zodResolver(chequeFormSchema),
    defaultValues: {
      type: "EMITIDO",
      number: "",
      bankName: "",
      amount: 0,
      issueDate: todayISO(),
      dueDate: todayISO(),
      partyName: "",
      partyDocument: "",
      customerId: "",
      supplierId: "",
      concept: "",
      notes: "",
    },
  });

  const type = form.watch("type");

  async function onSubmit(values: ChequeFormValues) {
    setIsLoading(true);
    try {
      const result = await createCheque(
        {
          ...values,
          customerId: type === "RECIBIDO" ? values.customerId || undefined : undefined,
          supplierId: type === "EMITIDO" ? values.supplierId || undefined : undefined,
        },
        userId
      );

      if (result.success) {
        toast.success("Cheque registrado exitosamente");
        router.push("/cheques");
        router.refresh();
      } else {
        toast.error(result.error || "Error al registrar el cheque");
      }
    } catch {
      toast.error("Error inesperado al registrar el cheque");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Datos del Cheque</CardTitle>
            <CardDescription>
              Emitido: cheque propio entregado para pagar a un proveedor u otro tercero.
              Recibido: cheque de un cliente entregado como forma de pago.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Cheque *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue>{TYPE_LABELS[field.value]}</SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="EMITIDO">{TYPE_LABELS.EMITIDO}</SelectItem>
                      <SelectItem value="RECIBIDO">{TYPE_LABELS.RECIBIDO}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>N° de Cheque *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="0001234" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banco *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Banco Continental" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto (GS) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="1"
                        value={field.value ?? 0}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div />
              <FormField
                control={form.control}
                name="issueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Emisión *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Pago (vencimiento) *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Para cheques diferidos, es la fecha desde la cual puede cobrarse.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {type === "EMITIDO" ? "Beneficiario" : "Librador (quién entrega el cheque)"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="partyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre / Razón Social *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={type === "EMITIDO" ? "A quién se le paga" : "Quién entrega el cheque"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="partyDocument"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>C.I. / RUC</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Opcional" />
                    </FormControl>
                  </FormItem>
                )}
              />

              {type === "RECIBIDO" && (
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Vincular a Cliente (opcional)</FormLabel>
                      <Select value={field.value || "NONE"} onValueChange={(v) => field.onChange(v === "NONE" ? "" : v)}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue>
                              {customers.find((c) => c.id === field.value)?.name ?? "Sin vincular"}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="NONE">Sin vincular</SelectItem>
                          {customers.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              )}

              {type === "EMITIDO" && (
                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Vincular a Proveedor (opcional)</FormLabel>
                      <Select value={field.value || "NONE"} onValueChange={(v) => field.onChange(v === "NONE" ? "" : v)}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue>
                              {suppliers.find((s) => s.id === field.value)?.name ?? "Sin vincular"}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="NONE">Sin vincular</SelectItem>
                          {suppliers.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="concept"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Concepto (opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ej: Pago factura N° 001-234" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Notas (opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Observaciones adicionales" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading} className="gap-2 min-w-44">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Registrar Cheque
          </Button>
        </div>
      </form>
    </Form>
  );
}
