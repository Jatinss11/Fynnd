const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const AIInterview = require('../models/AIInterview');
const Job = require('../models/Job');
const Candidate = require('../models/Candidate');
const { auth, requireRole } = require('../middleware/auth');
const { generateInterviewQuestions, evaluateAnswer, generateInterviewReport } = require('../services/aiService');
const { isValidObjectId } = require('../middleware/validate');

const answerLimiter = rateLimit({
  windowMs: 60 * 1000, max: 30,
  keyGenerator: (req) => req.params.id + req.ip,
});

// GET /api/ai-interviews
router.get('/', auth, async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'client') filter.clientId = req.user._id;
    const interviews = await AIInterview.find(filter)
      .populate('candidateId', 'name email')
      .populate('jobId', 'title company')
      .sort('-createdAt').limit(50);
    res.json(interviews);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch interviews' });
  }
});

// POST /api/ai-interviews — create
router.post('/', auth, requireRole('admin', 'recruiter'), async (req, res) => {
  try {
    const { candidateId, jobId, pipelineId, round } = req.body;
    if (!isValidObjectId(candidateId) || !isValidObjectId(jobId)) {
      return res.status(400).json({ message: 'Invalid candidateId or jobId' });
    }

    const [candidate, job] = await Promise.all([
      Candidate.findById(candidateId),
      Job.findById(jobId),
    ]);
    if (!candidate || !job) return res.status(404).json({ message: 'Candidate or Job not found' });

    // Generate questions
    let questions = [];
    let openingMessage = `Hello! I'm your AI interviewer for the ${job.title} position at ${job.company}. I'll be asking you ${5} questions. Let's begin!`;

    try {
      const qData = await generateInterviewQuestions(job.title, job.description, job.skills, round || 1);
      questions = qData.questions || [];
      if (qData.openingMessage) openingMessage = qData.openingMessage;
    } catch (err) {
      console.error('Question generation failed, using fallback:', err.message);
      questions = [
        { id: 1, question: 'Please introduce yourself and walk me through your professional background.', type: 'behavioural' },
        { id: 2, question: `What specific experience do you have with ${(job.skills || []).slice(0, 2).join(' and ')}?`, type: 'technical' },
        { id: 3, question: `Why are you interested in the ${job.title} role at ${job.company}?`, type: 'behavioural' },
        { id: 4, question: 'Describe a challenging technical problem you solved recently. What was your approach?', type: 'situational' },
        { id: 5, question: 'Where do you see yourself in the next 3 years, and how does this role fit into your career goals?', type: 'behavioural' },
      ];
    }

    const accessToken = uuidv4();
    const firstQuestion = questions[0]?.question || 'Tell me about yourself.';

    const interview = await AIInterview.create({
      candidateId,
      jobId,
      pipelineId: pipelineId || undefined,
      scheduledBy: req.user._id,
      jobTitle: job.title,
      jobDescription: job.description,
      accessToken,
      status: 'pending',
      // Store questions in messages as metadata
      messages: [{
        role: 'ai',
        content: `${openingMessage}\n\n**Question 1/${questions.length}:** ${firstQuestion}`,
      }],
      totalQuestions: questions.length,
      // Store all questions for sequential delivery
      _questionsCache: JSON.stringify(questions),
    });

    res.status(201).json({
      interview,
      accessToken,
      interviewLink: `${(process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim()}/interview/${accessToken}`,
    });
  } catch (err) {
    console.error('Create AI interview error:', err.message);
    res.status(500).json({ message: 'Failed to create interview' });
  }
});

