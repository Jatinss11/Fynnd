'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import Link from 'next/link';
import { Bot, Plus, ExternalLink, FileText, Copy, CheckCircle } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';

const statusBadge: Record<string, string> = {
  pending: 'badge-yellow', in_progress: 'badge-blue',
  completed: 'badge-green', abandoned: 'badge-gray',
};

const recoBadge: Record<string, string> = {
  strong_hire: 'badge-green', hire: 'badge-blue',
  maybe: 'badge-yellow', no_hire: 'badge-red',
};

export default function AIInterviewsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [form, setForm] = useState({ candidateId: '', jobId: '', round: '1' });

  const { data: interviews, isLoading } = useQuery({
    queryKey: ['ai-interviews'],
    queryFn: () => api.get('/ai-interviews').then(r => r.data),
  });

  const { data: candidates } = useQuery({
    queryKey: ['candidates-list'],
    queryFn: () => api.get('/candidates', { params: { limit: 100 } }).then(r => r.data),
  });

  const { data: jobs } = useQuery({
    queryKey: ['jobs-list'],
    queryFn: () => api.get('/jobs').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/ai-interviews', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ai-interviews'] }); setShowModal(false); },
  });

  const copyLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">AI Interviews</h1>
          <p className="text-sm text-gray-500">AI-monitored interviews with auto-generated reports</p>
        </div>
        {user?.role !== 'client' && (
          <button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={15} /> Schedule AI Interview</button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="card h-20 animate-pulse bg-gray-50" />)}</div>
      ) : interviews?.length === 0 ? (
        <EmptyState icon={Bot} title="No AI interviews yet"
          description="Schedule an AI interview — candidates get a link and the AI handles the entire process."
          action={user?.role !== 'client' ? <button onClick={() => setShowModal(true)} className="btn-primary">Schedule AI Interview</button> : undefined} />
      ) : (
        <div className="space-y-3">
          {interviews?.map((iv: any) => (
            <div key={iv._id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Bot size={18} className="text-violet-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800">{iv.candidateId?.name || iv.candidateName || 'Candidate'}</p>
                    <p className="text-sm text-gray-500">{iv.jobTitle} · Round {iv.round || 1}</p>
                    <p className="text-xs text-gray-400">{formatDateTime(iv.createdAt)}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className={`badge ${statusBadge[iv.status]}`}>{iv.status.replace('_', ' ')}</span>
                    {iv.report?.recommendation && (
                      <span className={`badge ${recoBadge[iv.report.recommendation]}`}>
                        {iv.report.recommendation.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  {iv.report?.overallScore && (
                    <p className="text-lg font-bold text-fynnd-600">{iv.report.overallScore}%</p>
                  )}

                  <div className="flex gap-2">
                    {iv.status !== 'completed' && (
                      <button onClick={() => copyLink(`${window.location.origin}/interview/${iv.accessToken}`, iv._id)}
                        className="btn-secondary text-xs py-1.5">
                        {copied === iv._id ? <><CheckCircle size={12} /> Copied!</> : <><Copy size={12} /> Copy Link</>}
                      </button>
                    )}
                    {iv.status === 'completed' && (
                      <Link href={`/ai-interviews/${iv._id}/report`} className="btn-primary text-xs py-1.5">
                        <FileText size={12} /> View Report
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Monitoring flags */}
              {(iv.monitoring?.tabSwitches > 0 || iv.monitoring?.copyPasteCount > 0) && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex gap-4 text-xs text-orange-600">
                  {iv.monitoring.tabSwitches > 0 && <span>⚠ Tab switches: {iv.monitoring.tabSwitches}</span>}
                  {iv.monitoring.copyPasteCount > 0 && <span>⚠ Copy/paste: {iv.monitoring.copyPasteCount}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Schedule AI Interview">
        <form onSubmit={e => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
          <div>
            <label className="label">Candidate *</label>
            <select className="input" required value={form.candidateId} onChange={e => setForm(f => ({ ...f, candidateId: e.target.value }))}>
              <option value="">Select candidate</option>
              {candidates?.candidates?.map((c: any) => <option key={c._id} value={c._id}>{c.name} — {c.currentRole}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Job *</label>
            <select className="input" required value={form.jobId} onChange={e => setForm(f => ({ ...f, jobId: e.target.value }))}>
              <option value="">Select job</option>
              {jobs?.jobs?.map((j: any) => <option key={j._id} value={j._id}>{j.title} — {j.company}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Interview Round</label>
            <select className="input" value={form.round} onChange={e => setForm(f => ({ ...f, round: e.target.value }))}>
              <option value="1">Round 1 — Technical Screening</option>
              <option value="2">Round 2 — Deep Technical</option>
              <option value="3">Round 3 — HR Round</option>
            </select>
          </div>
          <p className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
            AI will generate role-specific questions. A unique interview link will be created for the candidate. The AI monitors the session and generates a full report on completion.
          </p>
          {createMutation.isError && <p className="text-red-500 text-sm">{(createMutation.error as any)?.response?.data?.message}</p>}
          <div className="flex gap-3">
            <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create AI Interview'}
            </button>
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
