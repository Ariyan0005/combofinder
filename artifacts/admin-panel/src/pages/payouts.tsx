import { DollarSign, Search, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockPayouts = [
  { id: "PAY-1001", shop: "TechFix Store", amount: "$150.00", method: "Bank Transfer", date: "2023-10-01", status: "Pending" },
  { id: "PAY-1002", shop: "Dubai Electronics", amount: "$45.50", method: "PayPal", date: "2023-09-28", status: "Completed" },
];

export default function Payouts() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payouts</h1>
          <p className="text-sm text-muted-foreground">Manage withdrawals for partner shops and technicians.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Pending Payouts</div>
            <div className="text-2xl font-bold">$150.00</div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Total Paid (All Time)</div>
            <div className="text-2xl font-bold">$12,450.00</div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden mt-6">
        <div className="p-4 border-b border-border">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search payouts..." 
              className="w-full bg-input border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border">
              <tr>
                <th className="px-4 py-3">Payout ID</th>
                <th className="px-4 py-3">Shop / User</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Date Requested</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockPayouts.map((pay) => (
                <tr key={pay.id} className="border-b border-border hover:bg-secondary/20">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{pay.id}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{pay.shop}</td>
                  <td className="px-4 py-3 font-bold">{pay.amount}</td>
                  <td className="px-4 py-3 text-muted-foreground">{pay.method}</td>
                  <td className="px-4 py-3 text-muted-foreground">{pay.date}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      pay.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {pay.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {pay.status === 'Pending' ? (
                      <Button variant="outline" size="sm" className="text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10">Approve</Button>
                    ) : (
                      <Button variant="ghost" size="sm" disabled>Processed</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
