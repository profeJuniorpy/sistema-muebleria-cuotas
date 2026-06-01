import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const config = await prisma.companyConfig.findFirst();
  if (!config) {
    await prisma.companyConfig.create({
      data: {
        name: "Mueblería San Lucas",
        ruc: "80001234-5",
        address: "Av. Principal 123, Asunción",
        phone: "+595 21 000 000",
        email: "contacto@muebleriasanlucas.com",
      },
    });
    console.log("Configuración de empresa creada exitosamente.");
  } else {
    console.log("La configuración ya existe.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
