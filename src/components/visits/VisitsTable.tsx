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
            <TableHead className="text-slate-900">Fecha</TableHead>
            <TableHead className="text-slate-900">Horario</TableHead>
            <TableHead className="text-slate-900">Trabajadores</TableHead>
            <TableHead className="text-slate-900">Horas</TableHead>
            <TableHead className="text-slate-900">Visitas</TableHead>
            <TableHead className="text-slate-900">Costo Total</TableHead>
            <TableHead className="text-slate-900">Estado</TableHead>
            <TableHead className="text-right text-slate-900">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visits.map((visit) => (
            <TableRow key={visit.id}>
              <TableCell className="font-medium text-slate-900">
                {format(new Date(visit.start_time), "dd MMM yyyy", { locale: es })}
              </TableCell>
              <TableCell className="text-slate-900">
                {format(new Date(visit.start_time), "HH:mm")} -{" "}
                {format(new Date(visit.end_time), "HH:mm")}
              </TableCell>
              <TableCell className="text-slate-900">{visit.num_workers}</TableCell>
              <TableCell className="text-slate-900">{visit.total_hours}h</TableCell>
              <TableCell className="text-slate-900">{visit.num_visits}</TableCell>
              <TableCell className="font-semibold text-slate-900">
                ₡{visit.total_cost.toLocaleString()}
              </TableCell>
              <TableCell>
                {visit.status === "paid" ? (
                  <Badge variant="default" className="bg-success text-white">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Pagado
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-slate-900">
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
