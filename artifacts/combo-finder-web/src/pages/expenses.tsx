import { Plus, Search, Filter } from "lucide-react";

const expensesData = [
  { id: 1, date: "Oct 24, 2023", category: "Parts Procurement", amount: "$450.00", desc: "Batch order of iPhone screens from supplier" },
  { id: 2, date: "Oct 22, 2023", category: "Utilities", amount: "$120.00", desc: "Monthly internet bill" },
  { id: 3, date: "Oct 20, 2023", category: "Tools", amount: "$85.00", desc: "New heat gun and precision screwdrivers" },
  { id: 4, date: "Oct 15, 2023", category: "Rent", amount: "$1,200.00", desc: "Shop monthly rent" },
];

export default function Expenses() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Expenses</h1>
          <p className="text-sm text-muted-foreground mt-1">Track shop expenses and outgoing payments.</p>
        </div>
        <button className="bg-primary text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Record Expense
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/20">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search expenses..."
              className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button className="p-2 border border-border rounded-lg bg-background hover:bg-muted text-muted-foreground transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 font-medium text-muted-foreground">Date</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Category</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Description</th>
                <th className="px-6 py-3 font-medium text-muted-foreground text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {expensesData.map((item) => (
                <tr key={item.id} className="hover:bg-muted/30">
                  <td className="px-6 py-4 font-medium text-foreground">{item.date}</td>
                  <td className="px-6 py-4">
                    <span className="bg-secondary text-secondary-foreground px-2.5 py-1 rounded-md text-xs font-semibold">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{item.desc}</td>
                  <td className="px-6 py-4 text-right font-bold text-foreground">{item.amount}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/10 border-t border-border">
              <tr>
                <td colSpan={3} className="px-6 py-4 font-bold text-right text-foreground">Total this month:</td>
                <td className="px-6 py-4 font-bold text-right text-red-600 text-lg">$1,855.00</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}