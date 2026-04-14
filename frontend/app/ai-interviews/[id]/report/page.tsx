'use client';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import Link from 'next/link';
import { ArrowLeft, Bot, Star, AlertTriangle, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold">{score}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

const recoConfig: Record<string, { label: string; color: string; icon: any }> = {
  strong_hire: { label: 'Strong Hire', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  hire:        { label: 'Hire',        color: 'bg-blue-50 text-blue-700 border-blue-200',         icon: CheckCircle },
  maybe:       { label: 'Maybe',       color: 'bg-yellow-50 text-yellow-700 border-yellow-200',   icon: TrendingUp },
  no_hire:     { label: 'No Hire',     color: 'bg-red-50 text-red-700 border-red-200',            icon: XCircle },
};

export default function AIInterviewReportPage() {
  const { id } = useParams();

  const { data: interview, isLoading } = useQuery({
    queryKey: ['ai-interview-report', id],
    queryFn: () => api.get(`/ai-interviews/${id}/report`).then(r => r.data),
  });

  if (isLoading) return (
    <Layout>
      <div className="space-y-4 max-w-3xl mx-auto">
        {[...Array(4)].map((_, i) => <div key={i} className="card h-32 animate-pulse bg-gray-50" />)}
      </div>
    </Layout>
  );

  const report = interview?.report;
  const reco = recoConfig[report?.recommendation] || recoConfig.maybe;
  const RecoIcon = reco.icon;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-4">
          <Link href="/ai-interviews" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <ArrowLeft size={14} /> Back to AI Interviews
          </Link>
        </div>

        {/* Header */}
        <div className="card mb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center">
                <Bot size={28} className="text-violet-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{interview?.candidateId?.name || interview?.candidateName}</h1>
                <p className="text-gray-500">{interview?.jobTitle}</p>
                <p className="text-xs text-gray-400 mt-0.5">Completed {formatDateTime(interview?.completedAt)} · {interview?.duration}min</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-fynnd-600">{report?.overallScore}%</p>
              <p className="text-sm text-gray-400">Overall Score</p>
            </div>
          </div>

          {report?.recommendation && (
            <div className={cn('mt-4 flex items-center gap-3 px-4 py-3 rounded-xl border', reco.color)}>
              <RecoIcon size={20} />
              <div>
                <p className="font-semibold">{reco.label}</p>
                <p className="text-sm opacity-80">{report.hiringNotes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Score breakdown */}
        {report && (
          <div className="card mb-5">
            <h2 className="section-title">Score Breakdown</h2>
            <div className="space-y-3">
              <ScoreBar label="Technical Knowledge" score={report.technicalScore} />
              <ScoreBar label="Communication" score={report.communicationScore} />
              <ScoreBar label="Problem Solving" score={report.problemSolvingScore} />
              <ScoreBar label="Confidence" score={report.confidenceScore} />
            </div>
          </div>
        )}

        {/* Summary */}
        {report?.summary && (
          <div className="card mb-5">
            <h2 className="section-title">AI Summary</h2>
            <p className="text-gray-700 leading-relaxed">{report.summary}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
          {/* Strengths */}
          {report?.strengths?.length > 0 && (
            <div className="card">
              <h2 className="section-title text-emerald-700">Strengths</h2>
              <ul className="space-y-2">
                {report.strengths.map((s: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />{s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Weaknesses */}
          {report?.weaknesses?.length > 0 && (
            <div className="card">
              <h2 className="section-title text-red-600">Areas to Improve</h2>
              <ul className="space-y-2">
                {report.weaknesses.map((w: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <XCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />{w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Detailed feedback */}
        {report?.detailedFeedback && (
          <div className="card mb-5">
            <h2 className="section-title">Detailed Feedback</h2>
            <p className="text-gray-700 leading-relaxed text-sm">{report.detailedFeedback}</p>
          </div>
        )}

        {/* Red flags */}
        {report?.redFlags?.length > 0 && (
          <div className="card mb-5 border-orange-100 bg-orange-50/50">
            <h2 className="section-title text-orange-700 flex items-center gap-2"><AlertTriangle size={16} /> Red Flags</h2>
            <ul className="space-y-1">
              {report.redFlags.map((f: string, i: number) => (
                <li key={i} className="text-sm text-orange-700">• {f}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Monitoring */}
        {interview?.monitoring && (interview.monitoring.tabSwitches > 0 || interview.monitoring.copyPasteCount > 0) && (
          <div className="card border-yellow-100 bg-yellow-50/50">
            <h2 className="section-title text-yellow-700">Monitoring Report</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-500">Tab Switches</p><p className="font-bold text-lg">{interview.monitoring.tabSwitches}</p></div>
              <div><p className="text-gray-500">Copy/Paste Events</p><p className="font-bold text-lg">{interview.monitoring.copyPasteCount}</p></div>
            </div>
          </div>
        )}

        {/* Transcript */}
        {interview?.messages?.length > 0 && (
          <div className="card mt-5">
            <h2 className="section-title">Interview Transcript</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {interview.messages.map((m: any, i: number) => (
                <div key={i} className={cn('flex gap-3', m.role === 'candidate' ? 'flex-row-reverse' : '')}>
                  <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                    m.role === 'ai' ? 'bg-violet-100 text-violet-700' : 'bg-fynnd-100 text-fynnd-700')}>
                    {m.role === 'ai' ? 'AI' : 'C'}
                  </div>
                  <div className={cn('max-w-[80%] px-4 py-2.5 rounded-2xl text-sm',
                    m.role === 'ai' ? 'bg-gray-100 text-gray-800' : 'bg-fynnd-600 text-white',
                    m.flagged ? 'ring-2 ring-orange-300' : '')}>
                    {m.content}
                    {m.flagged && <p className="text-xs mt-1 opacity-70">⚠ Flagged: {m.flags?.join(', ')}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
