import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { WorkerForm } from "@/components/workers/WorkerForm";
import { WorkersTable } from "@/components/workers/WorkersTable";
export interface Worker {
  id: string;
  full_name: string;
  phone: string;
  payment_rate: number;
  payment_type: string;
  created_at: string;
}
const Trabajadores = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const fetchWorkers = async () => {
    const {
      data,
      error
    } = await supabase.from("workers").select("*").order("full_name", {
      ascending: true
    });
    if (error) {
      toast.error("Error al cargar trabajadores");
      return;
    }
    setWorkers(data || []);
  };
  useEffect(() => {
    fetchWorkers();
    const channel = supabase.channel("workers-changes").on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "workers"
    }, () => {
      fetchWorkers();
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  const handleEdit = (worker: Worker) => {
    setEditingWorker(worker);
    setIsFormOpen(true);
  };
  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este trabajador?")) return;
    const {
      error
    } = await supabase.from("workers").delete().eq("id", id);
    if (error) {
      toast.error("Error al eliminar trabajador");
    } else {
      toast.success("Trabajador eliminado exitosamente");
    }
  };
  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingWorker(null);
  };
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-950">Trabajadores</h1>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Trabajador
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Trabajadores</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkersTable workers={workers} onEdit={handleEdit} onDelete={handleDelete} />
        </CardContent>
      </Card>

      <WorkerForm open={isFormOpen} onClose={handleFormClose} editingWorker={editingWorker} onSuccess={fetchWorkers} />
    </div>;
};
export default Trabajadores;