'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import EmptyState from '@/components/ui/EmptyState';
import { Bell, CheckCheck } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const typeIcon: Record<string, string> = {
  pipeline_update: '🔄', interview_scheduled: '📅', offer_released: '🎉',
  new_job: '💼', new_candidate: '👤', feedback: '💬', system: '🔔',
};

export default function NotificationsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data),
  });

  const readAllMutation = useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const readMutation = useMutation({
    mutationFn: (id: string) => api.put(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Notifications</h1>
          {data?.unreadCount > 0 && <p className="text-sm text-gray-500">{data.unreadCount} unread</p>}
        </div>
        {data?.unreadCount > 0 && (
          <button onClick={() => readAllMutation.mutate()} className="btn-secondary text-sm">
            <CheckCheck size={15} /> Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="card h-16 animate-pulse bg-gray-50" />)}</div>
      ) : data?.notifications?.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="space-y-2">
          {data?.notifications?.map((n: any) => (
            <div key={n._id}
              className={cn('card flex items-start gap-4 cursor-pointer hover:border-fynnd-100 transition-colors', !n.read && 'border-fynnd-200 bg-fynnd-50/30')}
              onClick={() => { if (!n.read) readMutation.mutate(n._id); }}>
              <span className="text-xl flex-shrink-0">{typeIcon[n.type] || '🔔'}</span>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm', !n.read ? 'font-semibold text-gray-900' : 'text-gray-700')}>{n.title}</p>
                <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.createdAt)}</p>
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full bg-fynnd-500 flex-shrink-0 mt-1.5" />}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
