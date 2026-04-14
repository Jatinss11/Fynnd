const router = require('express').Router();
const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const Pipeline = require('../models/Pipeline');
const Interview = require('../models/Interview');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/analytics/overview
router.get('/overview', auth, requireRole('admin'), async (req, res) => {
  try {
    const [
      totalCandidates, activeCandidates, placedCandidates,
      totalJobs, openJobs, closedJobs,
      totalSubmissions, interviewsScheduled, placements,
      totalInterviews,
    ] = await Promise.all([
      Candidate.countDocuments(),
      Candidate.countDocuments({ status: 'active' }),
      Candidate.countDocuments({ status: 'placed' }),
      Job.countDocuments(),
      Job.countDocuments({ status: 'open' }),
      Job.countDocuments({ status: 'filled' }),
      Pipeline.countDocuments(),
      Pipeline.countDocuments({ stage: { $in: ['Interview Round 1', 'Interview Round 2', 'HR Round'] } }),
      Pipeline.countDocuments({ stage: 'Joined' }),
      Interview.countDocuments(),
    ]);

    const placementRate = totalSubmissions > 0 ? Math.round((placements / totalSubmissions) * 100) : 0;

    res.json({
      totalCandidates, activeCandidates, placedCandidates,
      totalJobs, openJobs, closedJobs,
      totalSubmissions, interviewsScheduled, placements,
      totalInterviews, placementRate,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/analytics/pipeline-stages
router.get('/pipeline-stages', auth, requireRole('admin', 'recruiter'), async (req, res) => {
  try {
    const stages = await Pipeline.aggregate([
      { $group: { _id: '$stage', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json(stages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/analytics/top-skills
router.get('/top-skills', auth, requireRole('admin', 'recruiter'), async (req, res) => {
  try {
    const skills = await Candidate.aggregate([
      { $unwind: '$skills' },
      { $group: { _id: '$skills', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]);
    res.json(skills);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/analytics/monthly-placements
router.get('/monthly-placements', auth, requireRole('admin'), async (req, res) => {
  try {
    const data = await Pipeline.aggregate([
      { $match: { stage: 'Joined' } },
      { $group: {
        _id: { year: { $year: '$updatedAt' }, month: { $month: '$updatedAt' } },
        count: { $sum: 1 },
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ]);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/analytics/candidate-sources
router.get('/candidate-sources', auth, requireRole('admin', 'recruiter'), async (req, res) => {
  try {
    const sources = await Candidate.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json(sources);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
