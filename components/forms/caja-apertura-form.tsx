"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Loader2, Save, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { abrirCaja } from "@/lib/actions/caja";

const schema = z.object({
  openingBalance: z.number().min(0, "El saldo inicial debe ser 0 o mayor"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  userId: string;
}

export default function CajaAperturaForm({ userId }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { openingBalance: 0, notes: "" },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    try {
      const result = await abrirCaja({ userId, ...values });
      if (result.success) {
        toast.success("Caja abierta correctamente");
        router.push("/caja");
        router.refresh();
      } else {
        toast.error(result.error ?? "Error al abrir la caja");
      }
    } catch {
      toast.error("Error inesperado");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="openingBalance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Saldo Inicial (GS)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  value={field.value ?? 0}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  placeholder="0"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} className="gap-2 min-w-40">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wallet className="h-4 w-4" />
            )}
            Abrir Caja
          </Button>
        </div>
      </form>
    </Form>
  );
}
