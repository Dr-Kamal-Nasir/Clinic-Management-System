// components/common/FinalSummaryCard.tsx
'use client';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, TrendingDown, DollarSign, Activity, 
  FlaskConical, Pill, ShoppingCart, CreditCard, User 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// Define icon types
export type CardIconType = 
  | 'revenue' 
  | 'profit' 
  | 'lab' 
  | 'pharmacy' 
  | 'expense' 
  | 'transactions'
  | 'users'
  | 'sales'
  | 'default';

interface FinalSummaryCardProps {
  title: string;
  value: number | string;
  icon?: CardIconType; // Make icon optional
  change?: number;
  loading?: boolean;
  isCurrency?: boolean;
  description?: string;
  className?: string;
}

export default function FinalSummaryCard({
  title,
  value,
  icon = 'default',
  change,
  loading = false,
  isCurrency = true,
  description,
  className
}: FinalSummaryCardProps) {
  const getIcon = () => {
    const iconClass = 'h-6 w-6 text-muted-foreground';
    switch (icon) {
      case 'revenue': return <DollarSign className={iconClass} />;
      case 'profit': return <Activity className={iconClass} />;
      case 'lab': return <FlaskConical className={iconClass} />;
      case 'pharmacy': return <Pill className={iconClass} />;
      case 'expense': return <TrendingDown className={iconClass} />;
      case 'transactions': return <CreditCard className={iconClass} />;
      case 'users': return <User className={iconClass} />;
      case 'sales': return <ShoppingCart className={iconClass} />;
      default: return <Activity className={iconClass} />;
    }
  };

  const formatValue = () => {
    if (typeof value === 'string') return value;
    
    if (isCurrency) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(value);
    }
    return value;
  };

  const getChangeStatus = () => {
    if (change === undefined) return 'neutral';
    return change >= 0 ? 'positive' : 'negative';
  };

  const changeStatus = getChangeStatus();

  return (
    <Card className={cn("h-full transition-all hover:shadow-md", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="p-2 rounded-lg bg-muted/50">
          {getIcon()}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">{formatValue()}</div>
            {change !== undefined && (
              <div className="flex items-center mt-1">
                <div className={cn(
                  "flex items-center text-xs",
                  changeStatus === 'positive' ? 'text-green-500' : 'text-red-500'
                )}>
                  {changeStatus === 'positive' ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  )}
                  {Math.abs(change)}%
                </div>
                <span className="text-xs text-muted-foreground ml-2">
                  vs previous period
                </span>
              </div>
            )}
            {description && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {description}
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{description}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
