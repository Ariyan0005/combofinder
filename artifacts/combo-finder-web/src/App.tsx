import { Switch, Route, Redirect, Router as WouterRouter } from "wouter";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { MigrationProvider } from "@/context/migration-context";
import MainLayout from "@/components/layout/main-layout";

import Splash from "@/pages/splash";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import Dashboard from "@/pages/dashboard";
import Compatibility from "@/pages/compatibility";
import BrandDetail from "@/pages/brand-detail";
import ModelDetail from "@/pages/model-detail";
import Repairs from "@/pages/repairs";
import Inventory from "@/pages/inventory";
import Pos from "@/pages/pos";
import Invoices from "@/pages/invoices";
import Customers from "@/pages/customers";
import CustomerProfile from "@/pages/customer-profile";
import KnowledgeBase from "@/pages/knowledge-base";
import Reports from "@/pages/reports";
import UnlockServices from "@/pages/unlock-services";
import Expenses from "@/pages/expenses";
import Settings from "@/pages/settings";
import Subscription from "@/pages/subscription";
import Ledger from "@/pages/ledger";
import IspPinout from "@/pages/isp-pinout";
import ManageCategories from "@/pages/manage-categories";
import ManageSuppliers from "@/pages/manage-suppliers";
import SupplierLedger from "@/pages/supplier-ledger";
import BatteryBrandPage from "@/pages/battery-brand";
import BatteryModelPage from "@/pages/battery-model";
import IcBrandPage from "@/pages/ic-brand";
import IcModelPage from "@/pages/ic-model";
import Privacy from "@/pages/privacy";
import SalesReport from "@/pages/sales-report";
import Terms from "@/pages/terms";
import FindParts from "@/pages/find-parts";
import StaffPage from "@/pages/staff";
import StockIn from "@/pages/stock-in";
import BranchManagement from "@/pages/branch-management";
import PublicPos from "@/pages/public-pos";
import PublicErp from "@/pages/public-erp";
import PublicRepair from "@/pages/public-repair";
import PublicTechnician from "@/pages/public-technician";
import PublicPricing from "@/pages/public-pricing";
import { GuestDemoDashboard } from "@/components/guest-demo-dashboard";
import { installBranchFetchInterceptor } from "@/lib/branch-store";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

if (typeof window !== "undefined") {
  installBranchFetchInterceptor();
  window.addEventListener("branch-changed", () => {
    queryClient.invalidateQueries();
  });
}

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--background))" }}>
      <div className="w-9 h-9 border-4 rounded-full animate-spin"
        style={{ borderColor: "hsl(var(--primary))", borderTopColor: "transparent" }} />
    </div>
  );
}

function MobileRepairOnly({ children }: { children: ReactNode }) {
  const { user, isGuest, guestMode } = useAuth();
  const isGeneralStore = user ? user.businessType === "general_store" : (isGuest && guestMode === "general_store");
  return isGeneralStore ? <Redirect to="/" /> : <>{children}</>;
}

function GeneralStoreOnly({ children }: { children: ReactNode }) {
  const { user, isGuest, guestMode } = useAuth();
  const isGeneralStore = user ? user.businessType === "general_store" : (isGuest && guestMode === "general_store");
  return !isGeneralStore ? <Redirect to="/" /> : <>{children}</>;
}

function OwnerOnly({ children }: { children: ReactNode }) {
  const { user, isGuest } = useAuth();
  if (isGuest) return <Redirect to="/" />;
  const isOwner = Boolean(user && !user.isStaff && !user.isManager && user.role?.toLowerCase() !== "manager");
  return !isOwner ? <Redirect to="/" /> : <>{children}</>;
}

function ManagerOrOwner({ children }: { children: ReactNode }) {
  const { user, isGuest } = useAuth();
  if (isGuest) return <>{children}</>;
  return user?.isStaff ? <Redirect to="/" /> : <>{children}</>;
}

function PaidOwnerOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isPaid = Boolean(user?.plan && ["pro", "premium"].some(plan => user.plan?.toLowerCase().startsWith(plan)));
  const isOwner = Boolean(user && !user.isStaff && !user.isManager && user.role?.toLowerCase() !== "manager");
  return !isOwner || !isPaid ? <Redirect to="/subscription" /> : <>{children}</>;
}

