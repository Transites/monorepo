import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { LoadingScreen } from "@/components/LoadingScreen";
import { AuthProvider } from "./contexts/AuthContext";
import AuthRoute from "@/components/AuthRoute";
import AdminRoute from "./components/AdminRoute";

// Lazy load route components for code splitting
const Index = lazy(() => import("./pages/Index"));
const Article = lazy(() => import("./pages/Article"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Catalog = lazy(() => import("./pages/Catalog"));
const SubmitArticle = lazy(() => import("./pages/SubmitArticle"));
const Register = lazy(() => import("./pages/Register")); 
const Login = lazy(() => import("./pages/Login")); 
const queryClient = new QueryClient();
const ReviewQueue = lazy(() => import("./pages/admin/ReviewQueue"));
const MyReviews = lazy(() => import("./pages/admin/MyReviews"));
const ReviewArticle = lazy(() => import("./pages/admin/ReviewArticle"));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/article/:id" element={<Article />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/submissao/nova" element={<AuthRoute> <SubmitArticle /> </AuthRoute>} />
              <Route path="/registro" element={<Register/>} /> 
              <Route path="/login" element={<Login/>} /> 
              <Route path="/admin/fila-de-revisao" element={<AuthRoute><ReviewQueue /></AuthRoute>} />
              <Route path="/admin/minhas-revisoes" element={<AuthRoute><MyReviews /></AuthRoute>} />
              <Route path="/admin/revisar/:id" element={<AuthRoute><ReviewArticle /></AuthRoute>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
