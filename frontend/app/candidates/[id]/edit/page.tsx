'use client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { INDIAN_CITIES, INDIAN_STATES, NOTICE_PERIODS } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function EditCandidatePage() {
  const { id } = useParams();
  const router = useRouter();
  const [form, setForm] = useState<any>(null);

  const { data: candidate, isLoading } = useQuery({
    queryKey: ['candidate', id],
    queryFn: () => api.get(`/candidates/${id}`).then(r => r.data),
  });

  useEffect(() => {
    if (candidate) {
      setForm({
        name: candidate.name || '',
        email: candidate.email || '',
        phone: candidate.phone || '',
        city: candidate.city || '',
        state: candidate.state || '',
        currentRole: candidate.currentRole || '',
        currentCompany: candidate.currentCompany || '',
        experienceYears: candidate.experienceYears ?? '',
        experienceMonths: candidate.experienceMonths ?? '',
        skills: (candidate.skills || []).join(', '),
        currentSalary: candidate.currentSalary ?? '',
        expectedSalary: candidate.expectedSalary ?? '',
        noticePeriod: candidate.noticePeriod || '',
        willingToRelocate: candidate.willingToRelocate || false,
        linkedinUrl: candidate.linkedinUrl || '',
        githubUrl: candidate.githubUrl || '',
        recruiterNotes: candidate.recruiterNotes || '',
        status: candidate.status || 'active',
      });
    }
  }, [candidate]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/candidates/${id}`, data),
    onSuccess: () => {
      toast.success('Candidate updated!');
      router.push(`/candidates/${id}`);
    },
    onError: () => toast.error('Update failed'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      ...form,
      skills: form.skills.split(',').map((s: string) => s.trim()).filter(Boolean),
      experienceYears: Number(form.experienceYears) || 0,
      experienceMonths: Number(form.experienceMonths) || 0,
      currentSalary: form.currentSalary ? Number(form.currentSalary) : undefined,
      expectedSalary: form.expectedSalary ? Number(form.expectedSalary) : undefined,
    });
  };

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  if (isLoading || !form) return (
    <Layout>
      <div className="space-y-4 max-w-2xl mx-auto">
        {[...Array(4)].map((_, i) => <div key={i} className="card h-32 animate-pulse bg-gray-50" />)}
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-4">
          <Link href={`/candidates/${id}`} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <ArrowLeft size={14} /> Back to Profile
          </Link>
        </div>
        <h1 className="page-title mb-6">Edit Candidate</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="card space-y-4">
            <h2 className="section-title">Personal Info</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Full Name *</label><input className="input" required value={form.name} onChange={e => set('name', e.target.value)} /></div>
              <div><label className="label">Email *</label><input className="input" type="email" required value={form.email} onChange={e => set('email', e.target.value)} /></div>
              <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
              <div><label className="label">Status</label>
                <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="active">Active</option>
                  <option value="placed">Placed</option>
                  <option value="inactive">Inactive</option>
                  <option value="blacklisted">Blacklisted</option>
                </select>
              </div>
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
            <div><label className="label">Skills (comma separated)</label>
              <input className="input" value={form.skills} onChange={e => set('skills', e.target.value)} placeholder="React, Node.js, TypeScript" />
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="section-title">Compensation</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Current CTC (LPA)</label><input className="input" type="number" value={form.currentSalary} onChange={e => set('currentSalary', e.target.value)} /></div>
              <div><label className="label">Expected CTC (LPA)</label><input className="input" type="number" value={form.expectedSalary} onChange={e => set('expectedSalary', e.target.value)} /></div>
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
              <div><label className="label">LinkedIn</label><input className="input" value={form.linkedinUrl} onChange={e => set('linkedinUrl', e.target.value)} /></div>
              <div><label className="label">GitHub</label><input className="input" value={form.githubUrl} onChange={e => set('githubUrl', e.target.value)} /></div>
            </div>
            <div><label className="label">Recruiter Notes</label>
              <textarea className="input h-24 resize-none" value={form.recruiterNotes} onChange={e => set('recruiterNotes', e.target.value)} />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="btn-primary" disabled={updateMutation.isPending}>
              <Save size={15} /> {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
            <Link href={`/candidates/${id}`} className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </Layout>
  );
}
