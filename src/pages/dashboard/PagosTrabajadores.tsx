import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
interface WorkerPayment {
  worker_id: string;
  worker_name: string;
  pending_amount: number;
  pending_visits: Array<{
    id: string;
    visit_id: string;
    visit_date: string;
    amount: number;
  }>;
}
const PagosTrabajadores = () => {
  const [workerPayments, setWorkerPayments] = useState<WorkerPayment[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<WorkerPayment | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isDatesDialogOpen, setIsDatesDialogOpen] = useState(false);
  const [viewingDatesWorker, setViewingDatesWorker] = useState<WorkerPayment | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [paymentDate, setPaymentDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const fetchWorkerPayments = async () => {
    const {
      data: visitWorkers,
      error
    } = await supabase.from("visit_workers").select(`
        id,
        worker_id,
        visit_id,
        amount,
        payment_status,
        workers (
          full_name
        ),
        visits (
          start_time
        )
      `).eq("payment_status", "pending").order("visits(start_time)", {
      ascending: false
    });
    if (error) {
      toast.error("Error al cargar pagos pendientes");
      return;
    }

    // Group by worker
    const grouped = visitWorkers.reduce((acc: any, vw: any) => {
      const workerId = vw.worker_id;
      if (!acc[workerId]) {
        acc[workerId] = {
          worker_id: workerId,
          worker_name: vw.workers.full_name,
          pending_amount: 0,
          pending_visits: []
        };
      }
      acc[workerId].pending_amount += Number(vw.amount);
      acc[workerId].pending_visits.push({
        id: vw.id,
        visit_id: vw.visit_id,
        visit_date: vw.visits.start_time,
        amount: Number(vw.amount)
      });
      return acc;
    }, {});
    setWorkerPayments(Object.values(grouped));
  };
  useEffect(() => {
    fetchWorkerPayments();
  }, []);
  const handleMarkAsPaid = async () => {
    if (!selectedWorker) return;
    const visitWorkerIds = selectedWorker.pending_visits.map(v => v.id);
    const {
      error
    } = await supabase.from("visit_workers").update({
      payment_status: "paid",
      payment_date: new Date(paymentDate).toISOString(),
      payment_method: paymentMethod
    }).in("id", visitWorkerIds);
    if (error) {
      toast.error("Error al marcar como pagado");
      return;
    }
    toast.success(`Pago registrado para ${selectedWorker.worker_name}`);
    setIsPaymentDialogOpen(false);
    setSelectedWorker(null);
    fetchWorkerPayments();
  };
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-black">Pagos a Trabajadores</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Saldos Pendientes</CardTitle>
        </CardHeader>
        <CardContent>
          {workerPayments.length === 0 ? <p className="text-muted-foreground">No hay pagos pendientes</p> : <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trabajador</TableHead>
                  <TableHead>Visitas Pendientes</TableHead>
                  <TableHead>Fechas</TableHead>
                  <TableHead>Monto Total</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workerPayments.map(wp => {
              // Get unique dates count
              const uniqueDatesCount = new Set(wp.pending_visits.map(v => format(new Date(v.visit_date), "dd/MM/yyyy", {
                locale: es
              }))).size;
              return <TableRow key={wp.worker_id}>
                      <TableCell className="font-medium">{wp.worker_name}</TableCell>
                      <TableCell>{wp.pending_visits.length}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => {
                    setViewingDatesWorker(wp);
                    setIsDatesDialogOpen(true);
                  }}>
                          <Calendar className="h-4 w-4 mr-2" />
                          Ver {uniqueDatesCount} {uniqueDatesCount === 1 ? 'fecha' : 'fechas'}
                        </Button>
                      </TableCell>
                      <TableCell>₡{wp.pending_amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Button size="sm" onClick={() => {
                    setSelectedWorker(wp);
                    setIsPaymentDialogOpen(true);
                  }}>
                          Marcar como Pagado
                        </Button>
                      </TableCell>
                    </TableRow>;
            })}
              </TableBody>
            </Table>}
        </CardContent>
      </Card>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-foreground">Registrar Pago</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedWorker && <>
                  Registrando pago para {selectedWorker.worker_name}
                  <br />
                  Monto total: ₡{selectedWorker.pending_amount.toLocaleString()}
                </>}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Fecha de Pago</Label>
              <Input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
            </div>

            <div>
              <Label>Método de Pago</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                  <SelectItem value="check">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedWorker && <div className="border rounded-lg p-4 space-y-2">
                <h4 className="font-semibold">Visitas incluidas:</h4>
                {selectedWorker.pending_visits.map(visit => <div key={visit.id} className="flex justify-between text-sm">
                    <span>
                      {format(new Date(visit.visit_date), "dd/MM/yyyy", {
                  locale: es
                })}
                    </span>
                    <span>₡{visit.amount.toLocaleString()}</span>
                  </div>)}
              </div>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleMarkAsPaid}>Confirmar Pago</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para ver fechas trabajadas */}
      <Dialog open={isDatesDialogOpen} onOpenChange={setIsDatesDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-foreground">Fechas Trabajadas</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {viewingDatesWorker && <>Fechas en las que {viewingDatesWorker.worker_name} trabajó visitas pendientes de pago</>}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {viewingDatesWorker && Array.from(new Set(viewingDatesWorker.pending_visits.map(v => format(new Date(v.visit_date), "dd/MM/yyyy", {
            locale: es
          })))).sort().map((date, idx) => <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-slate-950">{date}</span>
              </div>)}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDatesDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
};
export default PagosTrabajadores;