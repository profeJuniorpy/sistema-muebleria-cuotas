import { auth } from "@/lib/auth";
import { getCompanyConfig, getCommissionSettings } from "@/lib/actions/config";
import ConfigForm from "./config-form";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const session = await auth();
  const userId = (session?.user as any)?.id ?? "";

  const [company, commissions] = await Promise.all([
    getCompanyConfig(),
    getCommissionSettings(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración del Sistema</h1>
        <p className="text-muted-foreground">
          Datos de la empresa, configuración de documentos y parámetros comerciales.
        </p>
      </div>
      <ConfigForm company={company} commissions={commissions} userId={userId} />
    </div>
  );
}
