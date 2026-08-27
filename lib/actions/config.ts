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
    config = await prisma.companyConfig.findFirst({ orderBy: { updatedAt: "desc" } });
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
    const existing = await prisma.companyConfig.findFirst({ orderBy: { updatedAt: "desc" } });

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

// ─── Storefront credit (cuotas) settings ──────────────────────────────────────

const storefrontCreditSchema = z.object({
  interestRate: z.coerce.number().min(0).max(100),
  interestMode: z.enum(["FRANCES", "SIMPLE", "SALDO_DECRECIENTE"]),
  installmentOptions: z
    .string()
    .min(1, "Ingresá al menos una cantidad de cuotas")
    .regex(/^\d+(\s*,\s*\d+)*$/, "Usá números separados por coma, ej: 3,6,12,18,24"),
});

export type StorefrontCreditConfigData = z.infer<typeof storefrontCreditSchema>;

const DEFAULT_STOREFRONT_CREDIT: StorefrontCreditConfigData = {
  interestRate: 5,
  interestMode: "FRANCES",
  installmentOptions: "3,6,12,18,24",
};

export async function getStorefrontCreditConfig(): Promise<StorefrontCreditConfigData> {
  try {
    const s = await prisma.storefrontCreditConfig.findFirst();
    if (!s) return DEFAULT_STOREFRONT_CREDIT;
    return {
      interestRate: Number(s.interestRate),
      interestMode: s.interestMode,
      installmentOptions: s.installmentOptions,
    };
  } catch (err) {
    console.error("[getStorefrontCreditConfig] DB query failed:", err);
    return DEFAULT_STOREFRONT_CREDIT;
  }
}

export async function saveStorefrontCreditConfig(data: StorefrontCreditConfigData) {
  try {
    const parsed = storefrontCreditSchema.parse(data);
    const existing = await prisma.storefrontCreditConfig.findFirst();
    if (existing) {
      await prisma.storefrontCreditConfig.update({ where: { id: existing.id }, data: parsed });
    } else {
      await prisma.storefrontCreditConfig.create({ data: parsed });
    }
    revalidatePath("/configuracion");
    revalidatePath("/tienda");
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error?.issues?.[0]?.message ?? "Error al guardar la configuración de cuotas",
    };
  }
}

// ─── Storefront banner (hero / ofertas) ───────────────────────────────────────

const storefrontBannerSchema = z.object({
  enabled: z.boolean(),
  imageUrl: z.string().optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  ctaText: z.string().optional(),
  ctaLink: z.string().optional(),
});

export type StorefrontBannerData = z.infer<typeof storefrontBannerSchema>;

const EMPTY_BANNER: StorefrontBannerData = {
  enabled: false,
  imageUrl: "",
  title: "",
  subtitle: "",
  ctaText: "",
  ctaLink: "",
};

export async function getStorefrontBanner(): Promise<StorefrontBannerData> {
  try {
    const b = await prisma.storefrontBanner.findFirst();
    if (!b) return EMPTY_BANNER;
    return {
      enabled: b.enabled,
      imageUrl: b.imageUrl ?? "",
      title: b.title ?? "",
      subtitle: b.subtitle ?? "",
      ctaText: b.ctaText ?? "",
      ctaLink: b.ctaLink ?? "",
    };
  } catch (err) {
    console.error("[getStorefrontBanner] DB query failed:", err);
    return EMPTY_BANNER;
  }
}

export async function saveStorefrontBanner(data: StorefrontBannerData) {
  try {
    const parsed = storefrontBannerSchema.parse(data);
    const payload = {
      enabled: parsed.enabled,
      imageUrl: parsed.imageUrl || null,
      title: parsed.title || null,
      subtitle: parsed.subtitle || null,
      ctaText: parsed.ctaText || null,
      ctaLink: parsed.ctaLink || null,
    };
    const existing = await prisma.storefrontBanner.findFirst();
    if (existing) {
      await prisma.storefrontBanner.update({ where: { id: existing.id }, data: payload });
    } else {
      await prisma.storefrontBanner.create({ data: payload });
    }
    revalidatePath("/configuracion");
    revalidatePath("/tienda");
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error?.issues?.[0]?.message ?? "Error al guardar el banner de la tienda",
    };
  }
}
