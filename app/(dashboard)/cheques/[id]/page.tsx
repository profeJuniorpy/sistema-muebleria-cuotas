import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Banknote, Calendar, FileText, User } from "lucide-react";

import { getChequeDetail } from "@/lib/actions/cheques";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ChequeStatusActions } from "@/components/forms/cheque-status-actions";

export const dynamic = "force-dynamic";

const STATUS_CLASS: Record<string, string> = {
  PENDIENTE: "bg-amber-100 text-amber-800",
  COBRADO: "bg-emerald-100 text-emerald-800",
  RECHAZADO: "bg-red-100 text-red-800",
  ANULADO: "bg-slate-100 text-slate-700",
};

const TYPE_LABEL: Record<string, string> = {
  EMITIDO: "Emitido (pago a un tercero)",
  RECIBIDO: "Recibido (cobro a un cliente)",
};

const fmt = (n: number) => new Intl.NumberFormat("es-PY").format(n);

export default async function ChequeDetailPage({ params }: { params: { id: string } }) {
  const cheque = await getChequeDetail(params.id);
  if (!cheque) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" render={<Link href="/cheques" />}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">Cheque N° {cheque.number}</h1>
              <Badge className={cn("text-sm", STATUS_CLASS[cheque.status])}>{cheque.status}</Badge>
            </div>
            <p className="text-muted-foreground">{TYPE_LABEL[cheque.type] ?? cheque.type}</p>
          </div>
        </div>

        <ChequeStatusActions chequeId={cheque.id} status={cheque.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5" /> Datos del Cheque
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Banco:</span>
              <span className="font-medium">{cheque.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monto:</span>
              <span className="font-bold text-lg">{fmt(cheque.amount)} GS</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha de Emisión:</span>
              <span className="font-medium">
                {new Date(cheque.issueDate).toLocaleDateString("es-PY")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha de Pago:</span>
              <span className="font-medium">
                {new Date(cheque.dueDate).toLocaleDateString("es-PY")}
              </span>
            </div>
            {cheque.clearedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cobrado el:</span>
                <span className="font-medium">
                  {new Date(cheque.clearedAt).toLocaleDateString("es-PY")}
                </span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Registrado por:</span>
              <span className="font-medium">{cheque.registeredByName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Registrado el:</span>
              <span className="font-medium">
                {new Date(cheque.createdAt).toLocaleDateString("es-PY")}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {cheque.type === "EMITIDO" ? "Beneficiario" : "Librador"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground text-xs">Nombre / Razón Social</p>
                <p className="font-medium">{cheque.partyName}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">C.I. / RUC</p>
                <p className="font-medium">{cheque.partyDocument || "—"}</p>
              </div>
              {cheque.customer && (
                <div>
                  <p className="text-muted-foreground text-xs">Cliente vinculado</p>
                  <Link href={`/clientes/${cheque.customer.id}`} className="font-medium text-primary hover:underline">
                    {cheque.customer.name}
                  </Link>
                </div>
              )}
              {cheque.supplier && (
                <div>
                  <p className="text-muted-foreground text-xs">Proveedor vinculado</p>
                  <p className="font-medium">{cheque.supplier.name}</p>
                </div>
              )}
            </div>

            {(cheque.concept || cheque.notes) && (
              <>
                <Separator />
                {cheque.concept && (
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-muted-foreground text-xs">Concepto</p>
                      <p className="font-medium">{cheque.concept}</p>
                    </div>
                  </div>
                )}
                {cheque.notes && (
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-muted-foreground text-xs">Notas</p>
                      <p className="font-medium">{cheque.notes}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
