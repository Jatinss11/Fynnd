'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import Link from 'next/link';
import { ArrowLeft, Zap, MapPin, Briefcase, Clock, IndianRupee, Plus } from 'lucide-react';
import { SCORE_COLOR, formatLPA } from '@/lib/utils';
import { useState } from 'react';

export default function JobMatchesPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());

  const { data: job } = useQuery({
    queryKey: ['job', id],
    queryFn: () => api.get(`/jobs/${id}`).then(r => r.data),
  });

  const { data: matches, isLoading } = useQuery({
    queryKey: ['matches', id],
    queryFn: () => api.get(`/jobs/${id}/matches`).then(r => r.data),
  });

  const addToPipeline = async (candidateId: string, score: number, reasons: string[]) => {
    setAdding(candidateId);
    try {
      await api.post('/pipeline', { jobId: id, candidateId, matchScore: score, matchReasons: reasons });
      setAdded(prev => new Set([...prev, candidateId]));
      qc.invalidateQueries({ queryKey: ['pipeline'] });
    } catch (err: any) {
      if (err.response?.status === 409) setAdded(prev => new Set([...prev, candidateId]));
    } finally {
      setAdding(null);
    }
  };

  return (
    <Layout>
      <div className="mb-4">
        <Link href="/jobs" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <ArrowLeft size={14} /> Back to Jobs
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-fynnd-100 rounded-xl flex items-center justify-center">
          <Zap size={20} className="text-fynnd-600" />
        </div>
        <div>
          <h1 className="page-title">AI Candidate Matches</h1>
          {job && <p className="text-sm text-gray-500">{job.title} · {job.company}</p>}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="card p-4 text-center text-sm text-gray-500">
            <div className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-fynnd-300 border-t-fynnd-600 rounded-full animate-spin" />
              Running AI matching engine...
            </div>
          </div>
          {[...Array(5)].map((_, i) => <div key={i} className="card h-24 animate-pulse bg-gray-50" />)}
        </div>
      ) : matches?.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No matching candidates found. Add more candidates to the database.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches?.map(({ candidate, score, reasons, breakdown }: any, i: number) => (
            <div key={candidate._id} className="card flex items-center gap-4">
              <span className="text-gray-300 font-bold text-lg w-6 text-center flex-shrink-0">{i + 1}</span>

              <div className="w-10 h-10 rounded-xl bg-fynnd-100 text-fynnd-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                {candidate.name?.[0]}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link href={`/candidates/${candidate._id}`} className="font-semibold text-gray-900 hover:text-fynnd-600">
                    {candidate.name}
                  </Link>
                </div>
                <p className="text-sm text-gray-500">{candidate.currentRole} · {candidate.experienceYears}y exp</p>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-400">
                  {candidate.city && <span className="flex items-center gap-1"><MapPin size={11} />{candidate.city}</span>}
                  {candidate.expectedSalary && <span className="flex items-center gap-1"><IndianRupee size={11} />{candidate.expectedSalary} LPA</span>}
                  {candidate.noticePeriod && <span className="flex items-center gap-1"><Clock size={11} />{candidate.noticePeriod}</span>}
                </div>
                {reasons?.[0] && <p className="text-xs text-gray-400 mt-1 italic">{reasons[0]}</p>}

                {/* Score breakdown */}
                {breakdown && Object.keys(breakdown).length > 0 && (
                  <div className="flex gap-3 mt-2">
                    {Object.entries(breakdown).map(([key, val]: any) => (
                      <div key={key} className="text-center">
                        <div className="text-xs font-semibold text-gray-700">{val}%</div>
                        <div className="text-[10px] text-gray-400 capitalize">{key.replace('Match', '')}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <div className={`px-3 py-1.5 rounded-xl font-bold text-sm border ${SCORE_COLOR(score)}`}>
                  {score}%
                </div>
                <button
                  onClick={() => addToPipeline(candidate._id, score, reasons)}
                  disabled={added.has(candidate._id) || adding === candidate._id}
                  className={`btn text-xs py-1.5 ${added.has(candidate._id) ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'btn-primary'}`}
                >
                  {added.has(candidate._id) ? '✓ Added' : adding === candidate._id ? '...' : <><Plus size={13} /> Add to Pipeline</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
