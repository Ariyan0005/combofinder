import { useState } from "react";
import { useParams, Link } from "wouter";
import { ArrowLeft, Phone, MessageSquare, Wrench, DollarSign, Calendar, MapPin } from "lucide-react";

export default function CustomerProfile() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("Repair History");

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <Link href="/customers" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Customers
        </Link>
      </div>

      {/* Profile Header Card */}
      <div className="bg-card border border-border rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold border-4 border-background shadow-sm">
              SJ
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Sarah Jenkins</h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> +1 555-0123</span>
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> New York, NY</span>
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Joined Jan 2023</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition-colors">
              <Phone className="w-4 h-4" /> Call
            </button>
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 font-medium rounded-lg hover:bg-green-100 transition-colors">
              <MessageSquare className="w-4 h-4" /> WhatsApp
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-border">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Total Repairs</span>
            <span className="text-xl font-bold flex items-center gap-2"><Wrench className="w-5 h-5 text-primary" /> 4</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Total Spent</span>
            <span className="text-xl font-bold flex items-center gap-2"><DollarSign className="w-5 h-5 text-emerald-600" /> $450.00</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Active Repairs</span>
            <span className="text-xl font-bold text-amber-600">1</span>
          </div>
        </div>
      </div>

      {/* Tabs & Content */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="flex border-b border-border overflow-x-auto hide-scrollbar">
          {["Repair History", "Devices", "Payments", "Notes"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div className="p-0">
          {activeTab === "Repair History" && (
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 font-medium text-muted-foreground">ID / Date</th>
                  <th className="px-6 py-3 font-medium text-muted-foreground">Device & Problem</th>
                  <th className="px-6 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="px-6 py-3 font-medium text-muted-foreground">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr className="hover:bg-muted/30">
                  <td className="px-6 py-4">
                    <p className="font-bold text-foreground">RP-1042</p>
                    <p className="text-xs text-muted-foreground">Oct 24, 2023</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-foreground">iPhone 13 Pro</p>
                    <p className="text-xs text-muted-foreground">Broken Screen</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Repairing</span>
                  </td>
                  <td className="px-6 py-4 font-semibold">$150.00</td>
                </tr>
                <tr className="hover:bg-muted/30">
                  <td className="px-6 py-4">
                    <p className="font-bold text-foreground">RP-902</p>
                    <p className="text-xs text-muted-foreground">Aug 12, 2023</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-foreground">MacBook Air M1</p>
                    <p className="text-xs text-muted-foreground">Battery Replacement</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">Delivered</span>
                  </td>
                  <td className="px-6 py-4 font-semibold">$200.00</td>
                </tr>
              </tbody>
            </table>
          )}
          {activeTab !== "Repair History" && (
            <div className="p-12 text-center text-muted-foreground">
              Content for {activeTab} will appear here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}