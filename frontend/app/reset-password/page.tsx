'use client';
import { Suspense } from 'react';
import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Zap, Eye, EyeOff, CheckCircle } from 'lucide-react';
import Link from 'next/link';

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="card max-w-md w-full">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 bg-fynnd-600 rounded-xl flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <span className="font-bold text-xl">fynnd</span>
        </div>

        {done ? (
          <div className="text-center">
            <CheckCircle size={48} className="mx-auto text-emerald-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Password Reset!</h2>
            <p className="text-gray-500 mb-6">Your password has been updated successfully.</p>
            <Link href="/login" className="btn-primary w-full py-2.5 inline-block text-center">Sign In</Link>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Set new password</h2>
            <p className="text-gray-500 text-sm mb-6">Must be at least 8 characters with uppercase, lowercase and a number.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">New Password *</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} className="input pr-10" placeholder="Min 8 characters"
                    required value={password} onChange={e => setPassword(e.target.value)} />
                  <button type="button" className="absolute right-3 top-2.5 text-gray-400" onClick={() => setShowPass(!showPass)}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Confirm Password *</label>
                <input type="password" className="input" placeholder="Repeat password"
                  required value={confirm} onChange={e => setConfirm(e.target.value)} />
              </div>
              {error && <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}
              <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
