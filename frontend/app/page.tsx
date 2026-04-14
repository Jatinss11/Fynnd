'use client';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Zap, ArrowRight, Check, Star, Shield, Crown,
  Users, Briefcase, Bot, BarChart2, FileText,
  Phone, Mail, MapPin, ChevronRight, Play,
  TrendingUp, Clock, Target, Award
} from 'lucide-react';

const FEATURES = [
  { icon: Bot, title: 'AI Resume Parser', desc: 'Upload any PDF — AI extracts name, skills, experience, salary in seconds. Zero manual entry.', color: 'bg-violet-100 text-violet-600' },
  { icon: Target, title: 'AI Candidate Matching', desc: 'Post a job and get candidates ranked by match score. 94% accuracy on skill + experience fit.', color: 'bg-blue-100 text-blue-600' },
  { icon: Shield, title: 'ATS Score Checker', desc: 'Know exactly why CVs get rejected. AI scores against job descriptions and suggests fixes.', color: 'bg-emerald-100 text-emerald-600' },
  { icon: Bot, title: 'AI Interview Room', desc: 'Candidates take AI-monitored interviews. Get full reports with scores, strengths, red flags.', color: 'bg-orange-100 text-orange-600' },
  { icon: BarChart2, title: 'Recruitment Analytics', desc: 'Track pipeline stages, placement rates, time-to-hire, and revenue in real time.', color: 'bg-pink-100 text-pink-600' },
  { icon: FileText, title: 'AI CV Builder', desc: 'Candidates build ATS-optimized CVs with 4 professional templates. Download as PDF or Word.', color: 'bg-yellow-100 text-yellow-600' },
];

const PLANS = [
  {
    id: 'basic', name: 'Basic', price: 4999, icon: Shield, color: 'border-gray-200',
    headerBg: 'bg-gray-50', textColor: 'text-gray-900', badge: null,
    features: ['3 Job Postings', '10 AI Matches/month', '50 Candidate Views', '10 Resume Downloads', 'Basic Pipeline', '1 Team Member', 'Email Support'],
  },
  {
    id: 'premium', name: 'Premium', price: 14999, icon: Star, color: 'border-fynnd-500',
    headerBg: 'bg-fynnd-600', textColor: 'text-white', badge: 'Most Popular',
    features: ['15 Job Postings', '100 AI Matches/month', '500 Candidate Views', '100 Resume Downloads', 'Full Pipeline (11 stages)', '5 Team Members', '20 AI Interviews/month', '50 ATS Analyses', 'Analytics Dashboard', 'Priority Support'],
  },
  {
    id: 'gold', name: 'Gold', price: 39999, icon: Crown, color: 'border-yellow-400',
    headerBg: 'bg-gradient-to-br from-yellow-500 to-orange-500', textColor: 'text-white', badge: 'Best Value',
    features: ['Unlimited Job Postings', 'Unlimited AI Matches', 'Unlimited Candidate Views', 'Unlimited Resume Downloads', 'Unlimited AI Interviews', 'Unlimited Team Members', 'Dedicated Account Manager', 'Custom Branding', 'API Access', '24/7 Priority Support'],
  },
];

const STATS = [
  { value: '500+', label: 'Companies Hiring' },
  { value: '10K+', label: 'Placements Made' },
  { value: '94%', label: 'Match Accuracy' },
  { value: '5x', label: 'Faster Hiring' },
];

const TESTIMONIALS = [
  { name: 'Priya Sharma', role: 'HR Head, Razorpay', text: 'Fynnd cut our time-to-hire from 45 days to 8 days. The AI matching is incredibly accurate for tech roles.', avatar: 'P' },
  { name: 'Rahul Mehta', role: 'Talent Acquisition, Zomato', text: 'The AI interview feature is a game changer. We screen 10x more candidates without extra effort.', avatar: 'R' },
  { name: 'Ananya Singh', role: 'Founder, TechStartup', text: 'As a startup, we can\'t afford a full HR team. Fynnd gives us enterprise-level hiring at startup prices.', avatar: 'A' },
];

