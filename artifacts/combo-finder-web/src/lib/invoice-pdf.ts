import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface InvoiceItemData {
  partName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  returnedQuantity?: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  customerName?: string | null;
  customerPhone?: string | null;
  items: InvoiceItemData[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  status: string;
}

export function generateInvoicePdf(invoice: InvoiceData) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("ComboFinder", 14, 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Repair Shop Invoice", 14, 24);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Invoice: ${invoice.invoiceNumber}`, 14, 36);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Date: ${invoice.date}`, 14, 42);
  doc.text(`Status: ${invoice.status}`, 14, 48);
  doc.text(`Payment: ${invoice.paymentMethod}`, 14, 54);

  if (invoice.customerName || invoice.customerPhone) {
    doc.text(`Customer: ${invoice.customerName ?? "-"}`, 130, 42);
    doc.text(`Phone: ${invoice.customerPhone ?? "-"}`, 130, 48);
  }

  autoTable(doc, {
    startY: 62,
    head: [["Item", "Qty", "Unit Price", "Total", "Returned"]],
    body: invoice.items.map(it => [
      it.partName,
      String(it.quantity),
      `Tk ${it.unitPrice.toLocaleString()}`,
      `Tk ${it.total.toLocaleString()}`,
      it.returnedQuantity ? String(it.returnedQuantity) : "-",
    ]),
    theme: "striped",
    headStyles: { fillColor: [30, 100, 220] },
  });

  const finalY = (doc as any).lastAutoTable?.finalY ?? 70;
  doc.setFont("helvetica", "normal");
  doc.text(`Subtotal: Tk ${invoice.subtotal.toLocaleString()}`, 140, finalY + 10);
  if (invoice.discount > 0) doc.text(`Discount: -Tk ${invoice.discount.toLocaleString()}`, 140, finalY + 16);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`Total: Tk ${invoice.total.toLocaleString()}`, 140, finalY + (invoice.discount > 0 ? 24 : 18));

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Thank you for your business.", 14, 285);

  doc.save(`${invoice.invoiceNumber}.pdf`);
}

export interface DateWiseSaleRow {
  invoiceNumber: string;
  date: string;
  customerName?: string | null;
  total: number;
  status: string;
  paymentMethod: string;
}

export function generateSalesReportPdf(rows: DateWiseSaleRow[], from: string, to: string) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("ComboFinder — Sales Report", 14, 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Period: ${from || "All time"} to ${to || "Now"}`, 14, 25);

  autoTable(doc, {
    startY: 32,
    head: [["Invoice", "Date", "Customer", "Total", "Payment", "Status"]],
    body: rows.map(r => [
      r.invoiceNumber, r.date, r.customerName ?? "-", `Tk ${r.total.toLocaleString()}`, r.paymentMethod, r.status,
    ]),
    theme: "striped",
    headStyles: { fillColor: [30, 100, 220] },
  });

  const finalY = (doc as any).lastAutoTable?.finalY ?? 40;
  const totalSum = rows.reduce((s, r) => s + r.total, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Total: Tk ${totalSum.toLocaleString()} (${rows.length} invoices)`, 14, finalY + 10);

  doc.save(`sales-report_${from || "all"}_${to || "all"}.pdf`);
}
