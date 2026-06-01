"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Loader2, Calculator } from "lucide-react";
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
import { registrarArqueo } from "@/lib/actions/caja";

const schema = z.object({
  countedAmount: z.number().min(0, "Mínimo 0"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  cashRegisterId: string;
  userId: string;
  currentSystemBalance: number;
}

export default function CajaArqueoDialog({
  cashRegisterId,
  userId,
  currentSystemBalance,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ systemAmount: number; difference: number } | null>(null);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { countedAmount: 0, notes: "" },
  });

  const counted = form.watch("countedAmount") ?? 0;
  const diffPreview = counted - currentSystemBalance;

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    try {
      const res = await registrarArqueo({ cashRegisterId, userId, ...values });
      if (res.success) {
        setResult({ systemAmount: res.systemAmount!, difference: res.difference! });
        toast.success("Arqueo registrado");
        router.refresh();
      } else {
        toast.error(res.error ?? "Error al registrar el arqueo");
      }
    } catch {
      toast.error("Error inesperado");
    } finally {
      setIsLoading(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setResult(null);
    form.reset();
  }

  const fmt = (n: number) => new Intl.NumberFormat("es-PY").format(n);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
      <DialogTrigger render={<Button variant="outline" className="gap-2" />}>
        <Calculator className="h-4 w-4" /> Arqueo
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Arqueo de Caja</DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3 space-y-1">
                <p className="text-xs text-muted-foreground">Saldo del Sistema</p>
                <p className="font-bold text-lg">{fmt(result.systemAmount)} GS</p>
              </div>
              <div className={cn("rounded-lg border p-3 space-y-1", result.difference === 0 ? "border-emerald-200 bg-emerald-50" : result.difference < 0 ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50")}>
                <p className="text-xs text-muted-foreground">Diferencia</p>
                <p className={cn("font-bold text-lg", result.difference === 0 ? "text-emerald-700" : result.difference < 0 ? "text-red-700" : "text-amber-700")}>
                  {result.difference > 0 ? "+" : ""}{fmt(result.difference)} GS
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {result.difference === 0 ? "La caja cuadra perfectamente." : result.difference < 0 ? "Falta efectivo en caja (faltante)." : "Hay más efectivo del esperado (sobrante)."}
            </p>
            <Button className="w-full" onClick={handleClose}>Cerrar</Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="rounded-lg bg-zinc-50 border p-3 text-sm space-y-1">
                <p className="text-muted-foreground">Saldo esperado por sistema</p>
                <p className="font-bold text-xl">{fmt(currentSystemBalance)} GS</p>
              </div>
              <FormField
                control={form.control}
                name="countedAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Efectivo contado físicamente (GS)</FormLabel>
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
              {counted > 0 && (
                <div className={cn("rounded-lg border px-3 py-2 text-sm font-medium", diffPreview === 0 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : diffPreview < 0 ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-700")}>
                  Diferencia preliminar: {diffPreview > 0 ? "+" : ""}{fmt(diffPreview)} GS
                </div>
              )}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observaciones</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Notas opcionales..." />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading} className="gap-2">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Calculator className="h-4 w-4" />
                  )}
                  Registrar Arqueo
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
