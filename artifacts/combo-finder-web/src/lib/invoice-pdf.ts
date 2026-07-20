import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface InvoiceItemData {
  partName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  returnedQuantity?: number;
}

export interface InvoiceReturnRow {
  date: string;
  partName: string;
  quantity: number;
  refundAmount: number;
  reason?: string | null;
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
  // Credit sale fields
  advancePaid?: number | null;
  amountDue?: number | null;
  // Return/refund data
  returns?: InvoiceReturnRow[];
  totalRefunded?: number;
  // Branding (passed from user context)
  shopName?: string | null;
  currencySymbol?: string | null;
}

export interface RepairVoucherData {
  id: number;
  customerName: string;
  customerPhone?: string | null;
  phoneBrand: string;
  phoneModel: string;
  imei?: string | null;
  problem: string;
  status: string;
  engineer?: string | null;
  parts: { name: string; qty: number; unitPrice: number }[];
  laborCost: number;
  totalCost: number;
  advancePaid: number;
  isPaid: boolean;
  notes?: string | null;
  createdAt: string;
  shopName?: string | null;
  currencySymbol?: string | null;
  warrantyDays?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal builder — returns jsPDF doc (no side effects)
// ─────────────────────────────────────────────────────────────────────────────
function buildInvoiceDoc(invoice: InvoiceData): jsPDF {
  const sym   = invoice.currencySymbol ?? "$";
  const shop  = (invoice.shopName ?? "My Shop").trim();
  const doc   = new jsPDF({ unit: "mm", format: "a4" });
  const W     = doc.internal.pageSize.getWidth();  // 210

  // ── Header band ─────────────────────────────────────────────────────────────
  doc.setFillColor(25, 50, 180);
  doc.rect(0, 0, W, 32, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(shop, 14, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Sales Receipt", 14, 21);

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

  doc.setFont("helvetica", "bold");
  doc.text("Payment:", 14, y);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.paymentMethod, 38, y);

  if (invoice.customerName && invoice.customerName !== "Cash Customer") {
    doc.setFont("helvetica", "bold");
    doc.text("Customer:", W / 2, y);
    doc.setFont("helvetica", "normal");
    doc.text(invoice.customerName, W / 2 + 24, y);
    if (invoice.customerPhone) {
      doc.text(invoice.customerPhone, W / 2 + 24, y + 6);
    }
  }

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
    headStyles:   { fillColor: [25, 50, 180], fontSize: 9, fontStyle: "bold", halign: "left" },
    bodyStyles:   { fontSize: 9 },
    columnStyles: {
      1: { halign: "center", cellWidth: 14 },
      2: { halign: "right",  cellWidth: 28 },
      3: { halign: "right",  cellWidth: 28 },
      4: { halign: "center", cellWidth: 22 },
    },
    margin: { left: 14, right: 14 },
  });

  // ── Totals ───────────────────────────────────────────────────────────────────
  const tableEndY = (doc as any).lastAutoTable?.finalY ?? 120;
  let ty = tableEndY + 10;
  const labelX = W - 14 - 60;
  const valX   = W - 14;

  if (invoice.discount > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    doc.text("Discount", labelX, ty);
    doc.setTextColor(200, 50, 50);
    doc.text(`-${sym}${invoice.discount.toLocaleString()}`, valX, ty, { align: "right" });
    doc.setTextColor(0, 0, 0);
    ty += 6;
  }

  ty += 4;
  doc.setDrawColor(180, 180, 180);
  doc.line(labelX - 2, ty, valX, ty);
  ty += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(25, 50, 180);
  doc.text("TOTAL", labelX, ty);
  doc.text(`${sym}${invoice.total.toLocaleString()}`, valX, ty, { align: "right" });

