'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { Globe, Plus, Eye, Users, Edit, Trash2, ExternalLink, Check, X, Briefcase, MapPin, Clock } from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';

const STATUS_COLORS: Record<string, string> = {
  Draft: 'badge-gray', Published: 'badge-green', Paused: 'badge-yellow', Closed: 'badge-red',
};
const APP_STATUS_COLORS: Record<string, string> = {
  Applied: 'badge-blue', Screening: 'badge-yellow', Shortlisted: 'badge-purple',
  'Interview Scheduled': 'badge-orange', Interviewed: 'badge-blue',
  'Offer Extended': 'badge-green', Hired: 'badge-green', Rejected: 'badge-red', Withdrawn: 'badge-gray',
};

const EMPTY_FORM = {
  title: '', department: '', location: '', workType: 'On-site', employmentType: 'Full-time',
  experienceMin: '0', experienceMax: '', salaryMin: '', salaryMax: '',
  skills: '', description: '', responsibilities: '', benefits: '',
  openings: '1', status: 'Draft', companyName: '', industry: '',
};

export default function JobBoardPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editJob, setEditJob] = useState<any>(null);
  const [viewApps, setViewApps] = useState<any>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['hrms-jobboard'],
    queryFn: () => api.get('/jobboard').then(r => r.data),
  });

  const { data: appsData } = useQuery({
    queryKey: ['hrms-jobboard-apps', viewApps?._id],
    queryFn: () => api.get(`/jobboard/${viewApps._id}/applications`).then(r => r.data),
    enabled: !!viewApps,
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => editJob ? api.put(`/jobboard/${editJob._id}`, data) : api.post('/jobboard', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hrms-jobboard'] });
      setShowModal(false); setEditJob(null); setForm(EMPTY_FORM);
      toast.success(editJob ? 'Job updated' : 'Job created');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/jobboard/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hrms-jobboard'] }); toast.success('Job deleted'); },
  });

  const updateAppMutation = useMutation({
    mutationFn: ({ jobId, appId, status }: any) => api.put(`/jobboard/${jobId}/applications/${appId}`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hrms-jobboard-apps'] }); toast.success('Status updated'); },
  });

  const openEdit = (job: any) => {
    setEditJob(job);
    setForm({
      title: job.title, department: job.department || '', location: job.location,
      workType: job.workType, employmentType: job.employmentType,
      experienceMin: job.experienceMin?.toString() || '0',
      experienceMax: job.experienceMax?.toString() || '',
      salaryMin: job.salaryMin?.toString() || '', salaryMax: job.salaryMax?.toString() || '',
      skills: job.skills?.join(', ') || '', description: job.description,
      responsibilities: job.responsibilities || '', benefits: job.benefits || '',
      openings: job.openings?.toString() || '1', status: job.status,
      companyName: job.companyName || '', industry: job.industry || '',
    });
    setShowModal(true);
  };

  const totalApps = jobs?.reduce((s: number, j: any) => s + (j.applicationCount || 0), 0) ?? 0;
  const published = jobs?.filter((j: any) => j.status === 'Published').length ?? 0;

  return (
    <Layout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="page-title">Job Board</h1>
          <p className="text-sm text-gray-500">{published} published · {totalApps} applications</p>
        </div>
        <div className="flex gap-2">
          <a href="/jobs/board" target="_blank" className="btn-secondary text-xs flex items-center gap-1.5">
            <ExternalLink size={13} /> Public Board
          </a>
          <button onClick={() => { setEditJob(null); setForm(EMPTY_FORM); setShowModal(true); }} className="btn-primary">
            <Plus size={15} /> Post Job
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Total Jobs', value: jobs?.length ?? 0 },
          { label: 'Published', value: published },
          { label: 'Applications', value: totalApps },
          { label: 'Views', value: jobs?.reduce((s: number, j: any) => s + (j.views || 0), 0) ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="card text-center">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Jobs list */}
      {isLoading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="card h-24 animate-pulse bg-gray-50" />)}</div>
      ) : !jobs?.length ? (
        <div className="card text-center py-14">
          <Globe size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="font-semibold text-gray-600">No jobs posted yet</p>
          <p className="text-sm text-gray-400 mb-4">Post your first job to start receiving applications</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mx-auto">Post a Job</button>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job: any) => (
            <div key={job._id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-fynnd-50 flex items-center justify-center flex-shrink-0">
                    <Briefcase size={20} className="text-fynnd-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{job.title}</p>
                      <span className={`badge ${STATUS_COLORS[job.status]}`}>{job.status}</span>
                      <span className="badge badge-blue">{job.employmentType}</span>
                      <span className="badge badge-gray">{job.workType}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><MapPin size={12} />{job.location}</span>
                      <span className="flex items-center gap-1"><Users size={12} />{job.applicationCount || 0} applications</span>
                      <span className="flex items-center gap-1"><Eye size={12} />{job.views || 0} views</span>
                      {job.openings > 1 && <span className="flex items-center gap-1"><Briefcase size={12} />{job.openings} openings</span>}
                    </div>
                    {job.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {job.skills.slice(0, 5).map((s: string) => <span key={s} className="badge badge-blue text-[11px]">{s}</span>)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {job.applicationCount > 0 && (
                    <button onClick={() => setViewApps(job)} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
                      <Users size={13} /> {job.applicationCount} Apps
                    </button>
                  )}
                  <button onClick={() => openEdit(job)} className="btn-ghost p-2 text-gray-400 hover:text-fynnd-600"><Edit size={15} /></button>
                  <button onClick={() => { if (confirm('Delete this job?')) deleteMutation.mutate(job._id); }} className="btn-ghost p-2 text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post/Edit Job Modal */}
      <Modal open={showModal} onClose={() => { setShowModal(false); setEditJob(null); }} title={editJob ? 'Edit Job' : 'Post a Job'}>
        <form onSubmit={e => {
          e.preventDefault();
          saveMutation.mutate({
            ...form,
            skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
            experienceMin: Number(form.experienceMin),
            experienceMax: form.experienceMax ? Number(form.experienceMax) : undefined,
            salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
            salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
            openings: Number(form.openings),
          });
        }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="label">Job Title *</label><input className="input" required value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Senior React Developer" /></div>
            <div><label className="label">Company Name *</label><input className="input" required value={form.companyName} onChange={e => set('companyName', e.target.value)} /></div>
            <div><label className="label">Department</label><input className="input" value={form.department} onChange={e => set('department', e.target.value)} /></div>
            <div><label className="label">Location *</label><input className="input" required value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Bengaluru / Remote" /></div>
            <div><label className="label">Work Type</label>
              <select className="input" value={form.workType} onChange={e => set('workType', e.target.value)}>
                {['On-site', 'Remote', 'Hybrid'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="label">Employment Type</label>
              <select className="input" value={form.employmentType} onChange={e => set('employmentType', e.target.value)}>
                {['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="label">Openings</label><input className="input" type="number" min="1" value={form.openings} onChange={e => set('openings', e.target.value)} /></div>
            <div><label className="label">Min Experience (yrs)</label><input className="input" type="number" min="0" value={form.experienceMin} onChange={e => set('experienceMin', e.target.value)} /></div>
            <div><label className="label">Max Experience (yrs)</label><input className="input" type="number" min="0" value={form.experienceMax} onChange={e => set('experienceMax', e.target.value)} /></div>
            <div><label className="label">Min Salary (₹/mo)</label><input className="input" type="number" value={form.salaryMin} onChange={e => set('salaryMin', e.target.value)} /></div>
            <div><label className="label">Max Salary (₹/mo)</label><input className="input" type="number" value={form.salaryMax} onChange={e => set('salaryMax', e.target.value)} /></div>
            <div className="col-span-2"><label className="label">Skills (comma separated)</label><input className="input" value={form.skills} onChange={e => set('skills', e.target.value)} placeholder="React, Node.js, TypeScript" /></div>
            <div className="col-span-2"><label className="label">Job Description *</label><textarea className="input" rows={4} required value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the role..." /></div>
            <div className="col-span-2"><label className="label">Responsibilities</label><textarea className="input" rows={3} value={form.responsibilities} onChange={e => set('responsibilities', e.target.value)} /></div>
            <div className="col-span-2"><label className="label">Benefits</label><textarea className="input" rows={2} value={form.benefits} onChange={e => set('benefits', e.target.value)} /></div>
            <div><label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                {['Draft', 'Published', 'Paused', 'Closed'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {saveMutation.isError && <p className="text-red-500 text-sm">{(saveMutation.error as any)?.response?.data?.message}</p>}
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving...' : editJob ? 'Update Job' : 'Post Job'}</button>
            <button type="button" onClick={() => { setShowModal(false); setEditJob(null); }} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Applications Modal */}
      <Modal open={!!viewApps} onClose={() => setViewApps(null)} title={`Applications — ${viewApps?.title}`}>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {!appsData?.applications?.length ? (
            <p className="text-center text-gray-400 py-8">No applications yet</p>
          ) : appsData.applications.map((app: any) => (
            <div key={app._id} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{app.name}</p>
                  <p className="text-sm text-gray-500">{app.email} · {app.phone}</p>
                  {app.totalExperience !== undefined && <p className="text-xs text-gray-400 mt-1">{app.totalExperience} yrs exp · {app.noticePeriod} notice</p>}
                  {app.expectedSalary && <p className="text-xs text-gray-400">Expected: ₹{app.expectedSalary?.toLocaleString('en-IN')}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`badge ${APP_STATUS_COLORS[app.status] || 'badge-gray'}`}>{app.status}</span>
                  <select
                    value={app.status}
                    onChange={e => updateAppMutation.mutate({ jobId: viewApps._id, appId: app._id, status: e.target.value })}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-fynnd-500">
                    {['Applied', 'Screening', 'Shortlisted', 'Interview Scheduled', 'Interviewed', 'Offer Extended', 'Hired', 'Rejected', 'Withdrawn'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              {app.coverLetter && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{app.coverLetter}</p>}
              <p className="text-xs text-gray-400 mt-2">Applied {formatDate(app.appliedAt)}</p>
            </div>
          ))}
        </div>
      </Modal>
    </Layout>
  );
}
