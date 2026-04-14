'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { Upload, CheckCircle, AlertCircle, FileText, Zap, ArrowRight } from 'lucide-react';
import { formatLPA } from '@/lib/utils';

export default function UploadResumePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === 'application/pdf') setFile(f);
    else setError('Only PDF files are supported');
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');
    setError('');
    const formData = new FormData();
    formData.append('resume', file);
    try {
      const { data } = await api.post('/candidates/upload-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
      setStatus('success');
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError(`Candidate already exists: ${err.response.data.existing?.name}`);
      } else {
        setError(err.response?.data?.message || 'Upload failed');
      }
      setStatus('error');
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-fynnd-100 rounded-xl flex items-center justify-center">
            <Zap size={20} className="text-fynnd-600" />
          </div>
          <div>
            <h1 className="page-title">AI Resume Parser</h1>
            <p className="text-sm text-gray-500">Upload a PDF — AI extracts all candidate data instantly</p>
          </div>
        </div>

        <div className="card mb-5">
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-all ${
              dragging ? 'border-fynnd-400 bg-fynnd-50' : file ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 hover:border-fynnd-300 hover:bg-fynnd-50/50'
            }`}
          >
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileText size={32} className="text-emerald-500" />
                <p className="font-medium text-gray-800">{file.name}</p>
                <p className="text-sm text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
                <button onClick={() => setFile(null)} className="text-xs text-red-500 hover:text-red-600">Remove</button>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center gap-3">
                <Upload size={32} className="text-gray-300" />
                <div>
                  <p className="font-medium text-gray-600">Drop PDF here or click to browse</p>
                  <p className="text-sm text-gray-400 mt-1">Max 10MB · PDF only</p>
                </div>
                <input type="file" accept=".pdf" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
              </label>
            )}
          </div>

          <button onClick={handleUpload} disabled={!file || status === 'uploading'} className="btn-primary w-full mt-4 py-3">
            {status === 'uploading' ? (
              <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Parsing with AI...</span>
            ) : (
              <span className="flex items-center gap-2"><Zap size={16} /> Parse Resume with AI</span>
            )}
          </button>
        </div>

        {status === 'error' && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl mb-4">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {status === 'success' && result && (
          <div className="card">
            <div className="flex items-center gap-2 text-emerald-600 mb-5">
              <CheckCircle size={20} />
              <span className="font-semibold">Candidate profile created successfully</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-5">
              {[
                ['Name', result.name],
                ['Email', result.email],
                ['Phone', result.phone],
                ['Location', result.city || result.location],
                ['Current Role', result.currentRole],
                ['Company', result.currentCompany],
                ['Experience', result.experienceYears ? `${result.experienceYears} years` : '—'],
                ['Notice Period', result.noticePeriod],
                ['Current CTC', formatLPA(result.currentSalary)],
                ['Expected CTC', formatLPA(result.expectedSalary)],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-gray-400 text-xs mb-0.5">{label}</p>
                  <p className="font-medium text-gray-800">{val || '—'}</p>
                </div>
              ))}
            </div>

            {result.skills?.length > 0 && (
              <div className="mb-5">
                <p className="text-xs text-gray-400 mb-2">Skills extracted</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.skills.map((s: string) => <span key={s} className="badge badge-blue">{s}</span>)}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => router.push(`/candidates/${result._id}`)} className="btn-primary flex items-center gap-2">
                View Profile <ArrowRight size={15} />
              </button>
              <button onClick={() => { setFile(null); setStatus('idle'); setResult(null); }} className="btn-secondary">
                Parse Another
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
