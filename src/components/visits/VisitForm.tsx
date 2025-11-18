import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

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

export const VisitForm = ({ open, onClose, editingVisit, onSuccess }: VisitFormProps) => {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [description, setDescription] = useState("");
  const [numWorkers, setNumWorkers] = useState(2);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (editingVisit) {
      setStartTime(new Date(editingVisit.start_time).toISOString().slice(0, 16));
      setEndTime(new Date(editingVisit.end_time).toISOString().slice(0, 16));
      setDescription(editingVisit.description || "");
      setNumWorkers(editingVisit.num_workers);
    } else {
      resetForm();
    }
  }, [editingVisit, open]);

  const resetForm = () => {
    setStartTime("");
    setEndTime("");
    setDescription("");
    setNumWorkers(2);
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

    // Número de visitas - se redondea hacia arriba (cualquier tiempo extra cuenta como visita)
    const numVisits = Math.ceil(totalHours / 3);
    const totalCost = numVisits * numWorkers * COST_PER_WORKER_PER_VISIT;

    return {
      totalHours: parseFloat(totalHours.toFixed(2)),
      numVisits: numVisits, // Ahora es entero
      totalCost: parseFloat(totalCost.toFixed(2)),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (numWorkers < 2) {
      toast.error("Debe haber al menos 2 trabajadores por visita");
      return;
    }

    const visitData = calculateVisitData();
    if (!visitData) return;

    setIsLoading(true);

    const data = {
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
      description: description || null,
      num_workers: numWorkers,
      total_hours: visitData.totalHours,
      num_visits: visitData.numVisits,
      total_cost: visitData.totalCost,
      status: "pending",
    };

    let error;

    if (editingVisit) {
      const result = await supabase
        .from("visits")
        .update(data)
        .eq("id", editingVisit.id);
      error = result.error;
    } else {
      const result = await supabase.from("visits").insert(data);
      error = result.error;
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
            <Label htmlFor="num-workers">Número de Trabajadores (mínimo 2)</Label>
            <Input
              id="num-workers"
              type="number"
              min="2"
              value={numWorkers}
              onChange={(e) => setNumWorkers(parseInt(e.target.value) || 2)}
              required
            />
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
              <h4 className="font-semibold">Resumen Automático:</h4>
              <p className="text-sm">
                Total de Horas: <strong>{previewData.totalHours} horas</strong>
              </p>
              <p className="text-sm">
                Número de Visitas (cada 3 horas): <strong>{previewData.numVisits}</strong>
              </p>
              <p className="text-sm text-lg font-bold text-primary">
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
