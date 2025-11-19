import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

interface VisitFiltersProps {
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  dateFilter: string;
  setDateFilter: (value: string) => void;
}

export const VisitFilters = ({
  statusFilter,
  setStatusFilter,
  dateFilter,
  setDateFilter,
}: VisitFiltersProps) => {
  return (
    <Card className="glass-card border-slate-200/60">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status-filter" className="text-slate-900 font-semibold">Estado</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="status-filter" className="bg-white/80 border-slate-200/60 text-slate-900">
                <SelectValue placeholder="Seleccionar estado" className="text-white" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all" className="text-slate-900">Todos</SelectItem>
                <SelectItem value="pending" className="text-slate-900">Pendiente de Pago</SelectItem>
                <SelectItem value="paid" className="text-slate-900">Pagado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="date-filter" className="text-slate-900 font-semibold">Fecha</Label>
            <Input
              id="date-filter"
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-white/80 border-slate-200/60 text-slate-900"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
