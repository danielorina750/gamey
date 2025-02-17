import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

type UserRole = "admin" | "employee" | "customer";

export function ProtectedRoute({
  path,
  roles,
  component: Component,
}: {
  path: string;
  roles: UserRole[];
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user || !user.role || !roles.includes(user.role)) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Redirect to appropriate dashboard based on role
  if (path === "/" && user.role !== "admin") {
    return (
      <Route path={path}>
        <Redirect to={`/${user.role}`} />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}