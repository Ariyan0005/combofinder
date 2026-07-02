import { Store, User, Lock, Bell, Palette } from "lucide-react";

export default function Settings() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your shop profile, preferences, and account.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 space-y-1">
          {[
            { label: "Shop Profile", icon: Store, active: true },
            { label: "Account Details", icon: User },
            { label: "Security", icon: Lock },
            { label: "Notifications", icon: Bell },
            { label: "Appearance", icon: Palette },
          ].map((item, i) => (
            <button key={i} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${item.active ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
              <item.icon className="w-4 h-4" /> {item.label}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-card border border-border rounded-xl shadow-sm p-6 space-y-6">
          <h2 className="text-lg font-bold border-b border-border pb-4">Shop Profile</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Shop Name</label>
              <input type="text" defaultValue="TechFix Mobile Solutions" className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Contact Email</label>
                <input type="email" defaultValue="hello@techfix.com" className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Phone Number</label>
                <input type="tel" defaultValue="+1 (555) 000-1234" className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Shop Address</label>
              <textarea rows={3} defaultValue="123 Repair Street, Tech District&#10;New York, NY 10001" className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"></textarea>
            </div>
            
            <div className="pt-4 border-t border-border flex justify-end">
              <button className="bg-primary hover:bg-primary/90 text-white font-medium px-6 py-2 rounded-lg transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}