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
  // Branding (passed from user context)
  shopName?: string | null;
  currencySymbol?: string | null;
}

export function generateInvoicePdf(invoice: InvoiceData) {
  const sym   = invoice.currencySymbol ?? "$";
  const shop  = (invoice.shopName ?? "My Shop").trim();
  const doc   = new jsPDF({ unit: "mm", format: "a4" });
  const W     = doc.internal.pageSize.getWidth();  // 210

  // ── Header band ─────────────────────────────────────────────────────────────
  doc.setFillColor(25, 50, 180);
  doc.rect(0, 0, W, 32, "F");

  // Shop name
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(shop, 14, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Sales Receipt", 14, 21);

  // Invoice number (right side)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(invoice.invoiceNumber, W - 14, 14, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(invoice.date, W - 14, 21, { align: "right" });

  // ── Status chip ──────────────────────────────────────────────────────────────
  doc.setTextColor(0, 0, 0);
  const statusColors: Record<string, [number, number, number]> = {
    "Completed":           [5,   150, 105],
    "Returned":            [220,  38,  38],
    "Partially Returned":  [217, 119,   6],
  };
  const [sr, sg, sb] = statusColors[invoice.status] ?? [100, 100, 100];
  doc.setFillColor(sr, sg, sb);
  const statusText = invoice.status.toUpperCase();
  const statusW = doc.getTextWidth(statusText) + 6;
  doc.roundedRect(14, 36, statusW, 6, 1.5, 1.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text(statusText, 14 + statusW / 2, 40, { align: "center" });
  doc.setTextColor(0, 0, 0);

  // ── Meta info block ──────────────────────────────────────────────────────────
  let y = 48;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  // Left column: payment
  doc.setFont("helvetica", "bold");
  doc.text("Payment:", 14, y);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.paymentMethod, 38, y);

  // Right column: customer
  if (invoice.customerName && invoice.customerName !== "Cash Customer") {
    doc.setFont("helvetica", "bold");
    doc.text("Customer:", W / 2, y);
    doc.setFont("helvetica", "normal");
    doc.text(invoice.customerName, W / 2 + 24, y);
    if (invoice.customerPhone) {
      doc.text(invoice.customerPhone, W / 2 + 24, y + 6);
    }
  }

  // Divider
  y = 58;
  doc.setDrawColor(200, 200, 200);
  doc.line(14, y, W - 14, y);

  // ── Items table ──────────────────────────────────────────────────────────────
  autoTable(doc, {
    startY: y + 3,
    head: [["Item", "Qty", `Unit (${sym})`, `Total (${sym})`, "Returned"]],
    body: invoice.items.map(it => [
      it.partName,
      String(it.quantity),
      it.unitPrice.toLocaleString(),
      it.total.toLocaleString(),
      it.returnedQuantity ? String(it.returnedQuantity) : "—",
    ]),
    theme: "striped",
    headStyles:   { fillColor: [25, 50, 180], fontSize: 8.5, fontStyle: "bold", halign: "left" },
    bodyStyles:   { fontSize: 8.5 },
    columnStyles: {
      1: { halign: "center", cellWidth: 14 },
      2: { halign: "right",  cellWidth: 28 },
      3: { halign: "right",  cellWidth: 28 },
      4: { halign: "center", cellWidth: 22 },
    },
    margin: { left: 14, right: 14 },
  });

  // ── Totals ───────────────────────────────────────────────────────────────────
  const finalY = (doc as any).lastAutoTable?.finalY ?? y + 30;
  let ty = finalY + 8;
  const labelX = W - 60;
  const valX   = W - 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  doc.text("Subtotal", labelX, ty);
  doc.setTextColor(0, 0, 0);
  doc.text(`${sym}${invoice.subtotal.toLocaleString()}`, valX, ty, { align: "right" });

  if (invoice.discount > 0) {
    ty += 6;
    doc.setTextColor(90, 90, 90);
    doc.text("Discount", labelX, ty);
    doc.setTextColor(200, 50, 50);
    doc.text(`-${sym}${invoice.discount.toLocaleString()}`, valX, ty, { align: "right" });
    doc.setTextColor(0, 0, 0);
  }

  ty += 4;
  doc.setDrawColor(180, 180, 180);
  doc.line(labelX - 2, ty, valX, ty);
  ty += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(25, 50, 180);
  doc.text("TOTAL", labelX, ty);
  doc.text(`${sym}${invoice.total.toLocaleString()}`, valX, ty, { align: "right" });

  // ── Footer ───────────────────────────────────────────────────────────────────
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(160, 160, 160);
  doc.text("Thank you for your business.", 14, 282);
  doc.text(shop, W - 14, 282, { align: "right" });

  doc.save(`${invoice.invoiceNumber}.pdf`);
}

// ── Sales Report ──────────────────────────────────────────────────────────────

export interface DateWiseSaleRow {
  invoiceNumber: string;
  date: string;
  customerName?: string | null;
  total: number;
  status: string;
  paymentMethod: string;
}

export function generateSalesReportPdf(
  rows: DateWiseSaleRow[],
  from: string,
  to: string,
  shopName?: string | null,
  currencySymbol?: string | null,
) {
  const sym  = currencySymbol ?? "$";
  const shop = (shopName ?? "My Shop").trim();
  const doc  = new jsPDF({ unit: "mm", format: "a4" });
  const W    = doc.internal.pageSize.getWidth();

  // Header band
  doc.setFillColor(25, 50, 180);
  doc.rect(0, 0, W, 26, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(shop, 14, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Sales Report", 14, 19);
  doc.text(`${from || "All time"} — ${to || "Now"}`, W - 14, 19, { align: "right" });

  doc.setTextColor(0, 0, 0);

  autoTable(doc, {
    startY: 32,
    head: [["Invoice", "Date", "Customer", `Total (${sym})`, "Payment", "Status"]],
    body: rows.map(r => [
      r.invoiceNumber, r.date, r.customerName ?? "—",
      r.total.toLocaleString(), r.paymentMethod, r.status,
    ]),
    theme: "striped",
    headStyles:   { fillColor: [25, 50, 180], fontSize: 8.5, fontStyle: "bold" },
    bodyStyles:   { fontSize: 8.5 },
    columnStyles: { 3: { halign: "right" } },
    margin: { left: 14, right: 14 },
  });

  const finalY  = (doc as any).lastAutoTable?.finalY ?? 40;
  const totalSum = rows.reduce((s, r) => s + r.total, 0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(25, 50, 180);
  doc.text(`Grand Total: ${sym}${totalSum.toLocaleString()}   (${rows.length} invoice${rows.length !== 1 ? "s" : ""})`, 14, finalY + 10);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text(shop, W - 14, 282, { align: "right" });

  doc.save(`sales-report_${from || "all"}_${to || "all"}.pdf`);
}
