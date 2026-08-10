const router = require('express').Router();
const JobBoard = require('../models/JobBoard');
const { auth, requireRole } = require('../middleware/auth');
const { safePagination, isValidObjectId } = require('../middleware/validate');
const multer = require('multer');
const { getResumeUploader } = require('../services/cloudinaryService');

const upload = getResumeUploader();

// ── PUBLIC JOB BOARD ──────────────────────────────────────────────────────────

// GET /api/jobboard/public — public listing, no auth
router.get('/public', async (req, res) => {
  try {
    const { search, location, workType, employmentType, industry, sort = '-publishedAt' } = req.query;
    const { page, limit } = safePagination(req.query.page, req.query.limit, 20);
    const query = { status: 'Published' };
    if (search) query.$text = { $search: search };
    if (location) query.location = new RegExp(location, 'i');
    if (workType) query.workType = workType;
    if (employmentType) query.employmentType = employmentType;
    if (industry) query.industry = industry;
    
    const [jobs, total] = await Promise.all([
      JobBoard.find(query)
        .select('-applications')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
      JobBoard.countDocuments(query),
    ]);
    res.json({ jobs, total, pages: Math.ceil(total / limit), page });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/jobboard/public/:id — public job detail
router.get('/public/:id', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid ID' });
    const job = await JobBoard.findOne({ _id: req.params.id, status: 'Published' })
      .select('-applications');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    // Increment view count
    await JobBoard.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    res.json(job);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/jobboard/public/:id/apply — public application
router.post('/public/:id/apply', upload.single('resume'), async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid ID' });
    const job = await JobBoard.findOne({ _id: req.params.id, status: 'Published' });
    if (!job) return res.status(404).json({ message: 'Job not found or closed' });
    
    // Check duplicate application
    const alreadyApplied = job.applications.some(a => a.email === req.body.email?.toLowerCase());
    if (alreadyApplied) return res.status(400).json({ message: 'You have already applied for this position' });
    
    let resumeUrl = '';
    if (req.file) {
      resumeUrl = req.file.path?.startsWith('http') ? req.file.path : `/uploads/resumes/${req.file.filename}`;
    }
    
    job.applications.push({ ...req.body, resumeUrl, appliedAt: new Date() });
    job.applicationCount = job.applications.length;
    await job.save();
    
    res.status(201).json({ message: 'Application submitted successfully! We will get back to you soon.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── COMPANY JOB MANAGEMENT (authenticated) ────────────────────────────────────

// GET /api/jobboard — company's own jobs
router.get('/', auth, requireRole('admin', 'client'), async (req, res) => {
  try {
    const { status } = req.query;
    const query = { companyId: req.user._id };
    if (status) query.status = status;
    const jobs = await JobBoard.find(query)
      .select('-applications')
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/jobboard — create job
router.post('/', auth, requireRole('admin', 'client'), async (req, res) => {
  try {
    const job = await JobBoard.create({
      ...req.body,
      companyId: req.user._id,
      companyName: req.body.companyName || req.user.company || 'Company',
      postedBy: req.user._id,
      publishedAt: req.body.status === 'Published' ? new Date() : undefined,
    });
    res.status(201).json(job);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/jobboard/:id — update job
router.put('/:id', auth, requireRole('admin', 'client'), async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid ID' });
    const updates = { ...req.body };
    if (updates.status === 'Published' && !updates.publishedAt) updates.publishedAt = new Date();
    const job = await JobBoard.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user._id },
      updates, { new: true }
    );
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/jobboard/:id
router.delete('/:id', auth, requireRole('admin', 'client'), async (req, res) => {
  try {
    await JobBoard.findOneAndDelete({ _id: req.params.id, companyId: req.user._id });
    res.json({ message: 'Job deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/jobboard/:id/applications — view applications
router.get('/:id/applications', auth, requireRole('admin', 'client'), async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid ID' });
    const job = await JobBoard.findOne({ _id: req.params.id, companyId: req.user._id });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json({ job: { title: job.title, status: job.status }, applications: job.applications });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/jobboard/:id/applications/:appId — update application status
router.put('/:id/applications/:appId', auth, requireRole('admin', 'client'), async (req, res) => {
  try {
    const job = await JobBoard.findOne({ _id: req.params.id, companyId: req.user._id });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    const app = job.applications.id(req.params.appId);
    if (!app) return res.status(404).json({ message: 'Application not found' });
    Object.assign(app, req.body, { reviewedAt: new Date(), reviewedBy: req.user._id });
    await job.save();
    res.json(app);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
