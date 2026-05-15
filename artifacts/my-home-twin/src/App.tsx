import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { HomeProvider, useHome } from "@/contexts/HomeContext";

import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import SetupPage from "@/pages/SetupPage";
import HomePage from "@/pages/HomePage";
import BillPage from "@/pages/BillPage";
import ComplaintsPage from "@/pages/ComplaintsPage";
import AdminLoginPage from "@/pages/AdminLoginPage";
import AdminPage from "@/pages/AdminPage";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, requireSetup = false }: { component: React.ComponentType; requireSetup?: boolean }) {
  const { user, setup, isLoading } = useHome();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Redirect to="/login" />;
  if (requireSetup && !setup) return <Redirect to="/setup" />;
  return <Component />;
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useHome();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user || user.role !== "admin") return <Redirect to="/admin-login" />;
  return <Component />;
}

function RootRoute() {
  const { user, setup, isLoading } = useHome();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (user && user.role === "admin") return <Redirect to="/admin" />;
  if (user && setup) return <Redirect to="/home" />;
  if (user && !setup) return <Redirect to="/setup" />;
  return <LandingPage />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={RootRoute} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/admin-login" component={AdminLoginPage} />
      <Route path="/setup">
        <ProtectedRoute component={SetupPage} />
      </Route>
      <Route path="/home">
        <ProtectedRoute component={HomePage} requireSetup={true} />
      </Route>
      <Route path="/bill">
        <ProtectedRoute component={BillPage} requireSetup={true} />
      </Route>
      <Route path="/complaints">
        <ProtectedRoute component={ComplaintsPage} requireSetup={true} />
      </Route>
      <Route path="/admin">
        <AdminRoute component={AdminPage} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <HomeProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </HomeProvider>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
