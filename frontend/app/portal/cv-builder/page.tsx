'use client';
import { useState, useRef } from 'react';
import api from '@/lib/api';
import { Zap, ChevronRight, ChevronLeft, Download, FileText, Eye, Check, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import CVPreview from '@/components/cv/CVPreview';
import { CVData, TEMPLATES } from '@/components/cv/cvTypes';

const STEPS = ['Template', 'Personal Info', 'Experience', 'Education & Skills', 'Preview & Download'];

const emptyCV: CVData = {
  template: 'modern',
  personal: { name: '', email: '', phone: '', city: '', linkedin: '', github: '', website: '', summary: '' },
  experience: [],
  education: [],
  skills: [],
  certifications: [],
  languages: [],
  jobTitle: '',
  jobDescription: '',
};

export default function CVBuilderPage() {
  const [step, setStep] = useState(0);
  const [cv, setCV] = useState<CVData>(emptyCV);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState<'pdf' | 'word' | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const setPersonal = (k: string, v: string) => setCV(c => ({ ...c, personal: { ...c.personal, [k]: v } }));

  const addExp = () => setCV(c => ({ ...c, experience: [...c.experience, { company: '', role: '', startDate: '', endDate: '', current: false, description: '', achievements: [] }] }));
  const updateExp = (i: number, k: string, v: any) => setCV(c => { const e = [...c.experience]; e[i] = { ...e[i], [k]: v }; return { ...c, experience: e }; });
  const removeExp = (i: number) => setCV(c => ({ ...c, experience: c.experience.filter((_, idx) => idx !== i) }));

  const addEdu = () => setCV(c => ({ ...c, education: [...c.education, { degree: '', institution: '', year: '', grade: '' }] }));
  const updateEdu = (i: number, k: string, v: string) => setCV(c => { const e = [...c.education]; e[i] = { ...e[i], [k]: v }; return { ...c, education: e }; });
  const removeEdu = (i: number) => setCV(c => ({ ...c, education: c.education.filter((_, idx) => idx !== i) }));

  const generateWithAI = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/ats/optimize-cv', {
        candidateProfile: {
          name: cv.personal.name,
          email: cv.personal.email,
          currentRole: cv.experience[0]?.role || '',
          skills: cv.skills.join(', '),
          experience: cv.experience.map(e => `${e.role} at ${e.company}: ${e.description}`).join('\n'),
          education: cv.education.map(e => `${e.degree} from ${e.institution}`).join(', '),
        },
        jobTitle: cv.jobTitle,
        jobDescription: cv.jobDescription,
      });
      // Parse AI suggestions into summary
      const lines = res.data.optimizedCV?.split('\n') || [];
      const summaryLine = lines.find((l: string) => l.toLowerCase().includes('summary') || l.length > 100);
      if (summaryLine) setPersonal('summary', summaryLine.replace(/^(summary|profile|objective):?\s*/i, '').trim());
    } catch {}
    setGenerating(false);
  };

  const downloadPDF = async () => {
    setDownloading('pdf');
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      const el = previewRef.current;
      if (!el) return;
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, w, h);
      pdf.save(`${cv.personal.name || 'CV'}_Resume.pdf`);
    } catch (e) { console.error(e); }
    setDownloading(null);
  };

  const downloadWord = async () => {
    setDownloading('word');
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = await import('docx');
      const { saveAs } = await import('file-saver');

      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({ text: cv.personal.name, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [
              new TextRun({ text: [cv.personal.email, cv.personal.phone, cv.personal.city].filter(Boolean).join(' | '), size: 20 }),
            ]}),
            ...(cv.personal.summary ? [
              new Paragraph({ text: 'PROFESSIONAL SUMMARY', heading: HeadingLevel.HEADING_2 }),
              new Paragraph({ text: cv.personal.summary }),
            ] : []),
            ...(cv.skills.length > 0 ? [
              new Paragraph({ text: 'SKILLS', heading: HeadingLevel.HEADING_2 }),
              new Paragraph({ text: cv.skills.join(' • ') }),
            ] : []),
            ...(cv.experience.length > 0 ? [
              new Paragraph({ text: 'WORK EXPERIENCE', heading: HeadingLevel.HEADING_2 }),
              ...cv.experience.flatMap(e => [
                new Paragraph({ children: [new TextRun({ text: e.role, bold: true }), new TextRun({ text: ` | ${e.company}` })] }),
                new Paragraph({ children: [new TextRun({ text: `${e.startDate} – ${e.current ? 'Present' : e.endDate}`, italics: true, size: 18 })] }),
                new Paragraph({ text: e.description }),
              ]),
            ] : []),
            ...(cv.education.length > 0 ? [
              new Paragraph({ text: 'EDUCATION', heading: HeadingLevel.HEADING_2 }),
              ...cv.education.map(e => new Paragraph({ children: [
                new TextRun({ text: e.degree, bold: true }),
                new TextRun({ text: ` | ${e.institution} | ${e.year}` }),
              ]})),
            ] : []),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${cv.personal.name || 'CV'}_Resume.docx`);
    } catch (e) { console.error(e); }
    setDownloading(null);
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
            <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-none">AI CV Builder</p>
          </div>
        </div>
        <a href="/portal" className="text-sm text-gray-500 hover:text-white">← Back to Portal</a>
      </nav>

      {/* Steps */}
      <div className="border-b border-white/5 px-6 py-3">
        <div className="flex items-center gap-1 max-w-4xl mx-auto overflow-x-auto">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => i < step && setStep(i)}
                className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all',
                  i === step ? 'bg-fynnd-600 text-white' :
                  i < step ? 'text-emerald-400 hover:bg-white/5 cursor-pointer' :
                  'text-gray-600 cursor-default')}>
                {i < step ? <Check size={13} /> : <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">{i + 1}</span>}
                <span className="hidden sm:inline">{s}</span>
              </button>
              {i < STEPS.length - 1 && <ChevronRight size={14} className="text-gray-700 flex-shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* STEP 0: Template */}
        {step === 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Choose a Template</h2>
            <p className="text-gray-400 mb-6">All templates are ATS-friendly and professionally designed</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {TEMPLATES.map(t => (
                <button key={t.id} onClick={() => setCV(c => ({ ...c, template: t.id }))}
                  className={cn('relative rounded-2xl overflow-hidden border-2 transition-all group',
                    cv.template === t.id ? 'border-fynnd-500 shadow-lg shadow-fynnd-500/20' : 'border-white/10 hover:border-white/30')}>
                  <div className={cn('h-48 flex flex-col p-3 text-left', t.previewBg)}>
                    <div className={cn('h-3 w-24 rounded mb-1', t.accentColor)} />
                    <div className="h-1.5 w-16 bg-white/20 rounded mb-3" />
                    <div className="space-y-1">
                      <div className="h-1 bg-white/10 rounded w-full" />
                      <div className="h-1 bg-white/10 rounded w-4/5" />
                      <div className="h-1 bg-white/10 rounded w-3/5" />
                    </div>
                    <div className={cn('mt-2 h-1.5 w-12 rounded', t.accentColor)} />
                    <div className="mt-1 space-y-1">
                      <div className="h-1 bg-white/10 rounded w-full" />
                      <div className="h-1 bg-white/10 rounded w-3/4" />
                    </div>
                  </div>
                  <div className="p-3 bg-gray-900">
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.description}</p>
                  </div>
                  {cv.template === t.id && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-fynnd-500 rounded-full flex items-center justify-center">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 mb-6">
              <h3 className="font-semibold mb-3">Target Job (for AI optimization)</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label text-gray-400">Job Title</label>
                  <input className="input bg-white/5 border-white/10 text-white placeholder:text-gray-600" placeholder="e.g. Senior Software Engineer" value={cv.jobTitle} onChange={e => setCV(c => ({ ...c, jobTitle: e.target.value }))} /></div>
                <div><label className="label text-gray-400">Job Description (optional)</label>
                  <textarea className="input bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-20 resize-none" placeholder="Paste JD for AI to tailor your CV..." value={cv.jobDescription} onChange={e => setCV(c => ({ ...c, jobDescription: e.target.value }))} /></div>
              </div>
            </div>
            <button onClick={() => setStep(1)} className="btn-primary px-8 py-3">Next: Personal Info <ChevronRight size={16} /></button>
          </div>
        )}

        {/* STEP 1: Personal Info */}
        {step === 1 && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold mb-6">Personal Information</h2>
            <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label text-gray-400">Full Name *</label><input className="input bg-white/5 border-white/10 text-white placeholder:text-gray-600" value={cv.personal.name} onChange={e => setPersonal('name', e.target.value)} placeholder="Rahul Sharma" /></div>
                <div><label className="label text-gray-400">Email *</label><input className="input bg-white/5 border-white/10 text-white placeholder:text-gray-600" type="email" value={cv.personal.email} onChange={e => setPersonal('email', e.target.value)} placeholder="rahul@email.com" /></div>
                <div><label className="label text-gray-400">Phone</label><input className="input bg-white/5 border-white/10 text-white placeholder:text-gray-600" value={cv.personal.phone} onChange={e => setPersonal('phone', e.target.value)} placeholder="+91 98765 43210" /></div>
                <div><label className="label text-gray-400">City</label><input className="input bg-white/5 border-white/10 text-white placeholder:text-gray-600" value={cv.personal.city} onChange={e => setPersonal('city', e.target.value)} placeholder="Bengaluru, Karnataka" /></div>
                <div><label className="label text-gray-400">LinkedIn</label><input className="input bg-white/5 border-white/10 text-white placeholder:text-gray-600" value={cv.personal.linkedin} onChange={e => setPersonal('linkedin', e.target.value)} placeholder="linkedin.com/in/rahul" /></div>
                <div><label className="label text-gray-400">GitHub / Portfolio</label><input className="input bg-white/5 border-white/10 text-white placeholder:text-gray-600" value={cv.personal.github} onChange={e => setPersonal('github', e.target.value)} placeholder="github.com/rahul" /></div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label text-gray-400 mb-0">Professional Summary</label>
                  <button onClick={generateWithAI} disabled={generating} className="text-xs text-fynnd-400 hover:text-fynnd-300 flex items-center gap-1">
                    <Zap size={12} /> {generating ? 'Generating...' : 'AI Generate'}
                  </button>
                </div>
                <textarea className="input bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-28 resize-none" value={cv.personal.summary} onChange={e => setPersonal('summary', e.target.value)} placeholder="Write a compelling 3-4 sentence summary or click AI Generate..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(0)} className="btn-secondary bg-white/5 border-white/10 text-white hover:bg-white/10"><ChevronLeft size={16} /> Back</button>
              <button onClick={() => setStep(2)} className="btn-primary px-8">Next: Experience <ChevronRight size={16} /></button>
            </div>
          </div>
        )}

        {/* STEP 2: Experience */}
        {step === 2 && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold mb-6">Work Experience</h2>
            <div className="space-y-4 mb-4">
              {cv.experience.map((exp, i) => (
                <div key={i} className="bg-gray-900 border border-white/10 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-semibold text-sm text-gray-300">Experience {i + 1}</p>
                    <button onClick={() => removeExp(i)} className="text-gray-600 hover:text-red-400"><Trash2 size={15} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="label text-gray-400">Job Title *</label><input className="input bg-white/5 border-white/10 text-white placeholder:text-gray-600" value={exp.role} onChange={e => updateExp(i, 'role', e.target.value)} placeholder="Senior Software Engineer" /></div>
                    <div><label className="label text-gray-400">Company *</label><input className="input bg-white/5 border-white/10 text-white placeholder:text-gray-600" value={exp.company} onChange={e => updateExp(i, 'company', e.target.value)} placeholder="Infosys" /></div>
                    <div><label className="label text-gray-400">Start Date</label><input className="input bg-white/5 border-white/10 text-white placeholder:text-gray-600" value={exp.startDate} onChange={e => updateExp(i, 'startDate', e.target.value)} placeholder="Jan 2021" /></div>
                    <div>
                      <label className="label text-gray-400">End Date</label>
                      <input className="input bg-white/5 border-white/10 text-white placeholder:text-gray-600" value={exp.endDate} onChange={e => updateExp(i, 'endDate', e.target.value)} placeholder="Dec 2023" disabled={exp.current} />
                      <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
                        <input type="checkbox" checked={exp.current} onChange={e => updateExp(i, 'current', e.target.checked)} className="accent-fynnd-500" />
                        <span className="text-xs text-gray-400">Currently working here</span>
                      </label>
                    </div>
                  </div>
                  <div className="mt-3"><label className="label text-gray-400">Description & Achievements</label>
                    <textarea className="input bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-24 resize-none" value={exp.description} onChange={e => updateExp(i, 'description', e.target.value)} placeholder="• Led development of payment gateway handling ₹50Cr/month transactions&#10;• Reduced API response time by 40% through caching&#10;• Mentored team of 5 junior developers" /></div>
                </div>
              ))}
            </div>
            <button onClick={addExp} className="w-full border-2 border-dashed border-white/10 rounded-2xl py-4 text-gray-400 hover:border-fynnd-500 hover:text-fynnd-400 transition-all flex items-center justify-center gap-2">
              <Plus size={16} /> Add Work Experience
            </button>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(1)} className="btn-secondary bg-white/5 border-white/10 text-white hover:bg-white/10"><ChevronLeft size={16} /> Back</button>
              <button onClick={() => setStep(3)} className="btn-primary px-8">Next: Education & Skills <ChevronRight size={16} /></button>
            </div>
          </div>
        )}

        {/* STEP 3: Education & Skills */}
        {step === 3 && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold mb-6">Education & Skills</h2>

            <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 mb-4">
              <h3 className="font-semibold mb-4">Education</h3>
              <div className="space-y-3 mb-3">
                {cv.education.map((edu, i) => (
                  <div key={i} className="grid grid-cols-2 gap-3 relative">
                    <input className="input bg-white/5 border-white/10 text-white placeholder:text-gray-600" value={edu.degree} onChange={e => updateEdu(i, 'degree', e.target.value)} placeholder="B.Tech Computer Science" />
                    <input className="input bg-white/5 border-white/10 text-white placeholder:text-gray-600" value={edu.institution} onChange={e => updateEdu(i, 'institution', e.target.value)} placeholder="NIT Trichy" />
                    <input className="input bg-white/5 border-white/10 text-white placeholder:text-gray-600" value={edu.year} onChange={e => updateEdu(i, 'year', e.target.value)} placeholder="2019" />
                    <div className="flex gap-2">
                      <input className="input bg-white/5 border-white/10 text-white placeholder:text-gray-600 flex-1" value={edu.grade} onChange={e => updateEdu(i, 'grade', e.target.value)} placeholder="8.5 CGPA / 85%" />
                      <button onClick={() => removeEdu(i)} className="text-gray-600 hover:text-red-400 px-2"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={addEdu} className="text-sm text-fynnd-400 hover:text-fynnd-300 flex items-center gap-1"><Plus size={14} /> Add Education</button>
            </div>

            <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 mb-4">
              <h3 className="font-semibold mb-3">Skills</h3>
              <input className="input bg-white/5 border-white/10 text-white placeholder:text-gray-600" placeholder="React, Node.js, TypeScript, AWS, MongoDB, Docker (comma separated)" value={cv.skills.join(', ')} onChange={e => setCV(c => ({ ...c, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} />
              {cv.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {cv.skills.map((s, i) => (
                    <span key={i} className="flex items-center gap-1 bg-fynnd-900/50 border border-fynnd-500/30 text-fynnd-300 text-xs px-2.5 py-1 rounded-full">
                      {s}
                      <button onClick={() => setCV(c => ({ ...c, skills: c.skills.filter((_, idx) => idx !== i) }))} className="hover:text-red-400"><Trash2 size={10} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 mb-4">
              <h3 className="font-semibold mb-3">Languages</h3>
              <input className="input bg-white/5 border-white/10 text-white placeholder:text-gray-600" placeholder="Hindi (Native), English (Fluent), Tamil (Conversational)" value={cv.languages.join(', ')} onChange={e => setCV(c => ({ ...c, languages: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} />
            </div>

            <div className="bg-gray-900 border border-white/10 rounded-2xl p-5">
              <h3 className="font-semibold mb-3">Certifications (optional)</h3>
              <input className="input bg-white/5 border-white/10 text-white placeholder:text-gray-600" placeholder="AWS Solutions Architect, Google Cloud Professional, PMP" value={cv.certifications.join(', ')} onChange={e => setCV(c => ({ ...c, certifications: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} />
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(2)} className="btn-secondary bg-white/5 border-white/10 text-white hover:bg-white/10"><ChevronLeft size={16} /> Back</button>
              <button onClick={() => setStep(4)} className="btn-primary px-8">Preview CV <Eye size={16} /></button>
            </div>
          </div>
        )}

        {/* STEP 4: Preview & Download */}
        {step === 4 && (
          <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h2 className="text-2xl font-bold">Your CV is Ready!</h2>
                <p className="text-gray-400 text-sm">Review and download in your preferred format</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(3)} className="btn-secondary bg-white/5 border-white/10 text-white hover:bg-white/10 text-sm"><ChevronLeft size={14} /> Edit</button>
                <button onClick={downloadWord} disabled={downloading === 'word'} className="btn-secondary bg-white/5 border-white/10 text-white hover:bg-white/10 text-sm">
                  {downloading === 'word' ? 'Generating...' : <><FileText size={14} /> Download Word</>}
                </button>
                <button onClick={downloadPDF} disabled={downloading === 'pdf'} className="btn-primary text-sm">
                  {downloading === 'pdf' ? 'Generating...' : <><Download size={14} /> Download PDF</>}
                </button>
              </div>
            </div>

            {/* Template switcher */}
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
              {TEMPLATES.map(t => (
                <button key={t.id} onClick={() => setCV(c => ({ ...c, template: t.id }))}
                  className={cn('px-3 py-1.5 rounded-lg text-sm font-medium flex-shrink-0 transition-all',
                    cv.template === t.id ? 'bg-fynnd-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10')}>
                  {t.name}
                </button>
              ))}
            </div>

            {/* CV Preview */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl" ref={previewRef}>
              <CVPreview cv={cv} />
            </div>

            <div className="mt-6 bg-gray-900 border border-white/10 rounded-xl p-4 text-sm text-gray-400">
              <p className="font-semibold text-white mb-1">💡 Tips for best results:</p>
              <ul className="space-y-1">
                <li>• PDF is best for email applications and portals</li>
                <li>• Word (.docx) is best when the employer asks for an editable file</li>
                <li>• This CV is ATS-optimized — no tables or graphics that confuse scanners</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
