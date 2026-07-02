import { useAuth } from "@/context/auth-context";
import { Link } from "wouter";
import {
  Wrench, Package, Users, AlertTriangle, DollarSign,
  Plus, Search, ShieldCheck, ChevronRight
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const chartData = [
  { name: '1', income: 400, expense: 240 },
  { name: '5', income: 300, expense: 139 },
  { name: '10', income: 200, expense: 980 },
  { name: '15', income: 278, expense: 390 },
  { name: '20', income: 189, expense: 480 },
  { name: '25', income: 239, expense: 380 },
  { name: '30', income: 349, expense: 430 },
];

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Good Morning, {user?.name.split(' ')[0]} 👋</h1>
        <p className="text-muted-foreground mt-1 text-sm">Here's what's happening in your shop today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Today's Repairs", value: "12", sub: "3 in progress", icon: Wrench, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Pending Delivery", value: "4", sub: "2 ready to pick up", icon: Package, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Customers", value: "548", sub: "+12 this week", icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Low Stock Items", value: "18", sub: "Need attention", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
          { label: "Today's Income", value: "$85.00", sub: "+18% vs yesterday", icon: DollarSign, color: "text-indigo-600", bg: "bg-indigo-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.bg}`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm font-medium text-foreground">{stat.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Repairs Table */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-bold text-foreground">Recent Repairs</h2>
              <Link href="/repairs" className="text-sm text-primary font-medium hover:underline">View All</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium text-muted-foreground">ID</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Customer</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Device</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Problem</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { id: "#RP-1042", cus: "Sarah Jenkins", dev: "iPhone 13 Pro", prob: "Broken Screen", stat: "Repairing", sc: "bg-blue-100 text-blue-700" },
                    { id: "#RP-1041", cus: "Mike Ross", dev: "Samsung S22", prob: "Battery Replacement", stat: "Waiting", sc: "bg-amber-100 text-amber-700" },
                    { id: "#RP-1040", cus: "Emily Chen", dev: "iPad Air 4", prob: "Charging Port", stat: "Ready", sc: "bg-emerald-100 text-emerald-700" },
                    { id: "#RP-1039", cus: "Tom Hardy", dev: "Google Pixel 7", prob: "Water Damage", stat: "Delivered", sc: "bg-slate-100 text-slate-700" },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-foreground">{row.id}</td>
                      <td className="px-4 py-3">{row.cus}</td>
                      <td className="px-4 py-3">{row.dev}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.prob}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${row.sc}`}>{row.stat}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Monthly Overview Chart */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-4">
            <h2 className="font-bold text-foreground mb-4">Monthly Overview</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                  <Tooltip />
                  <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-4">
            <h2 className="font-bold text-foreground mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "New Repair", icon: Plus, color: "bg-blue-100 text-blue-600", href: "/repairs?new=1" },
                { label: "Find Compatibility", icon: Search, color: "bg-emerald-100 text-emerald-600", href: "/compatibility" },
                { label: "Add Inventory", icon: Package, color: "bg-purple-100 text-purple-600", href: "/inventory" },
                { label: "Add Customer", icon: Users, color: "bg-orange-100 text-orange-600", href: "/customers" },
                { label: "IMEI Check", icon: Search, color: "bg-yellow-100 text-yellow-600", href: "/knowledge-base" },
                { label: "Unlock Services", icon: ShieldCheck, color: "bg-red-100 text-red-600", href: "/unlock-services" },
              ].map((act, i) => (
                <Link key={i} href={act.href}>
                  <div className="p-3 border border-border rounded-lg hover:border-primary/40 hover:shadow-sm cursor-pointer transition-all flex flex-col gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${act.color}`}>
                      <act.icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold">{act.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Low Stock Alert */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-bold text-foreground">Low Stock Alert</h2>
              <Link href="/inventory" className="text-sm text-primary font-medium hover:underline">View All</Link>
            </div>
            <div className="p-0">
              {[
                { name: "iPhone 13 Display (OLED)", qty: 2 },
                { name: "Samsung S21 Battery", qty: 1 },
                { name: "Type-C Charging Port (Generic)", qty: 4 },
              ].map((item, i) => (
                <div key={i} className="px-4 py-3 border-b border-border last:border-0 flex items-center justify-between hover:bg-muted/30">
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">{item.qty} left</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}