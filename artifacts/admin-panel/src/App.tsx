import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/app-layout";
import { AuthProvider, useAuth } from "@/context/auth-context";

import Dashboard from "@/pages/dashboard";
import Brands from "@/pages/brands";
import BrandModels from "@/pages/brand-models";
import ModelDetail from "@/pages/model-detail";
import Compatibilities from "@/pages/compatibilities";
import Search from "@/pages/search";
import Parts from "@/pages/parts";
import Repairs from "@/pages/repairs";
import Customers from "@/pages/customers";
import Inventory from "@/pages/inventory";

// Management
import Users from "@/pages/users";
import Subscriptions from "@/pages/subscriptions";
import Roles from "@/pages/roles";
import TechnicianApprovals from "@/pages/technician-approvals";

// Database additions
import IssuesFixes from "@/pages/issues-fixes";
import Schematics from "@/pages/schematics";
import IspPinoutAdmin from "@/pages/isp-pinout";
import Documents from "@/pages/documents";
import Videos from "@/pages/videos";

// Business
import RepairCategories from "@/pages/repair-categories";
import InventoryCategories from "@/pages/inventory-categories";
import Suppliers from "@/pages/suppliers";
import UnlockServices from "@/pages/unlock-services";

// Finance
import Transactions from "@/pages/transactions";
import Payouts from "@/pages/payouts";
import Analytics from "@/pages/analytics";

// System
import Announcements from "@/pages/announcements";
import Notifications from "@/pages/notifications";
import Settings from "@/pages/settings";
import BackupRestore from "@/pages/backup-restore";
import ActivityLogs from "@/pages/activity-logs";

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
        <Route path="/brands/:id/models" component={BrandModels} />
        <Route path="/models/:id" component={ModelDetail} />
        <Route path="/compatibilities" component={Compatibilities} />
        <Route path="/parts" component={Parts} />
        <Route path="/issues-fixes" component={IssuesFixes} />
        <Route path="/schematics" component={Schematics} />
        <Route path="/isp-pinout" component={IspPinoutAdmin} />
        <Route path="/documents" component={Documents} />
        <Route path="/videos" component={Videos} />
        
        {/* Business */}
        <Route path="/repair-categories" component={RepairCategories} />
        <Route path="/inventory-categories" component={InventoryCategories} />
        <Route path="/suppliers" component={Suppliers} />
        <Route path="/unlock-services" component={UnlockServices} />
        
        {/* Finance */}
        <Route path="/transactions" component={Transactions} />
        <Route path="/payouts" component={Payouts} />
        <Route path="/analytics" component={Analytics} />
        
        {/* System */}
        <Route path="/announcements" component={Announcements} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/settings" component={Settings} />
        <Route path="/backup-restore" component={BackupRestore} />
        <Route path="/activity-logs" component={ActivityLogs} />
        
        {/* Other */}
        <Route path="/search" component={Search} />
        <Route path="/repairs" component={Repairs} />
        <Route path="/customers" component={Customers} />
        <Route path="/inventory" component={Inventory} />
        
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
