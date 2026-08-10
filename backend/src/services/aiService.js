const { GoogleGenerativeAI } = require('@google/generative-ai');

// Key rotation — tries each key in order on quota errors
const API_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter(Boolean);

const MODEL = 'gemini-1.5-flash'; // Best free-tier model

/**
 * Get a Gemini model instance, rotating keys on quota errors
 */
async function getModel(jsonMode = false) {
  for (const key of API_KEYS) {
    try {
      const genAI = new GoogleGenerativeAI(key);
      const config = jsonMode ? { generationConfig: { responseMimeType: 'application/json' } } : {};
      const model = genAI.getGenerativeModel({ model: MODEL, ...config });
      // Quick validation — return model with key info
      return { model, key };
    } catch (err) {
      console.warn(`Key ${key?.slice(0, 15)}... failed:`, err.message);
    }
  }
  throw new Error('No valid Gemini API key available');
}

/**
 * Safe text generation with key rotation
 */
async function ask(prompt) {
  if (!API_KEYS.length) throw new Error('GEMINI_API_KEY not configured');
  
  for (const key of API_KEYS) {
    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: MODEL });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      if (err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('RESOURCE_EXHAUSTED')) {
        console.warn(`Key ${key?.slice(0, 15)}... quota exceeded, trying next key...`);
        continue;
      }
      console.error('Gemini ask error:', err.message);
      throw new Error(`AI service error: ${err.message}`);
    }
  }
  throw new Error('All Gemini API keys have exceeded their quota. Please try again later or add a new API key.');
}

/**
 * Safe JSON generation with key rotation
 */
async function askJSON(prompt) {
  if (!API_KEYS.length) throw new Error('GEMINI_API_KEY not configured');
  
  for (const key of API_KEYS) {
    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({
        model: MODEL,
        generationConfig: { responseMimeType: 'application/json' },
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
      return JSON.parse(clean);
    } catch (err) {
      if (err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('RESOURCE_EXHAUSTED')) {
        console.warn(`Key ${key?.slice(0, 15)}... quota exceeded, trying next key...`);
        continue;
      }
      console.error('Gemini askJSON error:', err.message);
      throw new Error(`AI service error: ${err.message}`);
    }
  }
  throw new Error('All Gemini API keys have exceeded their quota. Please try again later or add a new API key at https://aistudio.google.com/app/apikey');
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
    1: 'technical screening - focus on core skills, fundamentals, and past experience',
    2: 'deep technical round - advanced concepts, system design, architecture, problem solving',
    3: 'HR round - behavioural questions, cultural fit, career goals, motivation',
  };
  const prompt = `You are an expert interviewer. Generate exactly 5 interview questions for a ${roundContext[round] || 'technical'} interview.

Job Title: ${jobTitle}
Key Skills: ${(skills || []).slice(0, 10).join(', ')}
Job Description: ${(jobDescription || '').slice(0, 400)}

Return ONLY valid JSON with no extra text:
{
  "questions": [
    { "id": 1, "question": "Tell me about yourself and your experience with ${(skills || ['the required technologies'])[0]}.", "type": "behavioural" },
    { "id": 2, "question": "Describe a challenging project you worked on. What was your role and what did you learn?", "type": "situational" },
    { "id": 3, "question": "How do you approach debugging a complex issue in production?", "type": "technical" },
    { "id": 4, "question": "Where do you see yourself in 3 years and how does this role fit your goals?", "type": "behavioural" },
    { "id": 5, "question": "Do you have any questions for us about the role or the team?", "type": "closing" }
  ],
  "openingMessage": "Hello! I'm your AI interviewer for the ${jobTitle} position. I'll ask you 5 questions. Take your time and answer thoroughly. Let's begin!",
  "closingMessage": "Thank you for completing the interview. Your responses have been recorded."
}

Make questions specific to the job title and skills. Each question should be clear and answerable in 2-3 minutes.`;
  return askJSON(prompt);
}

async function evaluateAnswer(question, answer, jobTitle) {
  const prompt = `You are an expert interviewer evaluating a candidate's answer for a ${jobTitle} position.

Question asked: "${question.slice(0, 500)}"
Candidate's answer: "${(answer || '').slice(0, 1000)}"

Evaluate the answer and return ONLY valid JSON with no extra text:
{
  "score": 7,
  "feedback": "Good explanation of the concept. Could have included more specific examples.",
  "followUp": "",
  "flags": []
}

Rules:
- score: integer 0-10 (0=no answer, 5=average, 8=good, 10=excellent)
- feedback: 1-2 sentences, constructive and specific
- followUp: optional follow-up question string, or empty string ""
- flags: array, use ["vague_answer"] if answer is too short/vague, ["off_topic"] if irrelevant, or []
- Be fair and encouraging in feedback tone`;
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
