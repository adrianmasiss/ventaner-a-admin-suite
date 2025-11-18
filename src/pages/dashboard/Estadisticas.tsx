import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DollarSign, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { toast } from "sonner";

interface Visit {
  id: string;
  total_cost: number;
  status: string;
  start_time: string;
  total_hours: number;
}

interface Worker {
  id: string;
  payment_rate: number;
  payment_type: string;
}

const Estadisticas = () => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [dateFilter, setDateFilter] = useState({
    start: "",
    end: "",
  });

  const fetchData = async () => {
    const { data: visitsData, error: visitsError } = await supabase
      .from("visits")
      .select("*");

    const { data: workersData, error: workersError } = await supabase
      .from("workers")
      .select("*");

    if (visitsError) {
      toast.error("Error al cargar visitas");
      return;
    }

    if (workersError) {
      toast.error("Error al cargar trabajadores");
      return;
    }

    setVisits(visitsData || []);
    setWorkers(workersData || []);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filterVisitsByDate = () => {
    if (!dateFilter.start && !dateFilter.end) return visits;

    return visits.filter((visit) => {
      const visitDate = new Date(visit.start_time);
      const start = dateFilter.start ? new Date(dateFilter.start) : null;
      const end = dateFilter.end ? new Date(dateFilter.end) : null;

      if (start && end) {
        return visitDate >= start && visitDate <= end;
      } else if (start) {
        return visitDate >= start;
      } else if (end) {
        return visitDate <= end;
      }
      return true;
    });
  };

  const filteredVisits = filterVisitsByDate();

  const totalEarnings = filteredVisits.reduce(
    (sum, visit) => sum + visit.total_cost,
    0
  );

  const pendingPayments = filteredVisits
    .filter((v) => v.status === "pending")
    .reduce((sum, visit) => sum + visit.total_cost, 0);

  const paidAmount = filteredVisits
    .filter((v) => v.status === "paid")
    .reduce((sum, visit) => sum + visit.total_cost, 0);

  // Calculate estimated worker payments
  const estimatedWorkerPayments = filteredVisits.reduce((sum, visit) => {
    const totalHours = visit.total_hours;
    const workersCost = workers.reduce((total, worker) => {
      if (worker.payment_type === "hourly") {
        return total + worker.payment_rate * totalHours;
      } else {
        // For daily payments, assume 8 hours per day
        const days = Math.ceil(totalHours / 8);
        return total + worker.payment_rate * days;
      }
    }, 0);
    return sum + workersCost;
  }, 0);

  const netProfit = totalEarnings - estimatedWorkerPayments;

  const stats = [
    {
      title: "Ingresos Totales",
      value: `₡${totalEarnings.toLocaleString()}`,
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Pendiente de Cobro",
      value: `₡${pendingPayments.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Pagos a Trabajadores",
      value: `₡${estimatedWorkerPayments.toLocaleString()}`,
      icon: TrendingDown,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      title: "Utilidad Neta",
      value: `₡${netProfit.toLocaleString()}`,
      icon: Wallet,
      color: "text-success",
      bgColor: "bg-success/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Estadísticas Financieras</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Fecha Inicio</Label>
              <Input
                id="start-date"
                type="date"
                value={dateFilter.start}
                onChange={(e) =>
                  setDateFilter((prev) => ({ ...prev, start: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">Fecha Fin</Label>
              <Input
                id="end-date"
                type="date"
                value={dateFilter.end}
                onChange={(e) =>
                  setDateFilter((prev) => ({ ...prev, end: e.target.value }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total de Visitas</p>
              <p className="text-2xl font-bold">{filteredVisits.length}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Visitas Pagadas</p>
              <p className="text-2xl font-bold">
                {filteredVisits.filter((v) => v.status === "paid").length}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Visitas Pendientes</p>
              <p className="text-2xl font-bold">
                {filteredVisits.filter((v) => v.status === "pending").length}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Trabajadores Activos</p>
              <p className="text-2xl font-bold">{workers.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Estadisticas;
