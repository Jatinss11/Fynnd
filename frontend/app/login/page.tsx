'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Zap, Eye, EyeOff, ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@fynnd.in', password: 'Admin@1234', color: 'bg-purple-100 text-purple-700' },
  { label: 'Recruiter', email: 'recruiter@fynnd.com', password: 'Test@123', color: 'bg-blue-100 text-blue-700' },
  { label: 'Client', email: 'client@acme.com', password: 'Test@123', color: 'bg-emerald-100 text-emerald-700' },
];

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'client', company: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [googleRoleMode, setGoogleRoleMode] = useState(false);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [googleRole, setGoogleRole] = useState('client');
  const [hasGoogle, setHasGoogle] = useState(false);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    setHasGoogle(!!clientId && clientId !== 'your_google_oauth_client_id');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const endpoint = tab === 'login' ? '/auth/login' : '/auth/register';
      const payload = tab === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password, role: form.role, company: form.company };
      const { data } = await api.post(endpoint, payload);
      if (tab === 'register') {
        setSuccess(data.message || 'Account created! You can now sign in.');
        setTab('login');
        setForm(f => ({ ...f, password: '' }));
      } else {
        setAuth(data.user, data.token);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail });
      setForgotSent(true);
    } catch {
      setForgotSent(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleToken) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/google-token', { accessToken: googleToken, role: googleRole });
      setAuth(data.user, data.token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to complete sign-up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot password view ──────────────────────────────────────────────────
  if (forgotMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="card max-w-md w-full">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-fynnd-600 rounded-xl flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl">fynnd</span>
          </div>
          {forgotSent ? (
            <div className="text-center">
              <Mail size={48} className="mx-auto text-fynnd-600 mb-4" />
              <h2 className="text-xl font-bold mb-2">Check your inbox</h2>
              <p className="text-gray-500 mb-6">If that email is registered, we've sent a password reset link.</p>
              <button onClick={() => { setForgotMode(false); setForgotSent(false); setForgotEmail(''); }}
                className="btn-primary w-full py-2.5">Back to Sign In</button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Forgot password?</h2>
              <p className="text-gray-500 text-sm mb-6">Enter your email and we'll send you a reset link.</p>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="label">Email address *</label>
                  <input type="email" className="input" placeholder="you@company.com" required
                    value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} />
                </div>
                {error && <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}
                <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
                <button type="button" onClick={() => setForgotMode(false)}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 py-2">
                  ← Back to Sign In
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Google role selection view ─────────────────────────────────────────────
  if (googleRoleMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="card max-w-md w-full">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-fynnd-600 rounded-xl flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl">fynnd</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">One last step</h2>
          <p className="text-gray-500 text-sm mb-6">Tell us how you'll be using fynnd.</p>
          <form onSubmit={handleGoogleRoleSubmit} className="space-y-4">
            <div>
              <label className="label">I am a *</label>
              <select className="input" value={googleRole} onChange={e => setGoogleRole(e.target.value)}>
                <option value="client">Hiring Company (Client)</option>
                <option value="recruiter">Recruiter</option>
              </select>
            </div>
            {error && <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}
            <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
              {loading ? 'Setting up...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Main login/register view ───────────────────────────────────────────────
  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-950 flex-col justify-between p-12">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-fynnd-600 rounded-xl flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <span className="text-white font-bold text-xl">fynnd</span>
          </Link>
          <Link href="/" className="text-gray-500 hover:text-gray-300 text-sm flex items-center gap-1">
            <ArrowLeft size={14} /> Home
          </Link>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Hire smarter,<br />not harder.
          </h1>
          <p className="text-gray-400 text-lg mb-8">
            The world's most trusted AI recruitment platform. Find the right talent in days, not months.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Faster Hiring', value: '5x' },
              { label: 'Match Accuracy', value: '94%' },
              { label: 'Companies', value: '500+' },
              { label: 'Placements', value: '10K+' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/5 rounded-2xl p-4">
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-sm text-gray-400">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 p-4 bg-fynnd-900/50 border border-fynnd-500/20 rounded-xl">
            <p className="text-fynnd-300 text-sm font-medium mb-1">7-day free trial</p>
            <p className="text-gray-400 text-xs">No credit card required. Full access to all features.</p>
          </div>
        </div>
        <p className="text-gray-600 text-sm">© 2024 Staffinger Solutions · Global</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center justify-between mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-fynnd-600 rounded-lg flex items-center justify-center">
                <Zap size={16} className="text-white" />
              </div>
              <span className="font-bold text-xl">fynnd</span>
            </Link>
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <ArrowLeft size={13} /> Home
            </Link>
          </div>

          <div className="card">
            {/* Tab switcher */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
              {(['login', 'register'] as const).map(t => (
                <button key={t} onClick={() => { setTab(t); setError(''); setSuccess(''); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                  {t === 'login' ? 'Sign In' : 'Register'}
                </button>
              ))}
            </div>

            {/* Success banner */}
            {success && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm px-4 py-3 rounded-xl mb-4 flex items-start gap-2">
                <Mail size={16} className="mt-0.5 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {tab === 'register' && (
                <>
                  <div>
                    <label className="label">Full Name *</label>
                    <input className="input" placeholder="Rahul Sharma" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">I am a *</label>
                    <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                      <option value="client">Hiring Company (Client)</option>
                      <option value="recruiter">Recruiter</option>
                    </select>
                  </div>
                  {form.role === 'client' && (
                    <div>
                      <label className="label">Company Name</label>
                      <input className="input" placeholder="Your company name" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="label">Email address *</label>
                <input type="email" className="input" placeholder="you@company.com" required
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label mb-0">Password *</label>
                  {tab === 'login' && (
                    <button type="button" onClick={() => setForgotMode(true)}
                      className="text-xs text-fynnd-600 hover:text-fynnd-700">
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} className="input pr-10"
                    placeholder={tab === 'register' ? 'Min 8 chars, uppercase & number' : 'Enter your password'}
                    required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                  <button type="button" className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPass(!showPass)}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
                {loading ? (tab === 'login' ? 'Signing in...' : 'Creating account...') : (tab === 'login' ? 'Sign In' : 'Create Account')}
              </button>

              {tab === 'register' && (
                <p className="text-xs text-gray-400 text-center">
                  By registering you agree to our{' '}
                  <a href="#" className="text-fynnd-600 hover:underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-fynnd-600 hover:underline">Privacy Policy</a>
                </p>
              )}
            </form>

            {tab === 'login' && (
              <>
                <div className="divider" />
                <div>
                  <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">Demo accounts</p>
                  <div className="flex gap-2 flex-wrap">
                    {DEMO_ACCOUNTS.map(({ label, email, password, color }) => (
                      <button key={label} onClick={() => setForm(f => ({ ...f, email, password }))}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium ${color} hover:opacity-80 transition-opacity`}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Click a role to auto-fill credentials</p>
                </div>
              </>
            )}
          </div>

          {tab === 'login' && (
            <p className="text-center text-sm text-gray-500 mt-4">
              Don't have an account?{' '}
              <button onClick={() => setTab('register')} className="text-fynnd-600 hover:text-fynnd-700 font-medium">
                Register free
              </button>
            </p>
          )}

          <div className="text-center mt-4">
            <Link href="/pricing" className="text-xs text-gray-400 hover:text-fynnd-600">
              View pricing plans →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
