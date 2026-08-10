'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { Star, Plus, TrendingUp, Award } from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';

const RATING_LABELS = ['', 'Poor', 'Below Average', 'Average', 'Good', 'Excellent'];
const STATUS_COLORS: Record<string, string> = {
  Draft: 'badge-gray', Submitted: 'badge-blue', Acknowledged: 'badge-yellow', Completed: 'badge-green',
};

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button" onClick={() => onChange?.(i)}
          className={cn('transition-colors', onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default')}>
          <Star size={16} className={i <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
        </button>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    employeeId: '', reviewPeriod: '', reviewDate: new Date().toISOString().split('T')[0],
    ratings: { quality: 3, productivity: 3, communication: 3, teamwork: 3, initiative: 3, punctuality: 3 },
    overallRating: 3, strengths: '', areasOfImprovement: '', achievements: '', goals: '',
    status: 'Submitted', nextReviewDate: '',
  });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const setRating = (k: string, v: number) => setForm(f => ({ ...f, ratings: { ...f.ratings, [k]: v } }));

  const { data: employees } = useQuery({
    queryKey: ['hrms-employees-all'],
    queryFn: () => api.get('/hrms/employees', { params: { limit: 100 } }).then(r => r.data.employees),
  });

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['hrms-reviews'],
    queryFn: () => api.get('/hrms/reviews').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/hrms/reviews', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hrms-reviews'] }); setShowModal(false); toast.success('Review submitted'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const avgRating = reviews?.length
    ? (reviews.reduce((s: number, r: any) => s + r.overallRating, 0) / reviews.length).toFixed(1)
    : '—';

  const ratingFields = [
    { key: 'quality', label: 'Work Quality' },
    { key: 'productivity', label: 'Productivity' },
    { key: 'communication', label: 'Communication' },
    { key: 'teamwork', label: 'Teamwork' },
    { key: 'initiative', label: 'Initiative' },
    { key: 'punctuality', label: 'Punctuality' },
  ];

  return (
    <Layout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="page-title">Performance Reviews</h1>
          <p className="text-sm text-gray-500">{reviews?.length ?? 0} reviews · Avg rating: {avgRating}/5</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={15} /> New Review</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Total Reviews', value: reviews?.length ?? 0 },
          { label: 'Avg Rating', value: `${avgRating} ★` },
          { label: 'Excellent (5★)', value: reviews?.filter((r: any) => r.overallRating === 5).length ?? 0 },
          { label: 'Needs Improvement', value: reviews?.filter((r: any) => r.overallRating <= 2).length ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="card text-center">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Reviews list */}
      {isLoading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="card h-24 animate-pulse bg-gray-50" />)}</div>
      ) : !reviews?.length ? (
        <div className="card text-center py-14">
          <Award size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="font-semibold text-gray-600">No reviews yet</p>
          <p className="text-sm text-gray-400 mb-4">Start by creating a performance review</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mx-auto">New Review</button>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review: any) => (
            <div key={review._id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-yellow-50 flex items-center justify-center flex-shrink-0">
                    <Star size={20} className="text-yellow-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">
                        {review.employeeId?.firstName} {review.employeeId?.lastName}
                      </p>
                      <span className="badge badge-gray">{review.reviewPeriod}</span>
                      <span className={`badge ${STATUS_COLORS[review.status]}`}>{review.status}</span>
                    </div>
                    <p className="text-sm text-gray-500">{review.employeeId?.designation} · {review.employeeId?.department}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <StarRating value={review.overallRating} />
                      <span className="text-sm font-semibold text-gray-700">{review.overallRating}/5 — {RATING_LABELS[review.overallRating]}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-400">Reviewed {formatDate(review.reviewDate)}</p>
                  {review.nextReviewDate && <p className="text-xs text-fynnd-600 mt-1">Next: {formatDate(review.nextReviewDate)}</p>}
                </div>
              </div>
              {(review.strengths || review.areasOfImprovement) && (
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                  {review.strengths && (
                    <div>
                      <p className="text-xs font-semibold text-emerald-600 mb-1">Strengths</p>
                      <p className="text-sm text-gray-600">{review.strengths}</p>
                    </div>
                  )}
                  {review.areasOfImprovement && (
                    <div>
                      <p className="text-xs font-semibold text-orange-500 mb-1">Areas to Improve</p>
                      <p className="text-sm text-gray-600">{review.areasOfImprovement}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New Review Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Performance Review">
        <form onSubmit={e => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Employee *</label>
              <select className="input" required value={form.employeeId} onChange={e => set('employeeId', e.target.value)}>
                <option value="">Select employee</option>
                {employees?.map((emp: any) => <option key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Review Period *</label>
              <input className="input" placeholder="e.g. Q1 2025" required value={form.reviewPeriod} onChange={e => set('reviewPeriod', e.target.value)} />
            </div>
            <div>
              <label className="label">Review Date *</label>
              <input className="input" type="date" required value={form.reviewDate} onChange={e => set('reviewDate', e.target.value)} />
            </div>
            <div>
              <label className="label">Next Review Date</label>
              <input className="input" type="date" value={form.nextReviewDate} onChange={e => set('nextReviewDate', e.target.value)} />
            </div>
          </div>

          {/* Ratings */}
          <div>
            <p className="label">Performance Ratings</p>
            <div className="grid grid-cols-2 gap-3">
              {ratingFields.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-700">{label}</span>
                  <StarRating value={(form.ratings as any)[key]} onChange={v => setRating(key, v)} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Overall Rating *</label>
            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-xl">
              <StarRating value={form.overallRating} onChange={v => set('overallRating', v)} />
              <span className="text-sm font-semibold text-gray-700">{form.overallRating}/5 — {RATING_LABELS[form.overallRating]}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Strengths</label>
              <textarea className="input" rows={3} value={form.strengths} onChange={e => set('strengths', e.target.value)} placeholder="Key strengths..." />
            </div>
            <div>
              <label className="label">Areas of Improvement</label>
              <textarea className="input" rows={3} value={form.areasOfImprovement} onChange={e => set('areasOfImprovement', e.target.value)} placeholder="Areas to improve..." />
            </div>
            <div>
              <label className="label">Achievements</label>
              <textarea className="input" rows={2} value={form.achievements} onChange={e => set('achievements', e.target.value)} placeholder="Notable achievements..." />
            </div>
            <div>
              <label className="label">Goals for Next Period</label>
              <textarea className="input" rows={2} value={form.goals} onChange={e => set('goals', e.target.value)} placeholder="Goals and targets..." />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={createMutation.isPending}>{createMutation.isPending ? 'Submitting...' : 'Submit Review'}</button>
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
