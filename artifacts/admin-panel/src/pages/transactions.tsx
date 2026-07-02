import { Search, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockTransactions = [
  { id: "TXN-9021", user: "Gsm Rahat", amount: "$9.99", type: "Subscription", date: "2023-10-01 14:30", status: "Completed" },
  { id: "TXN-9022", user: "TechFix Store", amount: "$29.99", type: "Subscription", date: "2023-10-01 15:45", status: "Completed" },
  { id: "TXN-9023", user: "Ali Ahmed", amount: "$5.00", type: "Unlock Service", date: "2023-10-02 09:15", status: "Pending" },
  { id: "TXN-9024", user: "John Doe", amount: "$9.99", type: "Subscription", date: "2023-10-02 11:20", status: "Failed" },
];

export default function Transactions() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground">Monitor all payments and revenue streams.</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search by ID, User..." 
            className="w-full bg-input border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <Button variant="outline" className="gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4" /> Filters
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border">
              <tr>
                <th className="px-4 py-3">Transaction ID</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockTransactions.map((txn) => (
                <tr key={txn.id} className="border-b border-border hover:bg-secondary/20">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{txn.id}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{txn.user}</td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-secondary text-foreground">
                      {txn.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold">{txn.amount}</td>
                  <td className="px-4 py-3 text-muted-foreground">{txn.date}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      txn.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' : 
                      txn.status === 'Pending' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {txn.status}
                    </span>
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
