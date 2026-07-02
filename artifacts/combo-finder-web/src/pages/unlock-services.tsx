import { ShieldCheck, ExternalLink } from "lucide-react";

export default function UnlockServices() {
  return (
    <div className="max-w-3xl mx-auto mt-12 text-center space-y-6">
      <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
        <ShieldCheck className="w-12 h-12 text-indigo-600" />
      </div>
      <h1 className="text-3xl font-bold text-foreground">Professional Unlock Services</h1>
      <p className="text-muted-foreground text-lg">
        ComboFinder partners with iUnlockd to provide fast, reliable, and secure network unlocking services for your customers' devices.
      </p>
      
      <div className="bg-card border border-border rounded-xl p-8 text-left mt-8 shadow-sm">
        <h3 className="font-bold text-xl mb-4">Supported Services</h3>
        <ul className="space-y-3 mb-8">
          <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-primary" /> iCloud Activation Lock Removal</li>
          <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-primary" /> Network Carrier Unlocks (AT&T, T-Mobile, etc.)</li>
          <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-primary" /> MDM Bypass & Removal</li>
          <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-primary" /> Samsung FRP Lock Bypass</li>
        </ul>
        
        <a href="https://iunlockd.com" target="_blank" rel="noopener noreferrer" className="block w-full">
          <button className="w-full bg-indigo-600 text-white font-bold text-lg py-4 rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20">
            Visit iUnlockd Portal <ExternalLink className="w-5 h-5" />
          </button>
        </a>
      </div>
    </div>
  );
}