import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { MigrationProvider } from "@/context/migration-context";
import MainLayout from "@/components/layout/main-layout";

import Splash from "@/pages/splash";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import Donate from "@/pages/donate";
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
import Terms from "@/pages/terms";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--background))" }}>
      <div className="w-9 h-9 border-4 rounded-full animate-spin"
        style={{ borderColor: "hsl(var(--primary))", borderTopColor: "transparent" }} />
    </div>
  );
}

function Router() {
  const { user, isGuest, isLoading } = useAuth();

  if (isLoading) return <Spinner />;

  if (!user && !isGuest) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/donate" component={Donate} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/terms" component={Terms} />
        <Route component={Splash} />
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
              {user ? <Dashboard /> : <Compatibility />}
            </Route>
            <Route path="/compatibility" component={Compatibility} />
            <Route path="/brands/:id" component={BrandDetail} />
            <Route path="/models/:id" component={ModelDetail} />
            <Route path="/repairs" component={Repairs} />
            <Route path="/inventory" component={Inventory} />
            <Route path="/pos" component={Pos} />
            <Route path="/invoices" component={Invoices} />
            <Route path="/customers" component={Customers} />
            <Route path="/customers/:id" component={CustomerProfile} />
            <Route path="/knowledge-base" component={KnowledgeBase} />
            <Route path="/reports" component={Reports} />
            <Route path="/unlock-services" component={UnlockServices} />
            <Route path="/expenses" component={Expenses} />
            <Route path="/settings" component={Settings} />
            <Route path="/subscription" component={Subscription} />
            <Route path="/ledger" component={Ledger} />
            <Route path="/isp-pinout" component={IspPinout} />
            <Route path="/manage-categories" component={ManageCategories} />
            <Route path="/manage-suppliers" component={ManageSuppliers} />
            <Route path="/supplier-ledger/:id" component={SupplierLedger} />
            <Route path="/battery-brand/:id" component={BatteryBrandPage} />
            <Route path="/battery-model/:id" component={BatteryModelPage} />
            <Route path="/ic-brand/:id" component={IcBrandPage} />
            <Route path="/ic-model/:id" component={IcModelPage} />
            <Route path="/donate" component={Donate} />
            <Route path="/privacy" component={Privacy} />
            <Route path="/terms" component={Terms} />
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
