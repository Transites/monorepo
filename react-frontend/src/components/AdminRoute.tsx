import { Navigate, useLocation } from "react-router-dom";
import { LoadingScreen } from "@/components/LoadingScreen"; 
import { useAuth } from "@/contexts/AuthContext";

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAdmin, loading, adminLoading } = useAuth();
  const location = useLocation();

  // Espera a sessão base carregar OU a checagem de privilégios terminar
  if (loading || adminLoading) {
    return <LoadingScreen />;
  }

  // Se ambos os loadings terminaram e a pessoa não é admin, recusa a entrada
  if (!isAdmin) {
    return <Navigate to="/" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;