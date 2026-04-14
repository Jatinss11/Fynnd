'use client';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { INDIAN_CITIES, INDIAN_STATES } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const { user, setAuth } = useAuthStore();
  const [saved, setSaved] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [error, setError] = useState('');

  const [profile, setProfile] = useState({
    name: user?.name || '', phone: user?.phone || '', city: user?.city || '',
  });

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });

  const profileMutation = useMutation({
    mutationFn: (data: any) => api.put('/auth/profile', data),
    onSuccess: (res) => {
      setAuth(res.data, localStorage.getItem('fynnd_token') || '');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const pwMutation = useMutation({
    mutationFn: (data: any) => api.put('/auth/change-password', data),
    onSuccess: () => { setPwSaved(true); setPw({ currentPassword: '', newPassword: '', confirm: '' }); setTimeout(() => setPwSaved(false), 3000); },
    onError: (err: any) => setError(err.response?.data?.message || 'Failed'),
  });

  const handlePwSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) { setError('Passwords do not match'); return; }
    setError('');
    pwMutation.mutate({ currentPassword: pw.currentPassword, newPassword: pw.newPassword });
  };

  return (
    <Layout>
      <h1 className="page-title mb-6">Settings</h1>

      <div className="max-w-xl space-y-5">
        <div className="card space-y-4">
          <h2 className="section-title">Profile</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Full Name</label><input className="input" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} /></div>
            <div><label className="label">Phone</label><input className="input" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} /></div>
            <div><label className="label">City</label>
              <select className="input" value={profile.city} onChange={e => setProfile(p => ({ ...p, city: e.target.value }))}>
                <option value="">Select city</option>
                {INDIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => profileMutation.mutate(profile)} className="btn-primary" disabled={profileMutation.isPending}>
              {profileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
            {saved && <span className="flex items-center gap-1 text-emerald-600 text-sm"><CheckCircle size={15} /> Saved</span>}
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="section-title">Change Password</h2>
          <form onSubmit={handlePwSubmit} className="space-y-3">
            <div><label className="label">Current Password</label><input className="input" type="password" required value={pw.currentPassword} onChange={e => setPw(p => ({ ...p, currentPassword: e.target.value }))} /></div>
            <div><label className="label">New Password</label><input className="input" type="password" required value={pw.newPassword} onChange={e => setPw(p => ({ ...p, newPassword: e.target.value }))} /></div>
            <div><label className="label">Confirm New Password</label><input className="input" type="password" required value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} /></div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex items-center gap-3">
              <button type="submit" className="btn-primary" disabled={pwMutation.isPending}>Update Password</button>
              {pwSaved && <span className="flex items-center gap-1 text-emerald-600 text-sm"><CheckCircle size={15} /> Updated</span>}
            </div>
          </form>
        </div>

        <div className="card">
          <h2 className="section-title">Account Info</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium">{user?.email}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Role</span><span className="font-medium capitalize">{user?.role}</span></div>
            {user?.company && <div className="flex justify-between"><span className="text-gray-500">Company</span><span className="font-medium">{user.company}</span></div>}
          </div>
        </div>
      </div>
    </Layout>
  );
}
