import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { z } from "zod";

const visitSchema = z.object({
  start_time: z.string().min(1, "La fecha de inicio es requerida"),
  end_time: z.string().min(1, "La fecha de fin es requerida"),
  description: z.string().max(500, "Descripción muy larga (máximo 500 caracteres)").optional(),
  num_workers: z.number()
    .int("El número de trabajadores debe ser entero")
    .min(2, "Mínimo 2 trabajadores")
    .max(50, "Máximo 50 trabajadores")
}).refine(data => new Date(data.end_time) > new Date(data.start_time), {
  message: "La fecha de fin debe ser posterior a la de inicio",
  path: ["end_time"]
});

interface Visit {
  id: string;
  start_time: string;
  end_time: string;
  description: string | null;
  num_workers: number;
  total_hours: number;
  num_visits: number;
  total_cost: number;
  status: string;
}

interface VisitFormProps {
  open: boolean;
  onClose: () => void;
  editingVisit: Visit | null;
  onSuccess: () => void;
}

const COST_PER_WORKER_PER_VISIT = 20000;

interface Worker {
  id: string;
  full_name: string;
}

export const VisitForm = ({ open, onClose, editingVisit, onSuccess }: VisitFormProps) => {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [description, setDescription] = useState("");
  const [numWorkers, setNumWorkers] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);

  useEffect(() => {
    fetchWorkers();
  }, []);

  useEffect(() => {
    if (editingVisit) {
      setStartTime(new Date(editingVisit.start_time).toISOString().slice(0, 16));
      setEndTime(new Date(editingVisit.end_time).toISOString().slice(0, 16));
      setDescription(editingVisit.description || "");
      setNumWorkers(editingVisit.num_workers);
      fetchVisitWorkers(editingVisit.id);
    } else {
      resetForm();
    }
  }, [editingVisit, open]);

  const fetchWorkers = async () => {
    const { data, error } = await supabase
      .from("workers")
      .select("id, full_name")
      .order("full_name");

    if (!error && data) {
      setWorkers(data);
    }
  };

  const fetchVisitWorkers = async (visitId: string) => {
    const { data, error } = await supabase
      .from("visit_workers")
      .select("worker_id")
      .eq("visit_id", visitId);

    if (!error && data) {
      setSelectedWorkers(data.map(vw => vw.worker_id));
    }
  };

  const resetForm = () => {
    setStartTime("");
    setEndTime("");
    setDescription("");
    setNumWorkers(2);
    setSelectedWorkers([]);
  };

  const handleWorkerToggle = (workerId: string) => {
    setSelectedWorkers(prev => 
      prev.includes(workerId)
        ? prev.filter(id => id !== workerId)
        : [...prev, workerId]
    );
  };

  const calculateVisitData = () => {
    if (!startTime || !endTime) return null;

    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const totalHours = diffMs / (1000 * 60 * 60);

    if (totalHours <= 0) {
      toast.error("La hora de fin debe ser posterior a la hora de inicio");
      return null;
    }

    // Número de visitas - cuenta como visita adicional solo si sobran más de 30 minutos
    // Ejemplos: 3h15min = 1 visita, 3h30min = 2 visitas, 4h = 2 visitas
    const numVisits = Math.floor((totalHours + 2.5) / 3);
    const totalCost = numVisits * numWorkers * COST_PER_WORKER_PER_VISIT;

    return {
      totalHours: parseFloat(totalHours.toFixed(2)),
      numVisits: numVisits, // Ahora es entero
      totalCost: parseFloat(totalCost.toFixed(2)),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedWorkers.length < 2) {
      toast.error("Debe seleccionar al menos 2 trabajadores");
      return;
    }

    const validation = visitSchema.safeParse({
      start_time: startTime,
      end_time: endTime,
      description: description,
      num_workers: selectedWorkers.length
    });

    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    const visitData = calculateVisitData();
    if (!visitData) return;

    setIsLoading(true);

    const data = {
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
      description: description || null,
      num_workers: selectedWorkers.length,
      total_hours: visitData.totalHours,
      num_visits: visitData.numVisits,
      total_cost: visitData.totalCost,
      status: "pending",
    };

    let visitId: string | null = null;
    let error;

    if (editingVisit) {
      const result = await supabase
        .from("visits")
        .update(data)
        .eq("id", editingVisit.id);
      error = result.error;
      visitId = editingVisit.id;

      // Delete existing visit_workers
      if (!error) {
        await supabase
          .from("visit_workers")
          .delete()
          .eq("visit_id", editingVisit.id);
      }
    } else {
      const result = await supabase.from("visits").insert(data).select();
      error = result.error;
      if (!error && result.data && result.data.length > 0) {
        visitId = result.data[0].id;
      }
    }

    // Insert visit_workers
    if (!error && visitId) {
      const visitWorkers = selectedWorkers.map(workerId => ({
        visit_id: visitId,
        worker_id: workerId,
        amount: visitData.numVisits * COST_PER_WORKER_PER_VISIT,
        payment_status: "pending"
      }));

      const { error: visitWorkersError } = await supabase
        .from("visit_workers")
        .insert(visitWorkers);

      if (visitWorkersError) {
        error = visitWorkersError;
      }
    }

    setIsLoading(false);

    if (error) {
      toast.error("Error al guardar la visita");
    } else {
      toast.success(
        editingVisit ? "Visita actualizada exitosamente" : "Visita creada exitosamente"
      );
      resetForm();
      onSuccess();
      onClose();
    }
  };

  const previewData = calculateVisitData();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingVisit ? "Editar Visita" : "Nueva Visita"}
          </DialogTitle>
          <DialogDescription>
            Complete los datos de la visita. El sistema calculará automáticamente el costo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Hora de Entrada</Label>
              <Input
                id="start-time"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">Hora de Salida</Label>
              <Input
                id="end-time"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Seleccionar Trabajadores (mínimo 2)</Label>
            <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
              {workers.map((worker) => (
                <div key={worker.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={worker.id}
                    checked={selectedWorkers.includes(worker.id)}
                    onCheckedChange={() => handleWorkerToggle(worker.id)}
                  />
                  <label
                    htmlFor={worker.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {worker.full_name}
                  </label>
                </div>
              ))}
              {workers.length === 0 && (
                <p className="text-sm text-muted-foreground">No hay trabajadores disponibles</p>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Trabajadores seleccionados: {selectedWorkers.length}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Detalles de la visita..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {previewData && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h4 className="font-semibold text-black">Resumen Automático:</h4>
              <p className="text-sm text-black">
                Total de Horas: <strong>{previewData.totalHours} horas</strong>
              </p>
              <p className="text-sm text-black">
                Número de Visitas (cada 3 horas): <strong>{previewData.numVisits}</strong>
              </p>
              <p className="text-sm text-lg font-bold text-black">
                Costo Total: ₡{previewData.totalCost.toLocaleString()}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : editingVisit ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
