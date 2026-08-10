'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { Bot, Send, Zap, CheckCircle, AlertTriangle, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

type Message = {
  role: 'ai' | 'candidate';
  content: string;
  flagged?: boolean;
  score?: number;
  feedback?: string;
};

export default function InterviewRoomPage() {
  const { token } = useParams();
  const [stage, setStage] = useState<'loading' | 'intro' | 'active' | 'complete' | 'error'>('loading');
  const [interview, setInterview] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [answer, setAnswer] = useState('');
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ answered: 0, total: 5 });
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [error, setError] = useState('');
  const [scores, setScores] = useState<number[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const interviewId = useRef<string>('');

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, sending]);

  // Load interview on mount
  useEffect(() => {
    if (!token) return;
    api.get(`/ai-interviews/join/${token}`)
      .then(r => {
        setInterview(r.data);
        interviewId.current = r.data.id;
        setMessages(r.data.messages || []);
        setProgress(p => ({ ...p, total: r.data.totalQuestions || 5 }));
        setStage('intro');
      })
      .catch(() => { setError('Interview not found or link has expired.'); setStage('error'); });
  }, [token]);

  // Monitor tab switches
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && stage === 'active' && interviewId.current) {
        api.post(`/ai-interviews/${interviewId.current}/monitor`, { token, event: 'tab_switch' }).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [stage, token]);

  const startInterview = async () => {
    if (!candidateName.trim()) return;
    try {
      const res = await api.post(`/ai-interviews/${interviewId.current}/start`, {
        token, candidateName: candidateName.trim(), candidateEmail,
      });
      setMessages(res.data.messages || []);
      setStage('active');
      setTimeout(() => textareaRef.current?.focus(), 100);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start interview. Please try again.');
    }
  };

  const handlePaste = () => {
    if (stage === 'active' && interviewId.current) {
      api.post(`/ai-interviews/${interviewId.current}/monitor`, { token, event: 'copy_paste' }).catch(() => {});
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim() || sending) return;
    if (answer.trim().length < 5) return;
    const myAnswer = answer.trim();
    setAnswer('');
    setSending(true);

    // Optimistically add candidate message
    setMessages(prev => [...prev, { role: 'candidate', content: myAnswer }]);

    try {
      const { data } = await api.post(`/ai-interviews/${interviewId.current}/answer`, {
        token, answer: myAnswer,
      });

      // Record score
      if (data.evaluation?.score !== undefined) {
        setScores(prev => [...prev, Number(data.evaluation.score)]);
      }

      // Add AI response
      setMessages(prev => [...prev, {
        role: 'ai',
        content: data.nextMessage,
        score: data.evaluation?.score,
        feedback: data.evaluation?.feedback,
      }]);

      setProgress({ answered: data.answeredCount, total: data.totalQuestions });

      if (data.isComplete) {
        setTimeout(() => setStage('complete'), 1500); // small delay so candidate reads closing message
      }
    } catch (err: any) {
      // Roll back the optimistic message on error
      setMessages(prev => prev.slice(0, -1));
      setAnswer(myAnswer); // restore answer so they can retry
      setMessages(prev => [...prev, {
        role: 'ai',
        content: err.response?.data?.message || 'Sorry, there was an issue processing your answer. Please try again.',
      }]);
    } finally {
      setSending(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitAnswer(); }
  };

  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) : 0;

  // ── LOADING ──
  if (stage === 'loading') return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="w-12 h-12 border-2 border-fynnd-400 border-t-fynnd-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading your interview...</p>
      </div>
    </div>
  );

  // ── ERROR ──
  if (stage === 'error') return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="text-center text-white max-w-md">
        <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={32} className="text-red-400" />
        </div>
        <h1 className="text-xl font-bold mb-2">Interview Not Found</h1>
        <p className="text-gray-400">{error}</p>
      </div>
    </div>
  );

  // ── COMPLETE ──
  if (stage === 'complete') return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="text-center text-white max-w-md">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Interview Complete!</h1>
        <p className="text-gray-400 mb-6">
          Great job, {candidateName}! Your responses have been recorded and an AI report is being generated.
        </p>

        {/* Score summary */}
        {scores.length > 0 && (
          <div className="bg-white/5 rounded-2xl p-5 mb-6 text-left">
            <p className="text-sm font-semibold text-gray-300 mb-3">Your Performance Summary</p>
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">Average Score</span>
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={14} className={s <= Math.round(avgScore/20) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />
                  ))}
                </div>
                <span className="font-bold text-white">{avgScore}/100</span>
              </div>
            </div>
            <div className="h-2 bg-gray-700 rounded-full">
              <div className={cn('h-2 rounded-full', avgScore >= 70 ? 'bg-emerald-500' : avgScore >= 50 ? 'bg-yellow-400' : 'bg-red-400')}
                style={{ width: `${avgScore}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {scores.map((s, i) => (
                <div key={i} className="text-center bg-white/5 rounded-lg p-2">
                  <p className="text-xs text-gray-400">Q{i+1}</p>
                  <p className={cn('font-bold text-sm', s >= 7 ? 'text-emerald-400' : s >= 5 ? 'text-yellow-400' : 'text-red-400')}>{s}/10</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white/5 rounded-2xl p-5 text-left mb-6">
          <p className="text-sm text-gray-400 mb-3">What happens next:</p>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-center gap-2"><Zap size={14} className="text-fynnd-400" /> AI generates your full interview report</li>
            <li className="flex items-center gap-2"><Zap size={14} className="text-fynnd-400" /> Recruiter reviews your score & detailed feedback</li>
            <li className="flex items-center gap-2"><Zap size={14} className="text-fynnd-400" /> You'll be contacted within 2-3 business days</li>
          </ul>
        </div>
        <p className="text-xs text-gray-600">Powered by Fynnd AI · Staffinger Solutions, Noida</p>
      </div>
    </div>
  );

  // ── INTRO ──
  if (stage === 'intro') return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-md border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-fynnd-600 rounded-xl flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-lg">fynnd</p>
            <p className="text-xs text-gray-500">AI Interview · Staffinger Solutions, Noida</p>
          </div>
        </div>

        <h1 className="text-xl font-bold text-white mb-1">AI Interview Invitation</h1>
        <p className="text-gray-400 text-sm mb-1">Position: <span className="text-white font-medium">{interview?.jobTitle}</span></p>
        <p className="text-gray-500 text-xs mb-6">{progress.total} questions · AI-monitored · Report generated on completion</p>

        <div className="bg-white/5 rounded-xl p-4 mb-5 text-sm text-gray-400 space-y-1.5">
          <p>✅ AI will ask you {progress.total} role-specific questions</p>
          <p>✅ Type your answer and press Enter to submit</p>
          <p>✅ Each answer is scored 1-10 by AI in real time</p>
          <p>✅ Full report with strengths & weaknesses generated</p>
          <p>⚠️ Tab switches and copy-paste are monitored</p>
        </div>

        <div className="space-y-3 mb-5">
          <div>
            <label className="label text-gray-300 text-sm">Your Full Name *</label>
            <input className="input bg-white/5 border-white/10 text-white placeholder:text-gray-600"
              placeholder="Enter your full name"
              value={candidateName}
              onChange={e => setCandidateName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && startInterview()} />
          </div>
          <div>
            <label className="label text-gray-300 text-sm">Email (optional)</label>
            <input className="input bg-white/5 border-white/10 text-white placeholder:text-gray-600"
              placeholder="your@email.com" type="email"
              value={candidateEmail}
              onChange={e => setCandidateEmail(e.target.value)} />
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

        <button onClick={startInterview} disabled={!candidateName.trim()}
          className="btn-primary w-full py-3 text-base">
          Start Interview →
        </button>
      </div>
    </div>
  );

  // ── ACTIVE INTERVIEW ──
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-white/5 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-fynnd-600 rounded-lg flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">fynnd AI Interview</p>
            <p className="text-gray-500 text-xs truncate max-w-[150px]">{interview?.jobTitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {scores.length > 0 && (
            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-400">Avg Score</p>
              <p className={cn('text-sm font-bold', avgScore >= 70 ? 'text-emerald-400' : avgScore >= 50 ? 'text-yellow-400' : 'text-red-400')}>
                {avgScore}/100
              </p>
            </div>
          )}
          <div className="text-right">
            <p className="text-xs text-gray-400">Progress</p>
            <p className="text-sm font-semibold text-white">{progress.answered}/{progress.total}</p>
          </div>
          <div className="w-16 h-1.5 bg-gray-700 rounded-full">
            <div className="h-1.5 bg-fynnd-500 rounded-full transition-all"
              style={{ width: `${progress.total > 0 ? (progress.answered / progress.total) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-3xl mx-auto w-full">
        {messages.map((m, i) => (
          <div key={i} className={cn('flex gap-3', m.role === 'candidate' ? 'flex-row-reverse' : '')}>
            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1',
              m.role === 'ai' ? 'bg-violet-600' : 'bg-fynnd-600')}>
              {m.role === 'ai' ? <Bot size={14} className="text-white" /> : (candidateName[0]?.toUpperCase() || 'C')}
            </div>
            <div className="max-w-[80%] space-y-1">
              <div className={cn('px-4 py-3 rounded-2xl text-sm leading-relaxed',
                m.role === 'ai' ? 'bg-gray-800 text-gray-100' : 'bg-fynnd-600 text-white')}
                dangerouslySetInnerHTML={{
                  __html: m.content
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br/>')
                }} />
              {/* Show score badge on AI messages that follow an answer */}
              {m.role === 'ai' && m.score !== undefined && (
                <div className="flex items-center gap-2 px-1">
                  <div className={cn('flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium',
                    m.score >= 7 ? 'bg-emerald-900/50 text-emerald-400' :
                    m.score >= 5 ? 'bg-yellow-900/50 text-yellow-400' :
                    'bg-red-900/50 text-red-400')}>
                    <Star size={10} className="fill-current" />
                    Score: {m.score}/10
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {sending && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-gray-800 px-4 py-3 rounded-2xl flex items-center gap-1.5">
              {[0, 150, 300].map(delay => (
                <span key={delay} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${delay}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-gray-900 border-t border-white/5 p-4 flex-shrink-0">
        <div className="flex gap-3 max-w-3xl mx-auto">
          <textarea
            ref={textareaRef}
            className="flex-1 bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-fynnd-500 resize-none"
            placeholder="Type your answer here... (Enter to send · Shift+Enter for new line)"
            rows={3}
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={sending}
          />
          <button onClick={submitAnswer} disabled={!answer.trim() || sending}
            className="btn-primary px-4 self-end disabled:opacity-40">
            <Send size={16} />
          </button>
        </div>
        <p className="text-center text-xs text-gray-600 mt-2">
          AI-monitored · Staffinger Solutions, Noida
        </p>
      </div>
    </div>
  );
}
