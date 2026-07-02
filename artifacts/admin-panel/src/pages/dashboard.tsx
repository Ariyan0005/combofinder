import { useQuery } from "@tanstack/react-query";
import { 
  Users, UserCheck, UserPlus, DollarSign, CreditCard, Activity, 
  Calendar, Download, Smartphone, Layers, Wrench, FileText, 
  Video, Megaphone, Server, Database, Save, HardDrive 
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import type { ElementType } from "react";

// Mock Data for Charts
const revenueData = [
  { day: "May 1", revenue: 500, subscriptions: 200 },
  { day: "May 5", revenue: 800, subscriptions: 400 },
  { day: "May 10", revenue: 600, subscriptions: 350 },
  { day: "May 15", revenue: 1200, subscriptions: 700 },
  { day: "May 20", revenue: 900, subscriptions: 500 },
  { day: "May 25", revenue: 1500, subscriptions: 850 },
  { day: "May 31", revenue: 1800, subscriptions: 1100 },
];

const usersByPlan = [
  { name: "Free", value: 50.3, color: "#94a3b8" },
  { name: "Pro", value: 34.9, color: "#3b82f6" },
  { name: "Business", value: 11.5, color: "#a855f7" },
  { name: "Lifetime", value: 3.3, color: "#eab308" },
];

const recentUsers = [
  { id: 1, name: "Rasel Ahmed", email: "rasel@example.com", plan: "Pro", time: "2 mins ago" },
  { id: 2, name: "John Doe", email: "john@example.com", plan: "Free", time: "15 mins ago" },
  { id: 3, name: "Maria Garcia", email: "maria@example.com", plan: "Business", time: "1 hour ago" },
  { id: 4, name: "Alex Wong", email: "alex@example.com", plan: "Lifetime", time: "3 hours ago" },
];

const recentSubscriptions = [
  { id: 1, name: "Gsm Rahat", plan: "Pro Plan", price: 9.99, time: "5 mins ago" },
  { id: 2, name: "TechFix Store", plan: "Business Plan", price: 29.99, time: "42 mins ago" },
  { id: 3, name: "Sarah Smith", plan: "Pro Plan", price: 9.99, time: "2 hours ago" },
  { id: 4, name: "Mike Johnson", plan: "Business Plan", price: 29.99, time: "5 hours ago" },
];

function StatCard({ label, value, trend, trendUp, icon: Icon, iconColor, isLoading }: {
  label: string; value: string; trend: string; trendUp: boolean; icon: ElementType; iconColor: string; isLoading: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${iconColor}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
      {isLoading ? <Skeleton className="h-8 w-24" /> : (
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-bold tracking-tight text-foreground">{value}</div>
        </div>
      )}
      <div className="text-xs text-muted-foreground flex items-center gap-1">
        <span className={trendUp ? "text-green-500" : "text-red-500"}>
          {trendUp ? "↑" : "↓"} {trend}
        </span>
        vs last month
      </div>
    </div>
  );
}

export default function Dashboard() {
  const isLoading = false; // Mock loading state

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-sm text-muted-foreground mb-1">Dashboard / Overview of your platform</div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Overview</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-card border border-border px-3 py-2 rounded-md text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>May 1 - May 31, 2025</span>
          </div>
          <Button className="gap-2" variant="secondary">
            <Download className="h-4 w-4" /> Export Report
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Users" value="24,758" trend="18.6%" trendUp={true} icon={Users} iconColor="from-blue-500 to-blue-700" isLoading={isLoading} />
        <StatCard label="Active Users" value="8,642" trend="12.4%" trendUp={true} icon={UserCheck} iconColor="from-emerald-400 to-emerald-600" isLoading={isLoading} />
        <StatCard label="New Registrations" value="1,842" trend="22.7%" trendUp={true} icon={UserPlus} iconColor="from-violet-500 to-violet-700" isLoading={isLoading} />
        <StatCard label="Total Revenue" value="$24,850" trend="28.5%" trendUp={true} icon={DollarSign} iconColor="from-amber-400 to-amber-600" isLoading={isLoading} />
        <StatCard label="Subscriptions" value="6,125" trend="15.2%" trendUp={true} icon={CreditCard} iconColor="from-pink-500 to-pink-700" isLoading={isLoading} />
        <StatCard label="API Requests" value="1.48M" trend="26.1%" trendUp={true} icon={Activity} iconColor="from-indigo-500 to-indigo-700" isLoading={isLoading} />
      </div>

      {/* Bottom Section - 3 Columns */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN */}
        <div className="xl:col-span-5 space-y-6">
          {/* Revenue Overview */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-lg font-semibold mb-4">Revenue Overview</h2>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSubs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111C2E', borderColor: '#1E2A3A', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                  <Area type="monotone" dataKey="subscriptions" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSubs)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Users */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Users</h2>
              <Link href="/users"><span className="text-xs text-primary cursor-pointer hover:underline">View All</span></Link>
            </div>
            <div className="space-y-4">
              {recentUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-semibold text-xs">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      user.plan === 'Pro' ? 'bg-blue-500/10 text-blue-500' :
                      user.plan === 'Business' ? 'bg-purple-500/10 text-purple-500' :
                      user.plan === 'Lifetime' ? 'bg-yellow-500/10 text-yellow-500' :
                      'bg-gray-500/10 text-gray-400'
                    }`}>
                      {user.plan}
                    </span>
                    <span className="text-xs text-muted-foreground">{user.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 items-center justify-center border-border hover:bg-secondary">
                <UserPlus className="h-5 w-5 text-blue-400" />
                <span className="text-xs">Add User</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 items-center justify-center border-border hover:bg-secondary">
                <Layers className="h-5 w-5 text-purple-400" />
                <span className="text-xs">Add Brand</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 items-center justify-center border-border hover:bg-secondary">
                <Smartphone className="h-5 w-5 text-emerald-400" />
                <span className="text-xs">Add Model</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 items-center justify-center border-border hover:bg-secondary">
                <Wrench className="h-5 w-5 text-amber-400" />
                <span className="text-xs">Add Issue</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 items-center justify-center border-border hover:bg-secondary">
                <FileText className="h-5 w-5 text-pink-400" />
                <span className="text-xs">Add Document</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 items-center justify-center border-border hover:bg-secondary">
                <Video className="h-5 w-5 text-indigo-400" />
                <span className="text-xs">Upload Video</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 items-center justify-center border-border hover:bg-secondary">
                <Megaphone className="h-5 w-5 text-red-400" />
                <span className="text-xs">Announcement</span>
              </Button>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN */}
        <div className="xl:col-span-4 space-y-6">
          {/* Users By Plan */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-lg font-semibold mb-2">Users By Plan</h2>
            <div className="h-[220px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={usersByPlan}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {usersByPlan.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111C2E', borderColor: '#1E2A3A', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Subscriptions */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Subscriptions</h2>
              <Link href="/subscriptions"><span className="text-xs text-primary cursor-pointer hover:underline">View All</span></Link>
            </div>
            <div className="space-y-4">
              {recentSubscriptions.map(sub => (
                <div key={sub.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-semibold text-xs">
                      {sub.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{sub.name}</div>
                      <div className="text-xs text-muted-foreground">{sub.plan}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-bold">${sub.price}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] px-1.5 py-0.5 rounded-sm font-medium bg-emerald-500/10 text-emerald-500">Paid</span>
                      <span className="text-xs text-muted-foreground">{sub.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subscription Overview */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-lg font-semibold mb-4">Subscription Overview</h2>
            <div className="space-y-4">
              {usersByPlan.map((plan) => (
                <div key={plan.name} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">{plan.name}</span>
                    <span className="font-medium text-foreground">{plan.value}%</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full" 
                      style={{ width: `${plan.value}%`, backgroundColor: plan.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="xl:col-span-3 space-y-6">
          
          {/* Top Countries */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-lg font-semibold mb-4">Top Countries</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><span className="text-lg">🇧🇩</span><span className="text-sm font-medium">Bangladesh</span></div>
                <div className="text-right"><div className="text-sm font-bold">12,456</div><div className="text-xs text-muted-foreground">50.3%</div></div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><span className="text-lg">🇮🇳</span><span className="text-sm font-medium">India</span></div>
                <div className="text-right"><div className="text-sm font-bold">5,745</div><div className="text-xs text-muted-foreground">23.2%</div></div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><span className="text-lg">🇵🇰</span><span className="text-sm font-medium">Pakistan</span></div>
                <div className="text-right"><div className="text-sm font-bold">2,451</div><div className="text-xs text-muted-foreground">9.9%</div></div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><span className="text-lg">🇮🇩</span><span className="text-sm font-medium">Indonesia</span></div>
                <div className="text-right"><div className="text-sm font-bold">1,245</div><div className="text-xs text-muted-foreground">5.0%</div></div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><span className="text-lg">🇵🇭</span><span className="text-sm font-medium">Philippines</span></div>
                <div className="text-right"><div className="text-sm font-bold">856</div><div className="text-xs text-muted-foreground">3.5%</div></div>
              </div>
              <div className="pt-2 text-center border-t border-border mt-2">
                <span className="text-xs text-primary cursor-pointer hover:underline">View All Countries →</span>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-lg font-semibold mb-4">System Health</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Server Status</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-sm font-medium text-emerald-500">Online</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Database</span>
                </div>
                <span className="text-sm font-medium text-emerald-500">Healthy</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">API Status</span>
                </div>
                <span className="text-sm font-medium text-emerald-500">Operational</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Storage</span>
                  </div>
                  <span className="text-sm font-medium text-amber-500">68% Used</span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: '68%' }} />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Backup</span>
                </div>
                <span className="text-sm font-medium text-emerald-500">Up to date</span>
              </div>
              
              <div className="pt-2 text-center border-t border-border mt-2">
                <span className="text-xs text-primary cursor-pointer hover:underline">View System Logs →</span>
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-lg font-semibold mb-4">Recent Activities</h2>
            <div className="space-y-4">
              
              <div className="flex gap-3">
                <div className="h-7 w-7 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-primary">AM</div>
                <div>
                  <p className="text-xs text-foreground"><span className="font-semibold">Abu Mahara</span> updated compatibility for iPhone 15 Pro</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">10 mins ago</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="h-7 w-7 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-muted-foreground">SYS</div>
                <div>
                  <p className="text-xs text-foreground"><span className="font-semibold">System</span> New user registered: Rasel Ahmed</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">15 mins ago</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="h-7 w-7 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-primary">AM</div>
                <div>
                  <p className="text-xs text-foreground"><span className="font-semibold">Abu Mahara</span> added new part: iPhone 13 Pro Display</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">1 hour ago</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="h-7 w-7 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-muted-foreground">SYS</div>
                <div>
                  <p className="text-xs text-foreground"><span className="font-semibold">System</span> New subscription: Gsm Rahat (Pro Plan)</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">2 hours ago</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="h-7 w-7 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-primary">AM</div>
                <div>
                  <p className="text-xs text-foreground"><span className="font-semibold">Abu Mahara</span> updated pricing for Pro Plan</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">3 hours ago</p>
                </div>
              </div>
              
              <div className="pt-2 text-center border-t border-border mt-2">
                <Link href="/activity-logs"><span className="text-xs text-primary cursor-pointer hover:underline">View All →</span></Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
