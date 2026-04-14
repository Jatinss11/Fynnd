'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { Shield, Upload, Zap, CheckCircle, AlertCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const r = (size / 2) - 8;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth="6" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <span className="absolute text-lg font-bold" style={{ color }}>{score}</span>
    </div>
  );
}

function SectionBar({ label, score, matched, missing, issues }: any) {
  const [open, setOpen] = useState(false);
  const color = score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50">
        <div className="flex items-center gap-3 flex-1">
          <span className="text-sm font-medium text-gray-700 w-36 text-left">{label}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-2">
            <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
          </div>
          <span className="text-sm font-bold text-gray-700 w-10 text-right">{score}%</span>
        </div>
        {(matched?.length || missing?.length || issues?.length) ? (open ? <ChevronUp size={14} className="ml-2 text-gray-400" /> : <ChevronDown size={14} className="ml-2 text-gray-400" />) : null}
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-2 bg-gray-50">
          {matched?.length > 0 && (
            <div><p className="text-xs text-gray-400 mb-1">Matched</p>
              <div className="flex flex-wrap gap-1">{matched.map((k: string) => <span key={k} className="badge badge-green text-[11px]">{k}</span>)}</div>
            </div>
          )}
          {missing?.length > 0 && (
            <div><p className="text-xs text-gray-400 mb-1">Missing</p>
              <div className="flex flex-wrap gap-1">{missing.map((k: string) => <span key={k} className="badge badge-red text-[11px]">{k}</span>)}</div>
            </div>
          )}
          {issues?.length > 0 && (
            <div><p className="text-xs text-gray-400 mb-1">Issues</p>
              <ul className="space-y-0.5">{issues.map((i: string, idx: number) => <li key={idx} className="text-xs text-gray-600">• {i}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ATSPage() {
  const [mode, setMode] = useState<'candidate' | 'upload'>('candidate');
  const [candidateId, setCandidateId] = useState('');
  const [jobId, setJobId] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedCV, setOptimizedCV] = useState('');
  const [error, setError] = useState('');

  const { data: candidates } = useQuery({
    queryKey: ['candidates-list'],
    queryFn: () => api.get('/candidates', { params: { limit: 100 } }).then(r => r.data),
  });
  const { data: jobs } = useQuery({
    queryKey: ['jobs-list'],
    queryFn: () => api.get('/jobs').then(r => r.data),
  });

  const handleAnalyze = async () => {
    setLoading(true); setError(''); setReport(null); setOptimizedCV('');
    try {
      let res;
      if (mode === 'upload' && file) {
        const fd = new FormData();
        fd.append('resume', file);
        fd.append('jobDescription', jobDescription);
        fd.append('jobTitle', jobTitle);
        res = await api.post('/ats/analyze-upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        res = await api.post('/ats/analyze', { candidateId, jobId, jobDescription, jobTitle });
      }
      setReport(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    if (!candidateId) return;
    setOptimizing(true);
    try {
      const res = await api.post('/ats/optimize-cv', { candidateId, jobDescription, jobTitle });
      setOptimizedCV(res.data.optimizedCV);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Optimization failed');
    } finally {
      setOptimizing(false);
    }
  };

  const scoreColor = (s: number) => s >= 75 ? 'text-emerald-600' : s >= 50 ? 'text-yellow-600' : 'text-red-500';

  return (
    <Layout>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
          <Shield size={20} className="text-violet-600" />
        </div>
        <div>
          <h1 className="page-title">ATS Analyzer</h1>
          <p className="text-sm text-gray-500">AI-powered CV scoring against job requirements</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-4">
          {/* Mode toggle */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
            {(['candidate', 'upload'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${mode === m ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                {m === 'candidate' ? 'From Database' : 'Upload PDF'}
              </button>
            ))}
          </div>

          <div className="card space-y-4">
            {mode === 'candidate' ? (
              <>
                <div>
                  <label className="label">Select Candidate</label>
                  <select className="input" value={candidateId} onChange={e => setCandidateId(e.target.value)}>
                    <option value="">Choose candidate...</option>
                    {candidates?.candidates?.map((c: any) => (
                      <option key={c._id} value={c._id}>{c.name} — {c.currentRole}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Match Against Job (optional)</label>
                  <select className="input" value={jobId} onChange={e => setJobId(e.target.value)}>
                    <option value="">Choose job or paste JD below...</option>
                    {jobs?.jobs?.map((j: any) => (
                      <option key={j._id} value={j._id}>{j.title} — {j.company}</option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <div>
                <label className="label">Upload Resume PDF</label>
                <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all ${file ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 hover:border-fynnd-300'}`}>
                  {file ? <><FileText size={24} className="text-emerald-500 mb-1" /><p className="text-sm font-medium">{file.name}</p></> : <><Upload size={24} className="text-gray-300 mb-1" /><p className="text-sm text-gray-500">Drop PDF here</p></>}
                  <input type="file" accept=".pdf" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                </label>
              </div>
            )}

            {!jobId && (
              <>
                <div><label className="label">Job Title</label><input className="input" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Senior Software Engineer" /></div>
                <div><label className="label">Job Description</label><textarea className="input h-32 resize-none" value={jobDescription} onChange={e => setJobDescription(e.target.value)} placeholder="Paste the full job description here..." /></div>
              </>
            )}

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button onClick={handleAnalyze} disabled={loading || (!candidateId && !file)} className="btn-primary w-full py-2.5">
              {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing with AI...</> : <><Shield size={15} /> Run ATS Analysis</>}
            </button>
          </div>
        </div>

        {/* Report */}
        {report && (
          <div className="space-y-4">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title mb-0">ATS Score</h2>
                <ScoreRing score={report.overallScore} size={72} />
              </div>
              <p className={`text-3xl font-bold mb-1 ${scoreColor(report.overallScore)}`}>
                {report.overallScore >= 75 ? 'Strong Match' : report.overallScore >= 50 ? 'Moderate Match' : 'Needs Improvement'}
              </p>
              <p className="text-sm text-gray-500">
                {report.overallScore >= 75 ? 'This CV is well-optimized for ATS systems.' : report.overallScore >= 50 ? 'Some improvements can increase selection chances.' : 'Significant optimization needed to pass ATS filters.'}
              </p>
            </div>

            <div className="card space-y-2">
              <h2 className="section-title">Section Breakdown</h2>
              {report.sections && Object.entries(report.sections).map(([key, val]: any) => (
                <SectionBar key={key}
                  label={key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                  score={val.score}
                  matched={val.matched}
                  missing={val.missing}
                  issues={val.issues}
                />
              ))}
            </div>

            {report.suggestions?.length > 0 && (
              <div className="card">
                <h2 className="section-title">AI Suggestions</h2>
                <ul className="space-y-2">
                  {report.suggestions.map((s: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <Zap size={14} className="text-fynnd-500 mt-0.5 flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {mode === 'candidate' && candidateId && (
              <div className="card">
                <h2 className="section-title">Generate Optimized CV</h2>
                <p className="text-sm text-gray-500 mb-3">AI rewrites the CV with ATS-friendly formatting and keywords from the job description.</p>
                <button onClick={handleOptimize} disabled={optimizing} className="btn-primary w-full">
                  {optimizing ? 'Generating...' : <><Zap size={15} /> Generate ATS-Optimized CV</>}
                </button>
                {optimizedCV && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-700">Optimized CV</p>
                      <button onClick={() => navigator.clipboard.writeText(optimizedCV)} className="btn-secondary text-xs py-1">Copy</button>
                    </div>
                    <pre className="bg-gray-50 rounded-xl p-4 text-xs text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto border border-gray-100">{optimizedCV}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!report && !loading && (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <Shield size={40} className="text-gray-200 mb-3" />
            <p className="font-medium text-gray-500">Run an analysis to see ATS score</p>
            <p className="text-sm text-gray-400 mt-1">Select a candidate and job, then click Analyze</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
