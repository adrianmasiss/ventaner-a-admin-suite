import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import { CalendarDays, DollarSign, Clock } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";

interface DailyPayment {
  work_date: string;
  daily_payment: number;
  visit_count: number;
}

export const PanelTrabajador = () => {
  const [payments, setPayments] = useState<DailyPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkerData();
  }, []);

  const fetchWorkerData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');

    const { data, error } = await supabase.rpc('calculate_worker_daily_payment', {
      _worker_id: user.id,
      _start_date: startDate,
      _end_date: endDate
    });

    if (data) {
      setPayments(data);
    }
    setLoading(false);
  };

  const totalDays = payments.length;
  const totalEarnings = payments.reduce((sum, p) => sum + Number(p.daily_payment), 0);
  const totalVisits = payments.reduce((sum, p) => sum + p.visit_count, 0);

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Mi Panel de Trabajador</h1>

      <div className="grid gap-6 md:grid-cols-3">
        <StatCard
          title="Días Trabajados"
          value={totalDays.toString()}
          icon={CalendarDays}
        />
        <StatCard
          title="Ganancias del Mes"
          value={`₡${totalEarnings.toLocaleString()}`}
          icon={DollarSign}
        />
        <StatCard
          title="Total Visitas"
          value={totalVisits.toString()}
          icon={Clock}
        />
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Historial de Trabajo</h2>
        <div className="space-y-3">
          {payments.map((payment, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-4 bg-muted/50 rounded-lg"
            >
              <div>
                <p className="font-medium">
                  {format(new Date(payment.work_date), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {payment.visit_count} {payment.visit_count === 1 ? 'visita' : 'visitas'}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">₡{payment.daily_payment.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Pago diario</p>
              </div>
            </div>
          ))}
          {payments.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No hay registro de días trabajados este mes
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};
