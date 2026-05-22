# Library Management System — Setup Guide

## Demo Accounts (after seeding)
| Role  | Username | Password  |
|-------|----------|-----------|
| Admin | admin    | admin123  |
| User  | john     | user123   |
| User  | jane     | user123   |

---

## Step 1 — MongoDB Atlas (free cloud database)

1. Go to https://cloud.mongodb.com and create a free account
2. Create a **free M0 cluster** (choose any region)
3. Under **Database Access** → Add a user with password
4. Under **Network Access** → Allow access from anywhere (`0.0.0.0/0`)
5. Click **Connect** → **Drivers** → copy the connection string
   - Replace `<password>` with your DB user's password
   - Replace `myFirstDatabase` with `library`

---

## Step 2 — Backend Setup (Local)

```bash
cd backend
cp .env.example .env
# Fill in your .env:
#   MONGODB_URI=  (from Atlas above)
#   JWT_SECRET=   (any long random string, e.g. "mysecretkey123abc")
#   EMAIL_USER=   (your Gmail address)
#   EMAIL_PASS=   (Gmail App Password — see below)
#   CLIENT_URL=   http://localhost:5173

npm install
npm run seed    # loads 12 demo books + 3 demo accounts
npm run dev     # starts on http://localhost:5000
```

### Gmail App Password (for warning emails)
1. Go to your Google Account → Security → 2-Step Verification (must be ON)
2. Search "App passwords" → create one for "Mail"
3. Use the 16-character code as `EMAIL_PASS`

---

## Step 3 — Frontend Setup (Local)

```bash
cd frontend
cp .env.example .env.local
# Set: VITE_API_URL=http://localhost:5000/api

npm install
npm run dev     # starts on http://localhost:5173
```

---

## Step 4 — Deploy Backend to Render (free)

1. Push the `backend/` folder to a GitHub repo
2. Go to https://render.com → New → Web Service
3. Connect your GitHub repo
4. Settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add Environment Variables (same as your `.env`):
   - `MONGODB_URI`, `JWT_SECRET`, `EMAIL_USER`, `EMAIL_PASS`
   - `CLIENT_URL` = your Vercel frontend URL (fill after step 5)
6. Deploy → copy your Render URL (e.g. `https://library-backend.onrender.com`)

---

## Step 5 — Deploy Frontend to Vercel (free)

1. Push the `frontend/` folder to a GitHub repo
2. Go to https://vercel.com → New Project → import repo
3. Add Environment Variable:
   - `VITE_API_URL` = `https://your-render-url.onrender.com/api`
4. Deploy → get your Vercel URL

---

## Step 6 — Run Seed on Production

Once backend is deployed on Render, update your local `.env` with the production `MONGODB_URI` and run:

```bash
cd backend
npm run seed
```

This populates the live database with demo books and accounts.
