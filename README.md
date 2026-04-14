# Fynnd — AI Recruitment Platform for India

> Find the right talent, faster. AI-powered hiring for Indian companies.

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- OpenAI API key

### 1. Backend

```bash
cd fynnd/backend
cp .env.example .env
# Edit .env — add your OPENAI_API_KEY and a strong JWT_SECRET
npm install
npm run dev
```

### 2. Seed demo data

```bash
npm run seed
```

This creates 3 recruiters, 3 clients (Zomato, Razorpay, Meesho), 6 candidates, and 3 jobs.

**Demo login credentials:**
| Role      | Email                    | Password   |
|-----------|--------------------------|------------|
| Admin     | admin@fynnd.in           | Admin@123  |
| Recruiter | priya@fynnd.in           | Test@123   |
| Recruiter | rahul@fynnd.in           | Test@123   |
| Client    | sneha@zomato.com         | Test@123   |
| Client    | vikram@razorpay.com      | Test@123   |
| Client    | ananya@meesho.com        | Test@123   |

### 3. Frontend

```bash
cd fynnd/frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Open http://localhost:3000

---

### Docker (all-in-one)

```bash
cd fynnd
OPENAI_API_KEY=sk-xxx docker-compose up
```

---

## Features

- **AI Resume Parser** — Upload PDF, AI extracts all fields instantly
- **AI Candidate Matching** — Ranked matches with score breakdown for every job
- **AI Candidate Summary** — Auto-generated professional summaries
- **Kanban Pipeline** — 11 stages from Sourced → Joined
- **Interview Scheduling** — Schedule, track, mark complete
- **Analytics Dashboard** — Charts, KPIs, pipeline distribution, top skills
- **Role-based Access** — Admin / Recruiter / Client with separate views
- **Notifications** — Real-time alerts for pipeline moves and interviews
- **Indian Market** — LPA salary, Indian cities/states, notice periods

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, React Query, Zustand, Recharts
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **AI**: OpenAI GPT-4o-mini
- **Auth**: JWT with role-based access control
