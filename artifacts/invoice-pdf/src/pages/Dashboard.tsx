import React, { useState, useRef } from 'react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Plus,
  Trash2,
  FileDown,
  Store,
  CalendarDays,
  FileText,
  ShoppingCart,
} from 'lucide-react';

const generateId = () =>
  Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

export type TransactionType = 'Sale' | 'Return';

export interface Transaction {
  id: string;
  type: TransactionType;
  productName: string;
  sku: string;
  orderNumber: string;
  qty: number;
  unit: string;
  unitPrice: number;
  date: string;
}

const defaultTransactions: Transaction[] = [
  { id: generateId(), type: 'Sale',   productName: 'Burger',   sku: '1001',   orderNumber: '1753204183510', qty: 3, unit: 'pcs', unitPrice: 100.00, date: format(new Date(), 'yyyy-MM-dd') },
  { id: generateId(), type: 'Return', productName: 'Burger',   sku: '1001',   orderNumber: '1753204200062', qty: 2, unit: 'pcs', unitPrice: 150.00, date: format(new Date(), 'yyyy-MM-dd') },
  { id: generateId(), type: 'Return', productName: 'Chowmein', sku: '1001',   orderNumber: '1753204155633', qty: 2, unit: 'pcs', unitPrice: 150.00, date: format(new Date(), 'yyyy-MM-dd') },
  { id: generateId(), type: 'Sale',   productName: 'Tiramisu', sku: '200383', orderNumber: '1753204155633', qty: 1, unit: 'pcs', unitPrice: 100.00, date: format(new Date(), 'yyyy-MM-dd') },
  { id: generateId(), type: 'Sale',   productName: 'Chowmein', sku: '1001',   orderNumber: '1753204155633', qty: 1, unit: 'pcs', unitPrice: 150.00, date: format(new Date(), 'yyyy-MM-dd') },
];

