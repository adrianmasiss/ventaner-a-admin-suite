import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  gradient?: "primary" | "success" | "warning" | "danger";
  subtitle?: string;
}

export const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  gradient,
  subtitle 
}: StatCardProps) => {
  const gradients = {
    primary: "from-[hsl(var(--primary))] to-[hsl(var(--info))]",
    success: "from-[hsl(var(--success))] to-emerald-500",
    warning: "from-[hsl(var(--warning))] to-orange-600",
    danger: "from-[hsl(var(--destructive))] to-red-600",
  };

  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1",
        gradient && "bg-gradient-to-br text-white border-0",
        gradient && gradients[gradient]
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className={cn(
              "text-sm font-semibold mb-1",
              gradient ? "text-white/90" : "text-muted-foreground"
            )}>
              {title}
            </p>
            <p className={cn(
              "text-3xl font-bold font-mono mb-2",
              gradient ? "text-white" : "text-foreground"
            )}>
              {value}
            </p>
            {subtitle && (
              <p className={cn(
                "text-xs",
                gradient ? "text-white/80" : "text-muted-foreground"
              )}>
                {subtitle}
              </p>
            )}
            {trend && (
              <p className={cn(
                "text-sm mt-2",
                gradient ? "text-white/90" : "text-muted-foreground"
              )}>
                {trend}
              </p>
            )}
          </div>
          <div className={cn(
            "p-3 rounded-xl",
            gradient ? "bg-white/20" : "bg-primary/10"
          )}>
            <Icon className={cn(
              "h-6 w-6",
              gradient ? "text-white" : "text-primary"
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
