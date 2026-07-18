/**
 * MigrationContext — detects when a Free user upgrades to Pro and
 * shows a banner to migrate ALL local data to the server.
 * Covers: Repairs, Inventory, Customers, Ledger, Sales.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { localRepairs, localInventory, localCustomers, localLedger, localSales, localExpenses, hasAnyLocalData } from "@/lib/local-store";

type MigCtx = {
  isMigrating: boolean;
  hasPendingData: boolean;
  migrate: () => Promise<void>;
  dismiss: () => void;
};

const MigCtx = createContext<MigCtx | null>(null);

export function MigrationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [hasPendingData, setHasPendingData] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.id || user.plan !== "Pro") { setHasPendingData(false); return; }
    const uid = user.id;
    if (hasAnyLocalData(uid)) { setHasPendingData(true); setDismissed(false); }
    else setHasPendingData(false);
  }, [user?.id, user?.plan]);

  async function migrate() {
    if (!user?.id) return;
    const uid = user.id;
    setIsMigrating(true);
    setError("");
    try {
      const repairs   = localRepairs.exportAll(uid);
      const inventory = localInventory.exportAll(uid);
      const customers = localCustomers.exportAll(uid);
      const ledger    = localLedger.exportAll(uid);
      const sales     = localSales.exportAll(uid);
      const expenses  = localExpenses.exportAll(uid);

      const res = await fetch("/api/migrate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repairs, inventory, customers, ledger, sales, expenses }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Migration failed");

      // Clear all local data after successful migration
      localRepairs.clear(uid);
      localInventory.clear(uid);
      localCustomers.clear(uid);
      localLedger.clear(uid);
      localSales.clear(uid);
      localExpenses.clear(uid);

      setHasPendingData(false);
      qc.invalidateQueries({ queryKey: ["repairs"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["ledger"] });
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    } catch (err: any) {
      setError(err.message ?? "Migration failed. Please try again.");
    } finally {
      setIsMigrating(false);
    }
  }

  function dismiss() { setDismissed(true); }

  const showBanner = hasPendingData && !dismissed;

  return (
    <MigCtx.Provider value={{ isMigrating, hasPendingData: showBanner, migrate, dismiss }}>
      {children}
      {showBanner && (
        <MigrationBanner
          isMigrating={isMigrating}
          error={error}
          onMigrate={migrate}
          onDismiss={dismiss}
        />
      )}
    </MigCtx.Provider>
  );
}

function MigrationBanner({
  isMigrating, error, onMigrate, onDismiss,
}: {
  isMigrating: boolean; error: string; onMigrate: () => void; onDismiss: () => void;
}) {
  return (
    <div style={{
      position: "fixed",
      bottom: 88,
      left: 12,
      right: 12,
      zIndex: 9999,
      background: "hsl(var(--primary))",
      color: "#fff",
      borderRadius: 18,
      padding: "16px 18px",
      boxShadow: "0 8px 40px rgba(0,0,0,0.28)",
      display: "flex",
      flexDirection: "column",
      gap: 12,
    }}>
      <div>
        <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>🎉 আপনি Pro হয়েছেন!</p>
        <p style={{ fontSize: 13, opacity: 0.88, margin: "4px 0 0", lineHeight: 1.4 }}>
          আপনার সব local data (Repairs, Inventory, Customers, Ledger, Sales) এখন cloud-এ migrate করুন।
          একবার migrate করলে সব device থেকে access করা যাবে।
        </p>
        {error && (
          <p style={{ fontSize: 12, color: "#FFD0D0", margin: "6px 0 0" }}>{error}</p>
        )}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onMigrate}
          disabled={isMigrating}
          style={{
            flex: 1, padding: "10px 0", borderRadius: 11,
            background: "#fff", color: "hsl(var(--primary))",
            fontWeight: 700, fontSize: 13, border: "none",
            cursor: isMigrating ? "not-allowed" : "pointer",
            opacity: isMigrating ? 0.7 : 1,
          }}
        >
          {isMigrating ? "Migrating…" : "☁️ Migrate করুন"}
        </button>
        <button
          onClick={onDismiss}
          style={{
            padding: "10px 16px", borderRadius: 11,
            background: "rgba(255,255,255,0.18)", color: "#fff",
            fontWeight: 600, fontSize: 13, border: "none", cursor: "pointer",
          }}
        >
          Later
        </button>
      </div>
    </div>
  );
}

export function useMigration() {
  const ctx = useContext(MigCtx);
  if (!ctx) throw new Error("useMigration must be used within MigrationProvider");
  return ctx;
}
