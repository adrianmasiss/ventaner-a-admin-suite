import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import Auth from "./pages/Auth"; // No lazy para evitar problemas de autenticación

const Index = lazy(() => import("./pages/Index"));
const VisitasPage = lazy(() => import("./pages/dashboard/VisitasPage"));
const TrabajadoresPage = lazy(() => import("./pages/dashboard/TrabajadoresPage"));
const EstadisticasPage = lazy(() => import("./pages/dashboard/EstadisticasPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      // 5 minutes
      gcTime: 1000 * 60 * 10,
      // 10 minutes
      refetchOnWindowFocus: false
    }
  }
});
const LoadingFallback = () => <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-slate-400 text-sm">Cargando...</p>
    </div>
  </div>;
const App = () => <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard/visitas" element={<VisitasPage />} />
            <Route path="/dashboard/trabajadores" element={<TrabajadoresPage />} />
            <Route path="/dashboard/estadisticas" element={<EstadisticasPage />} />
            <Route path="/dashboard" element={<Navigate to="/dashboard/visitas" replace />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>;
export default App;