'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import Link from 'next/link';
import { ArrowLeft, MapPin, IndianRupee, Briefcase, Users, Zap, Edit, Trash2, Clock, Globe, Plus } from 'lucide-react';
import { formatDate, SCORE_COLOR } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';
import { useState } from 'react';

const statusBadge: Record<string, string> = {
  open: 'badge-green', closed: 'badge-gray', 'on-hold': 'badge-yellow', filled: 'badge-blue',
};

export default function JobDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [jdText, setJdText] = useState('');
  const [matching, setMatching] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => api.get(`/jobs/${id}`).then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/jobs/${id}`),
    onSuccess: () => router.push('/jobs'),
  });

  const runMatching = async () => {
    setMatching(true);
    try {
      const res = await api.get(`/jobs/${id}/matches`);
      setMatches(res.data);
    } catch {}
    setMatching(false);
  };

  const addToPipeline = async (candidateId: string, score: number, reasons: string[]) => {
    setAdding(candidateId);
    try {
      await api.post('/pipeline', { jobId: id, candidateId, matchScore: score, matchReasons: reasons });
      setAdded(prev => new Set([...prev, candidateId]));
    } catch (err: any) {
      if (err.response?.status === 409) setAdded(prev => new Set([...prev, candidateId]));
    } finally {
      setAdding(null);
    }
  };

  if (isLoading) return <Layout><div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="card h-24 animate-pulse bg-gray-50" />)}</div></Layout>;
  if (!job) return <Layout><p className="text-gray-500">Job not found</p></Layout>;

  return (
    <Layout>
      <div className="mb-4">
        <Link href="/jobs" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <ArrowLeft size={14} /> Back to Jobs
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Job details */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                  <span className={`badge ${statusBadge[job.status]}`}>{job.status}</span>
                  {job.urgency !== 'normal' && <span className="badge badge-orange">{job.urgency}</span>}
                </div>
                <p className="text-gray-500 mt-1">{job.company} · {job.industry}</p>
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                  {job.location && <span className="flex items-center gap-1.5"><MapPin size={14} />{job.location}</span>}
                  {job.salaryMin && <span className="flex items-center gap-1.5"><IndianRupee size={14} />{job.salaryMin}–{job.salaryMax} LPA</span>}
                  <span className="flex items-center gap-1.5"><Briefcase size={14} />{job.experienceMin}–{job.experienceMax} yrs</span>
                  <span className="flex items-center gap-1.5"><Users size={14} />{job.openings} opening{job.openings > 1 ? 's' : ''}</span>
                  <span className="flex items-center gap-1.5"><Globe size={14} />{job.remote}</span>
                </div>
              </div>
              {user?.role !== 'client' && (
                <div className="flex gap-2 flex-shrink-0">
                  <Link href={`/jobs/${id}/edit`} className="btn-secondary"><Edit size={14} /></Link>
                  <button onClick={() => { if (confirm('Delete this job?')) deleteMutation.mutate(); }} className="btn-danger"><Trash2 size={14} /></button>
                </div>
              )}
            </div>

            {job.skills?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-gray-400 mb-2">Required Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {job.skills.map((s: string) => <span key={s} className="badge badge-blue">{s}</span>)}
                </div>
              </div>
            )}
          </div>

          {job.description && (
            <div className="card">
              <h2 className="section-title">Job Overview</h2>
              <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-line">{job.description}</p>
            </div>
          )}

          {job.responsibilities && (
            <div className="card">
              <h2 className="section-title">Responsibilities</h2>
              <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-line">{job.responsibilities}</p>
            </div>
          )}

          {job.requirements && (
            <div className="card">
              <h2 className="section-title">Requirements</h2>
              <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-line">{job.requirements}</p>
            </div>
          )}

          {/* AI Matching Section — visible to all roles */}
          <div className="card border-fynnd-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-fynnd-100 rounded-xl flex items-center justify-center">
                <Zap size={18} className="text-fynnd-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">AI Candidate Matching</h2>
                <p className="text-xs text-gray-500">AI ranks candidates from the database against this job</p>
              </div>
            </div>

            {user?.role === 'client' && (
              <div className="mb-4">
                <label className="label">Paste your Job Description for better matching (optional)</label>
                <textarea className="input h-24 resize-none" placeholder="Paste the full JD here for more accurate AI matching..." value={jdText} onChange={e => setJdText(e.target.value)} />
              </div>
            )}

            <button onClick={runMatching} disabled={matching} className="btn-primary w-full py-2.5 mb-4">
              {matching ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Running AI matching...</> : <><Zap size={15} /> Find Best Candidates</>}
            </button>

            {matches.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">{matches.length} candidates ranked by AI</p>
                {matches.map(({ candidate, score, reasons, breakdown }: any, i: number) => (
                  <div key={candidate._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-300 font-bold text-sm w-5 text-center">{i + 1}</span>
                    <div className="w-9 h-9 rounded-xl bg-fynnd-100 text-fynnd-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {candidate.name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/candidates/${candidate._id}`} className="font-semibold text-sm text-gray-900 hover:text-fynnd-600">{candidate.name}</Link>
                      <p className="text-xs text-gray-500">{candidate.currentRole} · {candidate.experienceYears}y · {candidate.city}</p>
                      {reasons?.[0] && <p className="text-xs text-gray-400 italic mt-0.5">{reasons[0]}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className={`px-2.5 py-1 rounded-lg font-bold text-xs border ${SCORE_COLOR(score)}`}>{score}%</div>
                      {user?.role !== 'client' && (
                        <button onClick={() => addToPipeline(candidate._id, score, reasons)}
                          disabled={added.has(candidate._id) || adding === candidate._id}
                          className={`btn text-xs py-1 px-2 ${added.has(candidate._id) ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'btn-primary'}`}>
                          {added.has(candidate._id) ? '✓' : adding === candidate._id ? '...' : <Plus size={12} />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Meta */}
        <div className="space-y-5">
          <div className="card">
            <h2 className="section-title">Job Details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Employment Type</span><span className="font-medium">{job.employmentType}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Department</span><span className="font-medium">{job.department || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Openings</span><span className="font-medium">{job.openings}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Posted</span><span className="font-medium">{formatDate(job.createdAt)}</span></div>
              {job.deadline && <div className="flex justify-between"><span className="text-gray-500">Deadline</span><span className="font-medium text-orange-600">{formatDate(job.deadline)}</span></div>}
              <div className="flex justify-between"><span className="text-gray-500">Applications</span><span className="font-medium">{job.applicationCount || 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Views</span><span className="font-medium">{job.viewCount || 0}</span></div>
            </div>
          </div>

          {job.clientId && (
            <div className="card">
              <h2 className="section-title">Client</h2>
              <p className="font-semibold">{job.clientId.name}</p>
              <p className="text-sm text-gray-500">{job.clientId.company}</p>
              {job.clientId.city && <p className="text-sm text-gray-400">{job.clientId.city}</p>}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Link href={`/jobs/${id}/matches`} className="btn-primary w-full justify-center">
              <Zap size={15} /> Full AI Match Page
            </Link>
            <Link href={`/pipeline?jobId=${id}`} className="btn-secondary w-full justify-center">
              View Pipeline
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
