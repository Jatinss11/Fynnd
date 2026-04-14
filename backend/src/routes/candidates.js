const router = require('express').Router();
const pdfParse = require('pdf-parse');
const fs = require('fs');
const Candidate = require('../models/Candidate');
const Subscription = require('../models/Subscription');
const { auth, requireRole } = require('../middleware/auth');
const { parseResume, generateCandidateSummary } = require('../services/aiService');
const { getResumeUploader } = require('../services/cloudinaryService');
const { safePagination, isValidObjectId } = require('../middleware/validate');

const upload = getResumeUploader();

// GET /api/candidates
router.get('/', auth, async (req, res) => {
  try {
    const { search, skills, location, city, state, noticePeriod, status, source, sort = '-createdAt' } = req.query;
    const { page, limit } = safePagination(req.query.page, req.query.limit, 50);
    const minExp = req.query.minExp ? Math.max(0, Number(req.query.minExp)) : undefined;
    const maxExp = req.query.maxExp ? Math.min(50, Number(req.query.maxExp)) : undefined;
    const minSalary = req.query.minSalary ? Math.max(0, Number(req.query.minSalary)) : undefined;
    const maxSalary = req.query.maxSalary ? Math.min(500, Number(req.query.maxSalary)) : undefined;

    // Plan-based access for clients
    if (req.user.role === 'client') {
      const sub = await Subscription.findOne({ clientId: req.user._id });
      const plan = sub?.plan || 'basic';
      const planLimits = { basic: 50, premium: 500, gold: -1 };
      const viewLimit = planLimits[plan] ?? 50;

      if (viewLimit !== -1) {
        const used = sub?.usage?.candidateViews || 0;
        if (used >= viewLimit) {
          return res.status(403).json({
            message: `You've used all ${viewLimit} candidate views on your ${plan} plan.`,
            upgradeRequired: true,
          });
        }
        if (sub) {
          await Subscription.findByIdAndUpdate(sub._id, { $inc: { 'usage.candidateViews': 1 } });
        }
      }
    }

    const query = {};
    if (search) query.$text = { $search: search };
    if (location) query.location = new RegExp(location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (city) query.city = new RegExp(city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (state) query.state = new RegExp(state.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (noticePeriod) query.noticePeriod = noticePeriod;
    if (status) query.status = status;
    if (source) query.source = source;
    if (skills) {
      const skillList = skills.split(',').slice(0, 10).map(s => s.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      query.skills = { $in: skillList.map(s => new RegExp(s, 'i')) };
    }
    if (minExp !== undefined || maxExp !== undefined) {
      query.experienceYears = {};
      if (minExp !== undefined) query.experienceYears.$gte = minExp;
      if (maxExp !== undefined) query.experienceYears.$lte = maxExp;
    }
    if (minSalary !== undefined || maxSalary !== undefined) {
      query.expectedSalary = {};
      if (minSalary !== undefined) query.expectedSalary.$gte = minSalary;
      if (maxSalary !== undefined) query.expectedSalary.$lte = maxSalary;
    }

    // Clients only see active candidates
    if (req.user.role === 'client') query.status = 'active';

    const allowedSorts = ['-createdAt', 'createdAt', '-experienceYears', 'experienceYears', '-expectedSalary'];
    const safeSort = allowedSorts.includes(sort) ? sort : '-createdAt';

    const [candidates, total] = await Promise.all([
      Candidate.find(query)
        .select(req.user.role === 'client' ? '-recruiterNotes -addedBy' : '')
        .populate('addedBy', 'name')
        .sort(safeSort)
        .skip((page - 1) * limit)
        .limit(limit),
      Candidate.countDocuments(query),
    ]);

    res.json({ candidates, total, pages: Math.ceil(total / limit), page });
  } catch (err) {
    console.error('GET /candidates error:', err.message);
    res.status(500).json({ message: 'Failed to fetch candidates' });
  }
});

// GET /api/candidates/:id
router.get('/:id', auth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid ID' });
    const candidate = await Candidate.findById(req.params.id)
      .select(req.user.role === 'client' ? '-recruiterNotes -addedBy' : '')
      .populate('addedBy', 'name email');
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch candidate' });
  }
});

// POST /api/candidates
router.post('/', auth, requireRole('admin', 'recruiter'), async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ message: 'Name and email are required' });
    const candidate = await Candidate.create({ ...req.body, addedBy: req.user._id });
    res.status(201).json(candidate);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'A candidate with this email already exists' });
    res.status(500).json({ message: 'Failed to create candidate' });
  }
});

// POST /api/candidates/upload-resume
router.post('/upload-resume', auth, requireRole('admin', 'recruiter'), upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Resume PDF is required' });

    let fileBuffer;
    let resumeUrl;

    if (req.file.path && req.file.path.startsWith('http')) {
      // Cloudinary upload
      const https = require('https');
      const http = require('http');
      const protocol = req.file.path.startsWith('https') ? https : http;
      fileBuffer = await new Promise((resolve, reject) => {
        protocol.get(req.file.path, (response) => {
          const chunks = [];
          response.on('data', c => chunks.push(c));
          response.on('end', () => resolve(Buffer.concat(chunks)));
          response.on('error', reject);
        });
      });
      resumeUrl = req.file.path;
    } else {
      fileBuffer = fs.readFileSync(req.file.path);
      resumeUrl = `/uploads/resumes/${req.file.filename}`;
    }

    const pdfData = await pdfParse(fileBuffer);
    if (!pdfData.text || pdfData.text.trim().length < 50) {
      return res.status(400).json({ message: 'Could not extract text from PDF. Ensure it is not a scanned image.' });
    }

    const parsed = await parseResume(pdfData.text);
    if (!parsed.email) return res.status(400).json({ message: 'Could not extract email from resume. Please add candidate manually.' });

    parsed.resumeUrl = resumeUrl;
    parsed.addedBy = req.user._id;
    parsed.source = 'resume_upload';

    const existing = await Candidate.findOne({ email: parsed.email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Candidate with this email already exists', existing });
    }

    const candidate = await Candidate.create(parsed);

    // Generate AI summary in background
    generateCandidateSummary(candidate)
      .then(summary => Candidate.findByIdAndUpdate(candidate._id, { aiSummary: summary }))
      .catch(err => console.error('AI summary error:', err.message));

    res.status(201).json(candidate);
  } catch (err) {
    console.error('Upload resume error:', err.message);
    res.status(500).json({ message: err.message || 'Resume upload failed' });
  }
});

// PUT /api/candidates/:id
router.put('/:id', auth, requireRole('admin', 'recruiter'), async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid ID' });
    // Prevent overwriting protected fields
    const { addedBy, _id, __v, ...updates } = req.body;
    const candidate = await Candidate.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update candidate' });
  }
});

// DELETE /api/candidates/:id
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid ID' });
    await Candidate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Candidate deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete candidate' });
  }
});

// POST /api/candidates/:id/generate-summary
router.post('/:id/generate-summary', auth, requireRole('admin', 'recruiter'), async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid ID' });
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ message: 'Not found' });
    const summary = await generateCandidateSummary(candidate);
    await Candidate.findByIdAndUpdate(candidate._id, { aiSummary: summary });
    res.json({ summary });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to generate summary' });
  }
});

module.exports = router;
