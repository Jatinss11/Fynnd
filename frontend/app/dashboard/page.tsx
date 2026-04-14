'use client';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import StatCard from '@/components/ui/StatCard';
import { Users, Briefcase, GitBranch, TrendingUp, UserCheck, Calendar, Zap, ArrowRight, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { STAGE_COLORS } from '@/lib/utils';
import dynamic from 'next/dynamic';

const PipelineChart = dynamic(() => import('@/components/charts/PipelineChart'), { ssr: false });

function TrialBanner() {
  const { data } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => api.get('/billing/subscription').then(r => r.data),
  });
  const sub = data?.subscription;
  if (!sub || sub.status !== 'trial') return null;
  const daysLeft = Math.max(0, Math.ceil((new Date(sub.trialEndsAt).getTime() - Date.now()) / 86400000));
  if (daysLeft > 7) return null;
  return (
    <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-5">
      <div className="flex items-center gap-3">
        <CreditCard size={18} className="text-yellow-600" />
        <div>
          <p className="text-sm font-semibold text-yellow-800">Trial ending in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</p>
          <p className="text-xs text-yellow-600">Upgrade to keep access to all features</p>
        </div>
      </div>
      <Link href="/billing" className="btn text-xs py-1.5 px-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg">
        Upgrade Now
      </Link>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: stats } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => api.get('/analytics/overview').then(r => r.data),
    enabled: user?.role === 'admin',
  });

  const { data: stagesData } = useQuery({
    queryKey: ['pipeline-stages'],
    queryFn: () => api.get('/analytics/pipeline-stages').then(r => r.data),
    enabled: user?.role !== 'client',
  });

  const { data: jobsData } = useQuery({
    queryKey: ['jobs-recent'],
    queryFn: () => api.get('/jobs', { params: { limit: 5 } }).then(r => r.data),
  });

  const { data: pipelineData } = useQuery({
    queryKey: ['pipeline-recent'],
    queryFn: () => api.get('/pipeline').then(r => r.data),
  });

  const recentPipeline = (pipelineData || []).slice(0, 6);

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">{user?.role} · Fynnd AI Talent Cloud</p>
        </div>
        <div className="flex gap-2">
          {user?.role !== 'client' && (
            <Link href="/candidates/upload" className="btn-secondary hidden sm:flex">
              <Zap size={15} /> AI Parse Resume
            </Link>
          )}
          <Link href="/jobs/new" className="btn-primary">+ Post Job</Link>
        </div>
      </div>

      {/* Trial banner for clients */}
      {user?.role === 'client' && (
        <TrialBanner />
      )}

      {user?.role === 'admin' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Candidates" value={stats?.totalCandidates} icon={Users} color="bg-fynnd-600" />
          <StatCard label="Open Jobs" value={stats?.openJobs} icon={Briefcase} color="bg-emerald-500" />
          <StatCard label="Submissions" value={stats?.totalSubmissions} icon={GitBranch} color="bg-violet-500" />
          <StatCard label="Placements" value={stats?.placements} icon={TrendingUp} color="bg-orange-500" suffix={`(${stats?.placementRate}%)`} />
        </div>
      )}

      {user?.role === 'recruiter' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Active Candidates" value={stats?.activeCandidates} icon={UserCheck} color="bg-fynnd-600" />
          <StatCard label="Open Jobs" value={stats?.openJobs} icon={Briefcase} color="bg-emerald-500" />
          <StatCard label="In Pipeline" value={stats?.totalSubmissions} icon={GitBranch} color="bg-violet-500" />
          <StatCard label="Interviews" value={stats?.interviewsScheduled} icon={Calendar} color="bg-yellow-500" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {stagesData && stagesData.length > 0 && (
          <div className="card lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title mb-0">Pipeline Overview</h2>
              <Link href="/pipeline" className="text-sm text-fynnd-600 hover:text-fynnd-700 flex items-center gap-1">
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <PipelineChart data={stagesData} />
          </div>
        )}

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Recent Jobs</h2>
            <Link href="/jobs" className="text-sm text-fynnd-600 hover:text-fynnd-700 flex items-center gap-1">
              All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {jobsData?.jobs?.slice(0, 5).map((job: any) => (
              <Link key={job._id} href={`/jobs/${job._id}`} className="flex items-center justify-between group">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 group-hover:text-fynnd-600 truncate">{job.title}</p>
                  <p className="text-xs text-gray-400">{job.company} · {job.location}</p>
                </div>
                <span className={`badge ml-2 flex-shrink-0 ${job.status === 'open' ? 'badge-green' : 'badge-gray'}`}>
                  {job.status}
                </span>
              </Link>
            ))}
            {!jobsData?.jobs?.length && <p className="text-sm text-gray-400">No jobs yet</p>}
          </div>
        </div>

        {recentPipeline.length > 0 && (
          <div className="card lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title mb-0">Recent Activity</h2>
              <Link href="/pipeline" className="text-sm text-fynnd-600 hover:text-fynnd-700 flex items-center gap-1">
                Pipeline <ArrowRight size={14} />
              </Link>
            </div>
            <div className="space-y-3">
              {recentPipeline.map((entry: any) => (
                <div key={entry._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-fynnd-100 text-fynnd-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {entry.candidateId?.name?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{entry.candidateId?.name}</p>
                      <p className="text-xs text-gray-400 truncate">{entry.jobId?.title}</p>
                    </div>
                  </div>
                  <span className={`badge flex-shrink-0 ml-2 ${STAGE_COLORS[entry.stage] || 'badge-gray'}`}>
                    {entry.stage}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card">
          <h2 className="section-title">Quick Actions</h2>
          <div className="space-y-2">
            {user?.role !== 'client' && (
              <>
                <Link href="/candidates/upload" className="btn-primary w-full justify-start gap-3">
                  <Zap size={15} /> AI Parse Resume
                </Link>
                <Link href="/candidates/new" className="btn-secondary w-full justify-start gap-3">
                  <Users size={15} /> Add Candidate
                </Link>
              </>
            )}
            <Link href="/jobs/new" className="btn-secondary w-full justify-start gap-3">
              <Briefcase size={15} /> Post a Job
            </Link>
            <Link href="/pipeline" className="btn-secondary w-full justify-start gap-3">
              <GitBranch size={15} /> View Pipeline
            </Link>
            <Link href="/portal" className="btn-secondary w-full justify-start gap-3">
              <Zap size={15} /> Candidate Portal
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
