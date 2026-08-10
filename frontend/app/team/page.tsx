'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { UserCog, Plus, ToggleLeft, ToggleRight, Trash2, CreditCard, Crown } from 'lucide-react';
import { formatDate, getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';

const PLAN_COLORS: Record<string, string> = {
  basic: 'badge-gray',
  premium: 'badge-blue',
  gold: 'bg-amber-100 text-amber-700',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'badge-green',
  trial: 'badge-blue',
  expired: 'badge-red',
  cancelled: 'badge-gray',
};

export default function TeamPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [planForm, setPlanForm] = useState({ plan: 'basic', months: '1' });
  const [tab, setTab] = useState<'recruiter' | 'client'>('recruiter');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'recruiter', company: '', phone: '', city: '' });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const { data: users, isLoading } = useQuery({
    queryKey: ['users', tab],
    queryFn: () => api.get('/users', { params: { role: tab } }).then(r => r.data),
  });

  // Fetch all subscriptions when on client tab
  const { data: allSubs } = useQuery({
    queryKey: ['billing-all'],
    queryFn: () => api.get('/billing/all').then(r => r.data),
    enabled: tab === 'client',
  });

  const subByClient = (clientId: string) =>
    allSubs?.find((s: any) => s.clientId?._id === clientId || s.clientId === clientId);

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/auth/register', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'recruiter', company: '', phone: '', city: '' });
      toast.success('User created successfully');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create user'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.put(`/users/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User deleted'); },
  });

  const setPlanMutation = useMutation({
    mutationFn: (data: any) => api.post('/billing/admin/set-plan', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['billing-all'] });
      setShowPlanModal(false);
      toast.success(`Plan updated to ${planForm.plan}`);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update plan'),
  });

  const roleBadge = (role: string) => ({ admin: 'badge-purple', recruiter: 'badge-blue', client: 'badge-green' }[role] || 'badge-gray');

  const openPlanModal = (client: any) => {
    setSelectedClient(client);
    const sub = subByClient(client._id);
    setPlanForm({ plan: sub?.plan || 'basic', months: '1' });
    setShowPlanModal(true);
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">Team Management</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={15} /> Add User</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-5">
        {(['recruiter', 'client'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}s
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="card h-16 animate-pulse bg-gray-50" />)}</div>
      ) : users?.length === 0 ? (
        <EmptyState icon={UserCog} title={`No ${tab}s yet`} description={`Add your first ${tab} to get started.`}
          action={<button onClick={() => setShowModal(true)} className="btn-primary">Add {tab}</button>} />
      ) : (
        <div className="space-y-2">
          {users?.map((u: any) => {
            const sub = tab === 'client' ? subByClient(u._id) : null;
            return (
              <div key={u._id} className="card flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-fynnd-100 text-fynnd-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {getInitials(u.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-800">{u.name}</p>
                      <span className={`badge ${roleBadge(u.role)}`}>{u.role}</span>
                      {!u.isActive && <span className="badge badge-red">Inactive</span>}
                      {sub && (
                        <>
                          <span className={`badge ${PLAN_COLORS[sub.plan] || 'badge-gray'} flex items-center gap-1`}>
                            <Crown size={10} /> {sub.plan}
                          </span>
                          <span className={`badge ${STATUS_COLORS[sub.status] || 'badge-gray'}`}>{sub.status}</span>
                        </>
                      )}
                      {tab === 'client' && !sub && (
                        <span className="badge badge-gray">no subscription</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{u.email} {u.company ? `· ${u.company}` : ''}</p>
                    <p className="text-xs text-gray-400">
                      Joined {formatDate(u.createdAt)}
                      {u.lastLogin ? ` · Last login ${formatDate(u.lastLogin)}` : ''}
                      {sub?.currentPeriodEnd ? ` · Plan expires ${formatDate(sub.currentPeriodEnd)}` : ''}
                    </p>
                    {sub && (
                      <div className="flex gap-3 mt-1 text-xs text-gray-400">
                        <span>Views: {sub.usage?.candidateViews ?? 0}</span>
                        <span>Jobs: {sub.usage?.jobPostings ?? 0}</span>
                        <span>AI Matches: {sub.usage?.aiMatches ?? 0}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {tab === 'client' && (
                    <button onClick={() => openPlanModal(u)} className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5" title="Manage subscription">
                      <CreditCard size={13} /> Plan
                    </button>
                  )}
                  <button onClick={() => toggleMutation.mutate(u._id)} className="btn-ghost p-2" title={u.isActive ? 'Deactivate' : 'Activate'}>
                    {u.isActive ? <ToggleRight size={20} className="text-emerald-500" /> : <ToggleLeft size={20} className="text-gray-400" />}
                  </button>
                  <button onClick={() => { if (confirm(`Delete ${u.name}?`)) deleteMutation.mutate(u._id); }} className="btn-ghost p-2 text-gray-400 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add User Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add User">
        <form onSubmit={e => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Full Name *</label><input className="input" required value={form.name} onChange={e => set('name', e.target.value)} /></div>
            <div><label className="label">Email *</label><input className="input" type="email" required value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div><label className="label">Password *</label><input className="input" type="password" required value={form.password} onChange={e => set('password', e.target.value)} /></div>
            <div><label className="label">Role *</label>
              <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="recruiter">Recruiter</option>
                <option value="client">Client</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
            <div><label className="label">City</label><input className="input" value={form.city} onChange={e => set('city', e.target.value)} /></div>
            {form.role === 'client' && (
              <div className="col-span-2"><label className="label">Company</label><input className="input" value={form.company} onChange={e => set('company', e.target.value)} /></div>
            )}
          </div>
          {createMutation.isError && <p className="text-red-500 text-sm">{(createMutation.error as any)?.response?.data?.message}</p>}
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={createMutation.isPending}>{createMutation.isPending ? 'Creating...' : 'Create User'}</button>
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Assign Plan Modal */}
      <Modal open={showPlanModal} onClose={() => setShowPlanModal(false)} title={`Manage Plan — ${selectedClient?.name}`}>
        <div className="mb-4 p-3 bg-gray-50 rounded-xl text-sm text-gray-600">
          <p><span className="font-medium">Company:</span> {selectedClient?.company || '—'}</p>
          <p><span className="font-medium">Email:</span> {selectedClient?.email}</p>
          {subByClient(selectedClient?._id) && (
            <p><span className="font-medium">Current plan:</span> {subByClient(selectedClient?._id)?.plan} ({subByClient(selectedClient?._id)?.status})</p>
          )}
        </div>
        <form onSubmit={e => {
          e.preventDefault();
          setPlanMutation.mutate({ clientId: selectedClient._id, plan: planForm.plan, months: Number(planForm.months) });
        }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Plan *</label>
              <select className="input" value={planForm.plan} onChange={e => setPlanForm(f => ({ ...f, plan: e.target.value }))}>
                <option value="basic">Basic — ₹4,999/mo (50 views)</option>
                <option value="premium">Premium — ₹14,999/mo (500 views)</option>
                <option value="gold">Gold — ₹39,999/mo (Unlimited)</option>
              </select>
            </div>
            <div>
              <label className="label">Duration (months) *</label>
              <select className="input" value={planForm.months} onChange={e => setPlanForm(f => ({ ...f, months: e.target.value }))}>
                <option value="1">1 month</option>
                <option value="3">3 months</option>
                <option value="6">6 months</option>
                <option value="12">12 months</option>
              </select>
            </div>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
            This will immediately activate the plan and reset usage counters.
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={setPlanMutation.isPending}>
              {setPlanMutation.isPending ? 'Saving...' : 'Assign Plan'}
            </button>
            <button type="button" onClick={() => setShowPlanModal(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
