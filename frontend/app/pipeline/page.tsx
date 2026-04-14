'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Clock, IndianRupee, Trash2 } from 'lucide-react';
import { PIPELINE_STAGES, STAGE_COLORS, formatLPA } from '@/lib/utils';
import { cn } from '@/lib/utils';

const STAGE_BG: Record<string, string> = {
  'Sourced':           'bg-gray-50 border-gray-200',
  'Screening':         'bg-blue-50 border-blue-100',
  'Shortlisted':       'bg-indigo-50 border-indigo-100',
  'Interview Round 1': 'bg-yellow-50 border-yellow-100',
  'Interview Round 2': 'bg-amber-50 border-amber-100',
  'HR Round':          'bg-orange-50 border-orange-100',
  'Offer Released':    'bg-purple-50 border-purple-100',
  'Offer Accepted':    'bg-violet-50 border-violet-100',
  'Joined':            'bg-emerald-50 border-emerald-100',
  'Rejected':          'bg-red-50 border-red-100',
  'Withdrawn':         'bg-gray-50 border-gray-200',
};

export default function PipelinePage() {
  const [jobId, setJobId] = useState('');
  const [selectedStages, setSelectedStages] = useState<string[]>(PIPELINE_STAGES.slice(0, 9));
  const qc = useQueryClient();

  const { data: jobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.get('/jobs').then(r => r.data),
  });

  const { data: pipeline, isLoading } = useQuery({
    queryKey: ['pipeline', jobId],
    queryFn: () => api.get('/pipeline', { params: jobId ? { jobId } : {} }).then(r => r.data),
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) => api.put(`/pipeline/${id}`, { stage }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pipeline'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/pipeline/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pipeline'] }),
  });

  const byStage = (stage: string) => (pipeline || []).filter((p: any) => p.stage === stage);

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="page-title">Recruitment Pipeline</h1>
          <p className="text-sm text-gray-500">{pipeline?.length ?? 0} candidates in pipeline</p>
        </div>
        <select className="input w-auto min-w-[200px]" value={jobId} onChange={e => setJobId(e.target.value)}>
          <option value="">All Jobs</option>
          {jobs?.jobs?.map((j: any) => (
            <option key={j._id} value={j._id}>{j.title} — {j.company}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading pipeline...</div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {selectedStages.map((stage) => {
              const entries = byStage(stage);
              return (
                <div key={stage} className={cn('w-60 rounded-2xl border p-3', STAGE_BG[stage] || 'bg-gray-50 border-gray-200')}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide leading-none">{stage}</p>
                    <span className="w-5 h-5 rounded-full bg-white text-gray-600 text-xs font-bold flex items-center justify-center shadow-sm">
                      {entries.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {entries.map((entry: any) => (
                      <div key={entry._id} className="bg-white rounded-xl p-3 shadow-sm border border-white/80">
                        <div className="flex items-start justify-between gap-1">
                          <Link href={`/candidates/${entry.candidateId?._id}`}
                            className="text-sm font-semibold text-gray-800 hover:text-fynnd-600 leading-tight">
                            {entry.candidateId?.name}
                          </Link>
                          <button onClick={() => deleteMutation.mutate(entry._id)} className="text-gray-300 hover:text-red-400 flex-shrink-0">
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{entry.candidateId?.currentRole}</p>

                        <div className="flex flex-wrap gap-1.5 mt-1.5 text-[10px] text-gray-400">
                          {entry.candidateId?.city && <span className="flex items-center gap-0.5"><MapPin size={9} />{entry.candidateId.city}</span>}
                          {entry.candidateId?.noticePeriod && <span className="flex items-center gap-0.5"><Clock size={9} />{entry.candidateId.noticePeriod}</span>}
                          {entry.candidateId?.expectedSalary && <span className="flex items-center gap-0.5"><IndianRupee size={9} />{entry.candidateId.expectedSalary}L</span>}
                        </div>

                        {entry.matchScore && (
                          <div className="mt-1.5">
                            <div className="flex items-center justify-between text-[10px] mb-0.5">
                              <span className="text-gray-400">Match</span>
                              <span className="font-semibold text-fynnd-600">{entry.matchScore}%</span>
                            </div>
                            <div className="h-1 bg-gray-100 rounded-full">
                              <div className="h-1 bg-fynnd-500 rounded-full" style={{ width: `${entry.matchScore}%` }} />
                            </div>
                          </div>
                        )}

                        <select
                          className="mt-2 w-full text-[11px] border border-gray-100 rounded-lg px-2 py-1 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-fynnd-400"
                          value={entry.stage}
                          onChange={e => moveMutation.mutate({ id: entry._id, stage: e.target.value })}
                        >
                          {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    ))}

                    {entries.length === 0 && (
                      <div className="text-center py-4 text-xs text-gray-300">Empty</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Layout>
  );
}
