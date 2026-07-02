import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { DollarSign, Wrench, AlertTriangle } from "lucide-react";

const monthlyData = [
  { name: 'Week 1', income: 1200, expense: 400 },
  { name: 'Week 2', income: 1900, expense: 600 },
  { name: 'Week 3', income: 1500, expense: 450 },
  { name: 'Week 4', income: 2200, expense: 800 },
];

const pieData = [
  { name: 'Delivered', value: 400 },
  { name: 'Repairing', value: 300 },
  { name: 'Waiting', value: 300 },
  { name: 'Ready', value: 200 },
];
const COLORS = ['#64748b', '#3b82f6', '#f59e0b', '#10b981'];

export default function Reports() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of shop performance and financials.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Revenue (Oct)", value: "$6,800.00", icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Total Repairs", value: "142", icon: Wrench, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Total Expenses", value: "$2,250.00", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 flex items-center gap-4 shadow-sm">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm">
          <h2 className="font-bold text-foreground mb-6">Income vs Expenses</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                <Tooltip />
                <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={3} dot={true} name="Income" />
                <Line type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={3} dot={true} name="Expense" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h2 className="font-bold text-foreground mb-6">Repairs by Status</h2>
          <div className="h-64 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 w-full">
              {pieData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="font-medium">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}