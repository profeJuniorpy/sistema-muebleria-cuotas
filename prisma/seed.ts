/**
 * Seed de datos de prueba basado en el mercado real de mueblerías en Paraguay.
 * Referencias: Casa Bonita, Mueblería Orion, Decorar, Lar, Confort del Hogar.
 * Precios en Guaraníes (PYG) alineados al mercado local 2024-2025.
 */

import {
  PrismaClient,
  Role,
  Category,
  Unit,
  ProductStatus,
  CustomerType,
  RiskLevel,
  SaleType,
  SaleChannel,
  SaleStatus,
  InterestMode,
  Frequency,
  InstallmentStatus,
  PaymentMethod,
  MovementType,
  CommissionTrigger,
  PurchaseType,
  PurchaseStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { addMonths, addDays, subMonths, subDays } from "date-fns";

const prisma = new PrismaClient();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ruc(base: string) {
  return base; // RUC simplificado para pruebas
}

function gs(amount: number) {
  return amount; // Guaraníes
}

async function main() {
  console.log("🌱 Iniciando seed de datos de prueba para mueblería paraguaya...\n");

  // ── Limpiar datos previos (excepto tablas de auth) ──────────────────────────
  await prisma.notificationLog.deleteMany();
  await prisma.cashCount.deleteMany();
  await prisma.cashWithdrawal.deleteMany();
  await prisma.cashRegister.deleteMany();
  await prisma.commission.deleteMany();
  await prisma.commissionSettings.deleteMany();
  await prisma.commissionOverride.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.amortizationSchedule.deleteMany();
  await prisma.creditPlan.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.supplierAmortizationSchedule.deleteMany();
  await prisma.supplierCreditPlan.deleteMany();
  await prisma.supplierPayment.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.product.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.companyConfig.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log("✓ Tablas limpiadas");

  // ══════════════════════════════════════════════════════════════════
  // 1. CONFIGURACIÓN DE LA EMPRESA
  // ══════════════════════════════════════════════════════════════════

  await prisma.companyConfig.create({
    data: {
      name: "Mueblería San Roque S.R.L.",
      ruc: ruc("80089234-5"),
      phone: "021 507 890",
      mobile: "0981 234 567",
      email: "ventas@muebleriasanroque.com.py",
      website: "www.muebleriasanroque.com.py",
      address: "Av. Eusebio Ayala 2150 c/ Médici",
      city: "Asunción",
      department: "Central",
      legalRepresentative: "Roberto Benítez Gavilán",
      legalRepresentativeCI: "2.345.678",
      bankName: "Banco Continental",
      bankAccount: "100-1234567-8",
      bankAccountType: "CORRIENTE",
      timbrado: "12345678",
      establishmentNumber: "001",
      dispatchPoint: "001",
      footerText: "Gracias por su preferencia. Válido como comprobante de venta. No se aceptan devoluciones pasados los 7 días.",
    },
  });

  console.log("✓ Configuración de empresa creada");

  // ══════════════════════════════════════════════════════════════════
  // 2. USUARIOS
  // ══════════════════════════════════════════════════════════════════

  const pw = await bcrypt.hash("admin123", 10);
  const pwV = await bcrypt.hash("vendedor123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@erp.com",
      name: "Roberto Benítez",
      password: pw,
      role: Role.ADMIN,
      phone: "0981 234 567",
      commissionRate: 0,
      isActive: true,
    },
  });

  const vendedor1 = await prisma.user.create({
    data: {
      email: "carlos.paredes@erp.com",
      name: "Carlos Paredes",
      password: pwV,
      role: Role.VENDEDOR,
      phone: "0971 456 789",
      commissionRate: 3,
      isActive: true,
    },
  });

  const vendedor2 = await prisma.user.create({
    data: {
      email: "ana.gonzalez@erp.com",
      name: "Ana González",
      password: pwV,
      role: Role.VENDEDOR,
      phone: "0982 345 678",
      commissionRate: 3,
      isActive: true,
    },
  });

  const cajero = await prisma.user.create({
    data: {
      email: "laura.romero@erp.com",
      name: "Laura Romero",
      password: pwV,
      role: Role.CAJERO,
      phone: "0991 567 890",
      commissionRate: 0,
      isActive: true,
    },
  });

  const supervisor = await prisma.user.create({
    data: {
      email: "diego.martinez@erp.com",
      name: "Diego Martínez",
      password: pwV,
      role: Role.SUPERVISOR,
      phone: "0985 678 901",
      commissionRate: 1,
      isActive: true,
    },
  });

  const almacen = await prisma.user.create({
    data: {
      email: "jorge.flores@erp.com",
      name: "Jorge Flores",
      password: pwV,
      role: Role.ALMACEN,
      phone: "0972 789 012",
      commissionRate: 0,
      isActive: true,
    },
  });

  console.log("✓ 6 usuarios creados (admin@erp.com / admin123)");

  // ══════════════════════════════════════════════════════════════════
  // 3. CONFIGURACIÓN DE COMISIONES
  // ══════════════════════════════════════════════════════════════════

  await prisma.commissionSettings.create({
    data: {
      cashSaleRate: 2,
      creditSaleRate: 3,
      trigger: CommissionTrigger.AL_VENDER,
      updatedBy: admin.id,
    },
  });

  // ══════════════════════════════════════════════════════════════════
  // 4. PROVEEDORES
  // ══════════════════════════════════════════════════════════════════

  const supMuebles = await prisma.supplier.create({
    data: {
      code: "PROV-001",
      name: "Fábrica Forli Muebles S.A.",
      ruc: ruc("80034521-6"),
      contactName: "Ramón Forli",
      phone: "021 663 442",
      email: "ventas@forlimuebles.com.py",
      categories: "MUEBLES",
      paymentTerms: "30 días",
      notes: "Principal proveedor de juegos de sala y dormitorios. Entrega en 15 días hábiles.",
    },
  });

  const supElectro = await prisma.supplier.create({
    data: {
      code: "PROV-002",
      name: "Distribuidora Electro Sur S.R.L.",
      ruc: ruc("80067890-1"),
      contactName: "Héctor Villalba",
      phone: "021 444 123",
      email: "hector@electrosur.com.py",
      categories: "ELECTRODOMESTICOS,ELECTRONICOS",
      paymentTerms: "Contado o 15 días",
      notes: "Distribuidor oficial Samsung y LG para la región Central. Garantía 12 meses.",
    },
  });

  const supColchon = await prisma.supplier.create({
    data: {
      code: "PROV-003",
      name: "Industrias Dreamlife Paraguay",
      ruc: ruc("80091234-3"),
      contactName: "Silvia Acosta",
      phone: "0981 334 556",
      email: "silvia@dreamlifepy.com",
      categories: "COLCHONES",
      paymentTerms: "Contado",
      notes: "Marca propia. Colchones resorte y espuma de alta densidad.",
    },
  });

  const supImport = await prisma.supplier.create({
    data: {
      code: "PROV-004",
      name: "Importadora Del Plata S.A.",
      ruc: ruc("80023456-7"),
      contactName: "Miguel Cardozo",
      phone: "021 500 789",
      email: "compras@delplata.com.py",
      categories: "ELECTRODOMESTICOS,ELECTRONICOS,OTROS",
      paymentTerms: "15-30 días según monto",
      notes: "Importadora de Ciudad del Este. Precios competitivos en electrodomésticos.",
    },
  });

  const supKitchen = await prisma.supplier.create({
    data: {
      code: "PROV-005",
      name: "Cocinas Integrales CYD S.R.L.",
      ruc: ruc("80056789-2"),
      contactName: "Claudio Ymbá",
      phone: "0982 445 667",
      email: "claudio@cyd.com.py",
      categories: "MUEBLES",
      paymentTerms: "50% adelanto, 50% entrega",
      notes: "Especialistas en cocinas y comedores a medida.",
    },
  });

  console.log("✓ 5 proveedores creados");

  // ══════════════════════════════════════════════════════════════════
  // 5. PRODUCTOS (35 artículos del catálogo)
  // ══════════════════════════════════════════════════════════════════

  const products = await prisma.product.createManyAndReturn({
    data: [
      // ── MUEBLES ────────────────────────────────────────────────────
      {
        code: "MUE-001",
        name: "Juego de Sala Cancún 3-2-1 Cuerpos",
        description: "Tapizado en tela jacquard, estructura de madera maciza, cojines desmontables.",
        category: Category.MUEBLES,
        subcategory: "Sala",
        brand: "Forli",
        model: "Cancún 321",
        unit: Unit.JUEGO,
        costPrice: gs(3_800_000),
        cashPrice: gs(5_500_000),
        creditPrice: gs(6_800_000),
        stock: 8,
        minStock: 3,
        supplierId: supMuebles.id,
        status: ProductStatus.ACTIVO,
      },
      {
        code: "MUE-002",
        name: "Juego de Sala Tokyo 2-2 Cuerpos",
        description: "Diseño moderno, tapizado en microfibra suave, pie de madera wengué.",
        category: Category.MUEBLES,
        subcategory: "Sala",
        brand: "Forli",
        model: "Tokyo 22",
        unit: Unit.JUEGO,
        costPrice: gs(2_900_000),
        cashPrice: gs(4_200_000),
        creditPrice: gs(5_100_000),
        stock: 5,
        minStock: 2,
        supplierId: supMuebles.id,
        status: ProductStatus.ACTIVO,
      },
      {
        code: "MUE-003",
        name: "Dormitorio Completo Milán Queen Size",
        description: "Incluye cama 1.40m, 2 mesas de luz, cómoda con espejo y ropero 4 puertas.",
        category: Category.MUEBLES,
        subcategory: "Dormitorio",
        brand: "Forli",
        model: "Milán Queen",
        unit: Unit.JUEGO,
        costPrice: gs(7_500_000),
        cashPrice: gs(11_200_000),
        creditPrice: gs(13_500_000),
        stock: 4,
        minStock: 2,
        supplierId: supMuebles.id,
        status: ProductStatus.ACTIVO,
      },
      {
        code: "MUE-004",
        name: "Ropero 6 Puertas Cedro Espejado",
        description: "Madera maciza de cedro, 6 puertas con espejos, interior con cajones y barras.",
        category: Category.MUEBLES,
        subcategory: "Dormitorio",
        brand: "Forli",
        model: "Cedro 6P",
        unit: Unit.UNIDAD,
        costPrice: gs(2_200_000),
        cashPrice: gs(3_300_000),
        creditPrice: gs(3_950_000),
        stock: 6,
        minStock: 2,
        supplierId: supMuebles.id,
        status: ProductStatus.ACTIVO,
      },
      {
        code: "MUE-005",
        name: "Comedor Moderno 6 Personas Vidrio Templado",
        description: "Mesa de vidrio templado 8mm con base metálica. 6 sillas tapizadas en cuero ecológico.",
        category: Category.MUEBLES,
        subcategory: "Comedor",
        brand: "CYD",
        model: "Glass 6P",
        unit: Unit.JUEGO,
        costPrice: gs(3_100_000),
        cashPrice: gs(4_600_000),
        creditPrice: gs(5_500_000),
        stock: 3,
        minStock: 1,
        supplierId: supKitchen.id,
        status: ProductStatus.ACTIVO,
      },
      {
        code: "MUE-006",
        name: "Mueble TV Rack Flotante 1.80m",
        description: "MDF laqueado blanco, diseño escandinavo, capacidad para TV hasta 75 pulgadas.",
        category: Category.MUEBLES,
        subcategory: "Living",
        brand: "Forli",
        model: "Rack Float 180",
        unit: Unit.UNIDAD,
        costPrice: gs(850_000),
        cashPrice: gs(1_350_000),
        creditPrice: gs(1_620_000),
        stock: 12,
        minStock: 4,
        supplierId: supMuebles.id,
        status: ProductStatus.ACTIVO,
      },
      {
        code: "MUE-007",
        name: "Cama Matrimonial 1.40m con Cajones",
        description: "Estructura de madera, cajones debajo para almacenamiento, cabecera tapizada.",
        category: Category.MUEBLES,
        subcategory: "Dormitorio",
        brand: "Forli",
        model: "Base 140 CJ",
        unit: Unit.UNIDAD,
        costPrice: gs(1_600_000),
        cashPrice: gs(2_400_000),
        creditPrice: gs(2_900_000),
        stock: 9,
        minStock: 3,
        supplierId: supMuebles.id,
        status: ProductStatus.ACTIVO,
      },
      {
        code: "MUE-008",
        name: "Camarote Juvenil 2 Camas + Escritorio",
        description: "Madera pino, incluye escalera, baranda de seguridad y escritorio lateral.",
        category: Category.MUEBLES,
        subcategory: "Juvenil",
        brand: "Forli",
        model: "Junior Duo",
        unit: Unit.JUEGO,
        costPrice: gs(2_400_000),
        cashPrice: gs(3_600_000),
        creditPrice: gs(4_350_000),
        stock: 5,
        minStock: 2,
        supplierId: supMuebles.id,
        status: ProductStatus.ACTIVO,
      },
      {
        code: "MUE-009",
        name: "Sillón Reclinable Relax Individual",
        description: "Tapizado en cuero ecológico café, reclinable manual 150°, reposabrazos acolchados.",
        category: Category.MUEBLES,
        subcategory: "Sala",
        brand: "Forli",
        model: "Relax 1000",
        unit: Unit.UNIDAD,
        costPrice: gs(1_100_000),
        cashPrice: gs(1_650_000),
        creditPrice: gs(2_000_000),
        stock: 7,
        minStock: 3,
        supplierId: supMuebles.id,
        status: ProductStatus.ACTIVO,
      },
      {
        code: "MUE-010",
        name: "Cocina Integral 2.40m MDF Blanco",
        description: "Módulos altos y bajos, mármol sintético en mesada, incluye instalación.",
        category: Category.MUEBLES,
        subcategory: "Cocina",
        brand: "CYD",
        model: "Kitchen 240",
        unit: Unit.JUEGO,
        costPrice: gs(4_500_000),
        cashPrice: gs(6_800_000),
        creditPrice: gs(8_200_000),
        stock: 2,
        minStock: 1,
        supplierId: supKitchen.id,
        status: ProductStatus.ACTIVO,
      },

      // ── ELECTRODOMÉSTICOS ──────────────────────────────────────────
      {
        code: "ELE-001",
        name: "Heladera LG 430L No Frost Inverter",
        description: "No Frost total, inverter linear compressor, 5 años de garantía, color plateado.",
        category: Category.ELECTRODOMESTICOS,
        subcategory: "Heladeras",
        brand: "LG",
        model: "GN-B432PVGB",
        unit: Unit.UNIDAD,
        costPrice: gs(2_600_000),
        cashPrice: gs(3_850_000),
        creditPrice: gs(4_600_000),
        stock: 10,
        minStock: 4,
        supplierId: supElectro.id,
        status: ProductStatus.ACTIVO,
      },
      {
        code: "ELE-002",
        name: "Heladera Samsung French Door 500L",
        description: "Family Hub, dispensador de agua y hielo, Twin Cooling, color negro mate.",
        category: Category.ELECTRODOMESTICOS,
        subcategory: "Heladeras",
        brand: "Samsung",
        model: "RF50A5202B1",
        unit: Unit.UNIDAD,
        costPrice: gs(5_200_000),
        cashPrice: gs(7_500_000),
        creditPrice: gs(9_000_000),
        stock: 4,
        minStock: 2,
        supplierId: supElectro.id,
        status: ProductStatus.ACTIVO,
      },
      {
        code: "ELE-003",
        name: "Lavarropas LG 9Kg Carga Frontal Inverter",
        description: "Motor inverter direct drive, programas AI DD, Steam+, eficiencia energética A+++.",
        category: Category.ELECTRODOMESTICOS,
        subcategory: "Lavarropas",
        brand: "LG",
        model: "F4WV509S0E",
        unit: Unit.UNIDAD,
        costPrice: gs(2_100_000),
        cashPrice: gs(3_100_000),
        creditPrice: gs(3_750_000),
        stock: 7,
        minStock: 3,
        supplierId: supElectro.id,
        status: ProductStatus.ACTIVO,
      },
      {
        code: "ELE-004",
        name: "Lavarropas Samsung 7Kg Carga Superior",
        description: "Digital inverter, 8 programas, agua caliente, color blanco.",
        category: Category.ELECTRODOMESTICOS,
        subcategory: "Lavarropas",
        brand: "Samsung",
        model: "WA70T4560B",
        unit: Unit.UNIDAD,
        costPrice: gs(1_450_000),
        cashPrice: gs(2_150_000),
        creditPrice: gs(2_600_000),
        stock: 9,
        minStock: 4,
        supplierId: supImport.id,
        status: ProductStatus.ACTIVO,
      },
      {
        code: "ELE-005",
        name: "Microondas LG 30L Grill Inverter",
        description: "Grill + microondas, EasyClean interior, 1200W, acero inoxidable.",
        category: Category.ELECTRODOMESTICOS,
        subcategory: "Microondas",
        brand: "LG",
        model: "MH8265BIS",
        unit: Unit.UNIDAD,
        costPrice: gs(620_000),
        cashPrice: gs(950_000),
        creditPrice: gs(1_150_000),
        stock: 15,
        minStock: 5,
        supplierId: supElectro.id,
        status: ProductStatus.ACTIVO,
      },
      {
        code: "ELE-006",
        name: "Cocina a Gas 6 Hornallas Mabe",
        description: "6 hornallas, horno grande con grill, encendido eléctrico, templado, acero inoxidable.",
        category: Category.ELECTRODOMESTICOS,
        subcategory: "Cocinas",
        brand: "Mabe",
        model: "EML756CX0",
        unit: Unit.UNIDAD,
        costPrice: gs(1_800_000),
        cashPrice: gs(2_700_000),
        creditPrice: gs(3_250_000),
        stock: 6,
        minStock: 2,
        supplierId: supImport.id,
        status: ProductStatus.ACTIVO,
      },
      {
        code: "ELE-007",
        name: "Aire Acondicionado Samsung 12000 BTU Inverter",
        description: "Frío/calor inverter, WiFi SmartThings, filtro tri-care, bajo consumo.",
        category: Category.ELECTRODOMESTICOS,
        subcategory: "Aires",
        brand: "Samsung",
        model: "AR12TSHZAWKXPE",
        unit: Unit.UNIDAD,
        costPrice: gs(2_300_000),
        cashPrice: gs(3_450_000),
        creditPrice: gs(4_150_000),
        stock: 5,
        minStock: 2,
        supplierId: supElectro.id,
        status: ProductStatus.ACTIVO,
      },
      {
        code: "ELE-008",
        name: "Heladera Bajo Mesada 120L",
        description: "Ideal para dormitorio u oficina, 2 estantes, cajón verdulero.",
        category: Category.ELECTRODOMESTICOS,
        subcategory: "Heladeras",
        brand: "LG",
        model: "GN-131SLB",
        unit: Unit.UNIDAD,
        costPrice: gs(780_000),
        cashPrice: gs(1_180_000),
        creditPrice: gs(1_420_000),
        stock: 8,
        minStock: 3,
        supplierId: supImport.id,
        status: ProductStatus.ACTIVO,
      },

      // ── ELECTRÓNICOS ───────────────────────────────────────────────
      {
        code: "ELC-001",
        name: "Smart TV Samsung 55\" 4K QLED",
        description: "Quantum dot, HDR 1500, Tizen OS, AirPlay 2, Dolby Atmos, 4x HDMI.",
        category: Category.ELECTRONICOS,
        subcategory: "Televisores",
        brand: "Samsung",
        model: "QN55Q70CAGXPE",
        unit: Unit.UNIDAD,
        costPrice: gs(3_400_000),
        cashPrice: gs(4_950_000),
        creditPrice: gs(5_950_000),
        stock: 8,
        minStock: 3,
        supplierId: supElectro.id,
        status: ProductStatus.ACTIVO,
      },
      {
        code: "ELC-002",
        name: "Smart TV LG 65\" 4K NanoCell",
        description: "NanoCell 80, α7 Gen6 AI, Google TV, Dolby Vision IQ, WiFi 5.",
        category: Category.ELECTRONICOS,
        subcategory: "Televisores",
        brand: "LG",
        model: "65NANO80SQA",
        unit: Unit.UNIDAD,
        costPrice: gs(5_100_000),
        cashPrice: gs(7_400_000),
        creditPrice: gs(8_900_000),
        stock: 5,
        minStock: 2,
        supplierId: supElectro.id,
        status: ProductStatus.ACTIVO,
      },
      {
        code: "ELC-003",
        name: "Smart TV TCL 43\" 4K Android TV",
        description: "HDR10+, Dolby Audio, Google Assistant, Chromecast integrado.",
        category: Category.ELECTRONICOS,
        subcategory: "Televisores",
        brand: "TCL",
        model: "43P745",
        unit: Unit.UNIDAD,
        costPrice: gs(1_450_000),
        cashPrice: gs(2_150_000),
        creditPrice: gs(2_600_000),
        stock: 15,
        minStock: 5,
        supplierId: supImport.id,
        status: ProductStatus.ACTIVO,
      },
      {
        code: "ELC-004",
        name: "Notebook Lenovo IdeaPad 3 Intel i5 8GB",
        description: "Procesador Core i5 12va gen, 8GB RAM, SSD 512GB, pantalla 15.6\" FHD.",
        category: Category.ELECTRONICOS,
        subcategory: "Notebooks",
        brand: "Lenovo",
        model: "IdeaPad 3 Gen7",
        unit: Unit.UNIDAD,
        costPrice: gs(3_200_000),
        cashPrice: gs(4_700_000),
        creditPrice: gs(5_650_000),
        stock: 6,
        minStock: 2,
        supplierId: supImport.id,
        status: ProductStatus.ACTIVO,
      },
      {
        code: "ELC-005",
        name: "Sistema de Audio Bluetooth 2.1 LG",
        description: "400W RMS, Bluetooth 5.0, subwoofer inalámbrico, Optical/HDMI ARC.",
        category: Category.ELECTRONICOS,
        subcategory: "Audio",
        brand: "LG",
        model: "SN5Y",
        unit: Unit.UNIDAD,
        costPrice: gs(1_100_000),
        cashPrice: gs(1_650_000),
        creditPrice: gs(2_000_000),
        stock: 10,
        minStock: 4,
        supplierId: supElectro.id,
        status: ProductStatus.ACTIVO,
      },

      // ── COLCHONES ──────────────────────────────────────────────────
      {
        code: "COL-001",
        name: "Colchón Resorte Simmons Pocketed 1.40m",
        description: "Resorte ensacado pocketed, pillow top, 25cm altura, tela jacquard.",
        category: Category.COLCHONES,
        subcategory: "Matrimonial",
        brand: "Simmons",
        model: "Pocketed Comfort 140",
        unit: Unit.UNIDAD,
        costPrice: gs(1_200_000),
        cashPrice: gs(1_850_000),
        creditPrice: gs(2_230_000),
        stock: 12,
        minStock: 4,
        supplierId: supColchon.id,
        status: ProductStatus.ACTIVO,
      },
      {
        code: "COL-002",
        name: "Colchón Memory Foam Dreamlife 1.60m King",
        description: "Espuma viscoelástica 5 zonas, cubierta de bambú, altura 28cm.",
        category: Category.COLCHONES,
        subcategory: "King",
        brand: "Dreamlife",
        model: "Memory King 160",
        unit: Unit.UNIDAD,
        costPrice: gs(2_100_000),
        cashPrice: gs(3_150_000),
        creditPrice: gs(3_800_000),
        stock: 8,
        minStock: 3,
        supplierId: supColchon.id,
        status: ProductStatus.ACTIVO,
      },
      {
        code: "COL-003",
        name: "Colchón Alta Densidad 1 Plaza 0.80m",
        description: "Espuma HR 30kg/m³, cubierta lavable, ideal dormitorio infantil.",
        category: Category.COLCHONES,
        subcategory: "1 Plaza",
        brand: "Dreamlife",
        model: "HD 80",
        unit: Unit.UNIDAD,
        costPrice: gs(480_000),
        cashPrice: gs(730_000),
        creditPrice: gs(880_000),
        stock: 20,
        minStock: 6,
        supplierId: supColchon.id,
        status: ProductStatus.ACTIVO,
      },
      {
        code: "COL-004",
        name: "Set Colchón + Almohadas Simmons 1.40m",
        description: "Colchón resorte 1.40m + 2 almohadas viscoelásticas incluidas.",
        category: Category.COLCHONES,
        subcategory: "Set Matrimonial",
        brand: "Simmons",
        model: "Set Classic 140",
        unit: Unit.SET,
        costPrice: gs(1_450_000),
        cashPrice: gs(2_200_000),
        creditPrice: gs(2_650_000),
        stock: 10,
        minStock: 3,
        supplierId: supColchon.id,
        status: ProductStatus.ACTIVO,
      },

      // ── OTROS ──────────────────────────────────────────────────────
      {
        code: "OTR-001",
        name: "Ventilador de Techo con Luz 52\" 5 Aspas",
        description: "52 pulgadas, motor silencioso, 3 velocidades, kit de luz LED incluido.",
        category: Category.OTROS,
        subcategory: "Ventilación",
        brand: "Mondial",
        model: "Teto 52",
        unit: Unit.UNIDAD,
        costPrice: gs(380_000),
        cashPrice: gs(580_000),
        creditPrice: gs(700_000),
        stock: 18,
        minStock: 6,
        supplierId: supImport.id,
        status: ProductStatus.ACTIVO,
      },
      {
        code: "OTR-002",
        name: "Vajilla 42 Piezas Porcelana Blanca",
        description: "42 piezas: platos, bowls, tazas, fuentes. Apta lavavajillas.",
        category: Category.OTROS,
        subcategory: "Vajillas",
        brand: "Oxford",
        model: "Plateau 42pc",
        unit: Unit.SET,
        costPrice: gs(320_000),
        cashPrice: gs(490_000),
        creditPrice: gs(590_000),
        stock: 25,
        minStock: 8,
        supplierId: supImport.id,
        status: ProductStatus.ACTIVO,
      },
      {
        code: "OTR-003",
        name: "Cortinas Blackout 2.40m x 1.40m Par",
        description: "Par de cortinas blackout 100%, tela de poliéster, varias tonalidades disponibles.",
        category: Category.OTROS,
        subcategory: "Cortinas",
        brand: "DecorLine",
        model: "Blackout 240",
        unit: Unit.PAR,
        costPrice: gs(180_000),
        cashPrice: gs(280_000),
        creditPrice: gs(340_000),
        stock: 30,
        minStock: 10,
        supplierId: supImport.id,
        status: ProductStatus.ACTIVO,
      },
    ],
  });

  console.log(`✓ ${products.length} productos creados`);

  // Índice por código para fácil acceso
  const P: Record<string, typeof products[0]> = {};
  for (const p of products) P[p.code] = p;

  // ══════════════════════════════════════════════════════════════════
  // 6. CLIENTES (25 clientes paraguayos)
  // ══════════════════════════════════════════════════════════════════

  const clientsData = [
    { code: "CLI-001", name: "Carlos Alberto Martínez Ojeda",   ruc: "3456789-0", mobile: "0981 234 101", city: "Asunción",         type: CustomerType.MINORISTA, risk: RiskLevel.BAJO,  limit: 15_000_000, income: 5_000_000 },
    { code: "CLI-002", name: "María José González Báez",         ruc: "2345678-1", mobile: "0991 345 202", city: "San Lorenzo",      type: CustomerType.MINORISTA, risk: RiskLevel.BAJO,  limit: 12_000_000, income: 4_200_000 },
    { code: "CLI-003", name: "Jorge Luis Benítez Ruíz",          ruc: "4567890-2", mobile: "0971 456 303", city: "Fernando de la Mora", type: CustomerType.MINORISTA, risk: RiskLevel.MEDIO, limit: 8_000_000,  income: 3_000_000 },
    { code: "CLI-004", name: "Ana Rosa Flores Acosta",           ruc: "5678901-3", mobile: "0982 567 404", city: "Lambaré",          type: CustomerType.MINORISTA, risk: RiskLevel.BAJO,  limit: 18_000_000, income: 6_500_000 },
    { code: "CLI-005", name: "Roberto Daniel López Díaz",        ruc: "6789012-4", mobile: "0985 678 505", city: "Capiatá",          type: CustomerType.MINORISTA, risk: RiskLevel.ALTO,  limit: 5_000_000,  income: 2_200_000 },
    { code: "CLI-006", name: "Patricia Inés Ramírez Torres",     ruc: "7890123-5", mobile: "0972 789 606", city: "Luque",            type: CustomerType.MINORISTA, risk: RiskLevel.BAJO,  limit: 20_000_000, income: 8_000_000 },
    { code: "CLI-007", name: "Fernando Augusto Sosa Villalba",   ruc: "8901234-6", mobile: "0983 890 707", city: "Asunción",         type: CustomerType.MAYORISTA, risk: RiskLevel.BAJO,  limit: 50_000_000, income: 20_000_000 },
    { code: "CLI-008", name: "Rosa Elvira Coronel Duarte",       ruc: "9012345-7", mobile: "0991 901 808", city: "Asunción",         type: CustomerType.MINORISTA, risk: RiskLevel.MEDIO, limit: 7_000_000,  income: 2_800_000 },
    { code: "CLI-009", name: "Miguel Ángel Gavilán Centurión",   ruc: "1023456-8", mobile: "0971 012 909", city: "San Lorenzo",      type: CustomerType.MINORISTA, risk: RiskLevel.BAJO,  limit: 14_000_000, income: 4_800_000 },
    { code: "CLI-010", name: "Silvia Patricia Cardozo Méndez",   ruc: "1134567-9", mobile: "0981 123 010", city: "Ciudad del Este",  type: CustomerType.MINORISTA, risk: RiskLevel.BAJO,  limit: 16_000_000, income: 5_500_000 },
    { code: "CLI-011", name: "Diego Hernán Ávalos Portillo",     ruc: "1245678-0", mobile: "0991 234 111", city: "Encarnación",      type: CustomerType.MINORISTA, risk: RiskLevel.MEDIO, limit: 9_000_000,  income: 3_200_000 },
    { code: "CLI-012", name: "Laura Beatriz Vera Escobar",       ruc: "1356789-1", mobile: "0982 345 212", city: "Coronel Oviedo",   type: CustomerType.MINORISTA, risk: RiskLevel.BAJO,  limit: 11_000_000, income: 4_000_000 },
    { code: "CLI-013", name: "Oscar Antonio Giménez Paredes",    ruc: "1467890-2", mobile: "0985 456 313", city: "Asunción",         type: CustomerType.MINORISTA, risk: RiskLevel.ALTO,  limit: 4_000_000,  income: 1_800_000 },
    { code: "CLI-014", name: "Marcela Susana Cabral Valdez",     ruc: "1578901-3", mobile: "0972 567 414", city: "Fernando de la Mora", type: CustomerType.MINORISTA, risk: RiskLevel.BAJO, limit: 13_000_000, income: 4_500_000 },
    { code: "CLI-015", name: "Héctor Daniel Insfrán Ibarra",     ruc: "1689012-4", mobile: "0983 678 515", city: "Asunción",         type: CustomerType.MINORISTA, risk: RiskLevel.BAJO,  limit: 22_000_000, income: 9_000_000 },
    { code: "CLI-016", name: "Claudia Elizabeth Oviedo Almirón", ruc: "1790123-5", mobile: "0991 789 616", city: "Lambaré",          type: CustomerType.MINORISTA, risk: RiskLevel.MEDIO, limit: 6_500_000,  income: 2_600_000 },
    { code: "CLI-017", name: "Nelson Ricardo Velázquez Paniagua",ruc: "1801234-6", mobile: "0971 890 717", city: "San Lorenzo",      type: CustomerType.MAYORISTA, risk: RiskLevel.BAJO,  limit: 40_000_000, income: 15_000_000 },
    { code: "CLI-018", name: "Graciela Noemí Romero Cabrera",    ruc: "1912345-7", mobile: "0981 901 818", city: "Luque",            type: CustomerType.MINORISTA, risk: RiskLevel.BAJO,  limit: 10_000_000, income: 3_800_000 },
    { code: "CLI-019", name: "Juan Pablo Lezcano Britez",        ruc: "2023456-8", mobile: "0991 012 919", city: "Capiatá",          type: CustomerType.MINORISTA, risk: RiskLevel.ALTO,  limit: 3_500_000,  income: 1_600_000 },
    { code: "CLI-020", name: "Norma Beatriz Cáceres Palacios",   ruc: "2134567-9", mobile: "0982 123 020", city: "Asunción",         type: CustomerType.MINORISTA, risk: RiskLevel.BAJO,  limit: 17_000_000, income: 6_000_000 },
    { code: "CLI-021", name: "Rodrigo Andrés Duarte Galeano",    ruc: "2245678-0", mobile: "0985 234 121", city: "Pedro Juan Caballero", type: CustomerType.MINORISTA, risk: RiskLevel.MEDIO, limit: 8_500_000, income: 3_100_000 },
    { code: "CLI-022", name: "Viviana Rocío Meza Fernández",     ruc: "2356789-1", mobile: "0972 345 222", city: "Asunción",         type: CustomerType.MINORISTA, risk: RiskLevel.BAJO,  limit: 19_000_000, income: 7_000_000 },
    { code: "CLI-023", name: "Arnaldo Benigno Núñez Jara",       ruc: "2467890-2", mobile: "0983 456 323", city: "Encarnación",      type: CustomerType.MAYORISTA, risk: RiskLevel.BAJO,  limit: 35_000_000, income: 12_000_000 },
    { code: "CLI-024", name: "Liliana Mercedes Arguello Ortiz",  ruc: "2578901-3", mobile: "0991 567 424", city: "Asunción",         type: CustomerType.MINORISTA, risk: RiskLevel.BAJO,  limit: 12_500_000, income: 4_300_000 },
    { code: "CLI-025", name: "Gustavo Adolfo Pino Godoy",        ruc: "2689012-4", mobile: "0971 678 525", city: "Ciudad del Este",  type: CustomerType.MINORISTA, risk: RiskLevel.MEDIO, limit: 7_500_000,  income: 2_900_000 },
  ];

  const customers: Record<string, { id: string }> = {};
  for (const c of clientsData) {
    const created = await prisma.customer.create({
      data: {
        code: c.code,
        name: c.name,
        ruc: c.ruc,
        mobile: c.mobile,
        city: c.city,
        type: c.type,
        riskLevel: c.risk,
        creditLimit: c.limit,
        monthlyIncome: c.income,
        registeredBy: admin.id,
        department: "Central",
      },
    });
    customers[c.code] = created;
  }

  console.log(`✓ ${clientsData.length} clientes creados`);

  // ══════════════════════════════════════════════════════════════════
  // 7. VENTAS + CRÉDITOS + PAGOS
  // ══════════════════════════════════════════════════════════════════

  const now = new Date();
  let saleCounter = 1;
  let paymentCounter = 1;

  async function createSaleContado(
    customerCode: string,
    sellerUser: { id: string },
    productCode: string,
    qty: number,
    daysAgo: number
  ) {
    const n = String(saleCounter++).padStart(5, "0");
    const prod = P[productCode];
    const date = subDays(now, daysAgo);
    const subtotal = prod.cashPrice.toNumber() * qty;
    const sale = await prisma.sale.create({
      data: {
        number: `VTA-${n}`,
        date,
        customerId: customers[customerCode].id,
        sellerId: sellerUser.id,
        type: SaleType.CONTADO,
        channel: SaleChannel.TIENDA,
        subtotal,
        discount: 0,
        total: subtotal,
        status: SaleStatus.COMPLETADA,
        items: {
          create: [{
            productId: prod.id,
            productName: prod.name,
            quantity: qty,
            unitPrice: prod.cashPrice.toNumber(),
            discount: 0,
            subtotal,
          }],
        },
      },
    });

    // Stock movement
    await prisma.stockMovement.create({
      data: {
        productId: prod.id,
        type: MovementType.SALIDA,
        quantity: qty,
        previousStock: prod.stock,
        newStock: prod.stock - qty,
        reason: `Venta ${sale.number}`,
        referenceId: sale.id,
        referenceType: "VENTA",
        userId: sellerUser.id,
      },
    });

    // Payment
    const pNum = String(paymentCounter++).padStart(5, "0");
    await prisma.payment.create({
      data: {
        number: `REC-${pNum}`,
        date,
        customerId: customers[customerCode].id,
        saleId: sale.id,
        receivedBy: cajero.id,
        amount: subtotal,
        paymentMethod: PaymentMethod.EFECTIVO,
        lateInterestApplied: 0,
      },
    });

    return sale;
  }

  // Ventas al contado
  await createSaleContado("CLI-001", vendedor1, "ELC-001", 1, 5);
  await createSaleContado("CLI-002", vendedor2, "COL-001", 2, 8);
  await createSaleContado("CLI-004", vendedor1, "MUE-006", 1, 12);
  await createSaleContado("CLI-007", vendedor2, "ELE-005", 2, 15);
  await createSaleContado("CLI-009", vendedor1, "ELC-003", 1, 20);
  await createSaleContado("CLI-010", vendedor2, "COL-003", 4, 25);
  await createSaleContado("CLI-015", vendedor1, "ELE-008", 1, 30);
  await createSaleContado("CLI-017", vendedor2, "OTR-001", 3, 35);
  await createSaleContado("CLI-020", vendedor1, "OTR-002", 2, 40);
  await createSaleContado("CLI-022", vendedor2, "MUE-009", 1, 45);

  // ── Ventas a CRÉDITO ──────────────────────────────────────────────

  async function createSaleCredito(
    customerCode: string,
    sellerUser: { id: string },
    items: { code: string; qty: number }[],
    daysAgo: number,
    cuotas: number,
    freq: Frequency,
    downPct: number,  // % de entrega inicial
    paidInstallments: number  // cuántas cuotas pagar en la simulación
  ) {
    const n = String(saleCounter++).padStart(5, "0");
    const date = subDays(now, daysAgo);

    let subtotal = 0;
    const lineItems = items.map(({ code, qty }) => {
      const prod = P[code];
      const lineTotal = prod.creditPrice.toNumber() * qty;
      subtotal += lineTotal;
      return {
        productId: prod.id,
        productName: prod.name,
        quantity: qty,
        unitPrice: prod.creditPrice.toNumber(),
        discount: 0,
        subtotal: lineTotal,
      };
    });

    const total = subtotal;
    const downPayment = Math.round(total * downPct);
    const financed = total - downPayment;
    const instAmt = Math.round(financed / cuotas);
    const firstDue = addMonths(date, 1);
    const interestRate = 2.5; // 2.5% mensual, típico en Paraguay

    const sale = await prisma.sale.create({
      data: {
        number: `VTA-${n}`,
        date,
        customerId: customers[customerCode].id,
        sellerId: sellerUser.id,
        type: SaleType.CREDITO,
        channel: SaleChannel.TIENDA,
        subtotal,
        discount: 0,
        total,
        status: SaleStatus.PENDIENTE,
        items: { create: lineItems },
      },
    });

    // Stock movements
    for (const { code, qty } of items) {
      const prod = P[code];
      await prisma.stockMovement.create({
        data: {
          productId: prod.id,
          type: MovementType.SALIDA,
          quantity: qty,
          previousStock: prod.stock,
          newStock: prod.stock - qty,
          reason: `Venta ${sale.number}`,
          referenceId: sale.id,
          referenceType: "VENTA",
          userId: sellerUser.id,
        },
      });
    }

    // Tabla de amortización (sistema francés simple)
    const schedule = [];
    let balance = financed;
    for (let i = 1; i <= cuotas; i++) {
      const interest = Math.round(balance * (interestRate / 100));
      const principal = instAmt - interest;
      balance = Math.max(0, balance - principal);
      const dueDate = freq === Frequency.MENSUAL
        ? addMonths(firstDue, i - 1)
        : freq === Frequency.QUINCENAL
          ? addDays(firstDue, (i - 1) * 15)
          : addDays(firstDue, (i - 1) * 7);

      const isPaid = i <= paidInstallments;
      const isOverdue = !isPaid && dueDate < now;

      schedule.push({
        installmentNumber: i,
        dueDate,
        principal: Math.abs(principal),
        interest,
        total: instAmt,
        balance,
        status: isPaid
          ? InstallmentStatus.PAGADA
          : isOverdue
            ? InstallmentStatus.VENCIDA
            : InstallmentStatus.PENDIENTE,
        paidAmount: isPaid ? instAmt : 0,
        paidAt: isPaid ? addDays(dueDate, -2) : null,
      });
    }

    const creditPlan = await prisma.creditPlan.create({
      data: {
        saleId: sale.id,
        downPayment,
        financedAmount: financed,
        interestRate,
        interestMode: InterestMode.FRANCES,
        installments: cuotas,
        frequency: freq,
        installmentAmount: instAmt,
        firstDueDate: firstDue,
        lateInterestRate: 3,
        amortizationTable: { create: schedule },
      },
    });

    // Entrega inicial
    if (downPayment > 0) {
      const pNum = String(paymentCounter++).padStart(5, "0");
      await prisma.payment.create({
        data: {
          number: `REC-${pNum}`,
          date,
          customerId: customers[customerCode].id,
          saleId: sale.id,
          receivedBy: cajero.id,
          amount: downPayment,
          paymentMethod: PaymentMethod.EFECTIVO,
          lateInterestApplied: 0,
        },
      });
    }

    // Pagos de cuotas pagadas
    for (let i = 1; i <= paidInstallments; i++) {
      const inst = schedule[i - 1];
      const pNum = String(paymentCounter++).padStart(5, "0");
      await prisma.payment.create({
        data: {
          number: `REC-${pNum}`,
          date: inst.paidAt!,
          customerId: customers[customerCode].id,
          saleId: sale.id,
          receivedBy: cajero.id,
          amount: instAmt,
          paymentMethod: i % 3 === 0 ? PaymentMethod.TRANSFERENCIA : PaymentMethod.EFECTIVO,
          lateInterestApplied: 0,
        },
      });
    }

    // Actualizar estado venta
    const allPaid = paidInstallments >= cuotas;
    const hasOverdue = schedule.some((s) => s.status === "VENCIDA");
    await prisma.sale.update({
      where: { id: sale.id },
      data: {
        status: allPaid ? SaleStatus.COMPLETADA : hasOverdue ? SaleStatus.MORA : SaleStatus.PENDIENTE,
      },
    });

    return sale;
  }

  // Ventas a crédito — casos variados
  await createSaleCredito("CLI-003", vendedor1, [{ code: "ELC-001", qty: 1 }], 180, 12, Frequency.MENSUAL, 0.2, 8);
  await createSaleCredito("CLI-005", vendedor2, [{ code: "MUE-001", qty: 1 }], 150, 18, Frequency.MENSUAL, 0.15, 3);
  await createSaleCredito("CLI-006", vendedor1, [
    { code: "MUE-003", qty: 1 },
    { code: "COL-002", qty: 1 },
  ], 120, 24, Frequency.MENSUAL, 0.3, 4);
  await createSaleCredito("CLI-008", vendedor2, [{ code: "ELE-001", qty: 1 }], 90, 12, Frequency.MENSUAL, 0.25, 2);
  await createSaleCredito("CLI-011", vendedor1, [{ code: "ELC-002", qty: 1 }], 75, 18, Frequency.MENSUAL, 0.2, 2);
  await createSaleCredito("CLI-013", vendedor2, [{ code: "ELE-003", qty: 1 }], 60, 6, Frequency.MENSUAL, 0.1, 0);
  await createSaleCredito("CLI-014", vendedor1, [
    { code: "MUE-002", qty: 1 },
    { code: "MUE-006", qty: 1 },
  ], 50, 12, Frequency.MENSUAL, 0.2, 1);
  await createSaleCredito("CLI-016", vendedor2, [{ code: "COL-001", qty: 1 }], 45, 6, Frequency.QUINCENAL, 0.25, 3);
  await createSaleCredito("CLI-018", vendedor1, [{ code: "ELE-007", qty: 1 }], 40, 12, Frequency.MENSUAL, 0.2, 1);
  await createSaleCredito("CLI-019", vendedor2, [{ code: "MUE-008", qty: 1 }], 35, 6, Frequency.MENSUAL, 0.1, 0);
  await createSaleCredito("CLI-021", vendedor1, [
    { code: "ELC-003", qty: 1 },
    { code: "ELE-005", qty: 1 },
  ], 30, 12, Frequency.MENSUAL, 0.25, 0);
  await createSaleCredito("CLI-024", vendedor2, [{ code: "MUE-004", qty: 1 }], 20, 6, Frequency.MENSUAL, 0.2, 0);
  await createSaleCredito("CLI-025", vendedor1, [
    { code: "MUE-007", qty: 1 },
    { code: "COL-004", qty: 1 },
  ], 10, 18, Frequency.MENSUAL, 0.3, 0);

  console.log("✓ Ventas al contado y a crédito creadas con cuotas y pagos");

  // ══════════════════════════════════════════════════════════════════
  // 8. COMPRAS A PROVEEDORES
  // ══════════════════════════════════════════════════════════════════

  const compraItems = [
    { prodCode: "MUE-001", qty: 5, cost: P["MUE-001"].costPrice.toNumber() },
    { prodCode: "ELC-001", qty: 4, cost: P["ELC-001"].costPrice.toNumber() },
    { prodCode: "ELC-003", qty: 6, cost: P["ELC-003"].costPrice.toNumber() },
    { prodCode: "COL-001", qty: 8, cost: P["COL-001"].costPrice.toNumber() },
    { prodCode: "ELE-001", qty: 5, cost: P["ELE-001"].costPrice.toNumber() },
  ];

  let cmpCount = 1;
  for (const item of compraItems) {
    const prod = P[item.prodCode];
    const subtotal = item.cost * item.qty;
    const cNum = String(cmpCount++).padStart(5, "0");
    const purchaseDate = subDays(now, 60 + cmpCount * 3);

    const purchase = await prisma.purchase.create({
      data: {
        number: `CMP-${cNum}`,
        date: purchaseDate,
        supplierId: prod.supplierId!,
        userId: almacen.id,
        type: PurchaseType.CONTADO,
        subtotal,
        discount: 0,
        total: subtotal,
        status: PurchaseStatus.COMPLETADA,
        items: {
          create: [{
            productId: prod.id,
            productName: prod.name,
            quantity: item.qty,
            unitCost: item.cost,
            discount: 0,
            subtotal,
          }],
        },
      },
    });

    await prisma.stockMovement.create({
      data: {
        productId: prod.id,
        type: MovementType.ENTRADA,
        quantity: item.qty,
        previousStock: prod.stock,
        newStock: prod.stock + item.qty,
        reason: `Compra ${purchase.number}`,
        referenceId: purchase.id,
        referenceType: "COMPRA",
        userId: almacen.id,
      },
    });
  }

  console.log("✓ Compras a proveedores registradas");

  // ══════════════════════════════════════════════════════════════════
  // 9. CAJA — una sesión de prueba
  // ══════════════════════════════════════════════════════════════════

  const cajaAbierta = await prisma.cashRegister.create({
    data: {
      number: "CAJ-00001",
      openedBy: cajero.id,
      openingBalance: 500_000,
      status: "ABIERTA",
      openedAt: subDays(now, 0),
      notes: "Apertura turno mañana",
    },
  });

  await prisma.cashWithdrawal.create({
    data: {
      number: "RET-00001",
      cashRegisterId: cajaAbierta.id,
      userId: cajero.id,
      amount: 150_000,
      concept: "Pago servicios básicos (ANDE/ESSAP)",
      category: "GASTO_OPERATIVO",
    },
  });

  console.log("✓ Caja de prueba creada");

  // ══════════════════════════════════════════════════════════════════
  // RESUMEN
  // ══════════════════════════════════════════════════════════════════

  const totals = {
    users: await prisma.user.count(),
    suppliers: await prisma.supplier.count(),
    products: await prisma.product.count(),
    customers: await prisma.customer.count(),
    sales: await prisma.sale.count(),
    payments: await prisma.payment.count(),
    installments: await prisma.amortizationSchedule.count(),
    purchases: await prisma.purchase.count(),
  };

  console.log("\n✅ Seed completado exitosamente!\n");
  console.log("📊 Resumen:");
  console.log(`   👤 Usuarios:      ${totals.users}`);
  console.log(`   🏭 Proveedores:   ${totals.suppliers}`);
  console.log(`   📦 Productos:     ${totals.products}`);
  console.log(`   👥 Clientes:      ${totals.customers}`);
  console.log(`   🛒 Ventas:        ${totals.sales}`);
  console.log(`   💳 Cuotas:        ${totals.installments}`);
  console.log(`   💰 Pagos:         ${totals.payments}`);
  console.log(`   🚚 Compras:       ${totals.purchases}`);
  console.log("\n🔑 Acceso:");
  console.log("   admin@erp.com      → admin123  (ADMIN)");
  console.log("   carlos.paredes@erp.com → vendedor123  (VENDEDOR)");
  console.log("   ana.gonzalez@erp.com   → vendedor123  (VENDEDOR)");
  console.log("   laura.romero@erp.com   → vendedor123  (CAJERO)");
  console.log("   diego.martinez@erp.com → vendedor123  (SUPERVISOR)");
  console.log("   jorge.flores@erp.com   → vendedor123  (ALMACEN)");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
