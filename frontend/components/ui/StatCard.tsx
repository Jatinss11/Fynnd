import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface Props {
  label: string;
  value: number | string | undefined;
  icon: LucideIcon;
  color: string;
  trend?: string;
  trendUp?: boolean;
  suffix?: string;
}

export default function StatCard({ label, value, icon: Icon, color, trend, trendUp, suffix }: Props) {
  return (
    <div className="stat-card">
      <div className={cn('p-3 rounded-xl flex-shrink-0', color)}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900">
          {value ?? <span className="text-gray-300">—</span>}
          {suffix && <span className="text-sm font-normal text-gray-500 ml-1">{suffix}</span>}
        </p>
        <p className="text-sm text-gray-500 truncate">{label}</p>
        {trend && (
          <p className={cn('text-xs mt-0.5', trendUp ? 'text-emerald-600' : 'text-red-500')}>
            {trendUp ? '↑' : '↓'} {trend}
          </p>
        )}
      </div>
    </div>
  );
}
