import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { memo, useCallback } from "react";

interface DashboardHeaderProps {
  user: SupabaseUser | null;
}

export const DashboardHeader = memo(({ user }: DashboardHeaderProps) => {
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    try {
      // Primero navegamos y limpiamos el estado local
      navigate("/auth");
      
      // Luego intentamos cerrar sesión en Supabase
      // Si falla, no importa porque ya redirigimos al usuario
      await supabase.auth.signOut({ scope: 'local' });
      
      toast.success("Sesión cerrada exitosamente");
    } catch (error) {
      // Incluso si hay un error, el usuario ya fue redirigido
      console.error("Error al cerrar sesión:", error);
    }
  }, [navigate]);

  return (
    <header className="h-20 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-8 shadow-[0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)] sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-slate-900 hover:bg-slate-100 rounded-lg p-3 transition-all duration-200 w-10 h-10" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Sistema Administrativo
          </h1>
          <p className="text-sm text-slate-700">Gestión integral de visitas y trabajadores</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 px-4 py-2.5 bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-sm">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
            <User className="h-5 w-5 text-white" />
          </div>
          <span className="text-sm font-medium text-slate-900">
            {user?.email}
          </span>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleLogout}
          className="bg-white/80 backdrop-blur-sm border-slate-200/60 text-slate-900 hover:bg-red-50 hover:border-red-300/60 hover:text-red-600 transition-all duration-200 rounded-lg"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>
    </header>
  );
});
