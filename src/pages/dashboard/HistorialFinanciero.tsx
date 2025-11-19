import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PaidVisitWorker {
  id: string;
  worker_name: string;
  visit_date: string;
  amount: number;
  payment_date: string;
  payment_method: string;
}

interface CollectedVisit {
  id: string;
  start_time: string;
  description: string;
  total_cost: number;
  billing_date: string;
  invoice_reference: string;
}

const HistorialFinanciero = () => {
  const [paidVisitWorkers, setPaidVisitWorkers] = useState<PaidVisitWorker[]>([]);
  const [collectedVisits, setCollectedVisits] = useState<CollectedVisit[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const fetchPaidVisitWorkers = async () => {
    let query = supabase
      .from("visit_workers")
      .select(`
        id,
        amount,
        payment_date,
        payment_method,
        workers (
          full_name
        ),
        visits (
          start_time
        )
      `)
      .eq("payment_status", "paid")
      .order("payment_date", { ascending: false });

    if (startDate) {
      query = query.gte("payment_date", new Date(startDate).toISOString());
    }
    if (endDate) {
      query = query.lte("payment_date", new Date(endDate).toISOString());
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Error al cargar historial de pagos");
      return;
    }

    const formatted = data.map((vw: any) => ({
      id: vw.id,
      worker_name: vw.workers.full_name,
      visit_date: vw.visits.start_time,
      amount: Number(vw.amount),
      payment_date: vw.payment_date,
      payment_method: vw.payment_method,
    }));

    setPaidVisitWorkers(formatted);
  };

  const fetchCollectedVisits = async () => {
    let query = supabase
      .from("visits")
      .select("*")
      .eq("billing_status", "collected")
      .order("billing_date", { ascending: false });

    if (startDate) {
      query = query.gte("billing_date", new Date(startDate).toISOString());
    }
    if (endDate) {
      query = query.lte("billing_date", new Date(endDate).toISOString());
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Error al cargar historial de cobros");
      return;
    }

    setCollectedVisits(data);
  };

  useEffect(() => {
    fetchPaidVisitWorkers();
    fetchCollectedVisits();
  }, [startDate, endDate]);

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "cash":
        return "Efectivo";
      case "transfer":
        return "Transferencia";
      case "check":
        return "Cheque";
      default:
        return method;
    }
  };

  const totalPaid = paidVisitWorkers.reduce((sum, vw) => sum + vw.amount, 0);
  const totalCollected = collectedVisits.reduce(
    (sum, v) => sum + Number(v.total_cost),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Historial Financiero</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Fecha Inicio</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Fecha Fin</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="payments">
        <TabsList>
          <TabsTrigger value="payments">Pagos a Trabajadores</TabsTrigger>
          <TabsTrigger value="collections">Cobros a LLBean</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                Total Pagado: ₡{totalPaid.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trabajador</TableHead>
                    <TableHead>Fecha Visita</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Fecha Pago</TableHead>
                    <TableHead>Método</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paidVisitWorkers.map((vw) => (
                    <TableRow key={vw.id}>
                      <TableCell>{vw.worker_name}</TableCell>
                      <TableCell>
                        {format(new Date(vw.visit_date), "dd/MM/yyyy", {
                          locale: es,
                        })}
                      </TableCell>
                      <TableCell>₡{vw.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        {format(new Date(vw.payment_date), "dd/MM/yyyy", {
                          locale: es,
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getPaymentMethodLabel(vw.payment_method)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="collections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                Total Cobrado: ₡{totalCollected.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha Visita</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Fecha Cobro</TableHead>
                    <TableHead>Referencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collectedVisits.map((visit) => (
                    <TableRow key={visit.id}>
                      <TableCell>
                        {format(new Date(visit.start_time), "dd/MM/yyyy", {
                          locale: es,
                        })}
                      </TableCell>
                      <TableCell>{visit.description || "Sin descripción"}</TableCell>
                      <TableCell>
                        ₡{Number(visit.total_cost).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {format(new Date(visit.billing_date), "dd/MM/yyyy", {
                          locale: es,
                        })}
                      </TableCell>
                      <TableCell>
                        {visit.invoice_reference || "Sin referencia"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HistorialFinanciero;
