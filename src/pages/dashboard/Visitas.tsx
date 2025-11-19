import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar, DollarSign, CheckCircle2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { VisitForm } from "@/components/visits/VisitForm";
import { VisitsTable } from "@/components/visits/VisitsTable";
import { VisitFilters } from "@/components/visits/VisitFilters";
import { StatCard } from "@/components/dashboard/StatCard";

export interface Visit {
  id: string;
  start_time: string;
  end_time: string;
  description: string | null;
  num_workers: number;
  total_hours: number;
  num_visits: number;
  total_cost: number;
  status: string;
  created_at: string;
}

const Visitas = () => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [filteredVisits, setFilteredVisits] = useState<Visit[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");

  const fetchVisits = async () => {
    const { data, error } = await supabase
      .from("visits")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error al cargar visitas");
      return;
    }

    setVisits(data || []);
    setFilteredVisits(data || []);
  };

  useEffect(() => {
    fetchVisits();

    const channel = supabase
      .channel("visits-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "visits",
        },
        () => {
          fetchVisits();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let filtered = [...visits];

    if (statusFilter !== "all") {
      filtered = filtered.filter((v) => v.status === statusFilter);
    }

    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter((v) => {
        const visitDate = new Date(v.start_time);
        return visitDate.toDateString() === filterDate.toDateString();
      });
    }

    setFilteredVisits(filtered);
  }, [statusFilter, dateFilter, visits]);

  const handleEdit = (visit: Visit) => {
    setEditingVisit(visit);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar esta visita?")) return;

    const { error } = await supabase.from("visits").delete().eq("id", id);

    if (error) {
      toast.error("Error al eliminar visita");
    } else {
      toast.success("Visita eliminada exitosamente");
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingVisit(null);
  };

  // Calculate statistics
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const thisMonthVisits = visits.filter((v) => {
    const visitDate = new Date(v.start_time);
    return visitDate.getMonth() === currentMonth && visitDate.getFullYear() === currentYear;
  });

  const totalVisitsThisMonth = thisMonthVisits.length;
  const pendingAmount = thisMonthVisits
    .filter((v) => v.status === "pending")
    .reduce((sum, v) => sum + v.total_cost, 0);
  const paidAmount = thisMonthVisits
    .filter((v) => v.status === "paid")
    .reduce((sum, v) => sum + v.total_cost, 0);
  const averageCost = thisMonthVisits.length > 0 
    ? thisMonthVisits.reduce((sum, v) => sum + v.total_cost, 0) / thisMonthVisits.length 
    : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Control de Visitas</h1>
          <p className="text-slate-700">Gestiona y monitorea todas las visitas de mantenimiento</p>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="btn-gradient-primary h-12 px-6 shadow-glow-blue hover-scale text-white"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nueva Visita
        </Button>
      </div>

      {/* Stats Cards - Premium Gradient Glass */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card-blue" style={{ animationDelay: '0.1s' }}>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-blue-800/80 uppercase tracking-wide">
                Visitas Este Mes
              </span>
              <Calendar className="h-12 w-12 text-blue-500/40" />
            </div>
            <div className="space-y-1">
              <p className="text-4xl font-bold text-slate-900 drop-shadow-sm">
                {totalVisitsThisMonth}
              </p>
              <p className="text-sm text-blue-700/70 font-medium">visitas registradas</p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-700 font-semibold">+12%</span>
              <span className="text-slate-600">vs mes anterior</span>
            </div>
          </div>
        </div>

        <div className="stat-card-orange" style={{ animationDelay: '0.2s' }}>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-orange-800/80 uppercase tracking-wide">
                Pendientes de Cobro
              </span>
              <DollarSign className="h-12 w-12 text-orange-500/40" />
            </div>
            <div className="space-y-1">
              <p className="text-4xl font-bold text-slate-900 drop-shadow-sm">
                ₡{pendingAmount.toLocaleString()}
              </p>
              <p className="text-sm text-orange-700/70 font-medium">por facturar</p>
            </div>
          </div>
        </div>

        <div className="stat-card-green" style={{ animationDelay: '0.3s' }}>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-green-800/80 uppercase tracking-wide">
                Total Cobrado
              </span>
              <CheckCircle2 className="h-12 w-12 text-green-500/40" />
            </div>
            <div className="space-y-1">
              <p className="text-4xl font-bold text-slate-900 drop-shadow-sm">
                ₡{paidAmount.toLocaleString()}
              </p>
              <p className="text-sm text-green-700/70 font-medium">cobrado este mes</p>
            </div>
          </div>
        </div>

        <div className="stat-card-sky" style={{ animationDelay: '0.4s' }}>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-sky-800/80 uppercase tracking-wide">
                Promedio por Visita
              </span>
              <TrendingUp className="h-12 w-12 text-sky-500/40" />
            </div>
            <div className="space-y-1">
              <p className="text-4xl font-bold text-slate-900 drop-shadow-sm">
                ₡{Math.round(averageCost).toLocaleString()}
              </p>
              <p className="text-sm text-sky-700/70 font-medium">costo promedio</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section - Glass Panel */}
      <div className="glass-card p-6" style={{ animationDelay: '0.5s' }}>
        <VisitFilters
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
        />
      </div>

      {/* Visits Table - Premium Glass */}
      <div className="glass-table" style={{ animationDelay: '0.6s' }}>
        <div className="glass-table-header px-6 py-4">
          <h2 className="text-xl font-bold">Listado de Visitas</h2>
        </div>
        <div className="p-0">
          <VisitsTable
            visits={filteredVisits}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>

      {/* Visit Form Modal */}
      <VisitForm
        open={isFormOpen}
        onClose={handleFormClose}
        editingVisit={editingVisit}
        onSuccess={fetchVisits}
      />
    </div>
  );
};

export default Visitas;
