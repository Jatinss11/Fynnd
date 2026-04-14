'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { formatLPA, formatDate, STAGE_COLORS } from '@/lib/utils';
import { MapPin, Phone, Mail, Briefcase, Clock, IndianRupee, ExternalLink, Edit, Trash2, Zap, ArrowLeft, Globe } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useAuthStore } from '@/lib/store';

export default function CandidateDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [generatingSummary, setGeneratingSummary] = useState(false);

  const { data: candidate, isLoading } = useQuery({
    queryKey: ['candidate', id],
    queryFn: () => api.get(`/candidates/${id}`).then(r => r.data),
  });

  const { data: pipelineEntries } = useQuery({
    queryKey: ['pipeline', 'candidate', id],
    queryFn: () => api.get('/pipeline', { params: { candidateId: id } }).then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/candidates/${id}`),
    onSuccess: () => router.push('/candidates'),
  });

  const generateSummary = async () => {
    setGeneratingSummary(true);
    try {
      const { data } = await api.post(`/candidates/${id}/generate-summary`);
      qc.setQueryData(['candidate', id], (old: any) => ({ ...old, aiSummary: data.summary }));
    } finally {
      setGeneratingSummary(false);
    }
  };

  if (isLoading) return <Layout><div className="animate-pulse space-y-4"><div className="card h-40 bg-gray-50" /><div className="card h-60 bg-gray-50" /></div></Layout>;
  if (!candidate) return <Layout><p className="text-gray-500">Candidate not found</p></Layout>;

  return (
    <Layout>
      <div className="mb-4">
        <Link href="/candidates" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <ArrowLeft size={14} /> Back to Candidates
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Profile */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header card */}
          <div className="card">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-fynnd-100 text-fynnd-700 flex items-center justify-center text-2xl font-bold flex-shrink-0">
                  {candidate.name?.[0]}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{candidate.name}</h1>
                  <p className="text-gray-500">{candidate.currentRole}{candidate.currentCompany ? ` @ ${candidate.currentCompany}` : ''}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {candidate.city && <span className="flex items-center gap-1 text-sm text-gray-500"><MapPin size={13} />{candidate.city}, {candidate.state}</span>}
                    {candidate.experienceYears !== undefined && <span className="flex items-center gap-1 text-sm text-gray-500"><Briefcase size={13} />{candidate.experienceYears}y {candidate.experienceMonths || 0}m exp</span>}
                  </div>
                </div>
              </div>
              {user?.role !== 'client' && (
                <div className="flex gap-2 flex-shrink-0">
                  <Link href={`/candidates/${id}/edit`} className="btn-secondary"><Edit size={14} /></Link>
                  <button onClick={() => { if (confirm('Delete this candidate?')) deleteMutation.mutate(); }} className="btn-danger"><Trash2 size={14} /></button>
                </div>
              )}
            </div>

            {/* AI Summary */}
            {candidate.aiSummary ? (
              <div className="mt-4 p-4 bg-fynnd-50 rounded-xl border border-fynnd-100">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={14} className="text-fynnd-600" />
                  <span className="text-xs font-semibold text-fynnd-700 uppercase tracking-wide">AI Summary</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{candidate.aiSummary}</p>
              </div>
            ) : user?.role !== 'client' && (
              <button onClick={generateSummary} disabled={generatingSummary} className="btn-secondary mt-4 text-xs">
                <Zap size={13} /> {generatingSummary ? 'Generating...' : 'Generate AI Summary'}
              </button>
            )}
          </div>

          {/* Skills */}
          {candidate.skills?.length > 0 && (
            <div className="card">
              <h2 className="section-title">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map((s: string) => <span key={s} className="badge badge-blue">{s}</span>)}
              </div>
            </div>
          )}

          {/* Work Experience */}
          {candidate.workExperience?.length > 0 && (
            <div className="card">
              <h2 className="section-title">Work Experience</h2>
              <div className="space-y-4">
                {candidate.workExperience.map((w: any, i: number) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-2 h-2 rounded-full bg-fynnd-400 mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-800">{w.role}</p>
                      <p className="text-sm text-gray-500">{w.company} · {w.startDate} – {w.current ? 'Present' : w.endDate}</p>
                      {w.description && <p className="text-sm text-gray-600 mt-1">{w.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {candidate.education?.length > 0 && (
            <div className="card">
              <h2 className="section-title">Education</h2>
              <div className="space-y-3">
                {candidate.education.map((e: any, i: number) => (
                  <div key={i}>
                    <p className="font-semibold text-gray-800">{e.degree}</p>
                    <p className="text-sm text-gray-500">{e.institution} · {e.year}</p>
                    {e.percentage && <p className="text-xs text-gray-400">{e.percentage}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pipeline history */}
          {pipelineEntries?.length > 0 && (
            <div className="card">
              <h2 className="section-title">Pipeline History</h2>
              <div className="space-y-3">
                {pipelineEntries.map((entry: any) => (
                  <div key={entry._id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{entry.jobId?.title}</p>
                      <p className="text-xs text-gray-400">{entry.jobId?.company}</p>
                    </div>
                    <span className={`badge ${STAGE_COLORS[entry.stage] || 'badge-gray'}`}>{entry.stage}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div className="space-y-5">
          <div className="card">
            <h2 className="section-title">Contact</h2>
            <div className="space-y-3 text-sm">
              {candidate.email && <a href={`mailto:${candidate.email}`} className="flex items-center gap-3 text-gray-600 hover:text-fynnd-600"><Mail size={15} className="text-gray-400" />{candidate.email}</a>}
              {candidate.phone && <a href={`tel:${candidate.phone}`} className="flex items-center gap-3 text-gray-600 hover:text-fynnd-600"><Phone size={15} className="text-gray-400" />{candidate.phone}</a>}
              {candidate.linkedinUrl && <a href={candidate.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-gray-600 hover:text-fynnd-600"><Globe size={15} className="text-gray-400" />LinkedIn</a>}
              {candidate.githubUrl && <a href={candidate.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-gray-600 hover:text-fynnd-600"><Globe size={15} className="text-gray-400" />GitHub</a>}
            </div>
          </div>

          <div className="card">
            <h2 className="section-title">Compensation</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Current CTC</span>
                <span className="font-semibold">{formatLPA(candidate.currentSalary)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Expected CTC</span>
                <span className="font-semibold text-fynnd-600">{formatLPA(candidate.expectedSalary)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Notice Period</span>
                <span className="font-semibold">{candidate.noticePeriod || '—'}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="section-title">Preferences</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Willing to Relocate</span>
                <span className={`badge ${candidate.willingToRelocate ? 'badge-green' : 'badge-gray'}`}>
                  {candidate.willingToRelocate ? 'Yes' : 'No'}
                </span>
              </div>
              {candidate.preferredLocations?.length > 0 && (
                <div>
                  <p className="text-gray-500 mb-1">Preferred Cities</p>
                  <div className="flex flex-wrap gap-1">
                    {candidate.preferredLocations.map((l: string) => <span key={l} className="badge badge-gray">{l}</span>)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {candidate.resumeUrl && (
            <a href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${candidate.resumeUrl}`}
              target="_blank" rel="noreferrer" className="btn-secondary w-full justify-center">
              <ExternalLink size={15} /> View Resume
            </a>
          )}

          {candidate.recruiterNotes && (
            <div className="card">
              <h2 className="section-title">Recruiter Notes</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{candidate.recruiterNotes}</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
