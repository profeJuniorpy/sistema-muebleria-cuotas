"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Save, Send, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateCustomerCallmebotKey } from "@/lib/actions/customers";
import { cn } from "@/lib/utils";

interface Props {
  customerId: string;
  initialKey: string | null;
  mobile: string | null;
}

export function CallmebotConfig({ customerId, initialKey, mobile }: Props) {
  const [key, setKey] = useState(initialKey ?? "");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const router = useRouter();

  const hasKey = key.trim().length > 0;

  async function handleSave() {
    setSaving(true);
    try {
      const result = await updateCustomerCallmebotKey(customerId, key.trim() || null);
      if (result.success) {
        toast.success("Clave CallMeBot guardada");
        router.refresh();
      } else {
        toast.error(result.error ?? "Error al guardar");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    if (!mobile || !key.trim()) return;
    setTesting(true);
    try {
      const clean = mobile.replace(/\D/g, "");
      const message = encodeURIComponent("✅ Prueba de notificación desde el ERP Mueblería. ¡Configuración correcta!");
      const res = await fetch(
        `https://api.callmebot.com/whatsapp.php?phone=${clean}&text=${message}&apikey=${key.trim()}`,
        { method: "GET" }
      );
      const body = await res.text();
      if (body.toLowerCase().includes("error")) {
        toast.error(`Error: ${body.slice(0, 100)}`);
      } else {
        toast.success("Mensaje de prueba enviado correctamente");
      }
    } catch {
      toast.error("Error de conexión al enviar la prueba");
    } finally {
      setTesting(false);
    }
  }

  return (
    <Card className={cn("border-blue-100", hasKey ? "bg-emerald-50/30 border-emerald-200" : "bg-blue-50/30")}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <MessageCircle className="h-4 w-4 text-[#25D366]" />
          Notificaciones WhatsApp (CallMeBot)
          {hasKey && <CheckCircle className="h-4 w-4 text-emerald-500 ml-auto" />}
          {!hasKey && <XCircle className="h-4 w-4 text-zinc-400 ml-auto" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasKey && (
          <div className="rounded-lg bg-blue-100/60 p-3 text-xs text-blue-800 space-y-1">
            <p className="font-semibold">¿Cómo obtener la clave?</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>El cliente agrega <strong>+34 644 59 73 07</strong> a sus contactos.</li>
              <li>Envía el mensaje: <code className="bg-blue-200 px-1 rounded font-mono">I allow callmebot to send me messages</code></li>
              <li>CallMeBot le responde con su API Key personal.</li>
              <li>Cargar esa clave aquí.</li>
            </ol>
          </div>
        )}

        <div className="flex gap-2">
          <Input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="123456 (API Key de CallMeBot)"
            className="font-mono text-sm"
          />
          <Button onClick={handleSave} disabled={saving} variant="outline" size="sm" className="gap-1 shrink-0">
            <Save className="h-3.5 w-3.5" /> Guardar
          </Button>
        </div>

        {hasKey && mobile && (
          <Button
            onClick={handleTest}
            disabled={testing}
            variant="outline"
            size="sm"
            className="gap-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white w-full"
          >
            <Send className="h-3.5 w-3.5" />
            {testing ? "Enviando..." : "Enviar mensaje de prueba"}
          </Button>
        )}

        {!mobile && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            Este cliente no tiene número de celular registrado. Agregalo en la edición del cliente para poder recibir notificaciones.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
