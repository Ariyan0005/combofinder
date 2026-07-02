import { Search, CreditCard, Download, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockSubs = [
  { id: "SUB-1029", user: "Gsm Rahat", email: "rahat@example.com", plan: "Pro Plan", price: "$9.99/mo", cycle: "Monthly", status: "Active", start: "2023-10-01", next: "2023-11-01" },
  { id: "SUB-1028", user: "TechFix Store", email: "tech@example.com", plan: "Business", price: "$29.99/mo", cycle: "Monthly", status: "Active", start: "2023-09-15", next: "2023-10-15" },
  { id: "SUB-1027", user: "Alex Wong", email: "alex@example.com", plan: "Pro Plan", price: "$99.99/yr", cycle: "Yearly", status: "Cancelled", start: "2022-10-01", next: "—" },
];

export default function Subscriptions() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-sm text-muted-foreground">Manage user subscriptions, billing, and plans.</p>
        </div>
        <Button className="gap-2">
          <Download className="h-4 w-4" /> Export Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">MRR (Monthly Recurring)</div>
            <div className="text-2xl font-bold">$12,450</div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Active Subscriptions</div>
            <div className="text-2xl font-bold">6,125</div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden mt-6">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search subscriptions by ID, user, email..." 
              className="w-full bg-input border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border">
              <tr>
                <th className="px-4 py-3">ID / User</th>
                <th className="px-4 py-3">Plan / Price</th>
                <th className="px-4 py-3">Billing Cycle</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Start Date</th>
                <th className="px-4 py-3">Next Billing</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockSubs.map((sub) => (
                <tr key={sub.id} className="border-b border-border hover:bg-secondary/20">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{sub.user}</span>
                      <span className="text-xs text-muted-foreground">{sub.id}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{sub.plan}</span>
                      <span className="text-xs text-muted-foreground">{sub.price}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{sub.cycle}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      sub.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{sub.start}</td>
                  <td className="px-4 py-3 text-muted-foreground">{sub.next}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="outline" size="sm">Manage</Button>
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
