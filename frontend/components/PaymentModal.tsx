'use client';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import api from '@/lib/api';
import { CreditCard, Smartphone, Shield, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  plan: string;
  planName: string;
  price: number;
  onSuccess: () => void;
}

declare global {
  interface Window { Razorpay: any; }
}

export default function PaymentModal({ open, onClose, plan, planName, price, onSuccess }: Props) {
  const [method, setMethod] = useState<'razorpay' | 'phonepe'>('razorpay');
  const [loading, setLoading] = useState(false);

  const handleRazorpay = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/billing/razorpay/create-order', { plan });

      // Dev mode — skip Razorpay SDK
      if (data.devMode) {
        toast('Dev mode: Simulating payment...', { icon: '🔧' });
        await new Promise(r => setTimeout(r, 1500));
        const verify = await api.post('/billing/razorpay/verify', {
          razorpay_order_id: data.orderId,
          razorpay_payment_id: `pay_dev_${Date.now()}`,
          razorpay_signature: 'dev_signature',
          plan,
          devMode: true,
        });
        toast.success(verify.data.message);
        onSuccess();
        onClose();
        return;
      }

      // Load Razorpay SDK dynamically
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Razorpay'));
          document.body.appendChild(script);
        });
      }

      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'Fynnd',
        description: `${planName} Plan — Monthly`,
        order_id: data.orderId,
        image: '/logo.png',
        theme: { color: '#4f46e5' },
        handler: async (response: any) => {
          try {
            const verify = await api.post('/billing/razorpay/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan,
            });
            toast.success(verify.data.message);
            onSuccess();
            onClose();
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      });
      rzp.open();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Payment failed');
      setLoading(false);
    }
  };

  const handlePhonePe = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/billing/phonepe/initiate', { plan });

      if (data.devMode) {
        toast('Dev mode: Simulating PhonePe payment...', { icon: '📱' });
        await new Promise(r => setTimeout(r, 1500));
        const verify = await api.post('/billing/phonepe/verify', {
          merchantTransactionId: `FYNND_dev_${Date.now()}`,
          plan,
        });
        toast.success(verify.data.message);
        onSuccess();
        onClose();
        return;
      }

      // Redirect to PhonePe payment page
      window.location.href = data.redirectUrl;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'PhonePe payment failed');
      setLoading(false);
    }
  };

  const handlePay = () => {
    if (method === 'razorpay') handleRazorpay();
    else handlePhonePe();
  };

  return (
    <Modal open={open} onClose={onClose} title="Complete Payment" size="sm">
      <div className="space-y-5">
        {/* Order summary */}
        <div className="bg-fynnd-50 border border-fynnd-100 rounded-xl p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold text-fynnd-800">{planName} Plan</p>
              <p className="text-xs text-fynnd-600">Monthly subscription · Auto-renews</p>
            </div>
            <p className="text-2xl font-bold text-fynnd-700">₹{price.toLocaleString('en-IN')}</p>
          </div>
          <p className="text-xs text-fynnd-500 mt-2">+ 18% GST = ₹{Math.round(price * 1.18).toLocaleString('en-IN')} total</p>
        </div>

        {/* Payment method */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Choose payment method</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setMethod('razorpay')}
              className={cn('flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all', method === 'razorpay' ? 'border-fynnd-500 bg-fynnd-50' : 'border-gray-100 hover:border-gray-200')}>
              <CreditCard size={22} className={method === 'razorpay' ? 'text-fynnd-600' : 'text-gray-400'} />
              <div className="text-center">
                <p className="text-sm font-semibold">Razorpay</p>
                <p className="text-[10px] text-gray-400">Cards, UPI, NetBanking</p>
              </div>
              {method === 'razorpay' && <Check size={14} className="text-fynnd-600" />}
            </button>

            <button onClick={() => setMethod('phonepe')}
              className={cn('flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all', method === 'phonepe' ? 'border-purple-500 bg-purple-50' : 'border-gray-100 hover:border-gray-200')}>
              <Smartphone size={22} className={method === 'phonepe' ? 'text-purple-600' : 'text-gray-400'} />
              <div className="text-center">
                <p className="text-sm font-semibold">PhonePe</p>
                <p className="text-[10px] text-gray-400">UPI, Wallet</p>
              </div>
              {method === 'phonepe' && <Check size={14} className="text-purple-600" />}
            </button>
          </div>
        </div>

        <button onClick={handlePay} disabled={loading}
          className={cn('w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all',
            method === 'razorpay' ? 'bg-fynnd-600 hover:bg-fynnd-700' : 'bg-purple-600 hover:bg-purple-700',
            loading && 'opacity-70 cursor-not-allowed')}>
          {loading ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : <>Pay ₹{price.toLocaleString('en-IN')}</>}
        </button>

        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <Shield size={12} /> 100% secure · SSL encrypted · GST invoice provided
        </div>
      </div>
    </Modal>
  );
}
