'use client';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import StatCard from '@/components/ui/StatCard';
import { Users, Briefcase, GitBranch, TrendingUp, UserCheck, Calendar, Target } from 'lucide-react';
import dynamic from 'next/dynamic';

const StagesChart = dynamic(() => import('@/components/charts/AnalyticsCharts').then(m => ({ default: m.StagesChart })), { ssr: false });
const MonthlyChart = dynamic(() => import('@/components/charts/AnalyticsCharts').then(m => ({ default: m.MonthlyChart })), { ssr: false });
const SourcesPieChart = dynamic(() => import('@/components/charts/AnalyticsCharts').then(m => ({ default: m.SourcesPieChart })), { ssr: false });

export default function AnalyticsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => api.get('/analytics/overview').then(r => r.data),
  });

  const { data: stages } = useQuery({
    queryKey: ['pipeline-stages'],
    queryFn: () => api.get('/analytics/pipeline-stages').then(r => r.data),
  });

  const { data: topSkills } = useQuery({
    queryKey: ['top-skills'],
    queryFn: () => api.get('/analytics/top-skills').then(r => r.data),
  });

  const { data: sources } = useQuery({
    queryKey: ['candidate-sources'],
    queryFn: () => api.get('/analytics/candidate-sources').then(r => r.data),
  });

  const { data: monthly } = useQuery({
    queryKey: ['monthly-placements'],
    queryFn: () => api.get('/analytics/monthly-placements').then(r => r.data),
  });

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyFormatted = monthly?.map((d: any) => ({
    month: MONTHS[d._id.month - 1],
    placements: d.count,
  }));

  return (
    <Layout>
      <h1 className="page-title mb-6">Analytics</h1>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(8)].map((_, i) => <div key={i} className="card h-24 animate-pulse bg-gray-50" />)}</div>
      ) : (
        <>
          {/* KPI grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Candidates" value={stats?.totalCandidates} icon={Users} color="bg-fynnd-600" />
            <StatCard label="Active Candidates" value={stats?.activeCandidates} icon={UserCheck} color="bg-emerald-500" />
            <StatCard label="Placed" value={stats?.placedCandidates} icon={TrendingUp} color="bg-orange-500" />
            <StatCard label="Placement Rate" value={stats?.placementRate} icon={Target} color="bg-violet-500" suffix="%" />
            <StatCard label="Total Jobs" value={stats?.totalJobs} icon={Briefcase} color="bg-blue-500" />
            <StatCard label="Open Jobs" value={stats?.openJobs} icon={Briefcase} color="bg-indigo-500" />
            <StatCard label="Submissions" value={stats?.totalSubmissions} icon={GitBranch} color="bg-pink-500" />
            <StatCard label="Interviews" value={stats?.totalInterviews} icon={Calendar} color="bg-yellow-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Pipeline stages */}
            {stages && (
              <div className="card">
                <h2 className="section-title">Pipeline Stage Distribution</h2>
                <StagesChart data={stages} />
              </div>
            )}

            {/* Monthly placements */}
            {monthlyFormatted?.length > 0 && (
              <div className="card">
                <h2 className="section-title">Monthly Placements</h2>
                <MonthlyChart data={monthlyFormatted} />
              </div>
            )}

            {/* Candidate sources */}
            {sources?.length > 0 && (
              <div className="card">
                <h2 className="section-title">Candidate Sources</h2>
                <SourcesPieChart data={sources} />
              </div>
            )}

            {/* Top skills */}
            {topSkills?.length > 0 && (
              <div className="card">
                <h2 className="section-title">Top Skills in Database</h2>
                <div className="space-y-2">
                  {topSkills.slice(0, 10).map(({ _id, count }: any) => {
                    const max = topSkills[0].count;
                    return (
                      <div key={_id} className="flex items-center gap-3">
                        <p className="text-sm text-gray-600 w-28 truncate">{_id}</p>
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div className="bg-fynnd-500 h-2 rounded-full transition-all" style={{ width: `${(count / max) * 100}%` }} />
                        </div>
                        <p className="text-sm font-medium text-gray-700 w-6 text-right">{count}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </Layout>
  );
}
