import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";

interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: ReactNode;
    trend?: {
        value: number;
        label: string;
        direction: 'up' | 'down' | 'neutral';
    };
    badge?: {
        text: string;
        variant?: 'default' | 'secondary' | 'destructive' | 'outline';
    };
    className?: string;
    onClick?: () => void;
}

export function MetricCard({
    title,
    value,
    subtitle,
    icon,
    trend,
    badge,
    className = "",
    onClick,
}: MetricCardProps) {
    const formatValue = (val: string | number) => {
        if (typeof val === 'number') {
            // Format large numbers
            if (val >= 1000000) {
                return `${(val / 1000000).toFixed(1)}M`;
            }
            if (val >= 1000) {
                return `${(val / 1000).toFixed(1)}K`;
            }
            // Format decimals
            if (val % 1 !== 0) {
                return val.toFixed(1);
            }
        }
        return val.toString();
    };

    return (
        <Card
            className={`transition-all hover:shadow-md ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''} ${className}`}
            onClick={onClick}
        >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                {icon && (
                    <div className="text-muted-foreground">
                        {icon}
                    </div>
                )}
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                        <div className="text-2xl font-bold">
                            {formatValue(value)}
                        </div>
                        {badge && (
                            <Badge variant={badge.variant || 'secondary'}>
                                {badge.text}
                            </Badge>
                        )}
                    </div>

                    {subtitle && (
                        <p className="text-xs text-muted-foreground">
                            {subtitle}
                        </p>
                    )}

                    {trend && (
                        <div className={`flex items-center text-xs ${trend.direction === 'up' ? 'text-green-600 dark:text-green-400' :
                                trend.direction === 'down' ? 'text-red-600 dark:text-red-400' :
                                    'text-muted-foreground'
                            }`}>
                            <span className="mr-1">
                                {trend.direction === 'up' ? '↗' :
                                    trend.direction === 'down' ? '↘' : '→'}
                            </span>
                            {trend.value > 0 && trend.direction !== 'neutral' && (
                                <span className="font-medium">
                                    {trend.direction === 'up' ? '+' : ''}{trend.value}
                                    {trend.label.includes('%') ? '%' : ''}
                                </span>
                            )}
                            <span className="ml-1">{trend.label}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
