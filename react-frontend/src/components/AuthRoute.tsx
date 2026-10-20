import { Navigate, useLocation } from "react-router-dom";
import { LoadingScreen } from "@/components/LoadingScreen"; 
import { useAuth } from "@/contexts/AuthContext";

interface AuthRouteProps {
  children: React.ReactNode;
}

const AuthRoute = ({ children }: AuthRouteProps) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    const from = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/login" state={{ from }} replace />;
  }

  return <>{children}</>;
};

export default AuthRoute;