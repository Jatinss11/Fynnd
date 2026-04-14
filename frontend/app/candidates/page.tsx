'use client';
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import Link from 'next/link';
import EmptyState from '@/components/ui/EmptyState';
import { Search, Plus, MapPin, Briefcase, Clock, Upload, Filter, IndianRupee, Users, X, ChevronDown, Zap, SlidersHorizontal } from 'lucide-react';
import { formatLPA, NOTICE_PERIODS, INDIAN_CITIES, INDIAN_STATES } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';

const SKILL_SUGGESTIONS = ['React', 'Node.js', 'Python', 'Java', 'AWS', 'TypeScript', 'Angular', 'Vue.js', 'Docker', 'Kubernetes', 'Machine Learning', 'Data Science', 'SQL', 'MongoDB', 'Spring Boot', 'Flutter', 'iOS', 'Android', 'DevOps', 'Salesforce'];

const statusConfig: Record<string, { label: string; class: string }> = {
  active:      { label: 'Active',      class: 'badge-green' },
  placed:      { label: 'Placed',      class: 'badge-blue' },
  inactive:    { label: 'Inactive',    class: 'badge-gray' },
  blacklisted: { label: 'Blacklisted', class: 'badge-red' },
};

export default function CandidatesPage() {
  const { user } = useAuthStore();
  const [filters, setFilters] = useState({
    search: '', city: '', state: '', skills: '', minExp: '', maxExp: '',
    noticePeriod: '', status: '', minSalary: '', maxSalary: '',
  });
  const [activeSkills, setActiveSkills] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const update = useCallback((key: string, val: string) => {
    setFilters(f => ({ ...f, [key]: val }));
    setPage(1);
  }, []);

  const toggleSkill = (skill: string) => {
    const next = activeSkills.includes(skill)
      ? activeSkills.filter(s => s !== skill)
      : [...activeSkills, skill];
    setActiveSkills(next);
    setFilters(f => ({ ...f, skills: next.join(',') }));
    setPage(1);
  };

  const clearAll = () => {
    setFilters({ search: '', city: '', state: '', skills: '', minExp: '', maxExp: '', noticePeriod: '', status: '', minSalary: '', maxSalary: '' });
    setActiveSkills([]);
    setPage(1);
  };

  const hasFilters = Object.values(filters).some(Boolean);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['candidates', filters, page],
    queryFn: () => api.get('/candidates', { params: { ...filters, page, limit: 20 } }).then(r => r.data),
    placeholderData: (prev) => prev,
  });

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="page-title">Talent Database</h1>
          <p className="text-sm text-gray-500">
            {isFetching ? 'Searching...' : `${data?.total ?? 0} candidates`}
          </p>
        </div>
        {user?.role !== 'client' && (
          <div className="flex gap-2">
            <Link href="/candidates/upload" className="btn-secondary hidden sm:flex">
              <Upload size={15} /> Upload Resume
            </Link>
            <Link href="/candidates/new" className="btn-primary">
              <Plus size={15} /> Add
            </Link>
          </div>
        )}
      </div>

      {/* Search bar */}
      <div className="card mb-4 p-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
            <input
              className="input pl-10 h-11 text-base"
              placeholder="Search by name, skill, company, role, location..."
              value={filters.search}
              onChange={e => update('search', e.target.value)}
            />
            {filters.search && (
              <button onClick={() => update('search', '')} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn('btn-secondary h-11 px-4 gap-2 flex-shrink-0', showFilters && 'bg-fynnd-50 border-fynnd-200 text-fynnd-700')}>
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">Filters</span>
            {hasFilters && <span className="w-2 h-2 bg-fynnd-500 rounded-full" />}
          </button>
          <div className="hidden sm:flex gap-1 border border-gray-200 rounded-xl p-1">
            {(['list', 'grid'] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', viewMode === m ? 'bg-fynnd-600 text-white' : 'text-gray-500 hover:text-gray-700')}>
                {m === 'list' ? '☰' : '⊞'}
              </button>
            ))}
          </div>
        </div>

        {/* Skill quick-filters */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {SKILL_SUGGESTIONS.slice(0, 12).map(skill => (
            <button key={skill} onClick={() => toggleSkill(skill)}
              className={cn('text-xs px-3 py-1 rounded-full border transition-all',
                activeSkills.includes(skill)
                  ? 'bg-fynnd-600 text-white border-fynnd-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-fynnd-300 hover:text-fynnd-600')}>
              {skill}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="card mb-4 overflow-hidden">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="label text-xs">City</label>
                <select className="input text-sm" value={filters.city} onChange={e => update('city', e.target.value)}>
                  <option value="">All Cities</option>
                  {INDIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label text-xs">State</label>
                <select className="input text-sm" value={filters.state} onChange={e => update('state', e.target.value)}>
                  <option value="">All States</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label text-xs">Min Exp (yrs)</label>
                <input className="input text-sm" type="number" min="0" placeholder="0" value={filters.minExp} onChange={e => update('minExp', e.target.value)} />
              </div>
              <div>
                <label className="label text-xs">Max Exp (yrs)</label>
                <input className="input text-sm" type="number" min="0" placeholder="20" value={filters.maxExp} onChange={e => update('maxExp', e.target.value)} />
              </div>
              <div>
                <label className="label text-xs">Notice Period</label>
                <select className="input text-sm" value={filters.noticePeriod} onChange={e => update('noticePeriod', e.target.value)}>
                  <option value="">Any</option>
                  {NOTICE_PERIODS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="label text-xs">Status</label>
                <select className="input text-sm" value={filters.status} onChange={e => update('status', e.target.value)}>
                  <option value="">All</option>
                  <option value="active">Active</option>
                  <option value="placed">Placed</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="label text-xs">Min CTC (LPA)</label>
                <input className="input text-sm" type="number" placeholder="0" value={filters.minSalary} onChange={e => update('minSalary', e.target.value)} />
              </div>
              <div>
                <label className="label text-xs">Max CTC (LPA)</label>
                <input className="input text-sm" type="number" placeholder="100" value={filters.maxSalary} onChange={e => update('maxSalary', e.target.value)} />
              </div>
            </div>
            {hasFilters && (
              <button onClick={clearAll} className="mt-3 text-xs text-fynnd-600 hover:text-fynnd-700 flex items-center gap-1">
                <X size={12} /> Clear all filters
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active filter chips */}
      {activeSkills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {activeSkills.map(s => (
            <span key={s} className="flex items-center gap-1 bg-fynnd-100 text-fynnd-700 text-xs px-2.5 py-1 rounded-full">
              {s}
              <button onClick={() => toggleSkill(s)}><X size={10} /></button>
            </span>
          ))}
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className={cn('gap-3', viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-2')}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card h-24 animate-pulse bg-gray-50" />
          ))}
        </div>
      ) : data?.candidates?.length === 0 ? (
        <EmptyState icon={Users} title="No candidates found"
          description="Try adjusting your filters or add a new candidate."
          action={user?.role !== 'client' ? <Link href="/candidates/new" className="btn-primary">Add Candidate</Link> : undefined} />
      ) : viewMode === 'list' ? (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {data?.candidates?.map((c: any, i: number) => (
              <motion.div key={c._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.03 }}>
                <Link href={`/candidates/${c._id}`}
                  className="card flex items-center justify-between gap-4 hover:border-fynnd-200 hover:shadow-card-hover transition-all group">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-fynnd-100 to-fynnd-200 text-fynnd-700 flex items-center justify-center font-bold text-sm flex-shrink-0 group-hover:from-fynnd-200 group-hover:to-fynnd-300 transition-all">
                      {c.name?.[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 group-hover:text-fynnd-600 transition-colors">{c.name}</p>
                        <span className={`badge ${statusConfig[c.status]?.class || 'badge-gray'} text-[10px]`}>
                          {statusConfig[c.status]?.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {c.currentRole}{c.currentCompany ? ` @ ${c.currentCompany}` : ''}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {c.skills?.slice(0, 5).map((s: string) => (
                          <span key={s} className={cn('badge text-[11px]', activeSkills.includes(s) ? 'bg-fynnd-100 text-fynnd-700' : 'badge-blue')}>
                            {s}
                          </span>
                        ))}
                        {c.skills?.length > 5 && <span className="badge badge-gray text-[11px]">+{c.skills.length - 5}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-5 text-sm text-gray-500 flex-shrink-0">
                    {c.city && <span className="flex items-center gap-1.5"><MapPin size={13} />{c.city}</span>}
                    {c.experienceYears !== undefined && <span className="flex items-center gap-1.5"><Briefcase size={13} />{c.experienceYears}y</span>}
                    {c.expectedSalary && <span className="flex items-center gap-1.5"><IndianRupee size={13} />{c.expectedSalary}L</span>}
                    {c.noticePeriod && <span className="flex items-center gap-1.5"><Clock size={13} />{c.noticePeriod}</span>}
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        // Grid view
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {data?.candidates?.map((c: any, i: number) => (
              <motion.div key={c._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
                <Link href={`/candidates/${c._id}`} className="card-hover block">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-fynnd-100 to-fynnd-200 text-fynnd-700 flex items-center justify-center font-bold text-lg">
                      {c.name?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{c.name}</p>
                      <p className="text-xs text-gray-500 truncate">{c.currentRole}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {c.skills?.slice(0, 4).map((s: string) => <span key={s} className="badge badge-blue text-[11px]">{s}</span>)}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1"><MapPin size={11} />{c.city || '—'}</span>
                    <span className="flex items-center gap-1"><Briefcase size={11} />{c.experienceYears}y</span>
                    <span className="flex items-center gap-1"><IndianRupee size={11} />{c.expectedSalary || '—'}L</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {(data?.pages ?? 0) > 1 && (
        <div className="flex justify-center gap-1.5 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-3 py-1.5 text-xs">← Prev</button>
          {Array.from({ length: Math.min(data.pages, 7) }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', page === p ? 'bg-fynnd-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')}>
              {p}
            </button>
          ))}
          <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages} className="btn-secondary px-3 py-1.5 text-xs">Next →</button>
        </div>
      )}
    </Layout>
  );
}
