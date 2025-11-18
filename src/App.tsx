import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import VisitasPage from "./pages/dashboard/VisitasPage";
import TrabajadoresPage from "./pages/dashboard/TrabajadoresPage";
import EstadisticasPage from "./pages/dashboard/EstadisticasPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
