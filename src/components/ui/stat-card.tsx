import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export const StatCard = ({ title, value, icon: Icon, trend, className }: StatCardProps) => {
  return (
    <Card className={cn('glass glass-hover animate-scale-in', className)}>
      <CardContent className="p-4 lg:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 lg:space-y-2 min-w-0 flex-1 overflow-hidden">
            <p className="text-xs lg:text-sm font-medium text-muted-foreground truncate">{title}</p>
            <p className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-foreground break-all leading-tight">{value}</p>
            {trend && (
              <p
                className={cn(
                  'text-xs font-medium',
                  trend.isPositive ? 'text-success' : 'text-destructive'
                )}
              >
                {trend.isPositive ? '+' : ''}{trend.value}% bu ay
              </p>
            )}
          </div>
          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