// GET /api/ai-interviews/join/:token
router.get('/join/:token', async (req, res) => {
  try {
    const { token } = req.params;
    if (!token || token.length < 10) return res.status(400).json({ message: 'Invalid token' });

    const interview = await AIInterview.findOne({ accessToken: token });
    if (!interview) return res.status(404).json({ message: 'Interview not found or link expired' });
    if (interview.status === 'completed') return res.status(400).json({ message: 'This interview has already been completed' });

    res.json({
      id: interview._id,
      jobTitle: interview.jobTitle,
      status: interview.status,
      messages: interview.messages,
      totalQuestions: interview.totalQuestions,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load interview' });
  }
});

// POST /api/ai-interviews/:id/start
router.post('/:id/start', async (req, res) => {
  try {
    const { token, candidateName, candidateEmail } = req.body;
    if (!token || !candidateName?.trim()) return res.status(400).json({ message: 'Token and name are required' });
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid ID' });

    const interview = await AIInterview.findOne({ _id: req.params.id, accessToken: token });
    if (!interview) return res.status(403).json({ message: 'Invalid access token' });
    if (interview.status === 'completed') return res.status(400).json({ message: 'Interview already completed' });

    interview.status = 'in_progress';
    interview.startedAt = new Date();
    interview.candidateName = candidateName.trim().slice(0, 100);
    if (candidateEmail) interview.candidateEmail = candidateEmail.trim().slice(0, 200);
    await interview.save();

    res.json({ message: 'Interview started', messages: interview.messages, totalQuestions: interview.totalQuestions });
  } catch (err) {
    res.status(500).json({ message: 'Failed to start interview' });
  }
});

// POST /api/ai-interviews/:id/answer — core interview loop
router.post('/:id/answer', answerLimiter, async (req, res) => {
  try {
    const { token, answer } = req.body;
    if (!token || !answer?.trim()) return res.status(400).json({ message: 'Token and answer are required' });
    if (answer.trim().length < 5) return res.status(400).json({ message: 'Please provide a more detailed answer.' });
    if (answer.length > 5000) return res.status(400).json({ message: 'Answer too long (max 5000 chars)' });
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid ID' });

    const interview = await AIInterview.findOne({ _id: req.params.id, accessToken: token });
    if (!interview) return res.status(403).json({ message: 'Invalid access token' });
    if (interview.status !== 'in_progress') return res.status(400).json({ message: 'Interview is not active' });

    // Extract the clean question text from the last AI message
    // Strip "**Question X/Y:**" prefix so AI evaluates the actual question
    const lastAIMsg = [...interview.messages].reverse().find(m => m.role === 'ai');
    let questionText = lastAIMsg?.content || '';
    // Extract just the question part after "**Question X/Y:**"
    const qMatch = questionText.match(/\*\*Question \d+\/\d+:\*\*\s*([\s\S]+)$/);
    if (qMatch) questionText = qMatch[1].trim();

    // Add candidate answer
    interview.messages.push({ role: 'candidate', content: answer.trim() });

    // Count answered questions (AFTER pushing the answer)
    const answeredCount = interview.messages.filter(m => m.role === 'candidate').length;
    const isLastQuestion = answeredCount >= interview.totalQuestions;

    // AI evaluates the answer
    let evaluation = { score: 6, feedback: 'Thank you for your answer.', followUp: '', flags: [] };
    try {
      evaluation = await evaluateAnswer(questionText, answer.trim(), interview.jobTitle);
      // Clamp score to valid range
      evaluation.score = Math.max(0, Math.min(10, Number(evaluation.score) || 6));
    } catch (err) {
      console.error('Evaluate answer error:', err.message);
    }

    // Flag suspicious answers
    if (evaluation.flags?.length > 0) {
      const lastMsg = interview.messages[interview.messages.length - 1];
      lastMsg.flagged = true;
      lastMsg.flags = evaluation.flags;
      if (evaluation.flags.includes('copied_response')) {
        interview.monitoring.copyPasteCount += 1;
      }
    }

    let nextMessage = '';

    if (isLastQuestion) {
      // Interview complete — build closing message
      nextMessage = `Thank you, ${interview.candidateName || 'candidate'}! You've completed all ${interview.totalQuestions} questions for the **${interview.jobTitle}** position.\n\nYour responses have been recorded and an AI report is being generated. The hiring team will review your performance and get back to you within 2-3 business days. Good luck! 🎉`;
      interview.status = 'completed';
      interview.completedAt = new Date();
      interview.duration = Math.round((Date.now() - new Date(interview.startedAt).getTime()) / 60000);

      // Generate full report in background
      generateInterviewReport(interview.messages, interview.jobTitle, interview.candidateName || 'Candidate')
        .then(report => AIInterview.findByIdAndUpdate(interview._id, { report }))
        .catch(err => console.error('Report generation error:', err.message));

    } else {
      // Get next question — answeredCount is 1-indexed, questions array is 0-indexed
      // answeredCount = 1 means we just answered Q1, so next is questions[1] (Q2)
      let nextQuestion = '';
      try {
        const questions = JSON.parse(interview._questionsCache || '[]');
        const nextQ = questions[answeredCount]; // answeredCount already incremented, so this is correct
        nextQuestion = nextQ?.question || '';
      } catch (e) {
        console.error('Questions cache parse error:', e.message);
      }

      if (!nextQuestion) {
        nextQuestion = 'Please tell me more about your experience and what makes you a strong candidate for this role.';
      }

      // Build next message: brief feedback + next question
      const feedbackLine = evaluation.feedback ? evaluation.feedback.trim() : '';
      nextMessage = feedbackLine
        ? `${feedbackLine}\n\n**Question ${answeredCount + 1}/${interview.totalQuestions}:** ${nextQuestion}`
        : `**Question ${answeredCount + 1}/${interview.totalQuestions}:** ${nextQuestion}`;
    }

    interview.messages.push({ role: 'ai', content: nextMessage });
    await interview.save();

    res.json({
      evaluation: {
        score: evaluation.score,
        feedback: evaluation.feedback,
        flags: evaluation.flags || [],
      },
      nextMessage,
      isComplete: isLastQuestion,
      answeredCount,
      totalQuestions: interview.totalQuestions,
    });
  } catch (err) {
    console.error('Answer processing error:', err.message);
    res.status(500).json({ message: 'Failed to process answer. Please try again.' });
  }
});

// POST /api/ai-interviews/:id/monitor
router.post('/:id/monitor', async (req, res) => {
  try {
    const { token, event, detail } = req.body;
    if (!token || !isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid request' });

    const interview = await AIInterview.findOne({ _id: req.params.id, accessToken: token });
    if (!interview) return res.status(403).json({ message: 'Invalid token' });

    if (event === 'tab_switch') interview.monitoring.tabSwitches += 1;
    else if (event === 'copy_paste') interview.monitoring.copyPasteCount += 1;
    else if (event === 'suspicious' && detail) interview.monitoring.suspiciousActivity.push(String(detail).slice(0, 200));

    await interview.save();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Monitor event failed' });
  }
});

// GET /api/ai-interviews/:id/report
router.get('/:id/report', auth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid ID' });
    const interview = await AIInterview.findById(req.params.id)
      .populate('candidateId', 'name email phone')
      .populate('jobId', 'title company');
    if (!interview) return res.status(404).json({ message: 'Not found' });

    if (!interview.report?.overallScore && interview.status === 'completed') {
      try {
        const report = await generateInterviewReport(
          interview.messages,
          interview.jobTitle,
          interview.candidateName || interview.candidateId?.name || 'Candidate'
        );
        interview.report = report;
        await interview.save();
      } catch (err) {
        console.error('Report generation error:', err.message);
      }
    }
    res.json(interview);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch report' });
  }
});

// DELETE /api/ai-interviews/:id
router.delete('/:id', auth, requireRole('admin', 'recruiter'), async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid ID' });
    await AIInterview.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete' });
  }
});

module.exports = router;
