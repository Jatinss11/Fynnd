'use client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { INDIAN_CITIES, INDUSTRIES } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function EditJobPage() {
  const { id } = useParams();
  const router = useRouter();
  const [form, setForm] = useState<any>(null);

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => api.get(`/jobs/${id}`).then(r => r.data),
  });

  useEffect(() => {
    if (job) {
      setForm({
        title: job.title || '',
        company: job.company || '',
        location: job.location || '',
        cities: (job.cities || []).join(', '),
        remote: job.remote || 'onsite',
        experienceMin: job.experienceMin ?? '',
        experienceMax: job.experienceMax ?? '',
        salaryMin: job.salaryMin ?? '',
        salaryMax: job.salaryMax ?? '',
        skills: (job.skills || []).join(', '),
        description: job.description || '',
        responsibilities: job.responsibilities || '',
        requirements: job.requirements || '',
        industry: job.industry || '',
        department: job.department || '',
        employmentType: job.employmentType || 'Full-time',
        openings: job.openings ?? 1,
        urgency: job.urgency || 'normal',
        status: job.status || 'open',
        deadline: job.deadline ? new Date(job.deadline).toISOString().split('T')[0] : '',
      });
    }
  }, [job]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/jobs/${id}`, data),
    onSuccess: () => { toast.success('Job updated!'); router.push(`/jobs/${id}`); },
    onError: () => toast.error('Update failed'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      ...form,
      skills: form.skills.split(',').map((s: string) => s.trim()).filter(Boolean),
      cities: form.cities.split(',').map((s: string) => s.trim()).filter(Boolean),
      experienceMin: Number(form.experienceMin) || 0,
      experienceMax: Number(form.experienceMax) || 10,
      salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
      salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
      openings: Number(form.openings) || 1,
      deadline: form.deadline || undefined,
    });
  };

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  if (isLoading || !form) return (
    <Layout><div className="space-y-4 max-w-2xl mx-auto">{[...Array(3)].map((_, i) => <div key={i} className="card h-32 animate-pulse bg-gray-50" />)}</div></Layout>
  );

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-4">
          <Link href={`/jobs/${id}`} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <ArrowLeft size={14} /> Back to Job
          </Link>
        </div>
        <h1 className="page-title mb-6">Edit Job</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="card space-y-4">
            <h2 className="section-title">Job Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="label">Job Title *</label><input className="input" required value={form.title} onChange={e => set('title', e.target.value)} /></div>
              <div><label className="label">Company *</label><input className="input" required value={form.company} onChange={e => set('company', e.target.value)} /></div>
              <div><label className="label">Industry</label>
                <select className="input" value={form.industry} onChange={e => set('industry', e.target.value)}>
                  <option value="">Select</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div><label className="label">Status</label>
                <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="open">Open</option>
                  <option value="on-hold">On Hold</option>
                  <option value="closed">Closed</option>
                  <option value="filled">Filled</option>
                </select>
              </div>
              <div><label className="label">Urgency</label>
                <select className="input" value={form.urgency} onChange={e => set('urgency', e.target.value)}>
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="section-title">Location & Requirements</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Location</label><input className="input" value={form.location} onChange={e => set('location', e.target.value)} /></div>
              <div><label className="label">Work Mode</label>
                <select className="input" value={form.remote} onChange={e => set('remote', e.target.value)}>
                  <option value="onsite">Onsite</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div><label className="label">Min Exp (yrs)</label><input className="input" type="number" value={form.experienceMin} onChange={e => set('experienceMin', e.target.value)} /></div>
              <div><label className="label">Max Exp (yrs)</label><input className="input" type="number" value={form.experienceMax} onChange={e => set('experienceMax', e.target.value)} /></div>
              <div><label className="label">Min Salary (LPA)</label><input className="input" type="number" value={form.salaryMin} onChange={e => set('salaryMin', e.target.value)} /></div>
              <div><label className="label">Max Salary (LPA)</label><input className="input" type="number" value={form.salaryMax} onChange={e => set('salaryMax', e.target.value)} /></div>
              <div><label className="label">Openings</label><input className="input" type="number" min="1" value={form.openings} onChange={e => set('openings', e.target.value)} /></div>
              <div><label className="label">Deadline</label><input className="input" type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} /></div>
            </div>
            <div><label className="label">Skills (comma separated)</label><input className="input" value={form.skills} onChange={e => set('skills', e.target.value)} /></div>
          </div>

          <div className="card space-y-4">
            <h2 className="section-title">Description</h2>
            <div><label className="label">Overview</label><textarea className="input h-24 resize-none" value={form.description} onChange={e => set('description', e.target.value)} /></div>
            <div><label className="label">Responsibilities</label><textarea className="input h-24 resize-none" value={form.responsibilities} onChange={e => set('responsibilities', e.target.value)} /></div>
            <div><label className="label">Requirements</label><textarea className="input h-24 resize-none" value={form.requirements} onChange={e => set('requirements', e.target.value)} /></div>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="btn-primary" disabled={updateMutation.isPending}>
              <Save size={15} /> {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
            <Link href={`/jobs/${id}`} className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </Layout>
  );
}
