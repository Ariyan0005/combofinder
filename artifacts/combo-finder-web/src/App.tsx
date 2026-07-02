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

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });

function ProtectedRoute({ component: Component }: { component: any }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  
  if (!user) {
    // Redirect logic happens inside component normally, but in render we can just render Login
    return <Login />;
  }

  return (
    <MainLayout>
      <Component />
    </MainLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      <Route path="/" render={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/compatibility" render={() => <ProtectedRoute component={Compatibility} />} />
      <Route path="/repairs" render={() => <ProtectedRoute component={Repairs} />} />
      <Route path="/inventory" render={() => <ProtectedRoute component={Inventory} />} />
      <Route path="/customers" render={() => <ProtectedRoute component={Customers} />} />
      <Route path="/customers/:id" render={() => <ProtectedRoute component={CustomerProfile} />} />
      <Route path="/knowledge-base" render={() => <ProtectedRoute component={KnowledgeBase} />} />
      <Route path="/reports" render={() => <ProtectedRoute component={Reports} />} />
      <Route path="/unlock-services" render={() => <ProtectedRoute component={UnlockServices} />} />
      <Route path="/expenses" render={() => <ProtectedRoute component={Expenses} />} />
      <Route path="/settings" render={() => <ProtectedRoute component={Settings} />} />
      
      <Route render={() => <div className="p-12 text-center text-xl font-bold">404 - Not Found</div>} />
    </Switch>
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