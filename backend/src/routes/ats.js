const router = require('express').Router();
const pdfParse = require('pdf-parse');
const fs = require('fs');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const ATSReport = require('../models/ATSReport');
const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const { auth } = require('../middleware/auth');
const { runATSAnalysis, generateOptimizedCV } = require('../services/aiService');
const { isValidObjectId } = require('../middleware/validate');

const upload = multer({ dest: 'uploads/ats/', limits: { fileSize: 10 * 1024 * 1024 } });

// Public rate limiter for portal (no auth)
const publicLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  keyGenerator: (req) => req.ip,
  message: { message: 'ATS analysis limit reached. Try again in 1 hour.' },
});

// POST /api/ats/analyze — requires auth OR public with strict rate limit
router.post('/analyze', publicLimiter, async (req, res) => {
  try {
    const { candidateId, jobId, jobDescription, jobTitle } = req.body;

    let cvText = req.body._cvText || '';
    let jdText = jobDescription || '';
    let jTitle = jobTitle || 'the role';

    if (candidateId) {
      if (!isValidObjectId(candidateId)) return res.status(400).json({ message: 'Invalid candidateId' });
      const candidate = await Candidate.findById(candidateId);
      if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
      cvText = `
Name: ${candidate.name}
Email: ${candidate.email}
Phone: ${candidate.phone || ''}
Location: ${candidate.city || ''}, ${candidate.state || ''}
Current Role: ${candidate.currentRole || ''} at ${candidate.currentCompany || ''}
Experience: ${candidate.experienceYears || 0} years
Skills: ${(candidate.skills || []).join(', ')}
Education: ${(candidate.education || []).map(e => `${e.degree} from ${e.institution} (${e.year})`).join('\n')}
Work Experience: ${(candidate.workExperience || []).map(w => `${w.role} at ${w.company}`).join('\n')}
Summary: ${candidate.summary || candidate.aiSummary || ''}
      `.trim();
    }

    if (jobId) {
      if (!isValidObjectId(jobId)) return res.status(400).json({ message: 'Invalid jobId' });
      const job = await Job.findById(jobId);
      if (job) {
        jdText = `${job.description || ''}\nRequired Skills: ${(job.skills || []).join(', ')}\nExperience: ${job.experienceMin}-${job.experienceMax} years`;
        jTitle = job.title;
      }
    }

    if (!cvText) return res.status(400).json({ message: 'No CV data found' });
    if (!jdText) return res.status(400).json({ message: 'Job description is required' });

    const analysis = await runATSAnalysis(cvText, jdText, jTitle);

    const report = await ATSReport.create({
      candidateId: candidateId || undefined,
      jobId: jobId || undefined,
      jobDescription: jdText.slice(0, 2000),
      jobTitle: jTitle,
      ...analysis,
      createdBy: req.user?._id,
    });

    res.json(report);
  } catch (err) {
    console.error('ATS analyze error:', err.message);
    res.status(500).json({ message: err.message || 'Analysis failed' });
  }
});

// POST /api/ats/analyze-upload
router.post('/analyze-upload', auth, upload.single('resume'), async (req, res) => {
  try {
    const { jobDescription, jobTitle } = req.body;
    if (!req.file) return res.status(400).json({ message: 'Resume PDF required' });
    if (!jobDescription) return res.status(400).json({ message: 'Job description required' });

    const fileBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(fileBuffer);
    const analysis = await runATSAnalysis(pdfData.text, jobDescription, jobTitle || 'the role');

    const report = await ATSReport.create({
      jobDescription: jobDescription.slice(0, 2000),
      jobTitle: jobTitle || 'the role',
      ...analysis,
      createdBy: req.user._id,
    });

    // Clean up temp file
    fs.unlink(req.file.path, () => {});

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Upload analysis failed' });
  }
});

// POST /api/ats/optimize-cv
router.post('/optimize-cv', publicLimiter, async (req, res) => {
  try {
    const { candidateId, jobDescription, jobTitle, candidateProfile } = req.body;

    let candidate;
    if (candidateId) {
      if (!isValidObjectId(candidateId)) return res.status(400).json({ message: 'Invalid candidateId' });
      candidate = await Candidate.findById(candidateId);
      if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    } else if (candidateProfile) {
      candidate = {
        name: candidateProfile.name || 'Candidate',
        email: candidateProfile.email || '',
        currentRole: candidateProfile.currentRole || '',
        experienceYears: 0,
        skills: (candidateProfile.skills || '').split(',').map(s => s.trim()).filter(Boolean),
        education: [{ degree: candidateProfile.education || '', institution: '', year: null }],
        workExperience: [{ role: candidateProfile.currentRole || '', company: '', description: candidateProfile.experience || '' }],
        summary: candidateProfile.experience || '',
      };
    } else {
      return res.status(400).json({ message: 'candidateId or candidateProfile required' });
    }

    const optimizedCV = await generateOptimizedCV(candidate, jobDescription, jobTitle);
    res.json({ optimizedCV });
  } catch (err) {
    res.status(500).json({ message: err.message || 'CV optimization failed' });
  }
});

// GET /api/ats/reports
router.get('/reports', auth, async (req, res) => {
  try {
    const { candidateId, jobId } = req.query;
    const filter = {};
    if (candidateId && isValidObjectId(candidateId)) filter.candidateId = candidateId;
    if (jobId && isValidObjectId(jobId)) filter.jobId = jobId;

    const reports = await ATSReport.find(filter)
      .populate('candidateId', 'name email')
      .populate('jobId', 'title company')
      .sort('-createdAt')
      .limit(20);
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch reports' });
  }
});

module.exports = router;
