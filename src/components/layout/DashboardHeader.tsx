import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface DashboardHeaderProps {
  user: SupabaseUser | null;
}

export const DashboardHeader = ({ user }: DashboardHeaderProps) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error al cerrar sesión");
    } else {
      toast.success("Sesión cerrada exitosamente");
      navigate("/auth");
    }
  };

  return (
    <header className="h-20 bg-white/75 backdrop-blur-[20px] border-b border-slate-200/50 flex items-center justify-between px-8 shadow-[0_4px_16px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.5)] sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-slate-700 hover:bg-slate-200/50 rounded-lg p-2 transition-colors" />
        <div>
          <h1 className="text-2xl font-bold gradient-text-primary">
            Sistema Administrativo
          </h1>
          <p className="text-sm text-slate-500">Gestión integral de visitas y trabajadores</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-slate-300/60">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-lg">
            <User className="h-5 w-5 text-white" />
          </div>
          <span className="text-sm font-medium text-slate-700">
            {user?.email}
          </span>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleLogout}
          className="bg-white/60 backdrop-blur-sm border-slate-300/60 text-slate-700 hover:bg-red-50/80 hover:border-red-300 hover:text-red-600 transition-all duration-300"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>
    </header>
  );
};
