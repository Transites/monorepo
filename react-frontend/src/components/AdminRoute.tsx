import { Navigate, useLocation } from "react-router-dom";
import { LoadingScreen } from "@/components/LoadingScreen"; 
import { useAuth } from "@/contexts/AuthContext";

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAdmin) {
    {/* if the user is not an admin, redirect to home */}
    return <Navigate to="/" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};


export default AdminRoute;