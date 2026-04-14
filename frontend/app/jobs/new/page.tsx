'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { INDIAN_CITIES, INDUSTRIES } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', company: '', location: '', cities: '',
    remote: 'onsite', experienceMin: '', experienceMax: '',
    salaryMin: '', salaryMax: '', skills: '', description: '',
    responsibilities: '', requirements: '', industry: '',
    department: '', employmentType: 'Full-time', openings: '1',
    urgency: 'normal', deadline: '',
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...form,
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        cities: form.cities.split(',').map(s => s.trim()).filter(Boolean),
        experienceMin: Number(form.experienceMin) || 0,
        experienceMax: Number(form.experienceMax) || 10,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
        openings: Number(form.openings) || 1,
        deadline: form.deadline || undefined,
      };
      const { data } = await api.post('/jobs', payload);
      router.push(`/jobs/${data._id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-4">
          <Link href="/jobs" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <ArrowLeft size={14} /> Back
          </Link>
        </div>
        <h1 className="page-title mb-6">Post a Job</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="card space-y-4">
            <h2 className="section-title">Job Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="label">Job Title *</label><input className="input" required value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Senior Software Engineer" /></div>
              <div><label className="label">Company *</label><input className="input" required value={form.company} onChange={e => set('company', e.target.value)} /></div>
              <div><label className="label">Industry</label>
                <select className="input" value={form.industry} onChange={e => set('industry', e.target.value)}>
                  <option value="">Select industry</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div><label className="label">Department</label><input className="input" value={form.department} onChange={e => set('department', e.target.value)} placeholder="e.g. Engineering" /></div>
              <div><label className="label">Employment Type</label>
                <select className="input" value={form.employmentType} onChange={e => set('employmentType', e.target.value)}>
                  {['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="section-title">Location & Work Mode</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Primary Location</label><input className="input" value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Bengaluru" /></div>
              <div><label className="label">Work Mode</label>
                <select className="input" value={form.remote} onChange={e => set('remote', e.target.value)}>
                  <option value="onsite">Onsite</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div className="col-span-2"><label className="label">Cities (comma separated)</label><input className="input" value={form.cities} onChange={e => set('cities', e.target.value)} placeholder="Bengaluru, Mumbai, Hyderabad" /></div>
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="section-title">Requirements</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Min Experience (yrs)</label><input className="input" type="number" min="0" value={form.experienceMin} onChange={e => set('experienceMin', e.target.value)} /></div>
              <div><label className="label">Max Experience (yrs)</label><input className="input" type="number" min="0" value={form.experienceMax} onChange={e => set('experienceMax', e.target.value)} /></div>
              <div><label className="label">Min Salary (LPA)</label><input className="input" type="number" value={form.salaryMin} onChange={e => set('salaryMin', e.target.value)} placeholder="e.g. 15" /></div>
              <div><label className="label">Max Salary (LPA)</label><input className="input" type="number" value={form.salaryMax} onChange={e => set('salaryMax', e.target.value)} placeholder="e.g. 30" /></div>
              <div><label className="label">No. of Openings</label><input className="input" type="number" min="1" value={form.openings} onChange={e => set('openings', e.target.value)} /></div>
              <div><label className="label">Urgency</label>
                <select className="input" value={form.urgency} onChange={e => set('urgency', e.target.value)}>
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div><label className="label">Required Skills (comma separated)</label><input className="input" value={form.skills} onChange={e => set('skills', e.target.value)} placeholder="React, Node.js, TypeScript, AWS" /></div>
          </div>

          <div className="card space-y-4">
            <h2 className="section-title">Job Description</h2>
            <div><label className="label">Overview</label><textarea className="input h-28 resize-none" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief overview of the role..." /></div>
            <div><label className="label">Responsibilities</label><textarea className="input h-28 resize-none" value={form.responsibilities} onChange={e => set('responsibilities', e.target.value)} /></div>
            <div><label className="label">Requirements</label><textarea className="input h-28 resize-none" value={form.requirements} onChange={e => set('requirements', e.target.value)} /></div>
            <div><label className="label">Application Deadline</label><input className="input" type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} /></div>
          </div>

          {error && <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

          <div className="flex gap-3">
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Posting...' : 'Post Job'}</button>
            <Link href="/jobs" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </Layout>
  );
}
