'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { useState, useEffect, Suspense } from 'react';
import { Crown, Star, Shield, Check, Calendar, CreditCard, ArrowRight, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';
import PaymentModal from '@/components/PaymentModal';

const PLAN_CONFIG: Record<string, any> = {
  basic:   { icon: Shield, color: 'text-gray-500',   bg: 'bg-gray-100',   border: 'border-gray-200',  price: 4999,  name: 'Basic',   tagline: 'For small teams' },
  premium: { icon: Star,   color: 'text-fynnd-600',  bg: 'bg-fynnd-100',  border: 'border-fynnd-200', price: 14999, name: 'Premium', tagline: 'Most popular' },
  gold:    { icon: Crown,  color: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-200',price: 39999, name: 'Gold',    tagline: 'Enterprise' },
};

const PLAN_FEATURES: Record<string, string[]> = {
  basic:   ['3 Job Postings', '10 AI Matches/mo', '50 Candidate Views', '1 Team Member'],
  premium: ['15 Job Postings', '100 AI Matches/mo', '500 Candidate Views', '20 AI Interviews', '5 Team Members', 'Analytics'],
  gold:    ['Unlimited Everything', 'Dedicated Manager', 'Custom Branding', 'API Access', '24/7 Support'],
};

function UsageBar({ label, used, limit, unlimited }: any) {
  const pct = unlimited ? 0 : limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const isHigh = pct > 80;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-gray-600 capitalize">{label.replace(/([A-Z])/g, ' $1')}</span>
        <span className={cn('font-semibold', isHigh ? 'text-red-500' : 'text-gray-800')}>
          {unlimited ? '∞ Unlimited' : `${used} / ${limit}`}
        </span>
      </div>
      {!unlimited && (
        <div className="h-2 bg-gray-100 rounded-full">
          <div className={cn('h-2 rounded-full transition-all', isHigh ? 'bg-red-400' : pct > 60 ? 'bg-yellow-400' : 'bg-fynnd-500')}
            style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

function BillingContent() {
  const router = useRouter();
  const qc = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState('');
  const [paymentModal, setPaymentModal] = useState<{ plan: string; name: string; price: number } | null>(null);

  // Read plan from URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const plan = params.get('plan');
      if (plan && PLAN_CONFIG[plan]) setSelectedPlan(plan);
    }
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => api.get('/billing/subscription').then(r => r.data),
  });

  const { data: usageData } = useQuery({
    queryKey: ['usage'],
    queryFn: () => api.get('/billing/usage').then(r => r.data),
  });

  const upgradeMutation = useMutation({
    mutationFn: (plan: string) => api.post('/billing/upgrade', { plan }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['subscription'] });
      qc.invalidateQueries({ queryKey: ['usage'] });
      const planName = PLAN_CONFIG[res.data.subscription.plan]?.name;
      toast.success(`Upgraded to ${planName} plan!`);
      setSelectedPlan('');
      window.history.replaceState({}, '', '/billing');
    },
    onError: () => toast.error('Upgrade failed. Please try again.'),
  });

  const sub = data?.subscription;
  const currentPlan = sub?.plan || 'basic';
  const cfg = PLAN_CONFIG[currentPlan];
  const Icon = cfg?.icon || Shield;
  const planOrder = ['basic', 'premium', 'gold'];
  const isUpgrade = (plan: string) => planOrder.indexOf(plan) > planOrder.indexOf(currentPlan);

  const daysLeft = sub?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(sub.trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0;

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Billing & Subscription</h1>
          <p className="text-sm text-gray-500">Manage your plan, usage, and payments</p>
        </div>
        <Link href="/pricing" className="btn-secondary text-sm">View All Plans</Link>
      </div>

      {/* Trial warning */}
      {sub?.status === 'trial' && daysLeft <= 3 && (
        <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl mb-5">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Trial ending in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</p>
            <p className="text-sm">Upgrade now to keep access to all features.</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="card h-24 animate-pulse bg-gray-50" />)}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Current plan + usage */}
          <div className="lg:col-span-2 space-y-5">
            {/* Current plan card */}
            <div className={cn('card border-2', cfg?.border)}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center', cfg?.bg)}>
                    <Icon size={26} className={cfg?.color} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-bold">{cfg?.name} Plan</h2>
                      <span className={cn('badge', sub?.status === 'active' ? 'badge-green' : sub?.status === 'trial' ? 'badge-yellow' : 'badge-red')}>
                        {sub?.status === 'trial' ? `Trial · ${daysLeft}d left` : sub?.status}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm">₹{cfg?.price?.toLocaleString('en-IN')}/month</p>
                    {sub?.currentPeriodEnd && sub?.status === 'active' && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Calendar size={11} /> Renews {new Date(sub.currentPeriodEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Plan features */}
              <div className="mt-4 flex flex-wrap gap-2">
                {PLAN_FEATURES[currentPlan]?.map(f => (
                  <span key={f} className="flex items-center gap-1 text-xs bg-gray-50 border border-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                    <Check size={11} className="text-emerald-500" /> {f}
                  </span>
                ))}
              </div>
            </div>

            {/* Usage */}
            {usageData?.usage && Object.keys(usageData.usage).length > 0 && (
              <div className="card">
                <h2 className="section-title">This Month's Usage</h2>
                <div className="space-y-4">
                  {Object.entries(usageData.usage).map(([key, val]: any) => (
                    <UsageBar key={key} label={key} used={val.used} limit={val.limit} unlimited={val.unlimited} />
                  ))}
                </div>
                {currentPlan !== 'gold' && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500">Need more? <button onClick={() => setSelectedPlan('premium')} className="text-fynnd-600 hover:text-fynnd-700 font-medium">Upgrade your plan</button></p>
                  </div>
                )}
              </div>
            )}

            {/* Invoice history */}
            {sub?.invoices?.length > 0 && (
              <div className="card">
                <h2 className="section-title">Invoice History</h2>
                <div className="space-y-2">
                  {sub.invoices.map((inv: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium capitalize">{inv.plan} Plan</p>
                        <p className="text-xs text-gray-400">{new Date(inv.paidAt).toLocaleDateString('en-IN')} · {inv.invoiceId}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-gray-800">₹{inv.amount?.toLocaleString('en-IN')}</p>
                        <span className="badge badge-green text-[10px]">Paid</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Upgrade panel */}
          <div className="space-y-4">
            <div className="card">
              <h2 className="section-title">Change Plan</h2>
              <div className="space-y-2.5">
                {Object.entries(PLAN_CONFIG).map(([planId, cfg]: any) => {
                  const PlanIcon = cfg.icon;
                  const isCurrent = planId === currentPlan;
                  const canUpgrade = isUpgrade(planId);
                  return (
                    <button key={planId}
                      onClick={() => canUpgrade && setSelectedPlan(planId === selectedPlan ? '' : planId)}
                      disabled={isCurrent || !canUpgrade}
                      className={cn('w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left',
                        isCurrent ? 'border-fynnd-200 bg-fynnd-50 cursor-default' :
                        selectedPlan === planId ? 'border-fynnd-500 bg-fynnd-50' :
                        canUpgrade ? 'border-gray-100 hover:border-fynnd-200 hover:bg-gray-50 cursor-pointer' :
                        'border-gray-100 opacity-40 cursor-not-allowed')}>
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', cfg.bg)}>
                        <PlanIcon size={18} className={cfg.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{cfg.name}</p>
                        <p className="text-xs text-gray-500">₹{cfg.price.toLocaleString('en-IN')}/mo · {cfg.tagline}</p>
                      </div>
                      {isCurrent && <span className="badge badge-blue text-[10px]">Current</span>}
                      {canUpgrade && selectedPlan === planId && <Check size={16} className="text-fynnd-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Upgrade confirmation */}
              {selectedPlan && isUpgrade(selectedPlan) && (
                <div className="mt-4 p-4 bg-fynnd-50 border border-fynnd-100 rounded-xl">
                  <p className="text-sm font-semibold text-fynnd-800 mb-1">
                    Upgrade to {PLAN_CONFIG[selectedPlan].name}
                  </p>
                  <p className="text-xs text-fynnd-600 mb-3">
                    ₹{PLAN_CONFIG[selectedPlan].price.toLocaleString('en-IN')}/month · Usage resets on upgrade
                  </p>
                  <button
                    onClick={() => setPaymentModal({ plan: selectedPlan, name: PLAN_CONFIG[selectedPlan].name, price: PLAN_CONFIG[selectedPlan].price })}
                    className="btn-primary w-full py-2.5 text-sm">
                    <CreditCard size={14} /> Pay & Upgrade
                  </button>
                  <p className="text-xs text-gray-400 text-center mt-2">Razorpay · PhonePe · GST invoice</p>
                </div>
              )}
            </div>

            {/* Enterprise CTA */}
            <div className="card bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <Crown size={16} className="text-yellow-600" />
                <p className="font-semibold text-yellow-800 text-sm">Need a custom plan?</p>
              </div>
              <p className="text-xs text-yellow-700 mb-3">For 50+ hires/month, bulk pricing, or enterprise SLA requirements.</p>
              <a href="mailto:sales@fynnd.in" className="btn text-xs py-2 bg-yellow-500 hover:bg-yellow-600 text-white w-full justify-center rounded-xl">
                Contact Sales
              </a>
            </div>

            {/* Quick links */}
            <div className="card">
              <h2 className="section-title text-sm">Quick Links</h2>
              <div className="space-y-2">
                <Link href="/jobs/new" className="flex items-center gap-2 text-sm text-gray-600 hover:text-fynnd-600 py-1">
                  <ArrowRight size={13} /> Post a Job
                </Link>
                <Link href="/candidates" className="flex items-center gap-2 text-sm text-gray-600 hover:text-fynnd-600 py-1">
                  <ArrowRight size={13} /> Browse Candidates
                </Link>
                <Link href="/ai-interviews" className="flex items-center gap-2 text-sm text-gray-600 hover:text-fynnd-600 py-1">
                  <ArrowRight size={13} /> AI Interviews
                </Link>
                <Link href="/pricing" className="flex items-center gap-2 text-sm text-gray-600 hover:text-fynnd-600 py-1">
                  <ArrowRight size={13} /> Compare All Plans
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal && (
        <PaymentModal
          open={!!paymentModal}
          onClose={() => setPaymentModal(null)}
          plan={paymentModal.plan}
          planName={paymentModal.name}
          price={paymentModal.price}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['subscription'] });
            qc.invalidateQueries({ queryKey: ['usage'] });
            setSelectedPlan('');
          }}
        />
      )}
    </Layout>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<Layout><div className="animate-pulse space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="card h-24 bg-gray-50" />)}</div></Layout>}>
      <BillingContent />
    </Suspense>
  );
}
