import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/context/auth-context";
import MainLayout from "@/components/layout/main-layout";

import Splash from "@/pages/splash";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Compatibility from "@/pages/compatibility";
import BrandDetail from "@/pages/brand-detail";
import ModelDetail from "@/pages/model-detail";
import Repairs from "@/pages/repairs";
import Inventory from "@/pages/inventory";
import Customers from "@/pages/customers";
import CustomerProfile from "@/pages/customer-profile";
import KnowledgeBase from "@/pages/knowledge-base";
import Reports from "@/pages/reports";
import UnlockServices from "@/pages/unlock-services";
import Expenses from "@/pages/expenses";
import Settings from "@/pages/settings";
import Subscription from "@/pages/subscription";

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

  // Not authenticated and not guest → public routes only
  if (!user && !isGuest) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route component={Splash} />
      </Switch>
    );
  }

  // Guest or authenticated → full layout, protected pages guarded
  return (
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
        <Route path="/customers" component={Customers} />
        <Route path="/customers/:id" component={CustomerProfile} />
        <Route path="/knowledge-base" component={KnowledgeBase} />
        <Route path="/reports" component={Reports} />
        <Route path="/unlock-services" component={UnlockServices} />
        <Route path="/expenses" component={Expenses} />
        <Route path="/settings" component={Settings} />
        <Route path="/subscription" component={Subscription} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route>
          <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
            <p className="text-4xl font-bold">404</p>
            <p style={{ color: "hsl(var(--muted-foreground))" }}>Page not found.</p>
          </div>
        </Route>
      </Switch>
    </MainLayout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AuthProvider>
          <Router />
        </AuthProvider>
      </WouterRouter>
    </QueryClientProvider>
  );
}
