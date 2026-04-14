'use client';
import { useState } from 'react';
import api from '@/lib/api';
import { Zap, Shield, FileText, CheckCircle, AlertCircle, Download, Copy, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type Stage = 'home' | 'ats_check' | 'cv_builder' | 'result';

function ScoreRing({ score, size = 100 }: { score: number; size?: number }) {
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const r = (size / 2) - 10;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e293b" strokeWidth="8" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="absolute text-center">
        <p className="text-2xl font-bold text-white">{score}</p>
        <p className="text-xs text-gray-400">/ 100</p>
      </div>
    </div>
  );
}

export default function CandidatePortalPage() {
  const [stage, setStage] = useState<Stage>('home');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ATS Check state
  const [atsForm, setAtsForm] = useState({ jobTitle: '', jobDescription: '', candidateName: '', skills: '', experience: '', education: '', summary: '' });
  const [atsReport, setAtsReport] = useState<any>(null);

  // CV Builder state
  const [cvForm, setCvForm] = useState({ name: '', email: '', phone: '', city: '', currentRole: '', experience: '', skills: '', education: '', jobTitle: '', jobDescription: '' });
  const [generatedCV, setGeneratedCV] = useState('');
  const [copied, setCopied] = useState(false);

  const runATSCheck = async () => {
    setLoading(true); setError('');
    try {
      // Build a CV text from the form
      const cvText = `
Name: ${atsForm.candidateName}
Summary: ${atsForm.summary}
Skills: ${atsForm.skills}
Experience: ${atsForm.experience}
Education: ${atsForm.education}
      `.trim();

      const res = await api.post('/ats/analyze', {
        jobDescription: atsForm.jobDescription,
        jobTitle: atsForm.jobTitle,
        // Pass as raw text via a special field
        _cvText: cvText,
      });
      setAtsReport(res.data);
      setStage('result');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const buildCV = async () => {
    setLoading(true); setError('');
    try {
      // Use the AI service directly via a candidate-friendly endpoint
      const res = await api.post('/ats/optimize-cv', {
        candidateProfile: cvForm,
        jobDescription: cvForm.jobDescription,
        jobTitle: cvForm.jobTitle,
      });
      setGeneratedCV(res.data.optimizedCV);
      setStage('result');
    } catch (err: any) {
      setError(err.response?.data?.message || 'CV generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyCV = () => {
    navigator.clipboard.writeText(generatedCV);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-fynnd-600 rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white">fynnd</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-none">Candidate Portal</p>
          </div>
        </div>
        <p className="text-xs text-gray-500">by Staffinger Solutions, Noida</p>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Home */}
        {stage === 'home' && (
          <div>
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-3">Land your dream job faster</h1>
              <p className="text-gray-400 text-lg">AI-powered tools to optimize your CV and beat ATS filters</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button onClick={() => setStage('ats_check')}
                className="bg-gray-900 border border-white/10 rounded-2xl p-6 text-left hover:border-fynnd-500 hover:bg-gray-800 transition-all group">
                <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Shield size={24} className="text-violet-400" />
                </div>
                <h2 className="text-lg font-bold mb-2">ATS Score Checker</h2>
                <p className="text-gray-400 text-sm mb-4">See how well your CV matches a job description and get a score out of 100.</p>
                <span className="text-fynnd-400 text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                  Check my CV <ChevronRight size={14} />
                </span>
              </button>

              <a href="/portal/cv-builder"
                className="bg-gray-900 border border-white/10 rounded-2xl p-6 text-left hover:border-fynnd-500 hover:bg-gray-800 transition-all group">
                <div className="w-12 h-12 bg-fynnd-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Zap size={24} className="text-fynnd-400" />
                </div>
                <h2 className="text-lg font-bold mb-2">AI CV Builder</h2>
                <p className="text-gray-400 text-sm mb-4">Choose a template, fill your details, get an ATS-optimized CV. Download as PDF or Word.</p>
                <span className="text-fynnd-400 text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                  Build my CV <ChevronRight size={14} />
                </span>
              </a>
            </div>

            <div className="mt-8 bg-gray-900 border border-white/5 rounded-2xl p-5">
              <p className="text-sm text-gray-400 text-center">
                💡 <span className="text-white font-medium">Did you know?</span> Over 75% of CVs are rejected by ATS before a human ever reads them. Our AI helps you get past the filters.
              </p>
            </div>
          </div>
        )}

        {/* ATS Check */}
        {stage === 'ats_check' && (
          <div>
            <button onClick={() => setStage('home')} className="text-sm text-gray-500 hover:text-white mb-6 flex items-center gap-1">← Back</button>
            <h2 className="text-2xl font-bold mb-6">ATS Score Checker</h2>

            <div className="space-y-4">
              <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 space-y-4">
                <h3 className="font-semibold text-gray-300">Your Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label text-gray-400">Your Name</label>
                    <input className="input bg-white/5 border-white/10 text-white placeholder:text-gray-600" placeholder="Full name" value={atsForm.candidateName} onChange={e => setAtsForm(f => ({ ...f, candidateName: e.target.value }))} /></div>
                  <div><label className="label text-gray-400">Key Skills</label>
                    <input className="input bg-white/5 border-white/10 text-white placeholder:text-gray-600" placeholder="React, Node.js, AWS..." value={atsForm.skills} onChange={e => setAtsForm(f => ({ ...f, skills: e.target.value }))} /></div>
                </div>
                <div><label className="label text-gray-400">Work Experience Summary</label>
                  <textarea className="input bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-20 resize-none" placeholder="e.g. 5 years as Senior Software Engineer at Infosys, worked on React and Node.js projects..." value={atsForm.experience} onChange={e => setAtsForm(f => ({ ...f, experience: e.target.value }))} /></div>
                <div><label className="label text-gray-400">Education</label>
                  <input className="input bg-white/5 border-white/10 text-white placeholder:text-gray-600" placeholder="B.Tech Computer Science, NIT Trichy, 2019" value={atsForm.education} onChange={e => setAtsForm(f => ({ ...f, education: e.target.value }))} /></div>
              </div>

              <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 space-y-4">
                <h3 className="font-semibold text-gray-300">Target Job</h3>
                <div><label className="label text-gray-400">Job Title</label>
                  <input className="input bg-white/5 border-white/10 text-white placeholder:text-gray-600" placeholder="e.g. Senior Software Engineer" value={atsForm.jobTitle} onChange={e => setAtsForm(f => ({ ...f, jobTitle: e.target.value }))} /></div>
                <div><label className="label text-gray-400">Job Description *</label>
                  <textarea className="input bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-32 resize-none" placeholder="Paste the full job description here..." value={atsForm.jobDescription} onChange={e => setAtsForm(f => ({ ...f, jobDescription: e.target.value }))} /></div>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button onClick={runATSCheck} disabled={loading || !atsForm.jobDescription || !atsForm.candidateName} className="btn-primary w-full py-3">
                {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing...</> : <><Shield size={15} /> Check ATS Score</>}
              </button>
            </div>
          </div>
        )}

        {/* CV Builder */}
        {stage === 'cv_builder' && (
          <div>
            <button onClick={() => setStage('home')} className="text-sm text-gray-500 hover:text-white mb-6 flex items-center gap-1">← Back</button>
            <h2 className="text-2xl font-bold mb-6">AI CV Builder</h2>

            <div className="space-y-4">
              <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 space-y-4">
                <h3 className="font-semibold text-gray-300">Personal Info</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label text-gray-400">Full Name *</label><input className="input bg-white/5 border-white/10 text-white placeholder:text-gray-600" value={cvForm.name} onChange={e => setCvForm(f => ({ ...f, name: e.target.value }))} /></div>
                  <div><label className="label text-gray-400">Email</label><input className="input bg-white/5 border-white/10 text-white placeholder:text-gray-600" type="email" value={cvForm.email} onChange={e => setCvForm(f => ({ ...f, email: e.target.value }))} /></div>
                  <div><label className="label text-gray-400">Phone</label><input className="input bg-white/5 border-white/10 text-white placeholder:text-gray-600" value={cvForm.phone} onChange={e => setCvForm(f => ({ ...f, phone: e.target.value }))} /></div>
                  <div><label className="label text-gray-400">City</label><input className="input bg-white/5 border-white/10 text-white placeholder:text-gray-600" value={cvForm.city} onChange={e => setCvForm(f => ({ ...f, city: e.target.value }))} /></div>
                </div>
              </div>

              <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 space-y-4">
                <h3 className="font-semibold text-gray-300">Professional Info</h3>
                <div><label className="label text-gray-400">Current/Last Role</label><input className="input bg-white/5 border-white/10 text-white placeholder:text-gray-600" placeholder="e.g. Senior Software Engineer at Infosys" value={cvForm.currentRole} onChange={e => setCvForm(f => ({ ...f, currentRole: e.target.value }))} /></div>
                <div><label className="label text-gray-400">Skills (comma separated)</label><input className="input bg-white/5 border-white/10 text-white placeholder:text-gray-600" placeholder="React, Node.js, TypeScript, AWS, MongoDB" value={cvForm.skills} onChange={e => setCvForm(f => ({ ...f, skills: e.target.value }))} /></div>
                <div><label className="label text-gray-400">Work Experience</label><textarea className="input bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-24 resize-none" placeholder="Describe your work experience, key projects, achievements..." value={cvForm.experience} onChange={e => setCvForm(f => ({ ...f, experience: e.target.value }))} /></div>
                <div><label className="label text-gray-400">Education</label><input className="input bg-white/5 border-white/10 text-white placeholder:text-gray-600" placeholder="B.Tech Computer Science, NIT Trichy, 2019" value={cvForm.education} onChange={e => setCvForm(f => ({ ...f, education: e.target.value }))} /></div>
              </div>

              <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 space-y-4">
                <h3 className="font-semibold text-gray-300">Target Job (for optimization)</h3>
                <div><label className="label text-gray-400">Job Title *</label><input className="input bg-white/5 border-white/10 text-white placeholder:text-gray-600" placeholder="e.g. Senior Full Stack Engineer" value={cvForm.jobTitle} onChange={e => setCvForm(f => ({ ...f, jobTitle: e.target.value }))} /></div>
                <div><label className="label text-gray-400">Job Description</label><textarea className="input bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-28 resize-none" placeholder="Paste the job description to tailor your CV..." value={cvForm.jobDescription} onChange={e => setCvForm(f => ({ ...f, jobDescription: e.target.value }))} /></div>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button onClick={buildCV} disabled={loading || !cvForm.name || !cvForm.jobTitle} className="btn-primary w-full py-3">
                {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Building your CV...</> : <><Zap size={15} /> Generate ATS-Optimized CV</>}
              </button>
            </div>
          </div>
        )}

        {/* Result */}
        {stage === 'result' && (
          <div>
            <button onClick={() => { setStage('home'); setAtsReport(null); setGeneratedCV(''); }} className="text-sm text-gray-500 hover:text-white mb-6 flex items-center gap-1">← Back to Home</button>

            {atsReport && (
              <div className="space-y-5">
                <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Your ATS Score</h2>
                    <p className={`text-lg font-semibold ${atsReport.overallScore >= 75 ? 'text-emerald-400' : atsReport.overallScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {atsReport.overallScore >= 75 ? '✅ Strong Match' : atsReport.overallScore >= 50 ? '⚠️ Moderate Match' : '❌ Needs Work'}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      {atsReport.overallScore >= 75 ? 'Your CV is well-optimized. High chance of passing ATS.' : atsReport.overallScore >= 50 ? 'Some improvements needed to increase selection chances.' : 'Significant optimization needed to pass ATS filters.'}
                    </p>
                  </div>
                  <ScoreRing score={atsReport.overallScore} size={100} />
                </div>

                {atsReport.sections && (
                  <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 space-y-3">
                    <h3 className="font-semibold">Section Scores</h3>
                    {Object.entries(atsReport.sections).map(([key, val]: any) => (
                      <div key={key}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <span className="font-semibold">{val.score}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-800 rounded-full">
                          <div className={`h-1.5 rounded-full ${val.score >= 75 ? 'bg-emerald-500' : val.score >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`} style={{ width: `${val.score}%` }} />
                        </div>
                        {val.missing?.length > 0 && (
                          <p className="text-xs text-red-400 mt-1">Missing: {val.missing.join(', ')}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {atsReport.suggestions?.length > 0 && (
                  <div className="bg-gray-900 border border-white/10 rounded-2xl p-5">
                    <h3 className="font-semibold mb-3">How to Improve</h3>
                    <ul className="space-y-2">
                      {atsReport.suggestions.map((s: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                          <Zap size={13} className="text-fynnd-400 mt-0.5 flex-shrink-0" />{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button onClick={() => setStage('cv_builder')} className="btn-primary w-full py-3">
                  <Zap size={15} /> Build an Optimized CV Now
                </button>
              </div>
            )}

            {generatedCV && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Your ATS-Optimized CV</h2>
                  <button onClick={copyCV} className={cn('btn text-sm py-2', copied ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/10 text-white hover:bg-white/20')}>
                    {copied ? <><CheckCircle size={14} /> Copied!</> : <><Copy size={14} /> Copy CV</>}
                  </button>
                </div>
                <div className="bg-gray-900 border border-white/10 rounded-2xl p-6">
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed font-mono">{generatedCV}</pre>
                </div>
                <div className="bg-fynnd-900/30 border border-fynnd-500/20 rounded-xl p-4 text-sm text-fynnd-300">
                  <p className="font-semibold mb-1">💡 Tips for using this CV:</p>
                  <ul className="space-y-1 text-fynnd-400">
                    <li>• Copy and paste into a plain Word document or Google Doc</li>
                    <li>• Avoid tables, columns, or graphics — ATS can't read them</li>
                    <li>• Save as PDF only after final formatting</li>
                    <li>• Customize for each job application</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
