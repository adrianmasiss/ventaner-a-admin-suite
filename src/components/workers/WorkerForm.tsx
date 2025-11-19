import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { z } from "zod";

const workerSchema = z.object({
  full_name: z.string()
    .trim()
    .min(1, "El nombre es requerido")
    .max(100, "El nombre es demasiado largo")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Solo se permiten letras y espacios"),
  phone: z.string()
    .trim()
    .regex(/^[0-9]{8,15}$/, "Formato de teléfono inválido (8-15 dígitos)"),
  payment_rate: z.number()
    .positive("La tarifa debe ser mayor a cero")
    .max(1000000, "La tarifa es excesiva"),
  payment_type: z.enum(["daily", "hourly"], {
    errorMap: () => ({ message: "Tipo de pago inválido" })
  })
});

interface Worker {
  id: string;
  full_name: string;
  phone: string;
  payment_rate: number;
  payment_type: string;
}

interface WorkerFormProps {
  open: boolean;
  onClose: () => void;
  editingWorker: Worker | null;
  onSuccess: () => void;
}

export const WorkerForm = ({ open, onClose, editingWorker, onSuccess }: WorkerFormProps) => {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentRate, setPaymentRate] = useState("");
  const [paymentType, setPaymentType] = useState("daily");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (editingWorker) {
      setFullName(editingWorker.full_name);
      setPhone(editingWorker.phone);
      setPaymentRate(editingWorker.payment_rate.toString());
      setPaymentType(editingWorker.payment_type);
    } else {
      resetForm();
    }
  }, [editingWorker, open]);

  const resetForm = () => {
    setFullName("");
    setPhone("");
    setPaymentRate("");
    setPaymentType("daily");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numericRate = parseFloat(paymentRate);
    
    const validation = workerSchema.safeParse({
      full_name: fullName,
      phone: phone,
      payment_rate: numericRate,
      payment_type: paymentType
    });

    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    const data = {
      full_name: fullName,
      phone: phone,
      payment_rate: parseFloat(paymentRate),
      payment_type: paymentType,
    };

    let error;

    if (editingWorker) {
      const result = await supabase
        .from("workers")
        .update(data)
        .eq("id", editingWorker.id);
      error = result.error;
    } else {
      const result = await supabase.from("workers").insert(data);
      error = result.error;
    }

    setIsLoading(false);

    if (error) {
      toast.error("Error al guardar trabajador");
    } else {
      toast.success(
        editingWorker
          ? "Trabajador actualizado exitosamente"
          : "Trabajador creado exitosamente"
      );
      resetForm();
      onSuccess();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingWorker ? "Editar Trabajador" : "Nuevo Trabajador"}
          </DialogTitle>
          <DialogDescription>
            Complete la información del trabajador
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full-name">Nombre Completo</Label>
            <Input
              id="full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-type">Tipo de Pago</Label>
            <Select value={paymentType} onValueChange={setPaymentType}>
              <SelectTrigger id="payment-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Pago Diario</SelectItem>
                <SelectItem value="hourly">Pago por Hora</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-rate">
              Tarifa ({paymentType === "daily" ? "por día" : "por hora"})
            </Label>
            <Input
              id="payment-rate"
              type="number"
              step="0.01"
              value={paymentRate}
              onChange={(e) => setPaymentRate(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : editingWorker ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
