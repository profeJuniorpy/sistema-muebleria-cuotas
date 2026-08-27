import { auth } from "@/lib/auth";
import {
  getCompanyConfig,
  getCommissionSettings,
  getStorefrontCreditConfig,
  getStorefrontBanner,
} from "@/lib/actions/config";
import ConfigForm from "./config-form";

export const dynamic = "force-dynamic";


export default async function ConfiguracionPage() {
  const session = await auth();
  const userId = (session?.user as any)?.id ?? "";

  let company: Awaited<ReturnType<typeof getCompanyConfig>>;
  let commissions: Awaited<ReturnType<typeof getCommissionSettings>>;
  let storefrontCredit: Awaited<ReturnType<typeof getStorefrontCreditConfig>>;
  let storefrontBanner: Awaited<ReturnType<typeof getStorefrontBanner>>;

  try {
    [company, commissions, storefrontCredit, storefrontBanner] = await Promise.all([
      getCompanyConfig(),
      getCommissionSettings(),
      getStorefrontCreditConfig(),
      getStorefrontBanner(),
    ]);
  } catch (err: any) {
    console.error("[configuracion-page] data fetch failed:", err?.message, err?.stack);
    throw err;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración del Sistema</h1>
        <p className="text-muted-foreground">
          Datos de la empresa, configuración de documentos y parámetros comerciales.
        </p>
      </div>
      <ConfigForm
        company={company}
        commissions={commissions}
        storefrontCredit={storefrontCredit}
        storefrontBanner={storefrontBanner}
        userId={userId}
      />
    </div>
  );
}
