import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DollarSign, Clock, Users, TrendingUp, Calendar, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Visit {
  id: string;
  total_cost: number;
  status: string;
  start_time: string;
  total_hours: number;
  num_workers: number;
}

interface Worker {
  id: string;
  payment_rate: number;
  payment_type: string;
  full_name: string;
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

  const estimatedWorkerPayments = filteredVisits.reduce((sum, visit) => {
    const totalHours = visit.total_hours;
    const numWorkers = visit.num_workers || 1;
    const workersCost = workers.slice(0, numWorkers).reduce((total, worker) => {
      if (worker.payment_type === "hourly") {
        return total + worker.payment_rate * totalHours;
      } else {
        const days = Math.ceil(totalHours / 8);
        return total + worker.payment_rate * days;
      }
    }, 0);
    return sum + workersCost;
  }, 0);

  const netProfit = totalEarnings - estimatedWorkerPayments;

  // Prepare chart data
  const monthlyData = filteredVisits.reduce((acc: any[], visit) => {
    const month = new Date(visit.start_time).toLocaleDateString('es-CR', { month: 'short' });
    const existing = acc.find(item => item.month === month);
    
    if (existing) {
      existing.ingresos += visit.total_cost;
    } else {
      acc.push({ month, ingresos: visit.total_cost });
    }
    
    return acc;
  }, []);

  const statusData = [
    { name: 'Pagado', value: filteredVisits.filter(v => v.status === 'paid').length, color: 'hsl(var(--success))' },
    { name: 'Pendiente', value: filteredVisits.filter(v => v.status === 'pending').length, color: 'hsl(var(--warning))' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Estadísticas</h1>
          <p className="text-muted-foreground mt-1">Análisis financiero y métricas clave</p>
        </div>
      </div>

      {/* Date Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filtrar por Rango de Fechas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start-date">Fecha Inicio</Label>
              <Input
                id="start-date"
                type="date"
                value={dateFilter.start}
                onChange={(e) =>
                  setDateFilter({ ...dateFilter, start: e.target.value })
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
                  setDateFilter({ ...dateFilter, end: e.target.value })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards with Gradients */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Ingresos Totales"
          value={`₡${totalEarnings.toLocaleString()}`}
          icon={DollarSign}
          gradient="primary"
          subtitle="Total ganado de todas las visitas"
        />
        <StatCard
          title="Por Cobrar"
          value={`₡${pendingPayments.toLocaleString()}`}
          icon={Clock}
          gradient="warning"
          subtitle="Visitas pendientes de pago"
        />
        <StatCard
          title="Por Pagar a Trabajadores"
          value={`₡${estimatedWorkerPayments.toLocaleString()}`}
          icon={Users}
          gradient="danger"
          subtitle="Total a pagar a trabajadores"
        />
        <StatCard
          title="Ganancia Neta"
          value={`₡${netProfit.toLocaleString()}`}
          icon={TrendingUp}
          gradient="success"
          subtitle="Ingresos - Pagos"
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Ingresos por Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="ingresos" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Visitas por Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen Detallado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium text-muted-foreground">Total de Visitas</p>
                <p className="text-2xl font-bold font-mono mt-1">{filteredVisits.length}</p>
              </div>
              <div className="p-4 rounded-lg bg-success/10">
                <p className="text-sm font-medium text-success">Visitas Pagadas</p>
                <p className="text-2xl font-bold font-mono mt-1 text-success">
                  {filteredVisits.filter(v => v.status === 'paid').length}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-warning/10">
                <p className="text-sm font-medium text-warning">Visitas Pendientes</p>
                <p className="text-2xl font-bold font-mono mt-1 text-warning">
                  {filteredVisits.filter(v => v.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Estadisticas;
