import { CheckCircle2, XCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockApprovals = [
  { id: 1, name: "Ali Ahmed", email: "ali@repairshop.com", shop: "FixIt Dubai", document: "Trade License.pdf", date: "2 hours ago", status: "Pending" },
  { id: 2, name: "Omar Farooq", email: "omar@gmail.com", shop: "Omar Tech", document: "ID_Card.jpg", date: "5 hours ago", status: "Pending" },
];

export default function TechnicianApprovals() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Technician Approvals</h1>
          <p className="text-sm text-muted-foreground">Review and approve new Pro Technician and Shop Owner accounts.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search by name, shop..." 
              className="w-full bg-input border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border">
              <tr>
                <th className="px-4 py-3">Applicant</th>
                <th className="px-4 py-3">Shop Details</th>
                <th className="px-4 py-3">Verification Docs</th>
                <th className="px-4 py-3">Applied On</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockApprovals.map((app) => (
                <tr key={app.id} className="border-b border-border hover:bg-secondary/20">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{app.name}</span>
                      <span className="text-xs text-muted-foreground">{app.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-medium">{app.shop}</td>
                  <td className="px-4 py-3">
                    <span className="text-primary hover:underline cursor-pointer flex items-center gap-1">
                      {app.document}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{app.date}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" className="text-red-500 border-red-500/20 hover:bg-red-500/10">
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                      <Button variant="outline" size="sm" className="text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10">
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {mockApprovals.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No pending approvals.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
