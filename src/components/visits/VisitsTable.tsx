import { format } from "date-fns";
import { es } from "date-fns/locale";
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
import { Edit, Trash2, CheckCircle, Clock } from "lucide-react";

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
  created_at: string;
}

interface VisitsTableProps {
  visits: Visit[];
  onEdit: (visit: Visit) => void;
  onDelete: (id: string) => void;
}

export const VisitsTable = ({ visits, onEdit, onDelete }: VisitsTableProps) => {
  if (visits.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No hay visitas registradas
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Horario</TableHead>
            <TableHead>Trabajadores</TableHead>
            <TableHead>Horas</TableHead>
            <TableHead>Visitas</TableHead>
            <TableHead>Costo Total</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visits.map((visit) => (
            <TableRow key={visit.id}>
              <TableCell className="font-medium">
                {format(new Date(visit.start_time), "dd MMM yyyy", { locale: es })}
              </TableCell>
              <TableCell>
                {format(new Date(visit.start_time), "HH:mm")} -{" "}
                {format(new Date(visit.end_time), "HH:mm")}
              </TableCell>
              <TableCell>{visit.num_workers}</TableCell>
              <TableCell>{visit.total_hours}h</TableCell>
              <TableCell>{visit.num_visits}</TableCell>
              <TableCell className="font-semibold">
                ₡{visit.total_cost.toLocaleString()}
              </TableCell>
              <TableCell>
                {visit.status === "paid" ? (
                  <Badge variant="default" className="bg-success">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Pagado
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <Clock className="h-3 w-3 mr-1" />
                    Pendiente
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(visit)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(visit.id)}
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
