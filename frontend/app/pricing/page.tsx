'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Check, X, Zap, Shield, Crown, Star, ArrowRight, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    tagline: 'Perfect for startups & small teams',
    price: 4999,
    annualPrice: 3999,
    color: 'border-gray-200',
    headerBg: 'bg-gray-50',
    icon: Shield,
    iconColor: 'text-gray-600',
    iconBg: 'bg-gray-100',
    badge: null,
    features: [
      { label: '3 Active Job Postings', included: true },
      { label: '10 AI Candidate Matches/month', included: true },
      { label: '50 Candidate Profile Views', included: true },
      { label: '10 Resume Downloads', included: true },
      { label: 'Basic Pipeline (4 stages)', included: true },
      { label: '1 Team Member', included: true },
      { label: 'Email Support', included: true },
      { label: 'AI Interviews', included: false },
      { label: 'ATS Analysis', included: false },
      { label: 'Advanced Analytics', included: false },
      { label: 'Priority Support', included: false },
      { label: 'Dedicated Account Manager', included: false },
      { label: 'Custom Branding', included: false },
      { label: 'API Access', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    tagline: 'For growing companies hiring at scale',
    price: 14999,
    annualPrice: 11999,
    color: 'border-fynnd-500',
    headerBg: 'bg-fynnd-600',
    icon: Star,
    iconColor: 'text-white',
    iconBg: 'bg-white/20',
    badge: 'Most Popular',
    features: [
      { label: '15 Active Job Postings', included: true },
      { label: '100 AI Candidate Matches/month', included: true },
      { label: '500 Candidate Profile Views', included: true },
      { label: '100 Resume Downloads', included: true },
      { label: 'Full Pipeline (11 stages)', included: true },
      { label: '5 Team Members', included: true },
      { label: 'Priority Email & Chat Support', included: true },
      { label: '20 AI Interviews/month', included: true },
      { label: '50 ATS Analyses/month', included: true },
      { label: 'Advanced Analytics Dashboard', included: true },
      { label: 'Bulk Candidate Upload', included: true },
      { label: 'Dedicated Account Manager', included: false },
      { label: 'Custom Branding', included: false },
      { label: 'API Access', included: false },
    ],
  },
  {
    id: 'gold',
    name: 'Gold',
    tagline: 'Enterprise-grade for large organisations',
    price: 39999,
    annualPrice: 31999,
    color: 'border-yellow-400',
    headerBg: 'bg-gradient-to-br from-yellow-500 to-orange-500',
    icon: Crown,
    iconColor: 'text-white',
    iconBg: 'bg-white/20',
    badge: 'Best Value',
    features: [
      { label: 'Unlimited Job Postings', included: true },
      { label: 'Unlimited AI Candidate Matches', included: true },
      { label: 'Unlimited Candidate Views', included: true },
      { label: 'Unlimited Resume Downloads', included: true },
      { label: 'Full Pipeline (11 stages)', included: true },
      { label: 'Unlimited Team Members', included: true },
      { label: '24/7 Priority Support', included: true },
      { label: 'Unlimited AI Interviews', included: true },
      { label: 'Unlimited ATS Analyses', included: true },
      { label: 'Advanced Analytics + Reports', included: true },
      { label: 'Bulk Candidate Upload', included: true },
      { label: 'Dedicated Account Manager', included: true },
      { label: 'Custom Branding', included: true },
      { label: 'API Access', included: true },
    ],
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const { user } = useAuthStore();
  const router = useRouter();

  const handleSelect = (planId: string) => {
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'client') return;
    router.push(`/billing?plan=${planId}`);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-fynnd-600 rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-bold text-white text-lg">fynnd</span>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <Link href="/dashboard" className="btn-secondary bg-white/10 border-white/10 text-white hover:bg-white/20 text-sm">Dashboard</Link>
          ) : (
            <Link href="/login" className="btn-primary text-sm">Sign In</Link>
          )}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-fynnd-900/50 border border-fynnd-500/30 text-fynnd-300 text-sm px-4 py-1.5 rounded-full mb-4">
            <Zap size={13} /> AI-Powered Recruitment Platform
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Simple, Transparent Pricing
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Hire faster with AI. No hidden fees. Cancel anytime. 14-day free trial on all plans.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={cn('text-sm', !annual ? 'text-white' : 'text-gray-500')}>Monthly</span>
            <button onClick={() => setAnnual(!annual)}
              className={cn('w-12 h-6 rounded-full transition-all relative', annual ? 'bg-fynnd-600' : 'bg-gray-700')}>
              <div className={cn('w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all', annual ? 'left-6' : 'left-0.5')} />
            </button>
            <span className={cn('text-sm', annual ? 'text-white' : 'text-gray-500')}>
              Annual <span className="text-emerald-400 font-semibold">Save 20%</span>
            </span>
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const price = annual ? plan.annualPrice : plan.price;
            const isPopular = plan.badge === 'Most Popular';
            return (
              <div key={plan.id} className={cn('rounded-2xl border-2 overflow-hidden transition-all hover:scale-[1.02]', plan.color, isPopular ? 'shadow-2xl shadow-fynnd-500/20' : '')}>
                {/* Header */}
                <div className={cn('p-6', plan.headerBg)}>
                  {plan.badge && (
                    <div className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
                      <Star size={11} /> {plan.badge}
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', plan.iconBg)}>
                      <Icon size={20} className={plan.iconColor} />
                    </div>
                    <div>
                      <p className={cn('font-bold text-xl', isPopular || plan.id === 'gold' ? 'text-white' : 'text-gray-900')}>{plan.name}</p>
                      <p className={cn('text-xs', isPopular || plan.id === 'gold' ? 'text-white/70' : 'text-gray-500')}>{plan.tagline}</p>
                    </div>
                  </div>
                  <div className="flex items-end gap-1">
                    <span className={cn('text-4xl font-bold', isPopular || plan.id === 'gold' ? 'text-white' : 'text-gray-900')}>
                      ₹{price.toLocaleString('en-IN')}
                    </span>
                    <span className={cn('text-sm mb-1', isPopular || plan.id === 'gold' ? 'text-white/70' : 'text-gray-500')}>/month</span>
                  </div>
                  {annual && <p className={cn('text-xs mt-1', isPopular || plan.id === 'gold' ? 'text-white/60' : 'text-gray-400')}>Billed ₹{(price * 12).toLocaleString('en-IN')}/year</p>}
                </div>

                {/* Features */}
                <div className="bg-gray-900 p-6">
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((f, i) => (
                      <li key={i} className={cn('flex items-center gap-3 text-sm', f.included ? 'text-gray-200' : 'text-gray-600')}>
                        {f.included
                          ? <Check size={15} className="text-emerald-400 flex-shrink-0" />
                          : <X size={15} className="text-gray-700 flex-shrink-0" />}
                        {f.label}
                      </li>
                    ))}
                  </ul>

                  <button onClick={() => handleSelect(plan.id)}
                    className={cn('w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2',
                      isPopular ? 'bg-fynnd-600 hover:bg-fynnd-700 text-white' :
                      plan.id === 'gold' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white' :
                      'bg-white/10 hover:bg-white/20 text-white border border-white/10')}>
                    Start 14-day Free Trial <ArrowRight size={15} />
                  </button>
                  <p className="text-center text-xs text-gray-600 mt-2">No credit card required</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature comparison table */}
        <div className="bg-gray-900 border border-white/10 rounded-2xl overflow-hidden mb-16">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-xl font-bold">Full Feature Comparison</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left p-4 text-gray-400 font-medium w-1/2">Feature</th>
                  <th className="text-center p-4 text-gray-300 font-semibold">Basic<br /><span className="text-fynnd-400 font-bold">₹4,999</span></th>
                  <th className="text-center p-4 text-fynnd-300 font-semibold bg-fynnd-900/30">Premium<br /><span className="text-fynnd-400 font-bold">₹14,999</span></th>
                  <th className="text-center p-4 text-yellow-300 font-semibold">Gold<br /><span className="text-yellow-400 font-bold">₹39,999</span></th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Job Postings', '3', '15', 'Unlimited'],
                  ['AI Candidate Matches', '10/mo', '100/mo', 'Unlimited'],
                  ['Candidate Profile Views', '50/mo', '500/mo', 'Unlimited'],
                  ['Resume Downloads', '10/mo', '100/mo', 'Unlimited'],
                  ['AI Interviews', '—', '20/mo', 'Unlimited'],
                  ['ATS Analysis', '—', '50/mo', 'Unlimited'],
                  ['Team Members', '1', '5', 'Unlimited'],
                  ['Pipeline Stages', '4', '11', '11'],
                  ['Analytics Dashboard', '—', '✓', '✓'],
                  ['Priority Support', '—', '✓', '✓'],
                  ['Dedicated Manager', '—', '—', '✓'],
                  ['Custom Branding', '—', '—', '✓'],
                  ['API Access', '—', '—', '✓'],
                  ['Bulk Upload', '—', '✓', '✓'],
                  ['SLA Guarantee', '—', '99.5%', '99.9%'],
                ].map(([feature, basic, premium, gold], i) => (
                  <tr key={i} className={cn('border-b border-white/5', i % 2 === 0 ? '' : 'bg-white/[0.02]')}>
                    <td className="p-4 text-gray-300">{feature}</td>
                    <td className="p-4 text-center text-gray-400">{basic}</td>
                    <td className="p-4 text-center text-gray-200 bg-fynnd-900/20">{premium}</td>
                    <td className="p-4 text-center text-yellow-200">{gold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {[
            { q: 'Is there a free trial?', a: 'Yes! All plans come with a 14-day free trial. No credit card required to start.' },
            { q: 'Can I upgrade or downgrade anytime?', a: 'Absolutely. You can change your plan at any time. Upgrades take effect immediately.' },
            { q: 'What payment methods do you accept?', a: 'We accept all major credit/debit cards, UPI, net banking, and NEFT/RTGS via Razorpay.' },
            { q: 'Is GST included in the pricing?', a: 'Prices shown are exclusive of GST. 18% GST will be added at checkout. GST invoices are provided.' },
            { q: 'What happens when I hit my limit?', a: 'You\'ll be notified and prompted to upgrade. Existing data is never deleted.' },
            { q: 'Do you offer custom enterprise plans?', a: 'Yes! Contact us at sales@fynnd.in or call +91-120-FYNND for custom pricing.' },
          ].map(({ q, a }, i) => (
            <div key={i} className="bg-gray-900 border border-white/10 rounded-xl p-5">
              <p className="font-semibold text-white mb-2">{q}</p>
              <p className="text-gray-400 text-sm">{a}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-fynnd-900 to-fynnd-800 border border-fynnd-500/30 rounded-2xl p-10 text-center">
          <h2 className="text-3xl font-bold mb-3">Ready to hire smarter?</h2>
          <p className="text-gray-300 mb-6">Join 500+ companies using Fynnd to find the best talent in India</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button onClick={() => handleSelect('premium')} className="btn-primary px-8 py-3 text-base">
              Start Free Trial <ArrowRight size={16} />
            </button>
            <a href="tel:+911204FYNND" className="flex items-center gap-2 text-gray-300 hover:text-white text-sm">
              <Phone size={15} /> Talk to Sales
            </a>
          </div>
          <p className="text-xs text-gray-500 mt-4">by Staffinger Solutions LLP, Noida · GST: 09XXXXX1234X1ZX</p>
        </div>
      </div>
    </div>
  );
}
