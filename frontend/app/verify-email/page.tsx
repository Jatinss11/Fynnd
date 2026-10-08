'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { Zap, CheckCircle, XCircle, Loader } from 'lucide-react';
import Link from 'next/link';

function VerifyEmailContent() {
  const params = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('Invalid verification link.'); return; }
    api.get(`/auth/verify-email?token=${token}`)
      .then(({ data }) => { setStatus('success'); setMessage(data.message); })
      .catch((err) => { setStatus('error'); setMessage(err.response?.data?.message || 'Verification failed.'); });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="card max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <div className="w-10 h-10 bg-fynnd-600 rounded-xl flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
        </div>
        {status === 'loading' && (
          <>
            <Loader size={40} className="mx-auto text-fynnd-600 animate-spin mb-4" />
            <p className="text-gray-600">Verifying your email...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle size={48} className="mx-auto text-emerald-500 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Email Verified!</h2>
            <p className="text-gray-500 mb-6">{message}</p>
            <Link href="/login" className="btn-primary w-full py-2.5 inline-block text-center">Sign In</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle size={48} className="mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-gray-500 mb-6">{message}</p>
            <Link href="/login" className="btn-primary w-full py-2.5 inline-block text-center">Back to Login</Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