function isStandaloneApp(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get("view") === "web") return false;
  if (params.get("view") === "app" || params.get("source") === "pwa" || params.get("mode") === "app") return true;
  return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
}

function Router() {
  const { user, isGuest, guestMode, isLoading } = useAuth();

  if (isLoading) return <Spinner />;

  if (!user && !isGuest) {
    const isApp = isStandaloneApp();
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/pos-system" component={PublicPos} />
        <Route path="/erp-inventory" component={PublicErp} />
        <Route path="/repair-shop-software" component={PublicRepair} />
        <Route path="/technician-tools" component={PublicTechnician} />
        <Route path="/pricing" component={PublicPricing} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/terms" component={Terms} />
        <Route component={isApp ? Login : Splash} />
      </Switch>
    );
  }

  // Auth pages always render without MainLayout, even for guests
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route>
        <MainLayout>
          <Switch>
            <Route path="/">
              {user ? <Dashboard /> : <GuestDemoDashboard mode={guestMode} />}
            </Route>
            <Route path="/compatibility" component={Compatibility} />
            <Route path="/brands/:id" component={BrandDetail} />
            <Route path="/models/:id" component={ModelDetail} />
            <Route path="/repairs"><MobileRepairOnly><Repairs /></MobileRepairOnly></Route>
            <Route path="/inventory" component={Inventory} />
            <Route path="/stock-in"><ManagerOrOwner><GeneralStoreOnly><StockIn /></GeneralStoreOnly></ManagerOrOwner></Route>
            <Route path="/pos" component={Pos} />
            <Route path="/invoices" component={Invoices} />
            <Route path="/customers" component={Customers} />
            <Route path="/parties" component={Customers} />
            <Route path="/customers/:id" component={CustomerProfile} />
            <Route path="/knowledge-base"><MobileRepairOnly><KnowledgeBase /></MobileRepairOnly></Route>
            <Route path="/reports"><ManagerOrOwner><MobileRepairOnly><Reports /></MobileRepairOnly></ManagerOrOwner></Route>
            <Route path="/unlock-services"><MobileRepairOnly><UnlockServices /></MobileRepairOnly></Route>
            <Route path="/expenses"><ManagerOrOwner><Expenses /></ManagerOrOwner></Route>
            <Route path="/settings"><OwnerOnly><Settings /></OwnerOnly></Route>
            <Route path="/subscription"><OwnerOnly><Subscription /></OwnerOnly></Route>
            <Route path="/ledger" component={Ledger} />
            <Route path="/isp-pinout"><MobileRepairOnly><IspPinout /></MobileRepairOnly></Route>
            <Route path="/manage-categories"><ManagerOrOwner><ManageCategories /></ManagerOrOwner></Route>
            <Route path="/manage-suppliers">
              <Redirect to="/customers?tab=suppliers" />
            </Route>
            <Route path="/supplier-ledger/:id"><ManagerOrOwner><SupplierLedger /></ManagerOrOwner></Route>
            <Route path="/battery-brand/:id"><MobileRepairOnly><BatteryBrandPage /></MobileRepairOnly></Route>
            <Route path="/battery-model/:id"><MobileRepairOnly><BatteryModelPage /></MobileRepairOnly></Route>
            <Route path="/ic-brand/:id"><MobileRepairOnly><IcBrandPage /></MobileRepairOnly></Route>
            <Route path="/ic-model/:id"><MobileRepairOnly><IcModelPage /></MobileRepairOnly></Route>
            <Route path="/privacy" component={Privacy} />
            <Route path="/terms" component={Terms} />
            <Route path="/sales-report"><ManagerOrOwner><SalesReport /></ManagerOrOwner></Route>
            <Route path="/staff"><OwnerOnly><StaffPage /></OwnerOnly></Route>
            <Route path="/branches"><PaidOwnerOnly><BranchManagement /></PaidOwnerOnly></Route>
            <Route path="/find-parts"><MobileRepairOnly><FindParts /></MobileRepairOnly></Route>
            <Route>
              <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
                <p className="text-4xl font-bold">404</p>
                <p style={{ color: "hsl(var(--muted-foreground))" }}>Page not found.</p>
              </div>
            </Route>
          </Switch>
        </MainLayout>
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AuthProvider>
          <MigrationProvider>
            <Router />
          </MigrationProvider>
        </AuthProvider>
      </WouterRouter>
    </QueryClientProvider>
  );
}
