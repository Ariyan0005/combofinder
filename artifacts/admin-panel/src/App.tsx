import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/app-layout";
import { AuthProvider, useAuth } from "@/context/auth-context";

import Dashboard from "@/pages/dashboard";
import Brands from "@/pages/brands";
import BatteryBrands from "@/pages/battery-brands";
import BatteryModels from "@/pages/battery-models";
import BatteryCompat from "@/pages/battery-compat";
import IcBrands from "@/pages/ic-brands";
import IcModels from "@/pages/ic-models";
import IcCompat from "@/pages/ic-compat";
import BrandModels from "@/pages/brand-models";
import ModelDetail from "@/pages/model-detail";
import Search from "@/pages/search";

// Management
import Users from "@/pages/users";
import Subscriptions from "@/pages/subscriptions";
import Roles from "@/pages/roles";
import TechnicianApprovals from "@/pages/technician-approvals";

// Database additions
import Schematics from "@/pages/schematics";
import IspPinoutAdmin from "@/pages/isp-pinout";

// Business
import UnlockServices from "@/pages/unlock-services";

// System
import Settings from "@/pages/settings";

import PartsSuppliersPage from "@/pages/parts-suppliers";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  const { authenticated } = useAuth();

  if (authenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return <LoginPage />;
  }

  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        
        {/* Management */}
        <Route path="/users" component={Users} />
        <Route path="/subscriptions" component={Subscriptions} />
        <Route path="/roles" component={Roles} />
        <Route path="/technician-approvals" component={TechnicianApprovals} />

        {/* Database */}
        <Route path="/brands" component={Brands} />
        <Route path="/battery-brands" component={BatteryBrands} />
        <Route path="/battery-brands/:id/models" component={BatteryModels} />
        <Route path="/battery-models/:id/compat" component={BatteryCompat} />
        <Route path="/ic-brands" component={IcBrands} />
        <Route path="/ic-brands/:id/models" component={IcModels} />
        <Route path="/ic-models/:id/compat" component={IcCompat} />
        <Route path="/brands/:id/models" component={BrandModels} />
        <Route path="/models/:id" component={ModelDetail} />
        <Route path="/schematics" component={Schematics} />
        <Route path="/isp-pinout" component={IspPinoutAdmin} />
        <Route path="/unlock-services" component={UnlockServices} />
        <Route path="/parts-suppliers" component={PartsSuppliersPage} />
        
        {/* System */}
        <Route path="/settings" component={Settings} />
        <Route path="/search" component={Search} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
