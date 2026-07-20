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
  DollarSign,
  Undo2,
  TrendingUp,
  Package,
  ShoppingCart
} from 'lucide-react';

const generateId = () => {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
};

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
  { id: generateId(), type: 'Sale', productName: 'Wireless Mouse', sku: 'WM-001', orderNumber: 'ORD-1001', qty: 2, unit: 'pcs', unitPrice: 25.00, date: format(new Date(), 'yyyy-MM-dd') },
  { id: generateId(), type: 'Sale', productName: 'Mechanical Keyboard', sku: 'MK-002', orderNumber: 'ORD-1001', qty: 1, unit: 'pcs', unitPrice: 89.99, date: format(new Date(), 'yyyy-MM-dd') },
  { id: generateId(), type: 'Return', productName: 'USB-C Cable', sku: 'UC-003', orderNumber: 'ORD-0998', qty: 1, unit: 'pcs', unitPrice: 12.50, date: format(new Date(), 'yyyy-MM-dd') },
  { id: generateId(), type: 'Sale', productName: 'Monitor Stand', sku: 'MS-004', orderNumber: 'ORD-1002', qty: 3, unit: 'pcs', unitPrice: 45.00, date: format(new Date(), 'yyyy-MM-dd') },
];

export default function Dashboard() {
  const [title, setTitle] = useState('Item Sales Report');
  const [storeName, setStoreName] = useState('Acme Retail Store');
  const [generatedDate, setGeneratedDate] = useState(format(new Date(), "MMM dd, yyyy HH:mm"));
  const [transactions, setTransactions] = useState<Transaction[]>(defaultTransactions);
  const [isExporting, setIsExporting] = useState(false);

  // Computed totals
  const totalRevenue = transactions.filter(t => t.type === 'Sale').reduce((sum, t) => sum + (t.qty * t.unitPrice), 0);
  const returnValue = transactions.filter(t => t.type === 'Return').reduce((sum, t) => sum + (t.qty * t.unitPrice), 0);
  const totalSalesCount = transactions.filter(t => t.type === 'Sale').length;
  const totalReturnsCount = transactions.filter(t => t.type === 'Return').length;
  const soldItemsCount = transactions.filter(t => t.type === 'Sale').reduce((sum, t) => sum + t.qty, 0);
  const returnedItemsCount = transactions.filter(t => t.type === 'Return').reduce((sum, t) => sum + t.qty, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const handleAddTransaction = () => {
    setTransactions([
      ...transactions,
      {
        id: generateId(),
        type: 'Sale',
        productName: '',
        sku: '',
        orderNumber: '',
        qty: 1,
        unit: 'pcs',
        unitPrice: 0,
        date: format(new Date(), 'yyyy-MM-dd')
      }
    ]);
  };

  const handleUpdateTransaction = (id: string, field: keyof Transaction, value: any) => {
    setTransactions(transactions.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      const element = document.getElementById('invoice-preview');
      if (!element) return;
      
      const canvas = await html2canvas(element, { 
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${title.replace(/\s+/g, '-').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2 text-primary">
          <FileText className="h-6 w-6" />
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Report Generator</h1>
        </div>
        <button 
          onClick={handleExportPdf}
          disabled={isExporting}
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {isExporting ? (
             <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1" />
          ) : (
            <FileDown className="h-4 w-4" />
          )}
          {isExporting ? 'Generating PDF...' : 'Export PDF'}
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col lg:flex-row p-4 lg:p-6 gap-6 h-[calc(100vh-73px)] overflow-hidden">
        
        {/* Left Panel: Form & Data Entry */}
        <div className="w-full lg:w-1/2 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-800">Report Details</h2>
            <p className="text-sm text-gray-500">Configure report headers and update transaction data.</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5">
            <div className="space-y-5">
              
              {/* General Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Report Title</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FileText className="h-4 w-4 text-gray-400" />
                    </div>
                    <input 
                      type="text" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary bg-white text-gray-900"
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Store Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Store className="h-4 w-4 text-gray-400" />
                    </div>
                    <input 
                      type="text" 
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary bg-white text-gray-900"
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Generated Date & Time</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarDays className="h-4 w-4 text-gray-400" />
                    </div>
                    <input 
                      type="text" 
                      value={generatedDate}
                      onChange={(e) => setGeneratedDate(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary bg-white text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Transactions Section */}
              <div className="pt-4 mt-2 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-md font-semibold text-gray-800">Transactions</h3>
                    <p className="text-xs text-gray-500">Manage line items for the report</p>
                  </div>
                  <button 
                    onClick={handleAddTransaction}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Row
                  </button>
                </div>

                <div className="space-y-3">
                  {transactions.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                      <ShoppingCart className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                      <p className="text-sm font-medium text-gray-600">No transactions added</p>
                      <p className="text-xs text-gray-400 mt-1">Add a transaction to see it in the report.</p>
                    </div>
                  ) : (
                    transactions.map((t, index) => (
                      <div key={t.id} className="group relative border border-gray-200 rounded-lg bg-white p-3 shadow-sm hover:border-gray-300 transition-colors">
                        <button
                          onClick={() => handleDeleteTransaction(t.id)}
                          className="absolute -top-2.5 -right-2.5 bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 rounded-full p-1.5 shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10"
                          title="Remove row"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        
                        <div className="grid grid-cols-12 gap-3">
                          {/* Top Row: Type & Product Info */}
                          <div className="col-span-12 sm:col-span-3">
                            <label className="text-[10px] font-semibold text-gray-500 uppercase">Type</label>
                            <select
                              value={t.type}
                              onChange={(e) => handleUpdateTransaction(t.id, 'type', e.target.value as TransactionType)}
                              className={`block w-full py-1.5 px-2 border rounded-md text-sm font-medium focus:ring-1 focus:outline-none ${
                                t.type === 'Sale' 
                                  ? 'border-blue-200 bg-blue-50 text-blue-700 focus:border-blue-400 focus:ring-blue-400' 
                                  : 'border-orange-200 bg-orange-50 text-orange-700 focus:border-orange-400 focus:ring-orange-400'
                              }`}
                            >
                              <option value="Sale">Sale</option>
                              <option value="Return">Return</option>
                            </select>
                          </div>
                          
                          <div className="col-span-12 sm:col-span-6">
                            <label className="text-[10px] font-semibold text-gray-500 uppercase">Product Name</label>
                            <input
                              type="text"
                              value={t.productName}
                              onChange={(e) => handleUpdateTransaction(t.id, 'productName', e.target.value)}
                              placeholder="E.g. Wireless Mouse"
                              className="block w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                            />
                          </div>

                          <div className="col-span-12 sm:col-span-3">
                            <label className="text-[10px] font-semibold text-gray-500 uppercase">Date</label>
                            <input
                              type="date"
                              value={t.date}
                              onChange={(e) => handleUpdateTransaction(t.id, 'date', e.target.value)}
                              className="block w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                            />
                          </div>

                          {/* Bottom Row: Details & Pricing */}
                          <div className="col-span-6 sm:col-span-3">
                            <label className="text-[10px] font-semibold text-gray-500 uppercase">SKU</label>
                            <input
                              type="text"
                              value={t.sku}
                              onChange={(e) => handleUpdateTransaction(t.id, 'sku', e.target.value)}
                              placeholder="SKU"
                              className="block w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                            />
                          </div>

                          <div className="col-span-6 sm:col-span-3">
                            <label className="text-[10px] font-semibold text-gray-500 uppercase">Order #</label>
                            <input
                              type="text"
                              value={t.orderNumber}
                              onChange={(e) => handleUpdateTransaction(t.id, 'orderNumber', e.target.value)}
                              placeholder="Order"
                              className="block w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                            />
                          </div>

                          <div className="col-span-4 sm:col-span-2">
                            <label className="text-[10px] font-semibold text-gray-500 uppercase">Qty</label>
                            <input
                              type="number"
                              min="1"
                              value={t.qty}
                              onChange={(e) => handleUpdateTransaction(t.id, 'qty', parseInt(e.target.value) || 0)}
                              className="block w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                            />
                          </div>
                          
                          <div className="col-span-4 sm:col-span-2">
                            <label className="text-[10px] font-semibold text-gray-500 uppercase">Unit</label>
                            <input
                              type="text"
                              value={t.unit}
                              onChange={(e) => handleUpdateTransaction(t.id, 'unit', e.target.value)}
                              placeholder="pcs"
                              className="block w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                            />
                          </div>

                          <div className="col-span-4 sm:col-span-2">
                            <label className="text-[10px] font-semibold text-gray-500 uppercase">Price</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={t.unitPrice}
                              onChange={(e) => handleUpdateTransaction(t.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="block w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Live Invoice Preview */}
        <div className="w-full lg:w-1/2 flex flex-col bg-gray-200 rounded-xl overflow-hidden shadow-inner border border-gray-300">
          <div className="p-3 bg-gray-300/50 border-b border-gray-300 flex justify-center">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">A4 Document Preview</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center custom-scrollbar">
            {/* 
              The actual A4 wrapper. 
              A4 aspect ratio is approx 1:1.414. We set a max-width and min-height to simulate the paper.
            */}
            <div 
              id="invoice-preview"
              className="bg-white shadow-xl w-full max-w-[800px] h-fit min-h-[1056px] px-10 py-12 relative flex flex-col font-sans"
              style={{
                /* We want crisp borders and explicit colors that translate well to html2canvas */
                color: '#1f2937' // text-gray-800 equivalent
              }}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h1 className="text-4xl font-extrabold text-[#1565C0] tracking-tight mb-2 uppercase" style={{ color: '#1565C0' }}>
                    {title || 'Item Sales Report'}
                  </h1>
                  <p className="text-xl font-medium text-gray-800">{storeName || 'Store Name'}</p>
                </div>
                <div className="text-right mt-2">
                  <p className="text-sm font-semibold text-gray-500 uppercase mb-1">Generated</p>
                  <p className="text-sm text-gray-800">{generatedDate}</p>
                </div>
              </div>

              {/* Summary Stats Grid */}
              <div className="mb-10 bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h2 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-3 mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-gray-500" />
                  Report Summary
                </h2>
                
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  {/* Left Column - Sales */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200/60">
                      <span className="text-sm font-medium text-gray-500">Total Revenue</span>
                      <span className="text-base font-bold text-gray-900">{formatCurrency(totalRevenue)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200/60">
                      <span className="text-sm font-medium text-gray-500">Total Sales (Count)</span>
                      <span className="text-base font-semibold text-gray-900">{totalSalesCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">Sold Items (Qty)</span>
                      <span className="text-base font-semibold text-gray-900">{soldItemsCount}</span>
                    </div>
                  </div>

                  {/* Right Column - Returns */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200/60">
                      <span className="text-sm font-medium text-gray-500">Return Value</span>
                      <span className="text-base font-bold text-gray-900">{formatCurrency(returnValue)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200/60">
                      <span className="text-sm font-medium text-gray-500">Total Returns (Count)</span>
                      <span className="text-base font-semibold text-gray-900">{totalReturnsCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">Returned Items (Qty)</span>
                      <span className="text-base font-semibold text-gray-900">{returnedItemsCount}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="w-full h-0.5 bg-[#1565C0] mb-8" style={{ backgroundColor: '#1565C0' }}></div>

              {/* Transactions Table */}
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-800 mb-4">
                  Transactions ({transactions.length})
                </h2>
                
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-300 text-gray-600">
                      <th className="py-3 px-2 font-bold w-12 text-center">#</th>
                      <th className="py-3 px-2 font-bold">Type</th>
                      <th className="py-3 px-2 font-bold">Product Details</th>
                      <th className="py-3 px-2 font-bold text-center">Date</th>
                      <th className="py-3 px-2 font-bold text-right">Qty</th>
                      <th className="py-3 px-2 font-bold text-right">Unit Price</th>
                      <th className="py-3 px-2 font-bold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-500 border-b border-gray-200">
                          No transactions included in this report.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((t, index) => {
                        const total = t.qty * t.unitPrice;
                        return (
                          <tr key={t.id} className="border-b border-gray-200 hover:bg-gray-50/50">
                            <td className="py-3 px-2 text-center text-gray-500 font-medium">
                              {index + 1}
                            </td>
                            <td className="py-3 px-2">
                              <span 
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                                  t.type === 'Sale' 
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                    : 'bg-orange-50 text-orange-700 border border-orange-200'
                                }`}
                                style={
                                  t.type === 'Sale'
                                    ? { backgroundColor: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }
                                    : { backgroundColor: '#fff7ed', color: '#c2410c', borderColor: '#fed7aa' }
                                }
                              >
                                {t.type}
                              </span>
                            </td>
                            <td className="py-3 px-2">
                              <div className="font-semibold text-gray-900">{t.productName || '-'}</div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                <span className="mr-3">SKU: {t.sku || '-'}</span>
                                <span>Order: {t.orderNumber || '-'}</span>
                              </div>
                            </td>
                            <td className="py-3 px-2 text-gray-600 text-center whitespace-nowrap">
                              {t.date}
                            </td>
                            <td className="py-3 px-2 text-right">
                              <span className="font-medium">{t.qty}</span> <span className="text-gray-500 text-xs">{t.unit}</span>
                            </td>
                            <td className="py-3 px-2 text-right text-gray-600 whitespace-nowrap">
                              {formatCurrency(t.unitPrice)}
                            </td>
                            <td className="py-3 px-2 text-right font-bold text-gray-900 whitespace-nowrap">
                              {t.type === 'Return' ? '-' : ''}{formatCurrency(total)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="mt-12 pt-4 border-t border-gray-200 text-center text-xs text-gray-400 font-medium">
                Report generated via Item Sales Report tool • {generatedDate}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
