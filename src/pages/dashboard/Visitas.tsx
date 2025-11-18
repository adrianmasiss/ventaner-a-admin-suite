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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Control de Visitas</h1>
          <p className="text-muted-foreground mt-1">Gestiona y monitorea todas las visitas</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          Nueva Visita
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Visitas Este Mes"
          value={totalVisitsThisMonth}
          icon={Calendar}
          subtitle={`${thisMonthVisits.length} visitas registradas`}
        />
        <StatCard
          title="Pendientes de Cobro"
          value={`₡${pendingAmount.toLocaleString()}`}
          icon={DollarSign}
          gradient="warning"
          subtitle={`${thisMonthVisits.filter(v => v.status === "pending").length} visitas pendientes`}
        />
        <StatCard
          title="Total Cobrado"
          value={`₡${paidAmount.toLocaleString()}`}
          icon={CheckCircle2}
          gradient="success"
          subtitle="Pagos completados este mes"
        />
        <StatCard
          title="Promedio por Visita"
          value={`₡${Math.round(averageCost).toLocaleString()}`}
          icon={TrendingUp}
          subtitle="Costo promedio"
        />
      </div>

      <VisitFilters
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
      />

      <Card className="shadow-sm">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-xl">Listado de Visitas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <VisitsTable
            visits={filteredVisits}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

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
