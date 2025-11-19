import { BarChart3, Users, Calendar } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import logo from "@/assets/logo.png";

const menuItems = [
  { title: "Control de Visitas", url: "/dashboard/visitas", icon: Calendar },
  { title: "Trabajadores", url: "/dashboard/trabajadores", icon: Users },
  { title: "Estadísticas", url: "/dashboard/estadisticas", icon: BarChart3 },
];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <Sidebar className="glass-sidebar border-r border-slate-800/20">
      <SidebarHeader className="p-6 border-b border-slate-700/30 bg-gradient-to-b from-blue-500/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <img src={logo} alt="Logo" className="h-12 w-auto drop-shadow-lg" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
              Ventanería y
            </span>
            <span className="text-xs text-slate-300/90 font-medium">
              Mantenimientos S.A.
            </span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-3 py-6">
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3 px-3">
            Menú Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {menuItems.map((item) => {
                const isActive = currentPath === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/15 text-white font-semibold border-l-4 border-blue-400 pl-3 shadow-[0_4px_12px_rgba(59,130,246,0.2)]'
                            : 'text-slate-300 hover:bg-slate-700/30 hover:text-white'
                        }`}
                      >
                        <item.icon 
                          className={`h-5 w-5 ${
                            isActive ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]' : ''
                          }`} 
                        />
                        <span className="text-sm">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
