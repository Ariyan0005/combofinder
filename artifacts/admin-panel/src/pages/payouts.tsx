import { DollarSign, Info } from "lucide-react";

export default function Payouts() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payouts</h1>
        <p className="text-sm text-muted-foreground">Manage withdrawals for partner shops and technicians.</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-10 flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
          <DollarSign className="h-8 w-8 text-amber-400" />
        </div>
        <h2 className="text-lg font-semibold">Payout System Coming Soon</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          The payout module will allow managing technician and shop owner withdrawals once payment gateway integration is complete.
        </p>
        <div className="flex items-center gap-2 bg-blue-500/10 text-blue-400 text-xs px-4 py-2 rounded-lg">
          <Info className="h-4 w-4 shrink-0" />
          Transactions can be tracked from the <strong className="mx-1">Transactions</strong> page in the meantime.
        </div>
      </div>
    </div>
  );
}
