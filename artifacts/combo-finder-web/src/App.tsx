import { Switch, Route, Redirect, Router as WouterRouter } from "wouter";
import { type ReactNode, lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { MigrationProvider } from "@/context/migration-context";
import Splash from "@/pages/splash";

// Lazy-load routes for code-splitting and rapid initial page load
const MainLayout = lazy(() => import("@/components/layout/main-layout"));
const Login = lazy(() => import("@/pages/login"));
const Register = lazy(() => import("@/pages/register"));
const ForgotPassword = lazy(() => import("@/pages/forgot-password"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Compatibility = lazy(() => import("@/pages/compatibility"));
const BrandDetail = lazy(() => import("@/pages/brand-detail"));
const ModelDetail = lazy(() => import("@/pages/model-detail"));
const Repairs = lazy(() => import("@/pages/repairs"));
const Inventory = lazy(() => import("@/pages/inventory"));
const Pos = lazy(() => import("@/pages/pos"));
const Invoices = lazy(() => import("@/pages/invoices"));
const Customers = lazy(() => import("@/pages/customers"));
const CustomerProfile = lazy(() => import("@/pages/customer-profile"));
const KnowledgeBase = lazy(() => import("@/pages/knowledge-base"));
const Reports = lazy(() => import("@/pages/reports"));
const UnlockServices = lazy(() => import("@/pages/unlock-services"));
const Expenses = lazy(() => import("@/pages/expenses"));
const Settings = lazy(() => import("@/pages/settings"));
const Subscription = lazy(() => import("@/pages/subscription"));
const Ledger = lazy(() => import("@/pages/ledger"));
const IspPinout = lazy(() => import("@/pages/isp-pinout"));
const ManageCategories = lazy(() => import("@/pages/manage-categories"));
const ManageSuppliers = lazy(() => import("@/pages/manage-suppliers"));
const SupplierLedger = lazy(() => import("@/pages/supplier-ledger"));
const BatteryBrandPage = lazy(() => import("@/pages/battery-brand"));
const BatteryModelPage = lazy(() => import("@/pages/battery-model"));
const IcBrandPage = lazy(() => import("@/pages/ic-brand"));
const IcModelPage = lazy(() => import("@/pages/ic-model"));
const Privacy = lazy(() => import("@/pages/privacy"));
const SalesReport = lazy(() => import("@/pages/sales-report"));
const Terms = lazy(() => import("@/pages/terms"));
const FindParts = lazy(() => import("@/pages/find-parts"));
const StaffPage = lazy(() => import("@/pages/staff"));
const StockIn = lazy(() => import("@/pages/stock-in"));
const BranchManagement = lazy(() => import("@/pages/branch-management"));
const PublicPos = lazy(() => import("@/pages/public-pos"));
const PublicErp = lazy(() => import("@/pages/public-erp"));
const PublicRepair = lazy(() => import("@/pages/public-repair"));
const PublicTechnician = lazy(() => import("@/pages/public-technician"));
const PublicPricing = lazy(() => import("@/pages/public-pricing"));
const PublicCompatibilityPage = lazy(() => import("@/pages/public-technical").then(m => ({ default: m.PublicCompatibilityPage })));
const PublicIspPage = lazy(() => import("@/pages/public-technical").then(m => ({ default: m.PublicIspPage })));
const PublicPinoutPage = lazy(() => import("@/pages/public-technical").then(m => ({ default: m.PublicPinoutPage })));
const GuestDemoDashboard = lazy(() => import("@/components/guest-demo-dashboard").then(m => ({ default: m.GuestDemoDashboard })));

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
      <Suspense fallback={<Spinner />}>
        <Switch>
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/pos-system" component={PublicPos} />
          <Route path="/erp-inventory" component={PublicErp} />
          <Route path="/repair-shop-software" component={PublicRepair} />
          <Route path="/technician-tools" component={PublicTechnician} />
          <Route path="/pricing" component={PublicPricing} />
          <Route path="/compatibility/:brandSlug/:modelSlug" component={PublicCompatibilityPage} />
          <Route path="/isp/:slug" component={PublicIspPage} />
          <Route path="/pinout/:slug" component={PublicPinoutPage} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/terms" component={Terms} />
          <Route component={isApp ? Login : Splash} />
        </Switch>
      </Suspense>
    );
  }

  // Auth pages always render without MainLayout, even for guests
  return (
    <Suspense fallback={<Spinner />}>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/compatibility/:brandSlug/:modelSlug" component={PublicCompatibilityPage} />
        <Route path="/isp/:slug" component={PublicIspPage} />
        <Route path="/pinout/:slug" component={PublicPinoutPage} />
        <Route>
          <MainLayout>
            <Suspense fallback={<Spinner />}>
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
            </Suspense>
          </MainLayout>
        </Route>
      </Switch>
    </Suspense>
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
