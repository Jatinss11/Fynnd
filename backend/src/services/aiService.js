const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MODEL = 'gemini-2.5-flash-lite';

/**
 * Safe text generation — returns null on failure instead of throwing
 */
async function ask(prompt) {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.error('Gemini ask error:', err.message);
    throw new Error(`AI service error: ${err.message}`);
  }
}

/**
 * Safe JSON generation — retries once on parse failure
 */
async function askJSON(prompt) {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');
  try {
    const model = genAI.getGenerativeModel({
      model: MODEL,
      generationConfig: { responseMimeType: 'application/json' },
    });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    // Strip markdown code fences if present
    const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error('Gemini askJSON error:', err.message);
    throw new Error(`AI service error: ${err.message}`);
  }
}

async function parseResume(resumeText) {
  const prompt = `You are an expert Indian HR recruiter. Extract structured data from this resume.
Return ONLY valid JSON matching this schema exactly:
{
  "name": "",
  "email": "",
  "phone": "",
  "location": "",
  "city": "",
  "state": "",
  "currentCompany": "",
  "currentRole": "",
  "experienceYears": 0,
  "experienceMonths": 0,
  "skills": [],
  "languages": [],
  "education": [{ "degree": "", "institution": "", "year": 0, "percentage": "" }],
  "workExperience": [{ "company": "", "role": "", "startDate": "", "endDate": "", "current": false, "description": "" }],
  "currentSalary": null,
  "expectedSalary": null,
  "noticePeriod": "",
  "linkedinUrl": "",
  "githubUrl": "",
  "summary": ""
}
Notes:
- Salary in LPA (Lakhs Per Annum) as a number
- noticePeriod must be one of: Immediate, 15 days, 30 days, 45 days, 60 days, 90 days, Serving notice
Resume:
${resumeText.slice(0, 5000)}`;
  return askJSON(prompt);
}

async function scoreCandidate(candidate, job) {
  const prompt = `You are an expert Indian recruiter. Score this candidate for the job 0-100.
Return ONLY valid JSON:
{
  "score": 0,
  "reasons": [],
  "skillMatch": 0,
  "experienceMatch": 0,
  "locationMatch": 0,
  "salaryMatch": 0,
  "recommendation": ""
}
Job: ${job.title} at ${job.company}
Required skills: ${(job.skills || []).join(', ')}
Experience: ${job.experienceMin}-${job.experienceMax} years
Location: ${job.cities?.join(', ') || job.location}
Salary: ${job.salaryMin}-${job.salaryMax} LPA
Remote: ${job.remote}

Candidate:
Skills: ${(candidate.skills || []).join(', ')}
Experience: ${candidate.experienceYears} years
Location: ${candidate.city || candidate.location}
Expected Salary: ${candidate.expectedSalary} LPA
Notice Period: ${candidate.noticePeriod}
Willing to Relocate: ${candidate.willingToRelocate}`;
  return askJSON(prompt);
}

async function runATSAnalysis(cvText, jobDescription, jobTitle) {
  const prompt = `You are an ATS expert. Analyze this CV against the job description.
Return ONLY valid JSON:
{
  "overallScore": 0,
  "sections": {
    "keywordMatch": { "score": 0, "matched": [], "missing": [] },
    "formatScore": { "score": 0, "issues": [] },
    "experienceMatch": { "score": 0, "notes": "" },
    "skillsMatch": { "score": 0, "matched": [], "missing": [] },
    "educationMatch": { "score": 0, "notes": "" }
  },
  "suggestions": []
}
Job Title: ${jobTitle}
Job Description:
${(jobDescription || '').slice(0, 2000)}
CV:
${(cvText || '').slice(0, 3000)}`;
  return askJSON(prompt);
}

