'use client';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { Search, MapPin, Briefcase, Clock, IndianRupee, Globe, ArrowLeft, Send, X, Building2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';

const WORK_TYPES = ['On-site', 'Remote', 'Hybrid'];
const EMP_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];

export default function PublicJobBoard() {
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [workType, setWorkType] = useState('');
  const [empType, setEmpType] = useState('');
  const [page, setPage] = useState(1);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showApply, setShowApply] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', location: '', totalExperience: '', currentSalary: '', expectedSalary: '', noticePeriod: '', coverLetter: '', linkedinUrl: '' });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const { data, isLoading } = useQuery({
    queryKey: ['public-jobs', search, location, workType, empType, page],
    queryFn: () => api.get('/jobboard/public', { params: { search, location, workType, employmentType: empType, page, limit: 12 } }).then(r => r.data),
    placeholderData: (prev) => prev,
  });

  const applyMutation = useMutation({
    mutationFn: (formData: any) => api.post(`/jobboard/public/${selectedJob._id}/apply`, formData),
    onSuccess: () => {
      toast.success('Application submitted! We\'ll be in touch soon.');
      setShowApply(false);
      setForm({ name: '', email: '', phone: '', location: '', totalExperience: '', currentSalary: '', expectedSalary: '', noticePeriod: '', coverLetter: '', linkedinUrl: '' });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to submit'),
  });

  const jobs = data?.jobs ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gray-950 text-white">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <Link href="/" className="flex items-center gap-2 mb-6 w-fit">
            <div className="w-7 h-7 bg-fynnd-600 rounded-lg flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-bold text-white">fynnd</span>
          </Link>
          <h1 className="text-4xl font-bold mb-2">Find your next opportunity</h1>
          <p className="text-gray-400 mb-8">{data?.total ?? 0} open positions from top companies</p>

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-3.5 text-gray-400" />
              <input className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-fynnd-500 focus:bg-white/15"
                placeholder="Job title, skills, company..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <div className="relative">
              <MapPin size={16} className="absolute left-4 top-3.5 text-gray-400" />
              <input className="w-full sm:w-48 pl-11 pr-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-fynnd-500"
                placeholder="Location..." value={location} onChange={e => { setLocation(e.target.value); setPage(1); }} />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            {WORK_TYPES.map(t => (
              <button key={t} onClick={() => { setWorkType(workType === t ? '' : t); setPage(1); }}
                className={cn('px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                  workType === t ? 'bg-fynnd-600 border-fynnd-600 text-white' : 'border-white/20 text-gray-400 hover:border-white/40 hover:text-white')}>
                {t}
              </button>
            ))}
            {EMP_TYPES.map(t => (
              <button key={t} onClick={() => { setEmpType(empType === t ? '' : t); setPage(1); }}
                className={cn('px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                  empType === t ? 'bg-fynnd-600 border-fynnd-600 text-white' : 'border-white/20 text-gray-400 hover:border-white/40 hover:text-white')}>
                {t}
              </button>
            ))}
            {(search || location || workType || empType) && (
              <button onClick={() => { setSearch(''); setLocation(''); setWorkType(''); setEmpType(''); setPage(1); }}
                className="px-3 py-1.5 rounded-full text-xs font-medium border border-red-400/40 text-red-400 hover:bg-red-400/10 flex items-center gap-1">
                <X size={11} /> Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Job listings */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-48 animate-pulse" />)}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20">
            <Globe size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-xl font-semibold text-gray-600">No jobs found</p>
            <p className="text-gray-400 mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.map((job: any) => (
                <div key={job._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-fynnd-100 transition-all p-5 flex flex-col">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-fynnd-50 flex items-center justify-center flex-shrink-0">
                      <Building2 size={20} className="text-fynnd-600" />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <span className={cn('badge text-[11px]', job.workType === 'Remote' ? 'badge-green' : job.workType === 'Hybrid' ? 'badge-blue' : 'badge-gray')}>{job.workType}</span>
                      <span className="badge badge-purple text-[11px]">{job.employmentType}</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{job.title}</h3>
                  <p className="text-sm text-fynnd-600 font-medium mb-3">{job.companyName}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>
                    {job.experienceMin !== undefined && <span className="flex items-center gap-1"><Briefcase size={11} />{job.experienceMin}{job.experienceMax ? `–${job.experienceMax}` : '+'} yrs</span>}
                    {job.salaryMin && <span className="flex items-center gap-1"><IndianRupee size={11} />{(job.salaryMin/1000).toFixed(0)}K{job.salaryMax ? `–${(job.salaryMax/1000).toFixed(0)}K` : '+'}</span>}
                  </div>
                  {job.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {job.skills.slice(0, 4).map((s: string) => <span key={s} className="badge badge-blue text-[11px]">{s}</span>)}
                      {job.skills.length > 4 && <span className="badge badge-gray text-[11px]">+{job.skills.length - 4}</span>}
                    </div>
                  )}
                  <div className="mt-auto flex gap-2">
                    <button onClick={() => setSelectedJob(job)} className="flex-1 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                      View Details
                    </button>
                    <button onClick={() => { setSelectedJob(job); setShowApply(true); }}
                      className="flex-1 py-2 text-sm font-medium bg-fynnd-600 hover:bg-fynnd-700 text-white rounded-xl transition-colors">
                      Apply Now
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {(data?.pages ?? 0) > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">← Prev</button>
                <span className="px-4 py-2 text-sm text-gray-500">Page {page} of {data?.pages}</span>
                <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data?.pages} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">Next →</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Job Detail Modal */}
      {selectedJob && !showApply && (
        <Modal open={!!selectedJob} onClose={() => setSelectedJob(null)} title={selectedJob.title}>
          <div className="space-y-4 max-h-[65vh] overflow-y-auto">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-fynnd-50 flex items-center justify-center">
                <Building2 size={22} className="text-fynnd-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">{selectedJob.companyName}</p>
                <div className="flex gap-2 mt-1">
                  <span className="badge badge-gray">{selectedJob.workType}</span>
                  <span className="badge badge-blue">{selectedJob.employmentType}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600"><MapPin size={14} className="text-gray-400" />{selectedJob.location}</div>
              {selectedJob.experienceMin !== undefined && <div className="flex items-center gap-2 text-gray-600"><Briefcase size={14} className="text-gray-400" />{selectedJob.experienceMin}{selectedJob.experienceMax ? `–${selectedJob.experienceMax}` : '+'} years</div>}
              {selectedJob.salaryMin && <div className="flex items-center gap-2 text-gray-600"><IndianRupee size={14} className="text-gray-400" />₹{selectedJob.salaryMin?.toLocaleString('en-IN')}{selectedJob.salaryMax ? `–₹${selectedJob.salaryMax?.toLocaleString('en-IN')}` : '+'}</div>}
              <div className="flex items-center gap-2 text-gray-600"><Clock size={14} className="text-gray-400" />{selectedJob.openings} opening{selectedJob.openings > 1 ? 's' : ''}</div>
            </div>
            {selectedJob.skills?.length > 0 && (
              <div><p className="text-xs font-semibold text-gray-500 uppercase mb-2">Required Skills</p>
                <div className="flex flex-wrap gap-1.5">{selectedJob.skills.map((s: string) => <span key={s} className="badge badge-blue">{s}</span>)}</div>
              </div>
            )}
            <div><p className="text-xs font-semibold text-gray-500 uppercase mb-2">About the Role</p><p className="text-sm text-gray-700 whitespace-pre-line">{selectedJob.description}</p></div>
            {selectedJob.responsibilities && <div><p className="text-xs font-semibold text-gray-500 uppercase mb-2">Responsibilities</p><p className="text-sm text-gray-700 whitespace-pre-line">{selectedJob.responsibilities}</p></div>}
            {selectedJob.benefits && <div><p className="text-xs font-semibold text-gray-500 uppercase mb-2">Benefits</p><p className="text-sm text-gray-700 whitespace-pre-line">{selectedJob.benefits}</p></div>}
            <button onClick={() => setShowApply(true)} className="btn-primary w-full py-3 mt-2">Apply for this Position</button>
          </div>
        </Modal>
      )}

      {/* Apply Modal */}
      <Modal open={showApply} onClose={() => setShowApply(false)} title={`Apply — ${selectedJob?.title}`}>
        <form onSubmit={e => { e.preventDefault(); applyMutation.mutate(form); }} className="space-y-4 max-h-[65vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Full Name *</label><input className="input" required value={form.name} onChange={e => set('name', e.target.value)} /></div>
            <div><label className="label">Email *</label><input className="input" type="email" required value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div><label className="label">Phone *</label><input className="input" required value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
            <div><label className="label">Current Location</label><input className="input" value={form.location} onChange={e => set('location', e.target.value)} /></div>
            <div><label className="label">Total Experience (yrs)</label><input className="input" type="number" min="0" value={form.totalExperience} onChange={e => set('totalExperience', e.target.value)} /></div>
            <div><label className="label">Notice Period</label>
              <select className="input" value={form.noticePeriod} onChange={e => set('noticePeriod', e.target.value)}>
                <option value="">Select</option>
                {['Immediate', '15 days', '30 days', '45 days', '60 days', '90 days'].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div><label className="label">Current Salary (₹/mo)</label><input className="input" type="number" value={form.currentSalary} onChange={e => set('currentSalary', e.target.value)} /></div>
            <div><label className="label">Expected Salary (₹/mo)</label><input className="input" type="number" value={form.expectedSalary} onChange={e => set('expectedSalary', e.target.value)} /></div>
            <div className="col-span-2"><label className="label">LinkedIn URL</label><input className="input" type="url" placeholder="https://linkedin.com/in/..." value={form.linkedinUrl} onChange={e => set('linkedinUrl', e.target.value)} /></div>
            <div className="col-span-2"><label className="label">Cover Letter</label><textarea className="input" rows={4} value={form.coverLetter} onChange={e => set('coverLetter', e.target.value)} placeholder="Why are you a great fit for this role?" /></div>
          </div>
          {applyMutation.isError && <p className="text-red-500 text-sm">{(applyMutation.error as any)?.response?.data?.message}</p>}
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1 py-3" disabled={applyMutation.isPending}>
              <Send size={15} /> {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
            </button>
            <button type="button" onClick={() => setShowApply(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