export default function HomePage() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user) router.push('/dashboard');
  }, [user, router]);

  if (user) return null;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-fynnd-600 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">fynnd</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-fynnd-600 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-fynnd-600 transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-fynnd-600 transition-colors">Reviews</a>
            <Link href="/portal" className="hover:text-fynnd-600 transition-colors">For Candidates</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 hidden sm:block">Sign in</Link>
            <Link href="/pricing" className="btn-primary text-sm py-2">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 to-gray-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-fynnd-900/40 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 bg-fynnd-900/60 border border-fynnd-500/30 text-fynnd-300 text-sm px-4 py-1.5 rounded-full mb-6">
            <Zap size={13} /> India's #1 AI Recruitment Platform
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6">
            Hire the best talent<br />
            <span className="bg-gradient-to-r from-fynnd-400 to-blue-400 bg-clip-text text-transparent">10x faster with AI</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            AI-powered candidate matching, automated interviews, ATS scoring, and smart pipelines — all in one platform built for Indian companies.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" className="btn-primary px-8 py-3.5 text-base flex items-center gap-2">
              Start Free Trial <ArrowRight size={18} />
            </Link>
            <Link href="/portal" className="flex items-center gap-2 text-gray-300 hover:text-white text-sm font-medium border border-white/10 px-6 py-3.5 rounded-xl hover:bg-white/5 transition-all">
              <Play size={15} /> Candidate Portal
            </Link>
          </div>
          <p className="text-gray-500 text-sm mt-4">14-day free trial · No credit card required</p>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-16 max-w-3xl mx-auto">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-bold text-white">{value}</p>
                <p className="text-sm text-gray-400 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold mb-4">Everything you need to hire smarter</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">From sourcing to joining — Fynnd automates the entire recruitment lifecycle with AI.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-fynnd-100 transition-all">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                  <Icon size={22} />
                </div>
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold mb-4">How Fynnd works</h2>
            <p className="text-gray-500 text-lg">From job posting to placement in 4 simple steps</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Post a Job', desc: 'Create a job posting with requirements, skills, and salary range in under 2 minutes.', icon: Briefcase },
              { step: '02', title: 'AI Matches Candidates', desc: 'Our AI scans the talent database and ranks candidates by match score instantly.', icon: Target },
              { step: '03', title: 'AI Interviews', desc: 'Shortlisted candidates take AI-monitored interviews. Get full reports automatically.', icon: Bot },
              { step: '04', title: 'Hire & Track', desc: 'Move candidates through the pipeline, schedule final interviews, and make offers.', icon: TrendingUp },
            ].map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="text-center">
                <div className="relative inline-flex items-center justify-center w-16 h-16 bg-fynnd-50 rounded-2xl mb-4">
                  <Icon size={24} className="text-fynnd-600" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-fynnd-600 text-white text-xs font-bold rounded-full flex items-center justify-center">{step}</span>
                </div>
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-gray-500 text-lg">Start free for 14 days. No credit card required.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              const isPopular = plan.badge === 'Most Popular';
              return (
                <div key={plan.id} className={`rounded-2xl border-2 overflow-hidden ${plan.color} ${isPopular ? 'shadow-2xl shadow-fynnd-500/20 scale-105' : ''}`}>
                  <div className={`p-6 ${plan.headerBg}`}>
                    {plan.badge && (
                      <span className="inline-flex items-center gap-1 bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
                        <Star size={10} /> {plan.badge}
                      </span>
                    )}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <Icon size={20} className={plan.textColor} />
                      </div>
                      <p className={`font-bold text-xl ${plan.textColor}`}>{plan.name}</p>
                    </div>
                    <p className={`text-3xl font-bold ${plan.textColor}`}>
                      ₹{plan.price.toLocaleString('en-IN')}
                      <span className={`text-sm font-normal opacity-70`}>/month</span>
                    </p>
                  </div>
                  <div className="bg-white p-6">
                    <ul className="space-y-2.5 mb-6">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                          <Check size={15} className="text-emerald-500 flex-shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                    <Link href={`/login`}
                      className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${isPopular ? 'bg-fynnd-600 hover:bg-fynnd-700 text-white' : plan.id === 'gold' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}>
                      Start Free Trial <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-center mt-8">
            <Link href="/pricing" className="text-fynnd-600 hover:text-fynnd-700 text-sm font-medium flex items-center gap-1 justify-center">
              View full feature comparison <ChevronRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold mb-4">Trusted by India's top companies</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, role, text, avatar }) => (
              <div key={name} className="bg-slate-50 rounded-2xl p-6 border border-gray-100">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">"{text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-fynnd-600 rounded-full flex items-center justify-center text-white font-bold text-sm">{avatar}</div>
                  <div>
                    <p className="font-semibold text-sm">{name}</p>
                    <p className="text-xs text-gray-400">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CANDIDATE SECTION ── */}
      <section className="py-20 bg-gradient-to-r from-fynnd-900 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 text-fynnd-300 text-sm px-4 py-1.5 rounded-full mb-4">
                <Users size={13} /> For Job Seekers
              </div>
              <h2 className="text-4xl font-bold mb-4">Free tools for candidates</h2>
              <p className="text-gray-300 text-lg mb-6">Build an ATS-optimized CV, check your score against any job, and take AI practice interviews — all free, no login needed.</p>
              <div className="space-y-3 mb-8">
                {['AI CV Builder with 4 professional templates', 'ATS Score Checker — know before you apply', 'Download as PDF or Word instantly', 'AI Interview practice with real feedback'].map(f => (
                  <div key={f} className="flex items-center gap-3 text-sm text-gray-300">
                    <Check size={15} className="text-emerald-400 flex-shrink-0" /> {f}
                  </div>
                ))}
              </div>
              <Link href="/portal" className="btn-primary px-8 py-3 flex items-center gap-2 w-fit">
                Try Candidate Portal <ArrowRight size={16} />
              </Link>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="space-y-3">
                {[
                  { label: 'ATS Score', value: '87%', color: 'bg-emerald-500', width: '87%' },
                  { label: 'Keyword Match', value: '92%', color: 'bg-blue-500', width: '92%' },
                  { label: 'Skills Match', value: '78%', color: 'bg-yellow-500', width: '78%' },
                  { label: 'Experience Match', value: '95%', color: 'bg-violet-500', width: '95%' },
                ].map(({ label, value, color, width }) => (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{label}</span>
                      <span className="font-semibold text-white">{value}</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full">
                      <div className={`h-2 rounded-full ${color}`} style={{ width }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-center text-xs text-gray-500 mt-4">Sample ATS analysis report</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to transform your hiring?</h2>
          <p className="text-gray-500 text-lg mb-8">Join 500+ companies using Fynnd to hire faster with AI. Start your free 14-day trial today.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" className="btn-primary px-10 py-3.5 text-base flex items-center gap-2">
              Start Free Trial <ArrowRight size={18} />
            </Link>
            <Link href="/pricing" className="btn-secondary px-8 py-3.5 text-base">View Pricing</Link>
          </div>
          <p className="text-gray-400 text-sm mt-4">No credit card · 14-day trial · Cancel anytime</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-950 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-fynnd-600 rounded-lg flex items-center justify-center">
                  <Zap size={14} className="text-white" />
                </div>
                <span className="font-bold text-white">fynnd</span>
              </div>
              <p className="text-sm text-gray-500 mb-3">AI-powered recruitment platform for India.</p>
              <p className="text-xs text-gray-600">by Staffinger Solutions LLP, Noida</p>
            </div>
            <div>
              <p className="font-semibold text-white text-sm mb-3">Product</p>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/portal" className="hover:text-white transition-colors">Candidate Portal</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white text-sm mb-3">For Clients</p>
              <ul className="space-y-2 text-sm">
                <li><Link href="/pricing" className="hover:text-white transition-colors">Plans & Pricing</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Post a Job</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">AI Matching</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">AI Interviews</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white text-sm mb-3">Contact</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><Mail size={13} /> sales@fynnd.in</li>
                <li className="flex items-center gap-2"><Phone size={13} /> +91-120-FYNND</li>
                <li className="flex items-center gap-2"><MapPin size={13} /> Noida, Uttar Pradesh</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
            <p>© 2024 Staffinger Solutions LLP · Noida, India · GST: 09XXXXX1234X1ZX</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-gray-400">Privacy Policy</a>
              <a href="#" className="hover:text-gray-400">Terms of Service</a>
              <a href="#" className="hover:text-gray-400">Refund Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