  if (invoice.advancePaid != null && invoice.advancePaid > 0) {
    ty += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(22, 163, 74);
    doc.text("Advance Paid", labelX, ty);
    doc.text(`${sym}${invoice.advancePaid.toLocaleString()}`, valX, ty, { align: "right" });
  }
  if (invoice.amountDue != null && invoice.amountDue > 0) {
    ty += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(220, 38, 38);
    doc.text("Amount Due", labelX, ty);
    doc.text(`${sym}${invoice.amountDue.toLocaleString()}`, valX, ty, { align: "right" });
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(0.4);
    doc.roundedRect(labelX - 3, ty - 5.5, valX - labelX + 6, 8, 1, 1, "S");
  }

  // ── Returns section ──────────────────────────────────────────────────────────
  if (invoice.returns && invoice.returns.length > 0) {
    ty += 12;
    // Section header
    doc.setFillColor(220, 38, 38);
    const retHeaderW = W - 28;
    doc.roundedRect(14, ty - 4, retHeaderW, 7, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text("RETURNS / REFUNDS", 17, ty + 0.5);
    doc.setTextColor(0, 0, 0);
    ty += 8;

    autoTable(doc, {
      startY: ty,
      head: [["Date", "Item", "Qty", `Refund (${sym})`, "Reason"]],
      body: invoice.returns.map(r => [
        r.date,
        r.partName,
        String(r.quantity),
        r.refundAmount.toLocaleString(),
        r.reason ?? "—",
      ]),
      theme: "grid",
      headStyles: { fillColor: [220, 38, 38], fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        2: { halign: "center", cellWidth: 12 },
        3: { halign: "right",  cellWidth: 28 },
      },
      margin: { left: 14, right: 14 },
    });

    const retEndY = (doc as any).lastAutoTable?.finalY ?? ty + 20;
    if (invoice.totalRefunded != null && invoice.totalRefunded > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(220, 38, 38);
      doc.text(
        `Total Refunded: ${sym}${invoice.totalRefunded.toLocaleString()}`,
        valX, retEndY + 6, { align: "right" },
      );
      // Net after refund
      const net = invoice.total - invoice.totalRefunded;
      doc.setTextColor(25, 50, 180);
      doc.text(`Net Amount: ${sym}${net.toLocaleString()}`, valX, retEndY + 13, { align: "right" });
    }
  }

  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(160, 160, 160);
  doc.text("Thank you for your business.", 14, 282);
  doc.text(shop, W - 14, 282, { align: "right" });

  return doc;
}

export function generateInvoicePdf(invoice: InvoiceData) {
  buildInvoiceDoc(invoice).save(`${invoice.invoiceNumber}.pdf`);
}

/** Returns a PDF Blob — use with navigator.share({ files }) for WhatsApp sharing */
export function generateInvoicePdfBlob(invoice: InvoiceData): Blob {
  return buildInvoiceDoc(invoice).output("blob") as Blob;
}

// ─────────────────────────────────────────────────────────────────────────────
// Repair Voucher — A5, larger fonts, bold design
// ─────────────────────────────────────────────────────────────────────────────
function buildRepairDoc(r: RepairVoucherData): jsPDF {
  const sym  = r.currencySymbol ?? "$";
  const shop = (r.shopName ?? "My Shop").trim();
  // A5 portrait: 148 × 210 mm
  const doc  = new jsPDF({ unit: "mm", format: "a5" });
  const W    = doc.internal.pageSize.getWidth();   // 148
  const H    = doc.internal.pageSize.getHeight();  // 210
  const L    = 10;   // left margin
  const R    = W - L;

  const dueAmt  = Math.max(0, r.totalCost - r.advancePaid);
  const isPaid  = r.isPaid || dueAmt <= 0;

  const statusColor: Record<string, [number, number, number]> = {
    "Waiting":   [245, 158, 11],
    "Repairing": [25,  50, 180],
    "Ready":     [16, 185, 129],
    "Delivered": [107, 114, 128],
    "Cancelled": [239,  68,  68],
  };
  const [hr, hg, hb] = statusColor[r.status] ?? [25, 50, 180];

  // ── Header ───────────────────────────────────────────────────────────────────
  doc.setFillColor(hr, hg, hb);
  doc.rect(0, 0, W, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(shop, L, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Repair Voucher", L, 18);

  // Repair ID on right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(`#${r.id}`, R, 12, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(new Date(r.createdAt).toLocaleDateString(), R, 18, { align: "right" });

  // Status badge
  const stText  = r.status.toUpperCase();
  const stW     = doc.getTextWidth(stText) + 6;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(L, 21, stW, 5.5, 1, 1, "F");
  doc.setTextColor(hr, hg, hb);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.text(stText, L + stW / 2, 25, { align: "center" });
  doc.setTextColor(0, 0, 0);

  // ── Customer ─────────────────────────────────────────────────────────────────
  let y = 34;
  doc.setFillColor(240, 242, 255);
  doc.roundedRect(L, y, W - 2 * L, 16, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(hr, hg, hb);
  doc.text(r.customerName, L + 4, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  if (r.customerPhone) doc.text(r.customerPhone, L + 4, y + 13);
  doc.setTextColor(0, 0, 0);

  // ── Device ───────────────────────────────────────────────────────────────────
  y += 20;
  doc.setFillColor(hr, hg, hb);
  doc.roundedRect(L, y, W - 2 * L, 6, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text("DEVICE & PROBLEM", L + 4, y + 4);
  doc.setTextColor(0, 0, 0);

  y += 9;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`${r.phoneBrand} ${r.phoneModel}`, L, y);

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  // Word wrap problem text
  const problemLines = doc.splitTextToSize(r.problem, W - 2 * L);
  doc.text(problemLines, L, y);
  y += problemLines.length * 5;

  if (r.imei) {
    doc.setFontSize(7.5);
    doc.setTextColor(130, 130, 130);
    doc.text(`IMEI: ${r.imei}`, L, y);
    y += 5;
  }
  doc.setTextColor(0, 0, 0);

  // ── Parts ────────────────────────────────────────────────────────────────────
  if (r.parts.length > 0) {
    y += 3;
    doc.setFillColor(hr, hg, hb);
    doc.roundedRect(L, y, W - 2 * L, 6, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text("PARTS USED", L + 4, y + 4);
    doc.setTextColor(0, 0, 0);

    autoTable(doc, {
      startY: y + 7,
      head: [["Part", "Qty", `Price (${sym})`]],
      body: r.parts.map(p => [
        p.name,
        String(p.qty),
        (p.unitPrice * p.qty).toLocaleString(),
      ]),
      theme: "grid",
      headStyles: { fillColor: [hr, hg, hb], fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 8.5 },
      columnStyles: {
        1: { halign: "center", cellWidth: 14 },
        2: { halign: "right",  cellWidth: 30 },
      },
      margin: { left: L, right: L },
    });
    y = (doc as any).lastAutoTable?.finalY ?? y + 30;
  }

  // ── Billing ──────────────────────────────────────────────────────────────────
  y += 4;
  doc.setFillColor(hr, hg, hb);
  doc.roundedRect(L, y, W - 2 * L, 6, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text("BILLING", L + 4, y + 4);
  doc.setTextColor(0, 0, 0);

  y += 9;
  const valX = R;
  const labX = L;

  function billingRow(label: string, value: string, bold = false, color?: [number, number, number]) {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 11 : 9.5);
    if (color) doc.setTextColor(...color);
    else doc.setTextColor(0, 0, 0);
    doc.text(label, labX, y);
    doc.text(value, valX, y, { align: "right" });
    y += bold ? 8 : 6;
  }

  if (r.laborCost > 0) billingRow("Labor", `${sym}${r.laborCost.toLocaleString()}`);
  if (r.parts.length > 0) {
    const partsTotal = r.parts.reduce((s, p) => s + p.unitPrice * p.qty, 0);
    if (partsTotal > 0) billingRow("Parts", `${sym}${partsTotal.toLocaleString()}`);
  }

  // divider
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(labX, y - 2, valX, y - 2);

  billingRow("TOTAL", `${sym}${r.totalCost.toLocaleString()}`, true, [hr, hg, hb]);

  if (r.advancePaid > 0) {
    billingRow("Advance Paid", `${sym}${r.advancePaid.toLocaleString()}`, false, [22, 163, 74]);
  }

  if (isPaid) {
    // Paid box
    doc.setFillColor(220, 252, 231);
    doc.setDrawColor(22, 163, 74);
    doc.setLineWidth(0.5);
    doc.roundedRect(labX, y - 1, W - 2 * L, 10, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(22, 163, 74);
    doc.text("✓ FULLY PAID", W / 2, y + 5.5, { align: "center" });
    y += 14;
  } else if (dueAmt > 0) {
    // Due highlighted
    doc.setFillColor(254, 226, 226);
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(0.5);
    doc.roundedRect(labX, y - 1, W - 2 * L, 12, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(220, 38, 38);
    doc.text("AMOUNT DUE", labX + 4, y + 5.5);
    doc.setFontSize(13);
    doc.text(`${sym}${dueAmt.toLocaleString()}`, valX - 4, y + 7, { align: "right" });
    y += 16;
  }

  doc.setTextColor(0, 0, 0);

  // ── Technician & Notes ───────────────────────────────────────────────────────
  if (r.engineer) {
    y += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Technician:", labX, y);
    doc.setFont("helvetica", "normal");
    doc.text(r.engineer, labX + 24, y);
    y += 6;
  }

  if (r.notes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Notes:", labX, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const noteLines = doc.splitTextToSize(r.notes, W - 2 * L);
    doc.text(noteLines, labX, y);
    y += noteLines.length * 4.5;
  }

  if (r.warrantyDays && r.warrantyDays > 0) {
    y += 2;
    doc.setFillColor(240, 249, 255);
    doc.setDrawColor(25, 50, 180);
    doc.setLineWidth(0.3);
    doc.roundedRect(labX, y, W - 2 * L, 8, 1.5, 1.5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(25, 50, 180);
    doc.text(`★ Warranty: ${r.warrantyDays} days`, W / 2, y + 5, { align: "center" });
    y += 11;
    doc.setTextColor(0, 0, 0);
  }

  // ── Footer ───────────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(180, 180, 180);
  doc.text("Thank you for choosing " + shop, W / 2, H - 6, { align: "center" });

  return doc;
}

export function generateRepairPdf(r: RepairVoucherData) {
  buildRepairDoc(r).save(`Repair-${r.id}-${r.phoneBrand}-${r.phoneModel}.pdf`.replace(/\s+/g, "-"));
}

/** Returns a PDF Blob — use with navigator.share({ files }) for WhatsApp sharing */
export function generateRepairPdfBlob(r: RepairVoucherData): Blob {
  return buildRepairDoc(r).output("blob") as Blob;
}


// ── Sales Report ──────────────────────────────────────────────────────────────
export interface DateWiseSaleRow {
  invoiceNumber: string;
  date: string;
  customerName?: string | null;
  total: number;
  totalRefund?: number; // total refunded amount for this sale
  advancePaid?: number; // advance paid for credit sales
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
  const fmt  = (n: number) =>
    `${sym}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // ── Computed summary values ─────────────────────────────────────────────
  const completedRows  = rows.filter(r => r.status === "Completed" || r.status === "Partially Returned");
  const returnedRows   = rows.filter(r => r.status === "Returned");

  const grossSales     = rows.reduce((s, r) => s + r.total, 0);
  const totalReturned  = rows.reduce((s, r) => s + (r.totalRefund ?? 0), 0);
  const netRevenue     = grossSales - totalReturned;

  const cashTotal      = rows.filter(r => r.paymentMethod === "Cash")
                             .reduce((s, r) => s + r.total, 0);
  const creditTotal    = rows.filter(r => r.paymentMethod === "Credit")
                             .reduce((s, r) => s + r.total, 0);
  const creditDue      = rows.reduce((s, r) => {
    if (r.paymentMethod !== "Credit") return s;
    if (r.status === "Returned") return s;
    const due = r.total - (r.advancePaid ?? 0) - (r.totalRefund ?? 0);
    return s + (due > 0.005 ? due : 0);
  }, 0);

  const completedCount = completedRows.length;
  const returnedCount  = returnedRows.length;

  // ── Header band ─────────────────────────────────────────────────────────
  doc.setFillColor(25, 50, 180);
  doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(shop, 14, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Sales Report", 14, 20);
  doc.text(`${from || "All time"} — ${to || "Now"}`, W - 14, 20, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(`${rows.length} invoice${rows.length !== 1 ? "s" : ""}`, W - 14, 26, { align: "right" });
  doc.setTextColor(0, 0, 0);

  // ── Summary boxes (2 rows × 3 cols) ─────────────────────────────────────
  const boxY  = 34;
  const boxH  = 20;
  const cols  = 3;
  const gap   = 3;
  const boxW  = (W - 28 - gap * (cols - 1)) / cols;

  type RGB = [number, number, number];
  const summaryItems: { label: string; value: string; textRgb: RGB; bgRgb: RGB }[] = [
    { label: "Gross Sales",  value: fmt(grossSales),   textRgb: [37,  99,  235], bgRgb: [239, 246, 255] },
    { label: "Total Returns",value: fmt(totalReturned),textRgb: [220, 38,  38],  bgRgb: [254, 242, 242] },
    { label: "Net Revenue",  value: fmt(netRevenue),   textRgb: [5,   150, 105], bgRgb: [236, 253, 245] },
    { label: "Cash Sales",   value: fmt(cashTotal),    textRgb: [55,  65,  81],  bgRgb: [249, 250, 251] },
    { label: "Credit Sales", value: fmt(creditTotal),  textRgb: [124, 58,  237], bgRgb: [245, 243, 255] },
    {
      label: "Credit Due",
      value: fmt(creditDue),
      textRgb: creditDue > 0.005 ? [220, 38, 38]  : [55, 65, 81],
      bgRgb:   creditDue > 0.005 ? [254, 242, 242] : [249, 250, 251],
    },
  ];

  summaryItems.forEach((item, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const x   = 14 + col * (boxW + gap);
    const y   = boxY + row * (boxH + gap);

    doc.setFillColor(...item.bgRgb);
    doc.roundedRect(x, y, boxW, boxH, 2, 2, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(107, 114, 128);
    doc.text(item.label.toUpperCase(), x + 3, y + 5.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...item.textRgb);
    doc.text(item.value, x + 3, y + 14);
  });

  // ── Completed / Returned count chips ────────────────────────────────────
  const chipY = boxY + 2 * (boxH + gap) + 4;

  doc.setFillColor(236, 253, 245);
  doc.roundedRect(14, chipY, 58, 7, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(5, 150, 105);
  doc.text(`✓  ${completedCount} Completed`, 43, chipY + 4.8, { align: "center" });

  doc.setFillColor(254, 242, 242);
  doc.roundedRect(76, chipY, 58, 7, 1.5, 1.5, "F");
  doc.setTextColor(220, 38, 38);
  doc.text(`✕  ${returnedCount} Returned`, 105, chipY + 4.8, { align: "center" });

  doc.setTextColor(0, 0, 0);

  // ── Invoice table ────────────────────────────────────────────────────────
  const tableStartY = chipY + 12;

  type StatusColors = { text: RGB; bg: RGB };
  const statusColorMap: Record<string, StatusColors> = {
    "Completed":          { text: [5,   150, 105], bg: [236, 253, 245] },
    "Returned":           { text: [220,  38,  38], bg: [254, 242, 242] },
    "Partially Returned": { text: [217, 119,   6], bg: [255, 247, 230] },
  };

  autoTable(doc, {
    startY: tableStartY,
    head: [["Invoice", "Date", "Customer", `Total (${sym})`, `Refund (${sym})`, "Payment", "Status"]],
    body: rows.map(r => [
      r.invoiceNumber,
      r.date,
      r.customerName ?? "—",
      r.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      r.totalRefund && r.totalRefund > 0
        ? r.totalRefund.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : "—",
      r.paymentMethod,
      r.status,
    ]),
    theme: "striped",
    headStyles:   { fillColor: [25, 50, 180], fontSize: 7.5, fontStyle: "bold" },
    bodyStyles:   { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      3: { halign: "right" },
      4: { halign: "right" },
      6: { minCellWidth: 22 }, // wide enough for "Completed" badge
    },
    margin: { left: 14, right: 14 },
    // Blank out cells we will redraw ourselves so autoTable text
    // doesn't show through and create a double-text / strikethrough effect.
    willDrawCell: (data: any) => {
      if (data.section !== "body") return;
      // Status chip (col 6) — always blank the raw text
      if (data.column.index === 6) {
        data.cell.text = [""];
      }
      // Refund amount (col 4) — blank only when there is a real value
      if (data.column.index === 4 && String(data.cell.raw ?? "") !== "—") {
        data.cell.text = [""];
      }
    },
    didDrawCell: (data: any) => {
      // Colour-code the Status column (index 6)
      if (data.section === "body" && data.column.index === 6) {
        const status  = String(data.cell.raw ?? "");
        const colors  = statusColorMap[status];
        if (colors) {
          const { x, y, width, height } = data.cell;
          doc.setFillColor(...colors.bg);
          doc.roundedRect(x + 0.5, y + 0.8, width - 1, height - 1.5, 1, 1, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(6);
          doc.setTextColor(...colors.text);
          const label = status === "Partially Returned" ? "Part. Return" : status;
          doc.text(label, x + width / 2, y + height / 2 + 0.5, { align: "center" });
        }
      }
      // Colour return amounts red (drawn fresh — no underlying text)
      if (data.section === "body" && data.column.index === 4) {
        const val = String(data.cell.raw ?? "");
        if (val !== "—") {
          const { x, y, width, height } = data.cell;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(7);
          doc.setTextColor(220, 38, 38);
          doc.text(val, x + width - 1.5, y + height / 2 + 0.5, { align: "right" });
        }
      }
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY ?? tableStartY + 20;

  // ── Summary footer ───────────────────────────────────────────────────────
  // Guard: if the table runs close to the page bottom, add a new page so
  // the 4-line footer (4 × 7mm ≈ 28mm) plus separator (6mm) fits safely.
  const footerHeight = 6 + 28 + 16; // separator + 4 lines + underline/watermark room
  if (finalY + footerHeight > 275) {
    doc.addPage();
  }
  const sumY = finalY + footerHeight > 275
    ? 20   // fresh page — start near top
    : finalY + 6;
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.line(14, sumY, W - 14, sumY);
  // Note: summary labels are at W-75 and values at W-22 to keep clear of
  // mobile PDF viewer FAB buttons that sit in the bottom-right corner.

  const summaryLines: [string, string, RGB][] = [
    ["Gross Sales",    fmt(grossSales),                [37,  99, 235]],
    ["Total Returns",  `- ${fmt(totalReturned)}`,      [220,  38,  38]],
    ["Net Revenue",    fmt(netRevenue),                [5,  150, 105]],
    ["Credit Due",     fmt(creditDue),                 creditDue > 0.005 ? [220, 38, 38] : [107, 114, 128]],
  ];

  let lineY = sumY + 7;
  summaryLines.forEach(([label, value, color]) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(75, 85, 99);
    doc.text(label, W - 75, lineY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...color);
    doc.text(value, W - 22, lineY, { align: "right" });
    lineY += 7;
  });

  // Underline Net Revenue
  doc.setDrawColor(5, 150, 105);
  doc.setLineWidth(0.4);
  doc.line(W - 75, lineY - 11, W - 22, lineY - 11);

  // ── Watermark footer ─────────────────────────────────────────────────────
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(160, 160, 160);
  doc.text(`Generated by ${shop}`, W - 14, 287, { align: "right" });

  doc.save(`sales-report_${from || "all"}_${to || "all"}.pdf`);
}
