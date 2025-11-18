import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { VisitForm } from "@/components/visits/VisitForm";
import { VisitsTable } from "@/components/visits/VisitsTable";
import { VisitFilters } from "@/components/visits/VisitFilters";

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Control de Visitas</h1>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Visita
        </Button>
      </div>

      <VisitFilters
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
      />

      <Card>
        <CardHeader>
          <CardTitle>Listado de Visitas</CardTitle>
        </CardHeader>
        <CardContent>
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
