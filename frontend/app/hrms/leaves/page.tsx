'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { Calendar, Plus, Check, X, Clock, Filter } from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';

const LEAVE_TYPES = ['Casual', 'Sick', 'Earned', 'Unpaid', 'Maternity', 'Paternity', 'Bereavement', 'Other'];
const STATUS_COLORS: Record<string, string> = {
  Pending: 'badge-yellow', Approved: 'badge-green', Rejected: 'badge-red', Cancelled: 'badge-gray',
};

export default function LeavesPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [form, setForm] = useState({
    employeeId: '', leaveType: 'Casual', startDate: '', endDate: '',
    totalDays: '1', reason: '', halfDay: false,
  });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const { data: employees } = useQuery({
    queryKey: ['hrms-employees-all'],
    queryFn: () => api.get('/hrms/employees', { params: { limit: 100 } }).then(r => r.data.employees),
  });

  const { data: leaves, isLoading } = useQuery({
    queryKey: ['hrms-leaves', statusFilter],
    queryFn: () => api.get('/hrms/leaves', { params: { status: statusFilter || undefined } }).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/hrms/leaves', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hrms-leaves'] }); setShowModal(false); toast.success('Leave applied'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.put(`/hrms/leaves/${id}/approve`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hrms-leaves'] }); toast.success('Leave approved'); },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.put(`/hrms/leaves/${id}/reject`, { reason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hrms-leaves'] }); setRejectId(null); toast.success('Leave rejected'); },
  });

  const pending = leaves?.filter((l: any) => l.status === 'Pending').length ?? 0;
  const approved = leaves?.filter((l: any) => l.status === 'Approved').length ?? 0;

  return (
    <Layout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="page-title">Leave Manager</h1>
          <p className="text-sm text-gray-500">{pending} pending · {approved} approved</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={15} /> Apply Leave</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Pending', value: pending, color: 'text-yellow-600 bg-yellow-50' },
          { label: 'Approved', value: approved, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Rejected', value: leaves?.filter((l: any) => l.status === 'Rejected').length ?? 0, color: 'text-red-500 bg-red-50' },
          { label: 'Total', value: leaves?.length ?? 0, color: 'text-blue-600 bg-blue-50' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center">
            <p className={`text-2xl font-bold ${color.split(' ')[0]}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="card mb-4 p-3 flex gap-3 items-center">
        <Filter size={15} className="text-gray-400" />
        <div className="flex gap-2 flex-wrap">
          {['', 'Pending', 'Approved', 'Rejected', 'Cancelled'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                statusFilter === s ? 'bg-fynnd-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Leave list */}
      {isLoading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="card h-20 animate-pulse bg-gray-50" />)}</div>
      ) : !leaves?.length ? (
        <div className="card text-center py-12">
          <Calendar size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No leave requests found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leaves.map((leave: any) => (
            <div key={leave._id} className="card flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-fynnd-50 flex items-center justify-center flex-shrink-0">
                  <Calendar size={18} className="text-fynnd-600" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">
                      {leave.employeeId?.firstName} {leave.employeeId?.lastName}
                    </p>
                    <span className="badge badge-blue">{leave.leaveType}</span>
                    <span className={`badge ${STATUS_COLORS[leave.status]}`}>{leave.status}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {formatDate(leave.startDate)} → {formatDate(leave.endDate)} · {leave.totalDays} day{leave.totalDays > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{leave.reason}</p>
                </div>
              </div>
              {leave.status === 'Pending' && (
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => approveMutation.mutate(leave._id)}
                    className="btn-secondary text-emerald-600 border-emerald-200 hover:bg-emerald-50 px-3 py-1.5 text-xs flex items-center gap-1">
                    <Check size={13} /> Approve
                  </button>
                  <button onClick={() => setRejectId(leave._id)}
                    className="btn-secondary text-red-500 border-red-200 hover:bg-red-50 px-3 py-1.5 text-xs flex items-center gap-1">
                    <X size={13} /> Reject
                  </button>
                </div>
              )}
              {leave.status !== 'Pending' && (
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-400">Applied {formatDate(leave.appliedAt)}</p>
                  {leave.approvedBy && <p className="text-xs text-gray-400">By {leave.approvedBy?.name}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Apply Leave Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Apply Leave">
        <form onSubmit={e => { e.preventDefault(); createMutation.mutate({ ...form, totalDays: Number(form.totalDays) }); }} className="space-y-4">
          <div>
            <label className="label">Employee *</label>
            <select className="input" required value={form.employeeId} onChange={e => set('employeeId', e.target.value)}>
              <option value="">Select employee</option>
              {employees?.map((emp: any) => <option key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName} ({emp.employeeId})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Leave Type *</label>
              <select className="input" value={form.leaveType} onChange={e => set('leaveType', e.target.value)}>
                {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Total Days *</label>
              <input className="input" type="number" min="0.5" step="0.5" required value={form.totalDays} onChange={e => set('totalDays', e.target.value)} />
            </div>
            <div>
              <label className="label">Start Date *</label>
              <input className="input" type="date" required value={form.startDate} onChange={e => set('startDate', e.target.value)} />
            </div>
            <div>
              <label className="label">End Date *</label>
              <input className="input" type="date" required value={form.endDate} onChange={e => set('endDate', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Reason *</label>
            <textarea className="input" rows={3} required value={form.reason} onChange={e => set('reason', e.target.value)} placeholder="Reason for leave..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={createMutation.isPending}>{createMutation.isPending ? 'Applying...' : 'Apply Leave'}</button>
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Reject Modal */}
      <Modal open={!!rejectId} onClose={() => setRejectId(null)} title="Reject Leave">
        <div className="space-y-4">
          <div>
            <label className="label">Reason for rejection</label>
            <textarea className="input" rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Optional reason..." />
          </div>
          <div className="flex gap-3">
            <button onClick={() => rejectMutation.mutate({ id: rejectId!, reason: rejectReason })}
              className="btn-danger" disabled={rejectMutation.isPending}>
              {rejectMutation.isPending ? 'Rejecting...' : 'Reject Leave'}
            </button>
            <button onClick={() => setRejectId(null)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
