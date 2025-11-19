import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PendingVisit {
  id: string;
  start_time: string;
  end_time: string;
  description: string;
  total_cost: number;
  billing_status: string;
  num_workers: number;
  days_pending: number;
}

const CobrosEmpresa = () => {
  const [pendingVisits, setPendingVisits] = useState<PendingVisit[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<PendingVisit | null>(null);
  const [isBillingDialogOpen, setIsBillingDialogOpen] = useState(false);
  const [billingStatus, setBillingStatus] = useState<string>("collected");
  const [billingDate, setBillingDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [invoiceReference, setInvoiceReference] = useState<string>("");
  const [totalPending, setTotalPending] = useState(0);

  const fetchPendingVisits = async () => {
    const { data, error } = await supabase
      .from("visits")
      .select("*")
      .in("billing_status", ["pending", "invoiced"])
      .order("start_time", { ascending: false });

    if (error) {
      toast.error("Error al cargar cobros pendientes");
      return;
    }

    const visitsWithDays = data.map((visit) => ({
      ...visit,
      days_pending: differenceInDays(new Date(), new Date(visit.start_time)),
    }));

    setPendingVisits(visitsWithDays);
    setTotalPending(
      visitsWithDays.reduce((sum, v) => sum + Number(v.total_cost), 0)
    );
  };

  useEffect(() => {
    fetchPendingVisits();

    const channel = supabase
      .channel("visits-billing-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "visits",
        },
        () => {
          fetchPendingVisits();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleMarkAsBilled = async () => {
    if (!selectedVisit) return;

    const { error } = await supabase
      .from("visits")
      .update({
        billing_status: billingStatus,
        billing_date: new Date(billingDate).toISOString(),
        invoice_reference: invoiceReference || null,
      })
      .eq("id", selectedVisit.id);

    if (error) {
      toast.error("Error al actualizar estado de cobro");
      return;
    }

    toast.success(
      billingStatus === "collected"
        ? "Visita marcada como cobrada"
        : "Visita marcada como facturada"
    );
    setIsBillingDialogOpen(false);
    setSelectedVisit(null);
    setInvoiceReference("");
    fetchPendingVisits();
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "destructive";
      case "invoiced":
        return "default";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente";
      case "invoiced":
        return "Facturada";
      case "collected":
        return "Cobrada";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-black">Cobros a LLBean</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Total Pendiente</p>
              <p className="text-2xl font-bold">₡{totalPending.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Visitas Pendientes</p>
              <p className="text-2xl font-bold">{pendingVisits.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Visitas Pendientes de Cobro</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingVisits.length === 0 ? (
            <p className="text-muted-foreground">No hay cobros pendientes</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Trabajadores</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingVisits.map((visit) => (
                  <TableRow key={visit.id}>
                    <TableCell>
                      {format(new Date(visit.start_time), "dd/MM/yyyy", {
                        locale: es,
                      })}
                    </TableCell>
                    <TableCell>{visit.description || "Sin descripción"}</TableCell>
                    <TableCell>{visit.num_workers}</TableCell>
                    <TableCell>₡{Number(visit.total_cost).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(visit.billing_status)}>
                        {getStatusLabel(visit.billing_status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedVisit(visit);
                          setBillingStatus(
                            visit.billing_status === "pending" ? "invoiced" : "collected"
                          );
                          setIsBillingDialogOpen(true);
                        }}
                      >
                        Actualizar Estado
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isBillingDialogOpen} onOpenChange={setIsBillingDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-black">Actualizar Estado de Cobro</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedVisit && (
                <>
                  Visita del{" "}
                  {format(new Date(selectedVisit.start_time), "dd/MM/yyyy", {
                    locale: es,
                  })}
                  <br />
                  Monto: ₡{Number(selectedVisit.total_cost).toLocaleString()}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-black">Nuevo Estado</Label>
              <Select value={billingStatus} onValueChange={setBillingStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="invoiced">Facturada</SelectItem>
                  <SelectItem value="collected">Cobrada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-black">Fecha</Label>
              <Input
                type="date"
                value={billingDate}
                onChange={(e) => setBillingDate(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-black">Referencia/Número de Factura</Label>
              <Input
                value={invoiceReference}
                onChange={(e) => setInvoiceReference(e.target.value)}
                placeholder="Ej: FAC-2024-001"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBillingDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleMarkAsBilled}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CobrosEmpresa;
