const router = require('express').Router();
const Pipeline = require('../models/Pipeline');
const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const { auth, requireRole } = require('../middleware/auth');
const { notifyPipelineMove } = require('../services/notificationService');

// GET /api/pipeline
router.get('/', auth, async (req, res) => {
  try {
    const { jobId, candidateId, stage } = req.query;
    const filter = {};
    if (jobId) filter.jobId = jobId;
    if (candidateId) filter.candidateId = candidateId;
    if (stage) filter.stage = stage;

    const entries = await Pipeline.find(filter)
      .populate('candidateId', 'name email phone currentRole currentCompany experienceYears skills city noticePeriod expectedSalary resumeUrl')
      .populate('jobId', 'title company status')
      .populate('movedBy', 'name')
      .sort('-updatedAt');
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/pipeline/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const entry = await Pipeline.findById(req.params.id)
      .populate('candidateId')
      .populate('jobId')
      .populate('movedBy', 'name');
    if (!entry) return res.status(404).json({ message: 'Not found' });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/pipeline — add candidate to job
router.post('/', auth, requireRole('admin', 'recruiter'), async (req, res) => {
  try {
    const { jobId, candidateId, matchScore, matchReasons } = req.body;

    const existing = await Pipeline.findOne({ jobId, candidateId });
    if (existing) return res.status(409).json({ message: 'Candidate already in pipeline for this job', entry: existing });

    const entry = await Pipeline.create({
      jobId, candidateId, matchScore, matchReasons,
      movedBy: req.user._id,
      activities: [{ action: 'Added to pipeline', by: req.user._id, byName: req.user.name }],
    });

    await Job.findByIdAndUpdate(jobId, { $inc: { applicationCount: 1 } });

    const populated = await Pipeline.findById(entry._id)
      .populate('candidateId', 'name email')
      .populate('jobId', 'title company');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/pipeline/:id — move stage / add feedback
router.put('/:id', auth, async (req, res) => {
  try {
    const { stage, clientFeedback, clientRating, recruiterNotes, interviewDate, interviewLink, interviewType, offeredSalary, joiningDate } = req.body;

    const entry = await Pipeline.findById(req.params.id)
      .populate('candidateId', 'name')
      .populate('jobId', 'title clientId');

    if (!entry) return res.status(404).json({ message: 'Not found' });

    const updates = { movedBy: req.user._id };
    const activity = { by: req.user._id, byName: req.user.name };

    if (stage && stage !== entry.stage) {
      updates.stage = stage;
      activity.action = `Stage changed to "${stage}"`;

      // Mark candidate as placed if Joined
      if (stage === 'Joined') {
        await Candidate.findByIdAndUpdate(entry.candidateId._id, { status: 'placed' });
      }

      // Notify client
      if (entry.jobId?.clientId) {
        await notifyPipelineMove({
          userId: entry.jobId.clientId,
          candidateName: entry.candidateId?.name,
          jobTitle: entry.jobId?.title,
          stage,
          pipelineId: entry._id,
        });
      }
    }

    if (clientFeedback !== undefined) { updates.clientFeedback = clientFeedback; activity.action = activity.action || 'Feedback added'; }
    if (clientRating !== undefined) updates.clientRating = clientRating;
    if (recruiterNotes !== undefined) updates.recruiterNotes = recruiterNotes;
    if (interviewDate !== undefined) updates.interviewDate = interviewDate;
    if (interviewLink !== undefined) updates.interviewLink = interviewLink;
    if (interviewType !== undefined) updates.interviewType = interviewType;
    if (offeredSalary !== undefined) updates.offeredSalary = offeredSalary;
    if (joiningDate !== undefined) updates.joiningDate = joiningDate;

    if (activity.action) {
      updates.$push = { activities: { ...activity, timestamp: new Date() } };
    }

    const updated = await Pipeline.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('candidateId', 'name email phone currentRole currentCompany experienceYears skills city noticePeriod expectedSalary resumeUrl')
      .populate('jobId', 'title company');

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/pipeline/:id
router.delete('/:id', auth, requireRole('admin', 'recruiter'), async (req, res) => {
  try {
    const entry = await Pipeline.findById(req.params.id);
    if (entry) await Job.findByIdAndUpdate(entry.jobId, { $inc: { applicationCount: -1 } });
    await Pipeline.findByIdAndDelete(req.params.id);
    res.json({ message: 'Removed from pipeline' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
