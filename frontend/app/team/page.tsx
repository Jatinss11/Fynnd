'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { UserCog, Plus, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { formatDate, getInitials } from '@/lib/utils';

export default function TeamPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState<'recruiter' | 'client'>('recruiter');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'recruiter', company: '', phone: '', city: '' });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const { data: users, isLoading } = useQuery({
    queryKey: ['users', tab],
    queryFn: () => api.get('/users', { params: { role: tab } }).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/auth/register', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setShowModal(false); setForm({ name: '', email: '', password: '', role: 'recruiter', company: '', phone: '', city: '' }); },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.put(`/users/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const roleBadge = (role: string) => ({ admin: 'badge-purple', recruiter: 'badge-blue', client: 'badge-green' }[role] || 'badge-gray');

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
          {users?.map((u: any) => (
            <div key={u._id} className="card flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-fynnd-100 text-fynnd-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {getInitials(u.name)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-800">{u.name}</p>
                    <span className={`badge ${roleBadge(u.role)}`}>{u.role}</span>
                    {!u.isActive && <span className="badge badge-red">Inactive</span>}
                  </div>
                  <p className="text-sm text-gray-500">{u.email} {u.company ? `· ${u.company}` : ''}</p>
                  <p className="text-xs text-gray-400">Joined {formatDate(u.createdAt)} {u.lastLogin ? `· Last login ${formatDate(u.lastLogin)}` : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => toggleMutation.mutate(u._id)} className="btn-ghost p-2" title={u.isActive ? 'Deactivate' : 'Activate'}>
                  {u.isActive ? <ToggleRight size={20} className="text-emerald-500" /> : <ToggleLeft size={20} className="text-gray-400" />}
                </button>
                <button onClick={() => { if (confirm(`Delete ${u.name}?`)) deleteMutation.mutate(u._id); }} className="btn-ghost p-2 text-gray-400 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
    </Layout>
  );
}
