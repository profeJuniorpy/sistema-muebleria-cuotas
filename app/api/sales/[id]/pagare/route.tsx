import { NextResponse } from "next/server";
import React from "react";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const [{ default: prisma }, { default: PagarePDF }, { renderToStream }] = await Promise.all([
      import("@/lib/prisma"),
      import("@/components/pdf/pagare-pdf"),
      import("@react-pdf/renderer"),
    ]);

    const saleId = params.id;
    const [sale, company] = await Promise.all([
      prisma.sale.findUnique({
        where: { id: saleId },
        include: {
          customer: true,
          creditPlan: {
            include: {
              amortizationTable: { orderBy: { installmentNumber: "asc" } },
            },
          },
        },
      }),
      prisma.companyConfig.findFirst({ orderBy: { updatedAt: "desc" } }),
    ]);

    if (!sale || !sale.creditPlan) {
      return new NextResponse("Pagaré no disponible: la venta no tiene un plan de crédito", {
        status: 404,
      });
    }

    const rows = sale.creditPlan.amortizationTable;
    const pendingRows = rows.filter((r) => r.status !== "PAGADA");
    const pendingBalance = pendingRows.reduce(
      (sum, r) => sum + Number(r.total) - Number(r.paidAmount),
      0
    );

    if (pendingBalance <= 0) {
      return new NextResponse("Este crédito ya está totalmente cancelado, no hay deuda pendiente", {
        status: 400,
      });
    }

    const dueDate = pendingRows.length > 0
      ? pendingRows[pendingRows.length - 1].dueDate
      : rows[rows.length - 1].dueDate;

    const companyData = company || {
      name: "Empresa no configurada",
      ruc: "00000000-0",
      address: "No disponible",
      city: "Coronel Oviedo",
    };

    const logoUrl = (company as any)?.logoUrl ?? undefined;

    const stream = await renderToStream(
      React.createElement(PagarePDF, {
        pagareNumber: `PG-${sale.number}`,
        issueDate: new Date(),
        dueDate,
        amount: Math.round(pendingBalance),
        debtor: {
          name: sale.customer.name,
          ruc: sale.customer.ruc,
          address: sale.customer.address,
          city: sale.customer.city,
        },
        creditor: {
          name: companyData.name,
          ruc: companyData.ruc,
          address: (companyData as any).address ?? null,
          city: (companyData as any).city ?? null,
        },
        saleNumber: sale.number,
        lateInterestRate: Number(sale.creditPlan.lateInterestRate),
        logoUrl,
      })
    );

    return new NextResponse(stream as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="pagare-${sale.number}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating pagaré PDF:", error);
    return new NextResponse("Error generating PDF", { status: 500 });
  }
}
