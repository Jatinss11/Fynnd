'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import api from '@/lib/api';
import {
  LayoutDashboard, Users, Briefcase, GitBranch, BarChart2,
  Settings, LogOut, Menu, X, Bell, Search, ChevronDown,
  Calendar, UserCog, Zap, Shield, Bot, CreditCard,
  Building2, Clock, DollarSign, Star, Globe
} from 'lucide-react';
import { useState } from 'react';
import { cn, getInitials } from '@/lib/utils';
import { usePlan } from '@/lib/usePlan';
import { motion } from 'framer-motion';

const navItems = [
  // ── Recruitment ──
  { href: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard, roles: ['admin', 'recruiter', 'client'], group: 'Recruitment' },
  { href: '/candidates',    label: 'Candidates',    icon: Users,           roles: ['admin', 'recruiter'],           group: 'Recruitment' },
  { href: '/jobs',          label: 'Jobs',           icon: Briefcase,       roles: ['admin', 'recruiter', 'client'], group: 'Recruitment' },
  { href: '/pipeline',      label: 'Pipeline',       icon: GitBranch,       roles: ['admin', 'recruiter', 'client'], group: 'Recruitment' },
  { href: '/interviews',    label: 'Interviews',     icon: Calendar,        roles: ['admin', 'recruiter', 'client'], group: 'Recruitment' },
  { href: '/ai-interviews', label: 'AI Interviews',  icon: Bot,             roles: ['admin', 'recruiter'],           group: 'Recruitment' },
  { href: '/ats',           label: 'ATS Analyzer',   icon: Shield,          roles: ['admin', 'recruiter'],           group: 'Recruitment' },
  // ── HRMS ──
  { href: '/hrms',          label: 'HR Dashboard',   icon: Building2,       roles: ['admin', 'client'],              group: 'HRMS' },
  { href: '/hrms/employees',label: 'Employees',      icon: Users,           roles: ['admin', 'client'],              group: 'HRMS' },
  { href: '/hrms/attendance',label: 'Attendance',    icon: Clock,           roles: ['admin', 'client'],              group: 'HRMS' },
  { href: '/hrms/leaves',   label: 'Leave Manager',  icon: Calendar,        roles: ['admin', 'client'],              group: 'HRMS' },
  { href: '/hrms/payroll',  label: 'Payroll',        icon: DollarSign,      roles: ['admin', 'client'],              group: 'HRMS' },
  { href: '/hrms/reviews',  label: 'Performance',    icon: Star,            roles: ['admin', 'client'],              group: 'HRMS' },
  { href: '/hrms/jobboard', label: 'Job Board',      icon: Globe,           roles: ['admin', 'client'],              group: 'HRMS' },
  // ── Admin ──
  { href: '/analytics',     label: 'Analytics',      icon: BarChart2,       roles: ['admin'],                        group: 'Admin' },
  { href: '/team',          label: 'Team',           icon: UserCog,         roles: ['admin'],                        group: 'Admin' },
  { href: '/billing',       label: 'Billing & Plans',icon: CreditCard,      roles: ['client'],                       group: 'Admin' },
];

const planBadgeClass: Record<string, string> = {
  basic:   'bg-gray-100 text-gray-600',
  premium: 'bg-fynnd-100 text-fynnd-700',
  gold:    'bg-yellow-100 text-yellow-700',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { plan, status } = usePlan();

  // Auth guard — redirect to login if not authenticated
  useEffect(() => {
    if (!user) router.push('/login');
  }, [user, router]);

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data),
    refetchInterval: 30_000,
    enabled: !!user,
  });

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) return null;

  const filtered = navItems.filter(item => item.roles.includes(user.role));
  const unread = notifData?.unreadCount ?? 0;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* ── Sidebar ── */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-gray-950 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-auto flex-shrink-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <Link href="/dashboard" className="flex items-center gap-2.5" onClick={() => setSidebarOpen(false)}>
            <div className="w-8 h-8 bg-fynnd-600 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-lg leading-none">fynnd</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">by Staffinger Solutions</p>
            </div>
          </Link>
          <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {filtered.reduce((acc, item, idx, arr) => {
            const prevGroup = idx > 0 ? arr[idx - 1].group : null;
            if (item.group !== prevGroup) {
              acc.push(
                <div key={`group-${item.group}`} className="px-3 pt-4 pb-1 text-[10px] font-semibold text-gray-600 uppercase tracking-widest">
                  {item.group}
                </div>
              );
            }
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
            const Icon = item.icon;
            acc.push(
              <Link key={item.href} href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  active ? 'bg-fynnd-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                )}
                onClick={() => setSidebarOpen(false)}>
                <Icon size={17} />
                {item.label}
              </Link>
            );
            return acc;
          }, [] as React.ReactNode[])}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-white/5">
          {/* Plan badge for clients */}
          {user.role === 'client' && plan && (
            <Link href="/billing" onClick={() => setSidebarOpen(false)}
              className="flex items-center justify-between px-3 py-2 mb-2 bg-fynnd-900/50 rounded-xl border border-fynnd-500/20 hover:border-fynnd-400/40 transition-all">
              <div className="flex items-center gap-2">
                <CreditCard size={13} className="text-fynnd-400" />
                <span className="text-xs text-fynnd-300 font-medium capitalize">{plan} Plan</span>
              </div>
              <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full',
                status === 'trial' ? 'bg-yellow-500/20 text-yellow-300' :
                status === 'active' ? 'bg-emerald-500/20 text-emerald-300' :
                'bg-red-500/20 text-red-300')}>
                {status === 'trial' ? 'Trial' : status}
              </span>
            </Link>
          )}

          {/* Profile */}
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 cursor-pointer"
            onClick={() => setProfileOpen(!profileOpen)}>
            <div className="w-8 h-8 rounded-full bg-fynnd-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {getInitials(user.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
            <ChevronDown size={14} className={cn('text-gray-500 transition-transform', profileOpen && 'rotate-180')} />
          </div>

          {profileOpen && (
            <div className="mt-1 bg-white/5 rounded-xl overflow-hidden">
              <Link href="/settings" onClick={() => { setSidebarOpen(false); setProfileOpen(false); }}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5">
                <Settings size={14} /> Settings
              </Link>
              <button onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-400 hover:text-red-400 hover:bg-white/5 w-full">
                <LogOut size={14} /> Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-4 lg:px-6 py-3 flex items-center gap-4 flex-shrink-0">
          <button className="lg:hidden text-gray-500 hover:text-gray-700" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>

          {/* Search */}
          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-fynnd-500 focus:bg-white"
                placeholder="Search candidates, jobs..."
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val) router.push(`/candidates?search=${encodeURIComponent(val)}`);
                  }
                }}
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Notifications */}
            <Link href="/notifications"
              className="relative p-2 rounded-xl hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors">
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>

            {/* User chip */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-gray-100">
              {user.role === 'client' && plan && (
                <span className={cn('badge text-xs capitalize', planBadgeClass[plan])}>
                  {plan}
                </span>
              )}
              <div className="w-7 h-7 rounded-full bg-fynnd-600 flex items-center justify-center text-xs font-bold text-white">
                {getInitials(user.name)}
              </div>
              <span className="text-sm font-medium text-gray-700">{user.name?.split(' ')[0]}</span>
            </div>
          </div>
        </header>

        {/* Page content with transition */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}>
            {children}
          </motion.div>
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}
