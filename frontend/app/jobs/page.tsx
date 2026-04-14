'use client';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import Link from 'next/link';
import EmptyState from '@/components/ui/EmptyState';
import { Plus, MapPin, IndianRupee, Users, Zap, Clock, Briefcase } from 'lucide-react';
import { formatLPA } from '@/lib/utils';

const statusBadge: Record<string, string> = {
  open: 'badge-green', closed: 'badge-gray', 'on-hold': 'badge-yellow', filled: 'badge-blue',
};
const urgencyBadge: Record<string, string> = {
  normal: '', urgent: 'badge-orange', critical: 'badge-red',
};
const remoteBadge: Record<string, string> = {
  onsite: 'badge-gray', remote: 'badge-green', hybrid: 'badge-blue',
};

export default function JobsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.get('/jobs').then(r => r.data),
  });

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Jobs</h1>
          <p className="text-sm text-gray-500">{data?.total ?? 0} job openings</p>
        </div>
        <Link href="/jobs/new" className="btn-primary"><Plus size={15} /> Post Job</Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="card h-28 animate-pulse bg-gray-50" />)}</div>
      ) : data?.jobs?.length === 0 ? (
        <EmptyState icon={Briefcase} title="No jobs posted yet" description="Post your first job to start finding candidates."
          action={<Link href="/jobs/new" className="btn-primary">Post a Job</Link>} />
      ) : (
        <div className="space-y-3">
          {data?.jobs?.map((job: any) => (
            <div key={job._id} className="card-hover">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/jobs/${job._id}`} className="font-semibold text-gray-900 hover:text-fynnd-600 text-lg">
                      {job.title}
                    </Link>
                    {job.urgency !== 'normal' && (
                      <span className={`badge ${urgencyBadge[job.urgency]}`}>{job.urgency}</span>
                    )}
                  </div>
                  <p className="text-gray-500 mt-0.5">{job.company} · {job.industry}</p>

                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                    {job.location && <span className="flex items-center gap-1.5"><MapPin size={13} />{job.location}</span>}
                    {job.salaryMin && <span className="flex items-center gap-1.5"><IndianRupee size={13} />{job.salaryMin}–{job.salaryMax} LPA</span>}
                    <span className="flex items-center gap-1.5"><Briefcase size={13} />{job.experienceMin}–{job.experienceMax} yrs</span>
                    <span className="flex items-center gap-1.5"><Users size={13} />{job.openings} opening{job.openings > 1 ? 's' : ''}</span>
                    <span className={`badge ${remoteBadge[job.remote]}`}>{job.remote}</span>
                  </div>

                  {job.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {job.skills.slice(0, 6).map((s: string) => <span key={s} className="badge badge-blue text-[11px]">{s}</span>)}
                      {job.skills.length > 6 && <span className="badge badge-gray text-[11px]">+{job.skills.length - 6}</span>}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className={`badge ${statusBadge[job.status]}`}>{job.status}</span>
                  <div className="flex gap-2">
                    <Link href={`/jobs/${job._id}/matches`} className="btn-secondary text-xs py-1.5">
                      <Zap size={13} /> AI Match
                    </Link>
                    <Link href={`/jobs/${job._id}`} className="btn-secondary text-xs py-1.5">View</Link>
                  </div>
                  <p className="text-xs text-gray-400">{job.applicationCount || 0} submitted</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
