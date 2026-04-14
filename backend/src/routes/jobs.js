const router = require('express').Router();
const Job = require('../models/Job');
const Candidate = require('../models/Candidate');
const { auth, requireRole } = require('../middleware/auth');
const { scoreCandidate } = require('../services/aiService');
const { safePagination, isValidObjectId } = require('../middleware/validate');

// GET /api/jobs
router.get('/', auth, async (req, res) => {
  try {
    const { status, industry, remote, search } = req.query;
    const { page, limit } = safePagination(req.query.page, req.query.limit, 50);
    const filter = {};
    if (req.user.role === 'client') filter.clientId = req.user._id;
    if (status) filter.status = status;
    if (industry) filter.industry = industry;
    if (remote) filter.remote = remote;
    if (search) filter.$text = { $search: search };

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate('postedBy', 'name')
        .populate('clientId', 'name company')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(limit),
      Job.countDocuments(filter),
    ]);
    res.json({ jobs, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch jobs' });
  }
});

// GET /api/jobs/:id
router.get('/:id', auth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid ID' });
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).populate('clientId', 'name company city industry').populate('postedBy', 'name');
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // Clients can only view their own jobs
    if (req.user.role === 'client' && job.clientId?._id?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch job' });
  }
});

// POST /api/jobs
router.post('/', auth, requireRole('admin', 'recruiter', 'client'), async (req, res) => {
  try {
    const { title, company } = req.body;
    if (!title || !company) return res.status(400).json({ message: 'Title and company are required' });

    const job = await Job.create({
      ...req.body,
      clientId: req.user.role === 'client' ? req.user._id : req.body.clientId,
      postedBy: req.user._id,
    });
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create job' });
  }
});

// PUT /api/jobs/:id
router.put('/:id', auth, requireRole('admin', 'recruiter', 'client'), async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid ID' });
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // Clients can only edit their own jobs
    if (req.user.role === 'client' && job.clientId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { postedBy, clientId, _id, __v, ...updates } = req.body;
    const updated = await Job.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update job' });
  }
});

// GET /api/jobs/:id/matches — AI matching
router.get('/:id/matches', auth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid ID' });
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const preFilter = { status: 'active' };
    if (job.experienceMin !== undefined) {
      preFilter.experienceYears = {
        $gte: Math.max(0, (job.experienceMin || 0) - 1),
        $lte: (job.experienceMax || 20) + 2,
      };
    }
    if (job.skills?.length > 0) {
      preFilter.skills = { $in: job.skills.map(s => new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')) };
    }

    const candidates = await Candidate.find(preFilter).limit(30);
    if (candidates.length === 0) return res.json([]);

    const scored = await Promise.allSettled(
      candidates.map(async (c) => {
        const result = await scoreCandidate(c, job);
        return { candidate: c, score: result.score || 0, reasons: result.reasons || [], breakdown: {
          skillMatch: result.skillMatch, experienceMatch: result.experienceMatch,
          locationMatch: result.locationMatch, salaryMatch: result.salaryMatch,
        }};
      })
    );

    const results = scored
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value)
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);

    res.json(results);
  } catch (err) {
    console.error('AI matching error:', err.message);
    res.status(500).json({ message: err.message || 'Matching failed' });
  }
});

// DELETE /api/jobs/:id
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid ID' });
    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete job' });
  }
});

module.exports = router;
