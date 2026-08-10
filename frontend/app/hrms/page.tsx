'use client';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import Link from 'next/link';
import { Users, Clock, Calendar, DollarSign, Star, TrendingUp, UserCheck, UserX, Building2, Globe, ArrowRight, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function HRMSDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['hrms-stats'],
    queryFn: () => api.get('/hrms/employees/stats').then(r => r.data),
  });

  const { data: leaveData } = useQuery({
    queryKey: ['hrms-leaves-pending'],
    queryFn: () => api.get('/hrms/leaves', { params: { status: 'Pending' } }).then(r => r.data),
  });

  const { data: payrollData } = useQuery({
    queryKey: ['hrms-payroll-pending'],
    queryFn: () => api.get('/hrms/payroll', { params: { status: 'Pending' } }).then(r => r.data),
  });

  const { data: jobsData } = useQuery({
    queryKey: ['hrms-jobs'],
    queryFn: () => api.get('/jobboard').then(r => r.data),
  });

  const pendingLeaves = leaveData?.length ?? 0;
  const pendingPayroll = payrollData?.length ?? 0;
  const publishedJobs = jobsData?.filter((j: any) => j.status === 'Published').length ?? 0;
  const totalApplications = jobsData?.reduce((sum: number, j: any) => sum + (j.applicationCount || 0), 0) ?? 0;

  const quickLinks = [
    { href: '/hrms/employees', label: 'Employees', icon: Users, color: 'bg-blue-50 text-blue-600', count: stats?.total ?? 0, sub: 'Total employees' },
    { href: '/hrms/attendance', label: 'Attendance', icon: Clock, color: 'bg-emerald-50 text-emerald-600', count: stats?.active ?? 0, sub: 'Active today' },
    { href: '/hrms/leaves', label: 'Leave Requests', icon: Calendar, color: 'bg-orange-50 text-orange-600', count: pendingLeaves, sub: 'Pending approval' },
    { href: '/hrms/payroll', label: 'Payroll', icon: DollarSign, color: 'bg-purple-50 text-purple-600', count: pendingPayroll, sub: 'Pending payment' },
    { href: '/hrms/reviews', label: 'Performance', icon: Star, color: 'bg-yellow-50 text-yellow-600', count: stats?.total ?? 0, sub: 'Employees' },
    { href: '/hrms/jobboard', label: 'Job Board', icon: Globe, color: 'bg-pink-50 text-pink-600', count: publishedJobs, sub: 'Active listings' },
  ];

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">HR Dashboard</h1>
          <p className="text-sm text-gray-500">Manage your workforce, payroll, and hiring</p>
        </div>
        <Link href="/hrms/employees/new" className="btn-primary">
          <Users size={15} /> Add Employee
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Employees', value: stats?.total ?? '—', icon: Users, color: 'text-blue-600 bg-blue-50' },
          { label: 'Active', value: stats?.active ?? '—', icon: UserCheck, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'On Leave', value: stats?.onLeave ?? '—', icon: UserX, color: 'text-orange-600 bg-orange-50' },
          { label: 'New This Month', value: stats?.newThisMonth ?? '—', icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{isLoading ? '—' : value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {quickLinks.map(({ href, label, icon: Icon, color, count, sub }) => (
          <Link key={href} href={href} className="card hover:border-fynnd-200 hover:shadow-card-hover transition-all text-center group">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${color} group-hover:scale-110 transition-transform`}>
              <Icon size={22} />
            </div>
            <p className="text-xl font-bold text-gray-900">{count}</p>
            <p className="text-sm font-medium text-gray-700">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department breakdown */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Employees by Department</h2>
            <Link href="/hrms/employees" className="text-xs text-fynnd-600 hover:text-fynnd-700 flex items-center gap-1">View all <ArrowRight size={12} /></Link>
          </div>
          {isLoading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-gray-50 rounded-lg animate-pulse" />)}</div>
          ) : stats?.byDept?.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No departments yet</p>
          ) : (
            <div className="space-y-3">
              {stats?.byDept?.slice(0, 6).map((d: any) => (
                <div key={d._id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-fynnd-50 flex items-center justify-center flex-shrink-0">
                    <Building2 size={14} className="text-fynnd-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 truncate">{d._id || 'Unassigned'}</span>
                      <span className="text-sm font-bold text-gray-900 ml-2">{d.count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className="h-1.5 bg-fynnd-500 rounded-full" style={{ width: `${Math.min(100, (d.count / (stats?.total || 1)) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending actions */}
        <div className="card">
          <h2 className="section-title">Pending Actions</h2>
          <div className="space-y-3">
            {pendingLeaves > 0 && (
              <Link href="/hrms/leaves?status=Pending" className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors">
                <AlertCircle size={18} className="text-orange-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{pendingLeaves} leave request{pendingLeaves > 1 ? 's' : ''} pending</p>
                  <p className="text-xs text-gray-500">Requires your approval</p>
                </div>
                <ArrowRight size={14} className="text-gray-400" />
              </Link>
            )}
            {pendingPayroll > 0 && (
              <Link href="/hrms/payroll?status=Pending" className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors">
                <DollarSign size={18} className="text-purple-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{pendingPayroll} payroll{pendingPayroll > 1 ? 's' : ''} pending payment</p>
                  <p className="text-xs text-gray-500">Mark as paid after processing</p>
                </div>
                <ArrowRight size={14} className="text-gray-400" />
              </Link>
            )}
            {totalApplications > 0 && (
              <Link href="/hrms/jobboard" className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                <Globe size={18} className="text-blue-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{totalApplications} job application{totalApplications > 1 ? 's' : ''}</p>
                  <p className="text-xs text-gray-500">From your public job board</p>
                </div>
                <ArrowRight size={14} className="text-gray-400" />
              </Link>
            )}
            {pendingLeaves === 0 && pendingPayroll === 0 && totalApplications === 0 && (
              <div className="text-center py-8 text-gray-400">
                <UserCheck size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">All caught up! No pending actions.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
