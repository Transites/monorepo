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
    {/* if the user is not logged in, redirect to login page */}
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};

export default AuthRoute;