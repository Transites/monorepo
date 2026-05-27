import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { LoadingScreen } from "@/components/LoadingScreen";

// Lazy load route components for code splitting
const Index = lazy(() => import("./pages/Index"));
const Article = lazy(() => import("./pages/Article"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Catalog = lazy(() => import("./pages/Catalog"));
const SubmitArticle = lazy(() => import("./pages/SubmitArticle"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/article/:id" element={<Article />} />
             <Route path="/catalog" element={<Catalog />} />
            <Route path="/submissao/nova" element={<SubmitArticle />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
