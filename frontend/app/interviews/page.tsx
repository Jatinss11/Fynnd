'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { Calendar, Plus, Video, Phone, MapPin, Clock, CheckCircle, XCircle, Star, Download, UserCheck, UserX, Pause } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const statusBadge: Record<string, string> = {
  scheduled: 'badge-blue', completed: 'badge-green', cancelled: 'badge-red',
  'no-show': 'badge-orange', rescheduled: 'badge-yellow',
};

const PROVIDERS = [
  { id: 'google_meet', label: 'Google Meet', icon: '🎥', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { id: 'zoom', label: 'Zoom', icon: '📹', color: 'bg-sky-50 border-sky-200 text-sky-700' },
  { id: 'manual', label: 'Manual Link', icon: '🔗', color: 'bg-gray-50 border-gray-200 text-gray-700' },
];

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} onClick={() => onChange(s)} type="button">
          <Star size={20} className={s <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
        </button>
      ))}
    </div>
  );
}

export default function InterviewsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [reviewModal, setReviewModal] = useState<any>(null);
  const [form, setForm] = useState({
    candidateId: '', jobId: '', pipelineId: '', scheduledAt: '',
    duration: '60', type: 'video', round: '1', meetLink: '',
    meetingProvider: 'google_meet', candidateName: '', jobTitle: '',
    candidateEmail: '', clientEmail: '',
  });
  const [review, setReview] = useState({
    overallRating: 0, technicalRating: 0, communicationRating: 0, cultureFitRating: 0,
    decision: '', feedback: '', privateNotes: '',
  });

  const { data: interviews, isLoading } = useQuery({
    queryKey: ['interviews'],
    queryFn: () => api.get('/interviews').then(r => r.data),
  });

  const { data: candidates } = useQuery({
    queryKey: ['candidates-list'],
    queryFn: () => api.get('/candidates', { params: { limit: 100 } }).then(r => r.data),
    enabled: user?.role !== 'client',
  });

  const { data: jobs } = useQuery({
    queryKey: ['jobs-list'],
    queryFn: () => api.get('/jobs').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/interviews', data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['interviews'] });
      setShowModal(false);
      const link = res.data.meetLink;
      if (link) toast.success(`Interview scheduled! Meet link: ${link}`, { duration: 5000 });
      else toast.success('Interview scheduled!');
    },
    onError: () => toast.error('Failed to schedule interview'),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, data }: any) => api.post(`/interviews/${id}/review`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['interviews'] });
      setReviewModal(null);
      toast.success('Review submitted!');
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: any) => api.put(`/interviews/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['interviews'] }),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ ...form, round: Number(form.round), duration: Number(form.duration) });
  };

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    reviewMutation.mutate({ id: reviewModal._id, data: review });
  };

  const today = (interviews || []).filter((i: any) => {
    const d = new Date(i.scheduledAt);
    return d.toDateString() === new Date().toDateString();
  });

  const upcoming = (interviews || []).filter((i: any) =>
    new Date(i.scheduledAt) > new Date() && i.status === 'scheduled'
  );

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Interviews</h1>
          <p className="text-sm text-gray-500">{upcoming.length} upcoming · {today.length} today</p>
        </div>
        {user?.role !== 'client' && (
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus size={15} /> Schedule Interview
          </button>
        )}
      </div>

      {/* Today's interviews */}
      <AnimatePresence>
        {today.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="card mb-5 border-fynnd-200 bg-gradient-to-r from-fynnd-50 to-blue-50">
            <h2 className="section-title text-fynnd-700">Today ({today.length})</h2>
            <div className="space-y-3">
              {today.map((iv: any) => (
                <div key={iv._id} className="bg-white rounded-xl p-4 flex items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-fynnd-100 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                      {iv.meetingProvider === 'zoom' ? '📹' : iv.meetingProvider === 'google_meet' ? '🎥' : '📞'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800">{iv.candidateId?.name}</p>
                      <p className="text-sm text-gray-500">{iv.jobId?.title} · Round {iv.round}</p>
                      <p className="text-xs text-gray-400">{formatDateTime(iv.scheduledAt)} · {iv.duration}min</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {iv.meetLink && (
                      <a href={iv.meetLink} target="_blank" rel="noreferrer" className="btn-primary text-xs py-1.5">
                        Join Now
                      </a>
                    )}
                    {(user?.role === 'client' || user?.role === 'admin') && (
                      <button onClick={() => { setReviewModal(iv); setReview({ overallRating: 0, technicalRating: 0, communicationRating: 0, cultureFitRating: 0, decision: '', feedback: '', privateNotes: '' }); }}
                        className="btn-secondary text-xs py-1.5">
                        <Star size={12} /> Rate
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* All interviews */}
      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="card h-20 animate-pulse bg-gray-50" />)}</div>
      ) : (interviews || []).length === 0 ? (
        <EmptyState icon={Calendar} title="No interviews scheduled"
          action={user?.role !== 'client' ? <button onClick={() => setShowModal(true)} className="btn-primary">Schedule Interview</button> : undefined} />
      ) : (
        <div className="space-y-2">
          {(interviews || []).map((iv: any) => (
            <motion.div key={iv._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="card flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-base flex-shrink-0">
                  {iv.meetingProvider === 'zoom' ? '📹' : iv.meetingProvider === 'google_meet' ? '🎥' : '📞'}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800">{iv.candidateId?.name}</p>
                  <p className="text-sm text-gray-500 truncate">{iv.jobId?.title} · Round {iv.round} · {iv.type}</p>
                  <p className="text-xs text-gray-400">{formatDateTime(iv.scheduledAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {iv.candidateId?.resumeUrl && (
                  <a href={iv.candidateId.resumeUrl} target="_blank" rel="noreferrer"
                    className="btn-secondary text-xs py-1.5 hidden sm:flex">
                    <Download size={12} /> CV
                  </a>
                )}
                {iv.meetLink && iv.status === 'scheduled' && (
                  <a href={iv.meetLink} target="_blank" rel="noreferrer" className="btn-secondary text-xs py-1.5">Join</a>
                )}
                {iv.status === 'scheduled' && (
                  <>
                    {(user?.role === 'client' || user?.role === 'admin') && (
                      <button onClick={() => { setReviewModal(iv); setReview({ overallRating: 0, technicalRating: 0, communicationRating: 0, cultureFitRating: 0, decision: '', feedback: '', privateNotes: '' }); }}
                        className="btn-secondary text-xs py-1.5">
                        <Star size={12} /> Review
                      </button>
                    )}
                    {user?.role !== 'client' && (
                      <>
                        <button onClick={() => updateStatus.mutate({ id: iv._id, status: 'completed' })}
                          className="btn text-xs py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100">
                          <CheckCircle size={12} />
                        </button>
                        <button onClick={() => updateStatus.mutate({ id: iv._id, status: 'cancelled' })}
                          className="btn-danger text-xs py-1.5">
                          <XCircle size={12} />
                        </button>
                      </>
                    )}
                  </>
                )}
                <span className={`badge ${statusBadge[iv.status]}`}>{iv.status}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Schedule Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Schedule Interview" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Candidate *</label>
              <select className="input" required value={form.candidateId} onChange={e => {
                const c = candidates?.candidates?.find((x: any) => x._id === e.target.value);
                setForm(f => ({ ...f, candidateId: e.target.value, candidateName: c?.name || '', candidateEmail: c?.email || '' }));
              }}>
                <option value="">Select candidate</option>
                {candidates?.candidates?.map((c: any) => <option key={c._id} value={c._id}>{c.name} — {c.currentRole}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Job *</label>
              <select className="input" required value={form.jobId} onChange={e => {
                const j = jobs?.jobs?.find((x: any) => x._id === e.target.value);
                setForm(f => ({ ...f, jobId: e.target.value, jobTitle: j?.title || '' }));
              }}>
                <option value="">Select job</option>
                {jobs?.jobs?.map((j: any) => <option key={j._id} value={j._id}>{j.title} — {j.company}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Date & Time *</label>
              <input className="input" type="datetime-local" required value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
            </div>
            <div>
              <label className="label">Duration (min)</label>
              <input className="input" type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
            </div>
            <div>
              <label className="label">Interview Type</label>
              <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {['video', 'phone', 'in-person', 'technical', 'hr'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Round</label>
              <input className="input" type="number" min="1" value={form.round} onChange={e => setForm(f => ({ ...f, round: e.target.value }))} />
            </div>
          </div>

          {/* Meeting provider */}
          <div>
            <label className="label">Meeting Platform</label>
            <div className="grid grid-cols-3 gap-2">
              {PROVIDERS.map(p => (
                <button key={p.id} type="button" onClick={() => setForm(f => ({ ...f, meetingProvider: p.id }))}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${form.meetingProvider === p.id ? p.color + ' border-current' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}>
                  <span>{p.icon}</span> {p.label}
                </button>
              ))}
            </div>
            {form.meetingProvider === 'google_meet' && (
              <p className="text-xs text-blue-600 mt-1.5">🎥 Google Meet link will be auto-generated and sent to attendees</p>
            )}
            {form.meetingProvider === 'zoom' && (
              <p className="text-xs text-sky-600 mt-1.5">📹 Zoom meeting will be created automatically</p>
            )}
            {form.meetingProvider === 'manual' && (
              <input className="input mt-2" value={form.meetLink} onChange={e => setForm(f => ({ ...f, meetLink: e.target.value }))} placeholder="Paste your meeting link..." />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Candidate Email (for invite)</label>
              <input className="input" type="email" value={form.candidateEmail} onChange={e => setForm(f => ({ ...f, candidateEmail: e.target.value }))} placeholder="candidate@email.com" />
            </div>
            <div>
              <label className="label">Client Email (for invite)</label>
              <input className="input" type="email" value={form.clientEmail} onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))} placeholder="client@company.com" />
            </div>
          </div>

          {createMutation.isError && <p className="text-red-500 text-sm">Failed to schedule. Please try again.</p>}
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Scheduling...' : 'Schedule Interview'}
            </button>
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Review Modal */}
      <Modal open={!!reviewModal} onClose={() => setReviewModal(null)} title="Rate & Review Candidate" size="md">
        {reviewModal && (
          <form onSubmit={handleReview} className="space-y-5">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-fynnd-100 rounded-xl flex items-center justify-center font-bold text-fynnd-700">
                {reviewModal.candidateId?.name?.[0]}
              </div>
              <div>
                <p className="font-semibold">{reviewModal.candidateId?.name}</p>
                <p className="text-sm text-gray-500">{reviewModal.jobId?.title}</p>
              </div>
              {reviewModal.candidateId?.resumeUrl && (
                <a href={reviewModal.candidateId.resumeUrl} target="_blank" rel="noreferrer"
                  className="ml-auto btn-secondary text-xs py-1.5">
                  <Download size={12} /> Download CV
                </a>
              )}
            </div>

            <div className="space-y-3">
              {[
                { key: 'overallRating', label: 'Overall Rating' },
                { key: 'technicalRating', label: 'Technical Skills' },
                { key: 'communicationRating', label: 'Communication' },
                { key: 'cultureFitRating', label: 'Culture Fit' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{label}</span>
                  <StarRating value={(review as any)[key]} onChange={v => setReview(r => ({ ...r, [key]: v }))} />
                </div>
              ))}
            </div>

            <div>
              <label className="label">Decision *</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'shortlisted', label: 'Shortlist', icon: UserCheck, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
                  { id: 'rejected', label: 'Reject', icon: UserX, color: 'bg-red-50 border-red-200 text-red-600' },
                  { id: 'on_hold', label: 'On Hold', icon: Pause, color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
                  { id: 'hired', label: 'Hire', icon: CheckCircle, color: 'bg-blue-50 border-blue-200 text-blue-700' },
                ].map(({ id, label, icon: Icon, color }) => (
                  <button key={id} type="button" onClick={() => setReview(r => ({ ...r, decision: id }))}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${review.decision === id ? color + ' border-current' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}>
                    <Icon size={15} /> {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Feedback (visible to recruiter)</label>
              <textarea className="input h-20 resize-none" value={review.feedback} onChange={e => setReview(r => ({ ...r, feedback: e.target.value }))} placeholder="Share your thoughts on the candidate..." />
            </div>

            <div>
              <label className="label">Private Notes (only you can see)</label>
              <textarea className="input h-16 resize-none" value={review.privateNotes} onChange={e => setReview(r => ({ ...r, privateNotes: e.target.value }))} placeholder="Internal notes..." />
            </div>

            <div className="flex gap-3">
              <button type="submit" className="btn-primary" disabled={!review.decision || reviewMutation.isPending}>
                {reviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
              </button>
              <button type="button" onClick={() => setReviewModal(null)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        )}
      </Modal>
    </Layout>
  );
}
