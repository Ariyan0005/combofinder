import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Settings() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-sm text-muted-foreground">Configure global application preferences.</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">General Settings</h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Platform Name</label>
              <input type="text" defaultValue="ComboFinder" className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Support Email</label>
              <input type="email" defaultValue="support@combofinder.com" className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Default Currency</label>
            <select className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none">
              <option>USD ($)</option>
              <option>EUR (€)</option>
              <option>GBP (£)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Security & Authentication</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <p className="text-sm font-medium">Two-Factor Authentication (2FA)</p>
              <p className="text-xs text-muted-foreground">Require 2FA for all admin accounts.</p>
            </div>
            <div className="w-10 h-5 bg-primary rounded-full relative cursor-pointer">
              <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5"></div>
            </div>
          </div>
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <p className="text-sm font-medium">Require Approval for Shop Owners</p>
              <p className="text-xs text-muted-foreground">Manual review required before shop owners can use the platform.</p>
            </div>
            <div className="w-10 h-5 bg-primary rounded-full relative cursor-pointer">
              <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button className="gap-2">
          <Save className="h-4 w-4" /> Save Changes
        </Button>
      </div>
    </div>
  );
}