export default function Dashboard() {
  const [title, setTitle] = useState('Item Sales Report');
  const [storeName, setStoreName] = useState('Store');
  const [generatedDate, setGeneratedDate] = useState(
    format(new Date(), 'dd MMM yyyy, hh:mm a')
  );
  const [transactions, setTransactions] = useState<Transaction[]>(defaultTransactions);
  const [isExporting, setIsExporting] = useState(false);

  // Computed totals
  const totalRevenue     = transactions.filter(t => t.type === 'Sale').reduce((s, t) => s + t.qty * t.unitPrice, 0);
  const returnValue      = transactions.filter(t => t.type === 'Return').reduce((s, t) => s + t.qty * t.unitPrice, 0);
  const totalSalesCount  = transactions.filter(t => t.type === 'Sale').length;
  const totalReturnsCount = transactions.filter(t => t.type === 'Return').length;
  const soldItemsQty     = transactions.filter(t => t.type === 'Sale').reduce((s, t) => s + t.qty, 0);
  const returnedItemsQty = transactions.filter(t => t.type === 'Return').reduce((s, t) => s + t.qty, 0);

  const fmt = (n: number) => n.toFixed(2);

  const handleAddTransaction = () => {
    setTransactions(prev => [...prev, {
      id: generateId(), type: 'Sale', productName: '', sku: '',
      orderNumber: '', qty: 1, unit: 'pcs', unitPrice: 0,
      date: format(new Date(), 'yyyy-MM-dd'),
    }]);
  };

  const handleUpdate = (id: string, field: keyof Transaction, value: any) =>
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));

  const handleDelete = (id: string) =>
    setTransactions(prev => prev.filter(t => t.id !== id));

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      const el = document.getElementById('invoice-preview');
      if (!el) return;
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, logging: false });
      const img = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(img, 'PNG', 0, 0, w, h);
      pdf.save(`${title.replace(/\s+/g, '-').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } finally {
      setIsExporting(false);
    }
  };

  const inputCls = 'block w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white';
  const labelCls = 'text-[10px] font-semibold text-gray-500 uppercase tracking-wide';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-700" />
          <h1 className="text-lg font-bold text-gray-900">Sales Report Generator</h1>
        </div>
        <button
          onClick={handleExportPdf}
          disabled={isExporting}
          className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {isExporting
            ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <FileDown className="h-4 w-4" />}
          {isExporting ? 'Generating...' : 'Export PDF'}
        </button>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row p-4 lg:p-6 gap-6 overflow-auto">

        {/* ── LEFT: Form ── */}
        <div className="w-full lg:w-[42%] flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-base font-semibold text-gray-800">Report Details</h2>
            <p className="text-xs text-gray-500 mt-0.5">Fill in report info and add transactions.</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Meta */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className={labelCls}>Report Title</label>
                <div className="relative">
                  <FileText className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputCls + ' pl-8'} />
                </div>
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Store Name</label>
                <div className="relative">
                  <Store className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input type="text" value={storeName} onChange={e => setStoreName(e.target.value)} className={inputCls + ' pl-8'} />
                </div>
              </div>
              <div className="col-span-2 space-y-1">
                <label className={labelCls}>Generated Date &amp; Time</label>
                <div className="relative">
                  <CalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input type="text" value={generatedDate} onChange={e => setGeneratedDate(e.target.value)} className={inputCls + ' pl-8'} />
                </div>
              </div>
            </div>

            {/* Transactions */}
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">Transactions</h3>
                  <p className="text-xs text-gray-400">Add sale &amp; return rows</p>
                </div>
                <button
                  onClick={handleAddTransaction}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Row
                </button>
              </div>

              {transactions.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg">
                  <ShoppingCart className="mx-auto h-7 w-7 text-gray-300 mb-2" />
                  <p className="text-sm text-gray-400">No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((t) => (
                    <div key={t.id} className="group relative border border-gray-200 rounded-lg p-3 bg-white hover:border-gray-300 transition-colors">
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="absolute -top-2 -right-2 bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>

                      <div className="grid grid-cols-12 gap-2">
                        {/* Type */}
                        <div className="col-span-4 space-y-0.5">
                          <label className={labelCls}>Type</label>
                          <select
                            value={t.type}
                            onChange={e => handleUpdate(t.id, 'type', e.target.value)}
                            className={`${inputCls} ${t.type === 'Sale' ? 'text-blue-700 border-blue-200 bg-blue-50' : 'text-red-600 border-red-200 bg-red-50'}`}
                          >
                            <option value="Sale">Sale</option>
                            <option value="Return">Return</option>
                          </select>
                        </div>
                        {/* Product */}
                        <div className="col-span-8 space-y-0.5">
                          <label className={labelCls}>Product</label>
                          <input type="text" value={t.productName} onChange={e => handleUpdate(t.id, 'productName', e.target.value)} placeholder="Product name" className={inputCls} />
                        </div>
                        {/* SKU */}
                        <div className="col-span-4 space-y-0.5">
                          <label className={labelCls}>SKU</label>
                          <input type="text" value={t.sku} onChange={e => handleUpdate(t.id, 'sku', e.target.value)} placeholder="SKU" className={inputCls} />
                        </div>
                        {/* Order */}
                        <div className="col-span-8 space-y-0.5">
                          <label className={labelCls}>Order #</label>
                          <input type="text" value={t.orderNumber} onChange={e => handleUpdate(t.id, 'orderNumber', e.target.value)} placeholder="Order number" className={inputCls} />
                        </div>
                        {/* Qty */}
                        <div className="col-span-3 space-y-0.5">
                          <label className={labelCls}>Qty</label>
                          <input type="number" min="1" value={t.qty} onChange={e => handleUpdate(t.id, 'qty', parseInt(e.target.value) || 0)} className={inputCls} />
                        </div>
                        {/* Unit */}
                        <div className="col-span-3 space-y-0.5">
                          <label className={labelCls}>Unit</label>
                          <input type="text" value={t.unit} onChange={e => handleUpdate(t.id, 'unit', e.target.value)} placeholder="pcs" className={inputCls} />
                        </div>
                        {/* Unit Price */}
                        <div className="col-span-3 space-y-0.5">
                          <label className={labelCls}>Price</label>
                          <input type="number" min="0" step="0.01" value={t.unitPrice} onChange={e => handleUpdate(t.id, 'unitPrice', parseFloat(e.target.value) || 0)} className={inputCls} />
                        </div>
                        {/* Date */}
                        <div className="col-span-3 space-y-0.5">
                          <label className={labelCls}>Date</label>
                          <input type="date" value={t.date} onChange={e => handleUpdate(t.id, 'date', e.target.value)} className={inputCls} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Invoice Preview ── */}
        <div className="w-full lg:flex-1 flex flex-col bg-gray-300 rounded-xl overflow-hidden shadow-inner border border-gray-400">
          <div className="py-2 px-4 bg-gray-400/60 border-b border-gray-400 text-center">
            <span className="text-[11px] font-bold text-gray-600 uppercase tracking-widest">A4 Document Preview</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center">
            {/* A4 Paper */}
            <div
              id="invoice-preview"
              style={{
                backgroundColor: '#ffffff',
                color: '#111827',
                fontFamily: 'Arial, sans-serif',
                width: '794px',
                minHeight: '1123px',
                padding: '48px 52px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
              }}
            >
              {/* ── Report Header ── */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#1565C0', letterSpacing: '0.01em' }}>
                    {title || 'Item Sales Report'}
                  </div>
                  <div style={{ fontSize: '13px', color: '#374151', marginTop: '4px' }}>{storeName || 'Store'}</div>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>Generated on {generatedDate}</div>
                </div>
                {/* Right summary box — matches screenshot right-side values */}
                <div style={{ textAlign: 'right', fontSize: '12px', color: '#374151' }}>
                  <table style={{ borderCollapse: 'collapse', marginLeft: 'auto' }}>
                    <tbody>
                      <tr>
                        <td style={{ paddingBottom: '4px', paddingRight: '16px', color: '#6B7280' }}>Total Revenue</td>
                        <td style={{ paddingBottom: '4px', fontWeight: '700', textAlign: 'right' }}>{fmt(totalRevenue)}</td>
                      </tr>
                      <tr>
                        <td style={{ paddingBottom: '4px', paddingRight: '16px', color: '#6B7280' }}>Total Returns</td>
                        <td style={{ paddingBottom: '4px', fontWeight: '700', textAlign: 'right' }}>{totalReturnsCount}</td>
                      </tr>
                      <tr>
                        <td style={{ paddingRight: '16px', color: '#6B7280' }}>Returned Items</td>
                        <td style={{ fontWeight: '700', textAlign: 'right' }}>{returnedItemsQty}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Left summary row — matches screenshot left-side values */}
              <div style={{ display: 'flex', gap: '40px', fontSize: '12px', marginBottom: '14px', color: '#374151' }}>
                <div><span style={{ color: '#6B7280' }}>Total Sales</span>&nbsp;&nbsp;<strong>{totalSalesCount}</strong></div>
                <div><span style={{ color: '#6B7280' }}>Sold Items</span>&nbsp;&nbsp;<strong>{soldItemsQty}</strong></div>
                <div><span style={{ color: '#6B7280' }}>Return Value</span>&nbsp;&nbsp;<strong>{fmt(returnValue)}</strong></div>
              </div>

              {/* Blue divider */}
              <div style={{ width: '100%', height: '2px', backgroundColor: '#1565C0', marginBottom: '16px' }} />

              {/* Transactions heading */}
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '10px' }}>
                Transactions ({transactions.length})
              </div>

              {/* Transactions Table — all columns separate, matching screenshot */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid #D1D5DB', backgroundColor: '#F9FAFB' }}>
                    {['#', 'Type', 'Product', 'SKU', 'Order', 'Qty', 'Unit', 'Unit Price', 'Total Value', 'Date'].map(h => (
                      <th
                        key={h}
                        style={{
                          padding: '7px 6px',
                          textAlign: ['#', 'Qty', 'Unit Price', 'Total Value'].includes(h) ? 'right' : 'left',
                          fontWeight: '700',
                          color: '#374151',
                          fontSize: '11px',
                          whiteSpace: 'nowrap',
                        }}
                      >{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: '12px' }}>
                        No transactions in this report.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((t, i) => {
                      const total = t.qty * t.unitPrice;
                      const isReturn = t.type === 'Return';
                      return (
                        <tr key={t.id} style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: i % 2 === 1 ? '#FAFAFA' : '#FFFFFF' }}>
                          <td style={{ padding: '6px 6px', textAlign: 'right', color: '#6B7280' }}>{i + 1}</td>
                          <td style={{ padding: '6px 6px', color: isReturn ? '#DC2626' : '#1D4ED8', fontWeight: '600' }}>
                            {t.type}
                          </td>
                          <td style={{ padding: '6px 6px', fontWeight: '500' }}>{t.productName || '-'}</td>
                          <td style={{ padding: '6px 6px', color: '#6B7280' }}>{t.sku || '-'}</td>
                          <td style={{ padding: '6px 6px', color: '#6B7280', fontSize: '10px' }}>{t.orderNumber || 'N/A'}</td>
                          <td style={{ padding: '6px 6px', textAlign: 'right' }}>{t.qty}</td>
                          <td style={{ padding: '6px 6px', color: '#6B7280' }}>{t.unit}</td>
                          <td style={{ padding: '6px 6px', textAlign: 'right' }}>{fmt(t.unitPrice)}</td>
                          <td style={{ padding: '6px 6px', textAlign: 'right', fontWeight: '600', color: isReturn ? '#DC2626' : '#111827' }}>
                            {isReturn ? '-' : ''}{fmt(total)}
                          </td>
                          <td style={{ padding: '6px 6px', color: '#6B7280', whiteSpace: 'nowrap', fontSize: '10px' }}>{t.date}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {/* Footer */}
              <div style={{ marginTop: '40px', paddingTop: '10px', borderTop: '1px solid #E5E7EB', textAlign: 'center', fontSize: '10px', color: '#9CA3AF' }}>
                Generated on {generatedDate}
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
