import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DollarSign, Clock, Users, TrendingUp, Calendar, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { StatCard } from "@/components/dashboard/StatCard";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Visit {
  id: string;
  total_cost: number;
  billing_status: string;
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

interface VisitWorker {
  id: string;
  amount: number;
  payment_status: string;
  visit_id: string;
}
const Estadisticas = () => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [visitWorkers, setVisitWorkers] = useState<VisitWorker[]>([]);
  const [dateFilter, setDateFilter] = useState({
    start: "",
    end: ""
  });

  const fetchData = async () => {
    const { data: visitsData, error: visitsError } = await supabase
      .from("visits")
      .select("*");
    
    const { data: workersData, error: workersError } = await supabase
      .from("workers")
      .select("*");
    
    const { data: visitWorkersData, error: visitWorkersError } = await supabase
      .from("visit_workers")
      .select("*");

    if (visitsError) {
      toast.error("Error al cargar visitas");
      return;
    }
    if (workersError) {
      toast.error("Error al cargar trabajadores");
      return;
    }
    if (visitWorkersError) {
      toast.error("Error al cargar pagos a trabajadores");
      return;
    }

    setVisits(visitsData || []);
    setWorkers(workersData || []);
    setVisitWorkers(visitWorkersData || []);
  };
  useEffect(() => {
    fetchData();
  }, []);
  const filterVisitsByDate = () => {
    if (!dateFilter.start && !dateFilter.end) return visits;
    return visits.filter(visit => {
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
  
  // Cobros realizados (billing_status = 'collected')
  const totalCollected = filteredVisits
    .filter(v => v.billing_status === "collected")
    .reduce((sum, visit) => sum + visit.total_cost, 0);
  
  // Cobros pendientes (billing_status = 'pending')
  const pendingCollections = filteredVisits
    .filter(v => v.billing_status === "pending")
    .reduce((sum, visit) => sum + visit.total_cost, 0);
  
  // Total de ingresos potenciales
  const totalEarnings = filteredVisits.reduce((sum, visit) => sum + visit.total_cost, 0);
  
  // Filtrar visit_workers por las visitas filtradas por fecha
  const filteredVisitIds = filteredVisits.map(v => v.id);
  const filteredVisitWorkers = visitWorkers.filter(vw => 
    filteredVisitIds.includes(vw.visit_id)
  );
  
  // Pagos realizados a trabajadores (payment_status = 'paid')
  const paidToWorkers = filteredVisitWorkers
    .filter(vw => vw.payment_status === "paid")
    .reduce((sum, vw) => sum + vw.amount, 0);
  
  // Pagos pendientes a trabajadores (payment_status = 'pending')
  const pendingWorkerPayments = filteredVisitWorkers
    .filter(vw => vw.payment_status === "pending")
    .reduce((sum, vw) => sum + vw.amount, 0);
  
  // Ganancia neta = Cobros realizados - Pagos realizados a trabajadores
  const netProfit = totalCollected - paidToWorkers;

  // Prepare chart data
  const monthlyData = filteredVisits.reduce((acc: any[], visit) => {
    const month = new Date(visit.start_time).toLocaleDateString('es-CR', {
      month: 'short'
    });
    const existing = acc.find(item => item.month === month);
    if (existing) {
      existing.ingresos += visit.total_cost;
    } else {
      acc.push({
        month,
        ingresos: visit.total_cost
      });
    }
    return acc;
  }, []);
  const statusData = [{
    name: 'Cobrado',
    value: filteredVisits.filter(v => v.billing_status === 'collected').length,
    color: 'hsl(var(--success))'
  }, {
    name: 'Pendiente Cobro',
    value: filteredVisits.filter(v => v.billing_status === 'pending').length,
    color: 'hsl(var(--warning))'
  }];
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight page-title-dark text-slate-950">Estadísticas</h1>
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
              <Input id="start-date" type="date" value={dateFilter.start} onChange={e => setDateFilter({
              ...dateFilter,
              start: e.target.value
            })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">Fecha Fin</Label>
              <Input id="end-date" type="date" value={dateFilter.end} onChange={e => setDateFilter({
              ...dateFilter,
              end: e.target.value
            })} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards with Gradients */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Cobros Realizados" value={`₡${totalCollected.toLocaleString()}`} icon={DollarSign} gradient="success" subtitle="Total cobrado de visitas" />
        <StatCard title="Por Cobrar" value={`₡${pendingCollections.toLocaleString()}`} icon={Clock} gradient="warning" subtitle="Visitas pendientes de cobro" />
        <StatCard title="Pagado a Trabajadores" value={`₡${paidToWorkers.toLocaleString()}`} icon={Users} gradient="danger" subtitle="Total pagado a trabajadores" />
        <StatCard title="Ganancia Neta" value={`₡${netProfit.toLocaleString()}`} icon={TrendingUp} gradient="success" subtitle="Cobrado - Pagado" />
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
                <Tooltip contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }} />
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
                <Pie data={statusData} cx="50%" cy="50%" labelLine={false} label={({
                name,
                percent
              }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={100} fill="#8884d8" dataKey="value">
                  {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }} />
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
                <p className="text-sm font-medium text-success">Visitas Cobradas</p>
                <p className="text-2xl font-bold font-mono mt-1 text-success">
                  {filteredVisits.filter(v => v.billing_status === 'collected').length}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-warning/10">
                <p className="text-sm font-medium text-warning">Visitas Pendientes Cobro</p>
                <p className="text-2xl font-bold font-mono mt-1 text-warning">
                  {filteredVisits.filter(v => v.billing_status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>;
};
export default Estadisticas;