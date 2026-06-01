import { NextResponse } from "next/server";
import React from "react";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const [{ default: prisma }, { default: ReceiptPDF }, { renderToStream }] = await Promise.all([
      import("@/lib/prisma"),
      import("@/components/pdf/receipt-pdf"),
      import("@react-pdf/renderer"),
    ]);

    const saleId = params.id;
    const [sale, company] = await Promise.all([
      prisma.sale.findUnique({
        where: { id: saleId },
        include: {
          customer: true,
          items: true,
          payments: true,
          creditPlan: true,
        },
      }),
      prisma.companyConfig.findFirst(),
    ]);

    if (!sale) {
      return new NextResponse("Venta no encontrada", { status: 404 });
    }

    const companyData = company || {
      name: "Empresa no configurada",
      ruc: "00000000-0",
      address: "No disponible",
      phone: "No disponible",
    };

    const lastPayment = sale.payments[sale.payments.length - 1] || {
      number: "S/N",
      date: sale.date,
      paymentMethod: "EFECTIVO",
      amount: sale.type === "CREDITO" ? (sale.creditPlan?.downPayment || 0) : sale.total,
      lateInterestApplied: 0,
    };

    const installments: never[] = [];

    const stream = await renderToStream(
      React.createElement(ReceiptPDF, {
        receipt: lastPayment,
        customer: sale.customer,
        sale,
        installments,
        company: companyData,
      })
    );

    return new NextResponse(stream as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="recibo-${sale.number}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating receipt PDF:", error);
    return new NextResponse("Error generating PDF", { status: 500 });
  }
}
