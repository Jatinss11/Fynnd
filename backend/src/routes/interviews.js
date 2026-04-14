const router = require('express').Router();
const Interview = require('../models/Interview');
const Pipeline = require('../models/Pipeline');
const CandidateReview = require('../models/CandidateReview');
const Candidate = require('../models/Candidate');
const { auth, requireRole } = require('../middleware/auth');
const { generateInterviewSummary } = require('../services/aiService');
const { notifyInterviewScheduled } = require('../services/notificationService');
const { createGoogleMeet, createZoomMeeting } = require('../services/meetingService');

// GET /api/interviews
router.get('/', auth, async (req, res) => {
  try {
    const { status, candidateId, jobId } = req.query;
    const filter = {};
    if (req.user.role === 'client') filter.clientId = req.user._id;
    if (status) filter.status = status;
    if (candidateId) filter.candidateId = candidateId;
    if (jobId) filter.jobId = jobId;

    const interviews = await Interview.find(filter)
      .populate('candidateId', 'name email phone city currentRole resumeUrl')
      .populate('jobId', 'title company')
      .populate('scheduledBy', 'name')
      .sort('scheduledAt');
    res.json(interviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/interviews — schedule with Google Meet or Zoom
router.post('/', auth, requireRole('admin', 'recruiter'), async (req, res) => {
  try {
    const {
      candidateId, jobId, pipelineId, clientId,
      scheduledAt, duration, type, round, venue,
      meetingProvider, // 'google_meet' | 'zoom' | 'manual'
      candidateName, jobTitle, candidateEmail, clientEmail,
    } = req.body;

    let meetLink = req.body.meetLink || '';
    let meetingMeta = {};

    // Auto-create meeting link
    if (meetingProvider === 'google_meet') {
      const meet = await createGoogleMeet({
        title: `Interview: ${candidateName} for ${jobTitle}`,
        startTime: scheduledAt,
        durationMinutes: duration || 60,
        attendeeEmails: [candidateEmail, clientEmail].filter(Boolean),
        description: `Fynnd AI Interview · Round ${round || 1}`,
      });
      meetLink = meet.meetLink;
      meetingMeta = meet;
    } else if (meetingProvider === 'zoom') {
      const zoom = await createZoomMeeting({
        title: `Interview: ${candidateName} for ${jobTitle}`,
        startTime: scheduledAt,
        durationMinutes: duration || 60,
        agenda: `Fynnd AI Interview · Round ${round || 1}`,
      });
      meetLink = zoom.meetLink;
      meetingMeta = zoom;
    }

    const interview = await Interview.create({
      ...req.body,
      meetLink,
      meetingProvider,
      meetingMeta,
      scheduledBy: req.user._id,
    });

    // Update pipeline stage
    if (pipelineId) {
      await Pipeline.findByIdAndUpdate(pipelineId, {
        interviewDate: scheduledAt,
        interviewLink: meetLink,
        interviewType: type,
        stage: 'Interview Round 1',
        $push: {
          activities: {
            action: `Interview scheduled via ${meetingProvider || 'manual'} for ${new Date(scheduledAt).toLocaleString('en-IN')}`,
            byName: req.user.name,
            timestamp: new Date(),
          },
        },
      });
    }

    // Notify client
    if (clientId) {
      await notifyInterviewScheduled({
        userId: clientId,
        candidateName: candidateName || 'Candidate',
        jobTitle: jobTitle || 'Job',
        scheduledAt,
        interviewId: interview._id,
      });
    }

    const populated = await Interview.findById(interview._id)
      .populate('candidateId', 'name email phone')
      .populate('jobId', 'title company');

    res.status(201).json({ interview: populated, meetLink, meetingMeta });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/interviews/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const interview = await Interview.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('candidateId', 'name email')
      .populate('jobId', 'title');
    res.json(interview);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/interviews/:id/ai-summary
router.post('/:id/ai-summary', auth, requireRole('admin', 'recruiter'), async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript) return res.status(400).json({ message: 'Transcript required' });
    const interview = await Interview.findById(req.params.id).populate('jobId', 'title');
    const summary = await generateInterviewSummary(transcript, interview?.jobId?.title || 'the role');
    await Interview.findByIdAndUpdate(req.params.id, {
      aiSummary: summary.summary,
      strengths: summary.strengths,
      weaknesses: summary.weaknesses,
      recommendation: summary.recommendation,
      feedback: summary.notes,
    });
    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/interviews/:id/review — client rates & decides on candidate
router.post('/:id/review', auth, requireRole('admin', 'recruiter', 'client'), async (req, res) => {
  try {
    const {
      overallRating, technicalRating, communicationRating, cultureFitRating,
      decision, feedback, privateNotes, interviewMonitoring,
    } = req.body;

    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    // Upsert review
    const review = await CandidateReview.findOneAndUpdate(
      { candidateId: interview.candidateId, jobId: interview.jobId },
      {
        candidateId: interview.candidateId,
        jobId: interview.jobId,
        pipelineId: interview.pipelineId,
        reviewedBy: req.user._id,
        overallRating, technicalRating, communicationRating, cultureFitRating,
        decision, feedback, privateNotes,
        interviewMonitoring,
      },
      { upsert: true, new: true }
    );

    // Update pipeline stage based on decision
    if (interview.pipelineId) {
      const stageMap = {
        shortlisted: 'Shortlisted',
        rejected: 'Rejected',
        hired: 'Offer Released',
        on_hold: 'HR Round',
      };
      const newStage = stageMap[decision];
      if (newStage) {
        await Pipeline.findByIdAndUpdate(interview.pipelineId, {
          stage: newStage,
          clientFeedback: feedback,
          clientRating: overallRating,
          $push: { activities: { action: `Decision: ${decision} by ${req.user.name}`, byName: req.user.name, timestamp: new Date() } },
        });
      }
    }

    // Update interview status
    await Interview.findByIdAndUpdate(req.params.id, { status: 'completed', rating: overallRating, feedback, recommendation: decision === 'hired' ? 'strong_hire' : decision === 'shortlisted' ? 'hire' : 'no_hire' });

    res.json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/interviews/:id/review
router.get('/:id/review', auth, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ message: 'Not found' });
    const review = await CandidateReview.findOne({ candidateId: interview.candidateId, jobId: interview.jobId });
    res.json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
