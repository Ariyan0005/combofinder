import { useState } from "react";
import { Search, Filter, MoreHorizontal, UserCheck, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockUsers = [
  { id: 1, name: "Rasel Ahmed", email: "rasel@example.com", plan: "Pro", type: "Pro Technician", status: "Active", country: "🇧🇩 Bangladesh", date: "2023-05-12" },
  { id: 2, name: "John Doe", email: "john@example.com", plan: "Free", type: "Free Technician", status: "Active", country: "🇺🇸 USA", date: "2023-06-01" },
  { id: 3, name: "Maria Garcia", email: "maria@example.com", plan: "Business", type: "Shop Owner", status: "Active", country: "🇪🇸 Spain", date: "2023-08-15" },
  { id: 4, name: "Abu Mahara", email: "admin@combofinder.com", plan: "Lifetime", type: "Admin", status: "Active", country: "🇦🇪 UAE", date: "2022-01-01" },
  { id: 5, name: "Inactive User", email: "old@example.com", plan: "Free", type: "Free Technician", status: "Inactive", country: "🇮🇳 India", date: "2022-11-20" },
];

export default function Users() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users Management</h1>
          <p className="text-sm text-muted-foreground">Manage platform users, technicians and admins.</p>
        </div>
        <Button className="gap-2">
          <UserCheck className="h-4 w-4" /> Add New User
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search users by name, email..." 
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
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Join Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockUsers.map((user) => (
                <tr key={user.id} className="border-b border-border hover:bg-secondary/20">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{user.name}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      user.plan === 'Pro' ? 'bg-blue-500/10 text-blue-500' :
                      user.plan === 'Business' ? 'bg-purple-500/10 text-purple-500' :
                      user.plan === 'Lifetime' ? 'bg-yellow-500/10 text-yellow-500' :
                      'bg-gray-500/10 text-gray-400'
                    }`}>
                      {user.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{user.type}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      user.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{user.country}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.date}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-border flex justify-between items-center text-sm text-muted-foreground">
          <span>Showing 1 to 5 of 24,758 users</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
