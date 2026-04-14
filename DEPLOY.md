# Fynnd Deployment Guide
## Live in 20 minutes — Free hosting

---

## Step 1: MongoDB Atlas (Free Database)

1. Go to **https://mongodb.com/atlas** → Sign Up free
2. Create a free cluster (M0 — free forever)
3. Click **Database Access** → Add user → username: `fynnd` → Auto-generate password → Copy it
4. Click **Network Access** → Add IP → Allow from anywhere: `0.0.0.0/0`
5. Click **Connect** → Drivers → Copy connection string:
   ```
   mongodb+srv://fynnd:<password>@cluster0.xxxxx.mongodb.net/fynnd
   ```
   Replace `<password>` with your password.

---

## Step 2: GitHub (Push your code)

1. Go to **https://github.com** → New repository → Name: `fynnd` → Create
2. Open Terminal in the `fynnd/` folder and run:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/fynnd.git
   git branch -M main
   git push -u origin main
   ```

---

## Step 3: Render (Free Backend Hosting)

1. Go to **https://render.com** → Sign up with GitHub
2. Click **New** → **Web Service** → Connect your `fynnd` repo
3. Settings:
   - **Name:** fynnd-backend
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node src/index.js`
   - **Instance Type:** Free
4. Click **Environment** → Add these variables:
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://fynnd:PASSWORD@cluster0.xxxxx.mongodb.net/fynnd
   JWT_SECRET=any_long_random_string_here_min_32_chars
   GEMINI_API_KEY=AIzaSyB7X4P24HCb3AfeASdVVSfb9lZbB4Syofc
   FRONTEND_URL=https://fynnd.vercel.app
   ```
5. Click **Create Web Service** → Wait ~3 minutes
6. Copy your backend URL: `https://fynnd-backend.onrender.com`

---

## Step 4: Vercel (Free Frontend Hosting)

1. Go to **https://vercel.com** → Sign up with GitHub
2. Click **Add New Project** → Import your `fynnd` repo
3. Settings:
   - **Root Directory:** `frontend`
   - **Framework:** Next.js
4. Click **Environment Variables** → Add:
   ```
   NEXT_PUBLIC_API_URL=https://fynnd-backend.onrender.com/api
   ```
5. Click **Deploy** → Wait ~2 minutes
6. Your app is live at: `https://fynnd.vercel.app`

---

## Step 5: Seed the database

After deployment, run this once to add demo data:

```bash
cd fynnd/backend
MONGODB_URI="your_atlas_connection_string" node src/seed.js
```

---

## Step 6: Update FRONTEND_URL on Render

1. Go to Render → fynnd-backend → Environment
2. Update `FRONTEND_URL` to your actual Vercel URL
3. Click **Save Changes** → Render auto-redeploys

---

## Your live URLs

| Service | URL |
|---------|-----|
| App | https://fynnd.vercel.app |
| API | https://fynnd-backend.onrender.com |
| Health | https://fynnd-backend.onrender.com/health |

---

## Login credentials (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@fynnd.in | Admin@123 |
| Recruiter | priya@fynnd.in | Test@123 |
| Client | vikram@razorpay.com | Test@123 |

---

## Optional: Custom Domain

1. Buy a domain (e.g. fynnd.in) from GoDaddy/Namecheap
2. In Vercel → Project → Domains → Add your domain
3. Follow DNS instructions (takes ~10 minutes)

---

## Notes

- **Free tier limits:** Render free tier sleeps after 15 min inactivity (first request takes ~30s to wake up). Upgrade to $7/month for always-on.
- **File uploads:** Without Cloudinary configured, resumes save to Render's ephemeral disk (lost on redeploy). Add Cloudinary keys for permanent storage.
- **Payments:** Add Razorpay keys to Render environment for real payments.
