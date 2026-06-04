"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { z } from "zod";

// ─── Schema ───────────────────────────────────────────────────────────────────

const companySchema = z.object({
  // Datos básicos
  name: z.string().min(1, "Nombre requerido"),
  ruc: z.string().min(1, "RUC requerido"),
  // Contacto
  phone: z.string().optional(),
  mobile: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  website: z.string().optional(),
  // Ubicación
  address: z.string().optional(),
  city: z.string().optional(),
  department: z.string().optional(),
  // Representación legal
  legalRepresentative: z.string().optional(),
  legalRepresentativeCI: z.string().optional(),
  // Datos bancarios
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  bankAccountType: z.string().optional(),
  // Datos fiscales
  timbrado: z.string().optional(),
  establishmentNumber: z.string().optional(),
  dispatchPoint: z.string().optional(),
  // Documentos
  logoUrl: z.string().optional(),
  footerText: z.string().optional(),
});

export type CompanyConfigData = z.infer<typeof companySchema>;

// ─── Get ──────────────────────────────────────────────────────────────────────

const EMPTY_CONFIG = {
  name: "", ruc: "", phone: "", mobile: "", email: "", website: "",
  address: "", city: "", department: "", legalRepresentative: "",
  legalRepresentativeCI: "", bankName: "", bankAccount: "",
  bankAccountType: "", timbrado: "", establishmentNumber: "",
  dispatchPoint: "", logoUrl: "", footerText: "",
};

export async function getCompanyConfig(): Promise<CompanyConfigData & { id?: string }> {
  let config: any = null;
  try {
    config = await prisma.companyConfig.findFirst();
  } catch (err) {
    console.error("[getCompanyConfig] DB query failed:", err);
    return EMPTY_CONFIG;
  }

  if (!config) return EMPTY_CONFIG;

  const c = config as any; // temporario hasta npx prisma generate
  return {
    id: c.id,
    name: c.name,
    ruc: c.ruc,
    phone: c.phone ?? "",
    mobile: c.mobile ?? "",
    email: c.email ?? "",
    website: c.website ?? "",
    address: c.address ?? "",
    city: c.city ?? "",
    department: c.department ?? "",
    legalRepresentative: c.legalRepresentative ?? "",
    legalRepresentativeCI: c.legalRepresentativeCI ?? "",
    bankName: c.bankName ?? "",
    bankAccount: c.bankAccount ?? "",
    bankAccountType: c.bankAccountType ?? "",
    timbrado: c.timbrado ?? "",
    establishmentNumber: c.establishmentNumber ?? "",
    dispatchPoint: c.dispatchPoint ?? "",
    logoUrl: c.logoUrl ?? "",
    footerText: c.footerText ?? "",
  };
}

// ─── Save (upsert) ────────────────────────────────────────────────────────────

export async function saveCompanyConfig(data: CompanyConfigData) {
  try {
    const existing = await prisma.companyConfig.findFirst();

    const payload = {
      name: data.name,
      ruc: data.ruc,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      // Nuevos campos
      mobile: data.mobile || null,
      website: data.website || null,
      city: data.city || null,
      department: data.department || null,
      legalRepresentative: data.legalRepresentative || null,
      legalRepresentativeCI: data.legalRepresentativeCI || null,
      bankName: data.bankName || null,
      bankAccount: data.bankAccount || null,
      bankAccountType: data.bankAccountType || null,
      timbrado: data.timbrado || null,
      establishmentNumber: data.establishmentNumber || null,
      dispatchPoint: data.dispatchPoint || null,
      logoUrl: data.logoUrl || null,
      footerText: data.footerText || null,
    } as any;

    if (existing) {
      await prisma.companyConfig.update({ where: { id: existing.id }, data: payload });
    } else {
      await prisma.companyConfig.create({ data: payload });
    }

    revalidatePath("/configuracion");
    revalidatePath("/rpt"); // actualiza todos los recibos e informes
    return { success: true };
  } catch (error: any) {
    console.error("Error en saveCompanyConfig:", error);
    return { success: false, error: "Error al guardar la configuración" };
  }
}

// ─── Commission settings ──────────────────────────────────────────────────────

const commissionSchema = z.object({
  cashSaleRate: z.coerce.number().min(0).max(100),
  creditSaleRate: z.coerce.number().min(0).max(100),
  trigger: z.enum(["AL_VENDER", "AL_COBRAR_CUOTA", "AL_COMPLETAR"]),
});

export type CommissionSettingsData = z.infer<typeof commissionSchema>;

export async function getCommissionSettings(): Promise<CommissionSettingsData> {
  try {
    const s = await prisma.commissionSettings.findFirst();
    return {
      cashSaleRate: Number(s?.cashSaleRate ?? 0),
      creditSaleRate: Number(s?.creditSaleRate ?? 0),
      trigger: (s?.trigger as any) ?? "AL_VENDER",
    };
  } catch (err) {
    console.error("[getCommissionSettings] DB query failed:", err);
    return { cashSaleRate: 0, creditSaleRate: 0, trigger: "AL_VENDER" };
  }
}

export async function saveCommissionSettings(
  data: CommissionSettingsData,
  userId: string
) {
  try {
    const existing = await prisma.commissionSettings.findFirst();
    if (existing) {
      await prisma.commissionSettings.update({
        where: { id: existing.id },
        data: { ...data, updatedBy: userId },
      });
    } else {
      await prisma.commissionSettings.create({
        data: { ...data, updatedBy: userId },
      });
    }
    revalidatePath("/configuracion");
    revalidatePath("/comisiones");
    return { success: true };
  } catch {
    return { success: false, error: "Error al guardar configuración de comisiones" };
  }
}
