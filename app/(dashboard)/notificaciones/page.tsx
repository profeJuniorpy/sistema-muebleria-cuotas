import { auth } from "@/lib/auth";
import { getNotificationLogs, getNotifStats, runNotifications } from "@/lib/actions/notificaciones";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Bell, CheckCircle2, XCircle, PhoneOff, Send, AlertTriangle,
} from "lucide-react";

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  ENVIADO:     { label: "Enviado",      className: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
  FALLIDO:     { label: "Fallido",      className: "bg-red-100 text-red-800",         icon: XCircle      },
  SIN_NUMERO:  { label: "Sin contacto", className: "bg-zinc-100 text-zinc-600",       icon: PhoneOff     },
  PENDIENTE:   { label: "Pendiente",    className: "bg-amber-100 text-amber-800",     icon: Bell         },
};

// ─── Manual trigger form ──────────────────────────────────────────────────────

async function TriggerButton() {
  async function trigger() {
    "use server";
    await runNotifications();
  }
  return (
    <form action={trigger}>
      <Button type="submit" className="gap-2">
        <Send className="h-4 w-4" /> Enviar notificaciones ahora
      </Button>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function NotificacionesPage() {
  const [logs, stats] = await Promise.all([
    getNotificationLogs(200),
    getNotifStats(),
  ]);

  const dryRun = process.env.CALLMEBOT_ENABLED === "false";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notificaciones WhatsApp</h1>
          <p className="text-muted-foreground">
            Recordatorios automáticos de vencimiento y mora enviados a los clientes.
          </p>
        </div>
        <TriggerButton />
      </div>

      {/* Dry-run warning */}
      {dryRun && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>
            <strong>Modo simulación activo</strong> — los mensajes NO se envían realmente.
            Para activar el envío, establecé <code className="font-mono bg-amber-100 px-1 rounded">CALLMEBOT_ENABLED=true</code> en el archivo <code className="font-mono bg-amber-100 px-1 rounded">.env</code>.
          </span>
        </div>
      )}

      {/* KPIs de hoy */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Enviados hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-700">{stats.todaySent}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <XCircle className="h-3.5 w-3.5 text-red-500" /> Fallidos hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{stats.todayFailed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <PhoneOff className="h-3.5 w-3.5 text-zinc-400" /> Sin contacto hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-zinc-500">{stats.todayNoContact}</p>
            <p className="text-xs text-muted-foreground mt-1">sin celular o clave CallMeBot</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Bell className="h-3.5 w-3.5" /> Total histórico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalLogs}</p>
          </CardContent>
        </Card>
      </div>

      {/* Logs table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" /> Historial de notificaciones
          </CardTitle>
          <CardDescription>
            Últimos {logs.length} registros. Los mensajes se envían automáticamente a las 08:00 todos los días.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha / Hora</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Aún no se han enviado notificaciones.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const cfg = STATUS_CONFIG[log.status] ?? STATUS_CONFIG.PENDIENTE;
                  const Icon = cfg.icon;
                  const tipo = log.installmentId ? "Vence hoy" : "Mora";
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString("es-PY")}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-sm">{log.customerName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{log.customerCode}</p>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{log.phone}</TableCell>
                      <TableCell>
                        <Badge className={cn("gap-1 text-xs", cfg.className)}>
                          <Icon className="h-3 w-3" />
                          {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-red-600 max-w-xs truncate">
                        {log.errorMessage ?? "—"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Setup instructions */}
      <Card className="border-blue-100 bg-blue-50/30">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-blue-800">
            ¿Cómo configurar CallMeBot para un cliente?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-900 space-y-2">
          <ol className="list-decimal list-inside space-y-1">
            <li>El cliente debe agregar el número <strong>+34 644 59 73 07</strong> a sus contactos de WhatsApp.</li>
            <li>Enviar el mensaje: <code className="bg-blue-100 px-1 rounded font-mono">I allow callmebot to send me messages</code></li>
            <li>CallMeBot responderá con su <strong>API Key personal</strong>.</li>
            <li>Cargar esa clave en la ficha del cliente (sección "Notificaciones WhatsApp").</li>
          </ol>
          <p className="text-xs text-blue-600 mt-2">
            Sin esta clave, el cliente no recibirá notificaciones automáticas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
