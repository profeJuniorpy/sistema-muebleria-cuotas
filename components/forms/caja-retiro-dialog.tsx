"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Loader2, MinusCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { registrarRetiro } from "@/lib/actions/caja";
import { WithdrawalCategory } from "@prisma/client";

const CATEGORY_LABELS: Record<string, string> = {
  PAGO_PROVEEDOR: "Pago a proveedor",
  GASTO_OPERATIVO: "Gasto operativo",
  ADELANTO_PERSONAL: "Adelanto al personal",
  DEVOLUCION: "Devolución a cliente",
  OTRO: "Otro",
};

const schema = z.object({
  amount: z.number().min(1, "El monto debe ser mayor a 0"),
  concept: z.string().min(1, "El concepto es requerido"),
  category: z.nativeEnum(WithdrawalCategory),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  cashRegisterId: string;
  userId: string;
}

export default function CajaRetiroDialog({ cashRegisterId, userId }: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: 0, concept: "", category: "OTRO" },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    try {
      const result = await registrarRetiro({ cashRegisterId, userId, ...values });
      if (result.success) {
        toast.success("Retiro registrado correctamente");
        setOpen(false);
        form.reset();
        router.refresh();
      } else {
        toast.error(result.error ?? "Error al registrar el retiro");
      }
    } catch {
      toast.error("Error inesperado");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" className="gap-2" />}>
        <MinusCircle className="h-4 w-4" /> Registrar Retiro
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Retiro de Caja</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue>
                          {field.value ? CATEGORY_LABELS[field.value] ?? field.value : null}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(WithdrawalCategory).map((c) => (
                        <SelectItem key={c} value={c}>
                          {CATEGORY_LABELS[c] ?? c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="concept"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Concepto / Detalle</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ej: Pago factura Proveedor XYZ, servicios básicos..."
                    />
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
                  <FormLabel>Monto (GS)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
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
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="gap-2">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MinusCircle className="h-4 w-4" />
                )}
                Confirmar Retiro
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
