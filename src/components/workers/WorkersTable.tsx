import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash2 } from "lucide-react";

interface Worker {
  id: string;
  full_name: string;
  phone: string;
  payment_rate: number;
  payment_type: string;
}

interface WorkersTableProps {
  workers: Worker[];
  onEdit: (worker: Worker) => void;
  onDelete: (id: string) => void;
}

export const WorkersTable = ({ workers, onEdit, onDelete }: WorkersTableProps) => {
  if (workers.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No hay trabajadores registrados
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Tipo de Pago</TableHead>
            <TableHead>Tarifa</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workers.map((worker) => (
            <TableRow key={worker.id}>
              <TableCell className="font-medium">{worker.full_name}</TableCell>
              <TableCell>{worker.phone}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {worker.payment_type === "daily" ? "Diario" : "Por Hora"}
                </Badge>
              </TableCell>
              <TableCell>
                ₡{worker.payment_rate.toLocaleString()}
                {worker.payment_type === "daily" ? "/día" : "/hora"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(worker)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(worker.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
