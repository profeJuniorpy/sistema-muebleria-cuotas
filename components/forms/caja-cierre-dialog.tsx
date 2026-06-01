"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Loader2, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
import { Input } from "@/components/ui/input";
import { cerrarCaja } from "@/lib/actions/caja";

const schema = z.object({
  closingBalance: z.number().min(0, "Mínimo 0"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  cashRegisterId: string;
  userId: string;
  systemBalance: number;
}

export default function CajaCierreDialog({
  cashRegisterId,
  userId,
  systemBalance,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { closingBalance: systemBalance, notes: "" },
  });

  const declared = form.watch("closingBalance") ?? 0;
  const diffPreview = declared - systemBalance;
  const fmt = (n: number) => new Intl.NumberFormat("es-PY").format(n);

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    try {
      const result = await cerrarCaja({ cashRegisterId, userId, ...values });
      if (result.success) {
        toast.success("Caja cerrada correctamente");
        setOpen(false);
        router.push("/caja");
        router.refresh();
      } else {
        toast.error(result.error ?? "Error al cerrar la caja");
      }
    } catch {
      toast.error("Error inesperado");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" className="gap-2" />}>
        <LockKeyhole className="h-4 w-4" /> Cerrar Caja
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cerrar Caja</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="rounded-lg bg-zinc-50 border p-3 text-sm space-y-1">
              <p className="text-muted-foreground">Saldo calculado por el sistema</p>
              <p className="font-bold text-xl">{fmt(systemBalance)} GS</p>
            </div>
            <FormField
              control={form.control}
              name="closingBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Efectivo declarado al cierre (GS)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
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
            <div className={cn("rounded-lg border px-3 py-2 text-sm font-medium", diffPreview === 0 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : diffPreview < 0 ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-700")}>
              Diferencia: {diffPreview > 0 ? "+" : ""}{fmt(diffPreview)} GS
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones de cierre</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Notas opcionales..." />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} variant="destructive" className="gap-2">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LockKeyhole className="h-4 w-4" />
                )}
                Confirmar Cierre
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
