import HomePage from "@/pages/home-page";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "./lib/protected-route";
import { useAuth } from "@/hooks/use-auth";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import AdminDashboard from "@/pages/admin-dashboard";
import EmployeeDashboard from "@/pages/employee-dashboard";
import CustomerDashboard from "@/pages/customer-dashboard";
import CustomerPortal from "@/pages/customer-portal";
import { useEffect, useRef } from "react";
import { createInitialData } from "@/lib/firebase/admin-utils";
import { useToast } from "@/hooks/use-toast";

function Router() {
  const { user } = useAuth();

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/customer/:qrCode" component={CustomerPortal} />

      {/* Protected routes */}
      <ProtectedRoute
        path="/"
        roles={["admin"]}
        component={() => {
          // Redirect root to appropriate dashboard based on role
          if (user?.role === "employee") return <EmployeeDashboard />;
          if (user?.role === "customer") return <CustomerDashboard />;
          return <AdminDashboard />;
        }}
      />
      <ProtectedRoute
        path="/admin"
        roles={["admin"]}
        component={AdminDashboard}
      />
      <ProtectedRoute
        path="/employee"
        roles={["employee"]}
        component={EmployeeDashboard}
      />
      <ProtectedRoute
        path="/customer"
        roles={["customer"]}
        component={CustomerDashboard}
      />

      {/* Catch-all route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { toast } = useToast();
  const initRef = useRef(false);

  useEffect(() => {
    const initializeApp = async () => {
      if (initRef.current) return;
      initRef.current = true;

      try {
        console.log("Starting initial data creation...");
        const result = await createInitialData();
        console.log("Initial data creation result:", result);

        if (result) {
          toast({
            title: "Setup Complete",
            description: "Application initialized successfully.",
          });
        }
      } catch (error) {
        console.error("Failed to initialize app:", error);
        toast({
          title: "Setup Warning",
          description: "Some setup steps may have been skipped. The app should still function normally.",
          variant: "destructive",
        });
      }
    };

    initializeApp();
  }, [toast]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;