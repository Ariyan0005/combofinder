import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/context/auth-context";

import MainLayout from "@/components/layout/main-layout";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Compatibility from "@/pages/compatibility";
import Repairs from "@/pages/repairs";
import Inventory from "@/pages/inventory";
import Customers from "@/pages/customers";
import CustomerProfile from "@/pages/customer-profile";
import KnowledgeBase from "@/pages/knowledge-base";
import Reports from "@/pages/reports";
import UnlockServices from "@/pages/unlock-services";
import Expenses from "@/pages/expenses";
import Settings from "@/pages/settings";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // When not authenticated, always show login
  if (!user) return <Login />;

  // All protected routes wrapped in MainLayout
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/compatibility" component={Compatibility} />
        <Route path="/repairs" component={Repairs} />
        <Route path="/inventory" component={Inventory} />
        <Route path="/customers" component={Customers} />
        <Route path="/customers/:id" component={CustomerProfile} />
        <Route path="/knowledge-base" component={KnowledgeBase} />
        <Route path="/reports" component={Reports} />
        <Route path="/unlock-services" component={UnlockServices} />
        <Route path="/expenses" component={Expenses} />
        <Route path="/settings" component={Settings} />
        <Route>
          <div className="flex items-center justify-center h-[60vh] flex-col gap-4">
            <p className="text-4xl font-bold text-foreground">404</p>
            <p className="text-muted-foreground">Page not found.</p>
          </div>
        </Route>
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