async function generateOptimizedCV(candidate, jobDescription, jobTitle) {
  const prompt = `You are an expert CV writer for the Indian job market. Create a professional ATS-optimized CV.

Candidate Info:
Name: ${candidate.name || ''}
Current Role: ${candidate.currentRole || ''}
Experience: ${candidate.experienceYears || 0} years
Skills: ${(candidate.skills || []).join(', ')}
Education: ${(candidate.education || []).map(e => `${e.degree} from ${e.institution} (${e.year})`).join(', ')}
Work History: ${(candidate.workExperience || []).map(w => `${w.role} at ${w.company}`).join(', ')}
Summary: ${candidate.summary || ''}

Target Job: ${jobTitle || ''}
Job Description: ${(jobDescription || '').slice(0, 1500)}

Instructions:
- Use ATS-friendly formatting (no tables, no columns, plain text)
- Include relevant keywords from the job description naturally
- Use strong action verbs
- Quantify achievements where possible
- Format for Indian job market standards
- Include sections: Summary, Skills, Experience, Education

Return the complete CV as plain text, ready to copy.`;
  return ask(prompt);
}

async function generateInterviewQuestions(jobTitle, jobDescription, skills, round = 1) {
  const roundContext = {
    1: 'technical screening - focus on core skills and fundamentals',
    2: 'deep technical round - advanced concepts, system design, problem solving',
    3: 'HR round - behavioural, cultural fit, career goals, salary discussion',
  };
  const prompt = `Generate 8 interview questions for a ${roundContext[round] || 'technical'} interview.
Job: ${jobTitle}
Key Skills: ${(skills || []).join(', ')}
Job Description: ${(jobDescription || '').slice(0, 500)}

Return ONLY valid JSON:
{
  "questions": [
    { "id": 1, "question": "", "type": "technical", "expectedDuration": 120, "followUp": "" }
  ],
  "openingMessage": "",
  "closingMessage": ""
}`;
  return askJSON(prompt);
}

async function evaluateAnswer(question, answer, jobTitle) {
  const prompt = `Evaluate this interview answer for a ${jobTitle} position.
Question: ${question}
Answer: ${(answer || '').slice(0, 1000)}

Return ONLY valid JSON:
{
  "score": 5,
  "feedback": "",
  "followUp": "",
  "flags": []
}
- score: 0-10
- feedback: brief evaluation (1-2 sentences)
- followUp: follow-up question or ""
- flags: ["vague_answer"] or []`;
  return askJSON(prompt);
}

async function generateInterviewReport(messages, jobTitle, candidateName) {
  const transcript = (messages || [])
    .map(m => `${m.role === 'ai' ? 'Interviewer' : candidateName}: ${m.content}`)
    .join('\n');
  const prompt = `Generate a comprehensive interview report for ${candidateName} applying for ${jobTitle}.

Transcript:
${transcript.slice(0, 6000)}

Return ONLY valid JSON:
{
  "overallScore": 70,
  "technicalScore": 70,
  "communicationScore": 70,
  "problemSolvingScore": 70,
  "confidenceScore": 70,
  "recommendation": "hire",
  "summary": "",
  "strengths": [],
  "weaknesses": [],
  "detailedFeedback": "",
  "redFlags": [],
  "hiringNotes": ""
}
All scores 0-100.`;
  return askJSON(prompt);
}

async function generateCandidateSummary(candidate) {
  const prompt = `Write a concise 3-sentence professional summary for this candidate for the Indian job market.
Name: ${candidate.name}
Role: ${candidate.currentRole || 'Professional'}
Experience: ${candidate.experienceYears || 0} years
Skills: ${(candidate.skills || []).join(', ')}
Education: ${candidate.education?.[0]?.degree || ''} from ${candidate.education?.[0]?.institution || ''}
Return ONLY the summary text, no JSON, no markdown.`;
  return ask(prompt);
}

async function generateInterviewSummary(transcript, jobTitle) {
  const prompt = `Analyze this interview for ${jobTitle}. Return ONLY valid JSON:
{
  "summary": "",
  "strengths": [],
  "weaknesses": [],
  "recommendation": "hire",
  "technicalScore": 70,
  "communicationScore": 70,
  "cultureFitScore": 70,
  "notes": ""
}
Transcript:
${(transcript || '').slice(0, 6000)}`;
  return askJSON(prompt);
}

module.exports = {
  parseResume, scoreCandidate, runATSAnalysis, generateOptimizedCV,
  generateInterviewQuestions, evaluateAnswer, generateInterviewReport,
  generateCandidateSummary, generateInterviewSummary,
};
