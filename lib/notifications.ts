import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendStockAlert(productName: string, currentStock: number, minStock: number) {
  try {
    await resend.emails.send({
      from: "ERP Mueblería <sistema@tuempresa.com>",
      to: process.env.NOTIFICATION_EMAIL || "admin@tuempresa.com",
      subject: `ALERTA: Stock Crítico - ${productName}`,
      html: `
        <h1>Alerta de Inventario</h1>
        <p>El producto <strong>${productName}</strong> ha alcanzado su nivel crítico.</p>
        <p>Stock Actual: <strong>${currentStock}</strong></p>
        <p>Mínimo Configurado: <strong>${minStock}</strong></p>
        <br/>
        <p>Por favor, realice la reposición a la brevedad.</p>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}

export async function sendPaymentReceipt(customerEmail: string, customerName: string, receiptNumber: string, amount: number) {
  if (!customerEmail) return;

  try {
    await resend.emails.send({
      from: "Mueblería Cuotas <pagos@tuempresa.com>",
      to: customerEmail,
      subject: `Comprobante de Pago Recibido - ${receiptNumber}`,
      html: `
        <h1>¡Gracias por su pago, ${customerName}!</h1>
        <p>Hemos registrado correctamente su pago por el monto de <strong>${new Intl.NumberFormat().format(amount)} GS</strong>.</p>
        <p>Número de Recibo: <strong>${receiptNumber}</strong></p>
        <br/>
        <p>Puede descargar su comprobante oficial desde su portal de cliente o solicitarlo en sucursal.</p>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}
