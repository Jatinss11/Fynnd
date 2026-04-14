'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { INDIAN_CITIES, INDIAN_STATES, NOTICE_PERIODS } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewCandidatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', phone: '', city: '', state: '',
    currentCompany: '', currentRole: '', experienceYears: '', experienceMonths: '',
    skills: '', currentSalary: '', expectedSalary: '', noticePeriod: '',
    willingToRelocate: false, linkedinUrl: '', githubUrl: '', recruiterNotes: '', summary: '',
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
        experienceYears: Number(form.experienceYears) || 0,
        experienceMonths: Number(form.experienceMonths) || 0,
        currentSalary: form.currentSalary ? Number(form.currentSalary) : undefined,
        expectedSalary: form.expectedSalary ? Number(form.expectedSalary) : undefined,
      };
      const { data } = await api.post('/candidates', payload);
      router.push(`/candidates/${data._id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create candidate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-4">
          <Link href="/candidates" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <ArrowLeft size={14} /> Back
          </Link>
        </div>
        <h1 className="page-title mb-6">Add Candidate</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="card space-y-4">
            <h2 className="section-title">Personal Info</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Full Name *</label><input className="input" required value={form.name} onChange={e => set('name', e.target.value)} /></div>
              <div><label className="label">Email *</label><input className="input" type="email" required value={form.email} onChange={e => set('email', e.target.value)} /></div>
              <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" /></div>
              <div><label className="label">City</label>
                <select className="input" value={form.city} onChange={e => set('city', e.target.value)}>
                  <option value="">Select city</option>
                  {INDIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="label">State</label>
                <select className="input" value={form.state} onChange={e => set('state', e.target.value)}>
                  <option value="">Select state</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="section-title">Professional Info</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Current Role</label><input className="input" value={form.currentRole} onChange={e => set('currentRole', e.target.value)} /></div>
              <div><label className="label">Current Company</label><input className="input" value={form.currentCompany} onChange={e => set('currentCompany', e.target.value)} /></div>
              <div><label className="label">Experience (Years)</label><input className="input" type="number" min="0" value={form.experienceYears} onChange={e => set('experienceYears', e.target.value)} /></div>
              <div><label className="label">Experience (Months)</label><input className="input" type="number" min="0" max="11" value={form.experienceMonths} onChange={e => set('experienceMonths', e.target.value)} /></div>
            </div>
            <div><label className="label">Skills (comma separated)</label><input className="input" value={form.skills} onChange={e => set('skills', e.target.value)} placeholder="React, Node.js, TypeScript, AWS" /></div>
          </div>

          <div className="card space-y-4">
            <h2 className="section-title">Compensation & Availability</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Current CTC (LPA)</label><input className="input" type="number" value={form.currentSalary} onChange={e => set('currentSalary', e.target.value)} placeholder="e.g. 12" /></div>
              <div><label className="label">Expected CTC (LPA)</label><input className="input" type="number" value={form.expectedSalary} onChange={e => set('expectedSalary', e.target.value)} placeholder="e.g. 18" /></div>
              <div><label className="label">Notice Period</label>
                <select className="input" value={form.noticePeriod} onChange={e => set('noticePeriod', e.target.value)}>
                  <option value="">Select</option>
                  {NOTICE_PERIODS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3 pt-6">
                <input type="checkbox" id="relocate" checked={form.willingToRelocate} onChange={e => set('willingToRelocate', e.target.checked)} className="w-4 h-4 accent-fynnd-600" />
                <label htmlFor="relocate" className="text-sm text-gray-700">Willing to relocate</label>
              </div>
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="section-title">Links & Notes</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">LinkedIn URL</label><input className="input" value={form.linkedinUrl} onChange={e => set('linkedinUrl', e.target.value)} placeholder="https://linkedin.com/in/..." /></div>
              <div><label className="label">GitHub URL</label><input className="input" value={form.githubUrl} onChange={e => set('githubUrl', e.target.value)} placeholder="https://github.com/..." /></div>
            </div>
            <div><label className="label">Recruiter Notes</label><textarea className="input h-24 resize-none" value={form.recruiterNotes} onChange={e => set('recruiterNotes', e.target.value)} /></div>
          </div>

          {error && <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

          <div className="flex gap-3">
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Create Candidate'}</button>
            <Link href="/candidates" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </Layout>
  );
}
