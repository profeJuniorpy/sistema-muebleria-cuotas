import { NextResponse } from "next/server";
import React from "react";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const [{ default: prisma }, { default: ContractPDF }, { renderToStream }] = await Promise.all([
      import("@/lib/prisma"),
      import("@/components/pdf/contract-pdf"),
      import("@react-pdf/renderer"),
    ]);

    const saleId = params.id;
    const [sale, company] = await Promise.all([
      prisma.sale.findUnique({
        where: { id: saleId },
        include: {
          customer: true,
          items: true,
          creditPlan: {
            include: {
              amortizationTable: {
                orderBy: { installmentNumber: "asc" },
              },
            },
          },
        },
      }),
      prisma.companyConfig.findFirst(),
    ]);

    if (!sale || !sale.creditPlan) {
      return new NextResponse("Contrato no disponible para esta venta", { status: 404 });
    }

    if (!sale.customer.address || !sale.customer.city) {
      await prisma.customer.update({
        where: { id: sale.customer.id },
        data: {
          address: sale.customer.address || "S/D",
          city: sale.customer.city || "S/D",
        },
      });
      sale.customer = {
        ...sale.customer,
        address: sale.customer.address || "S/D",
        city: sale.customer.city || "S/D",
      };
    }

    const companyData = company || {
      name: "Empresa no configurada",
      ruc: "00000000-0",
      address: "No disponible",
      phone: "No disponible",
    };

    const stream = await renderToStream(
      React.createElement(ContractPDF, {
        sale,
        customer: sale.customer,
        creditPlan: sale.creditPlan,
        items: sale.items,
        schedule: sale.creditPlan.amortizationTable,
        company: companyData,
      })
    );

    return new NextResponse(stream as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="contrato-${sale.number}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating contract PDF:", error);
    return new NextResponse("Error generating PDF", { status: 500 });
  }
}
