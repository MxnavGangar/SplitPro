# SplitPro — Smart Expense Splitter

> A full-stack AI-powered expense splitting application built for the NeevAI internship assignment.

![SplitPro Banner](https://img.shields.io/badge/SplitPro-Smart%20Expense%20Splitter-7c6aff?style=for-the-badge)
![Stack](https://img.shields.io/badge/Stack-React%20%2B%20Node.js%20%2B%20PostgreSQL-blue?style=for-the-badge)
![AI](https://img.shields.io/badge/AI-Claude%20Sonnet%204-8b5cf6?style=for-the-badge)

---

## Features

### Core Features
- **Group Management** — Create groups with icons, add/remove members
- **Expense Tracking** — Add expenses with descriptions, amounts, dates, categories
- **Smart Splitting** — Equal split or fully custom per-person amounts
- **Real-time Balances** — Net balance per member, updated instantly
- **Debt Simplification** — Greedy algorithm minimizes number of transactions to settle
- **Settle Up** — Record payments between members

### AI-Powered Features (Claude Sonnet 4)
- **Auto Categorization** — Click ✨ to auto-categorize any expense by description
- **Spending Insights** — AI analyzes group spending patterns and surfaces actionable insights
- **Visual Analytics** — Category pie chart + member bar chart via Recharts

### Technical Highlights
- JWT authentication with 7-day token expiry
- PostgreSQL with normalized schema and indexes
- Greedy debt simplification algorithm
- React Router v6 protected routes
- Fully responsive dark UI

---

## Tech Stack

| Layer     | Technology              |
|-----------|------------------------|
| Frontend  | React 18, Vite, React Router v6, Recharts |
| Backend   | Node.js, Express.js (ESM) |
| Database  | PostgreSQL              |
| AI        | Anthropic Claude Sonnet 4 |
| Auth      | JWT (jsonwebtoken + bcryptjs) |
| Deploy    | Vercel (frontend + backend separately) |

---

## Local Setup — Step by Step

### Prerequisites
- Node.js v18+
- PostgreSQL 14+
- Git
- An Anthropic API key (get one at console.anthropic.com)

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/splitpro.git
cd splitpro
```

---

### Step 2 — Set up PostgreSQL database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE splitpro;
CREATE USER splituser WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE splitpro TO splituser;
\q

# Run the schema
psql -U splituser -d splitpro -f backend/schema.sql
```

---

### Step 3 — Configure backend environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```
PORT=5000
DATABASE_URL=postgresql://splituser:yourpassword@localhost:5432/splitpro
JWT_SECRET=any_long_random_string_here
ANTHROPIC_API_KEY=sk-ant-your-key-here
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

---

### Step 4 — Install and run backend

```bash
cd backend
npm install
npm run dev
# ✅ API running on http://localhost:5000
```

Test the API:
```bash
curl http://localhost:5000/health
# {"status":"ok","timestamp":"..."}
```

---

### Step 5 — Configure frontend environment

```bash
cd ../frontend
cp .env.example .env
```

`.env` contents:
```
VITE_API_URL=http://localhost:5000/api
```

---

### Step 6 — Install and run frontend

```bash
npm install
npm run dev
# ✅ Frontend running on http://localhost:5173
```

Open http://localhost:5173 in your browser.

---

## Deployment on Vercel

### Deploy Backend

1. Push the repo to GitHub
2. Go to vercel.com → New Project → Import your repo
3. Set **Root Directory** to `backend`
4. Set **Framework Preset** to `Other`
5. Add environment variables:
   - `DATABASE_URL` (use Supabase or Neon for free PostgreSQL)
   - `JWT_SECRET`
   - `ANTHROPIC_API_KEY`
   - `NODE_ENV=production`
   - `FRONTEND_URL=https://your-frontend.vercel.app`
6. Deploy → note your backend URL (e.g. `https://splitpro-api.vercel.app`)

### Deploy Frontend

1. New Project → same repo
2. Set **Root Directory** to `frontend`
3. Add environment variable:
   - `VITE_API_URL=https://splitpro-api.vercel.app/api`
4. Deploy

---

## Free PostgreSQL Options

For deployment, use one of these free hosted PostgreSQL services:
- **Neon** (neon.tech) — 0.5GB free, serverless, great for Vercel
- **Supabase** (supabase.com) — 500MB free, includes dashboard
- **Railway** (railway.app) — $5 credit free tier

Get the connection string and use as `DATABASE_URL`.

---

## Architecture

```
splitpro/
├── backend/
│   ├── src/
│   │   ├── index.js              # Express entry point
│   │   ├── routes/index.js       # All API routes
│   │   ├── controllers/
│   │   │   ├── authController.js # Register, login, getMe
│   │   │   ├── groupController.js # CRUD groups + members
│   │   │   └── expenseController.js # Expenses, balances, settle
│   │   ├── services/
│   │   │   └── aiService.js      # Claude AI categorization + insights
│   │   ├── middleware/
│   │   │   └── auth.js           # JWT authentication middleware
│   │   └── utils/
│   │       └── db.js             # PostgreSQL connection pool
│   ├── schema.sql                # Database schema
│   └── vercel.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Router + protected routes
│   │   ├── context/AuthContext.jsx
│   │   ├── services/api.js       # API client
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx      # Login / Register
│   │   │   ├── DashboardPage.jsx # Groups overview
│   │   │   └── GroupPage.jsx     # Expenses, balances, insights
│   │   └── components/
│   │       ├── Layout.jsx        # Sidebar layout
│   │       ├── AddExpenseModal.jsx
│   │       ├── BalanceView.jsx
│   │       ├── ExpenseList.jsx
│   │       ├── InsightsPanel.jsx
│   │       └── ...
│   └── vercel.json
└── README.md
```

### Balance Calculation Algorithm

The debt simplification uses a **greedy creditor-debtor matching** approach:
1. Compute net balance for each user: `paid - owed + settlements_received - settlements_paid`
2. Separate into creditors (positive net) and debtors (negative net)
3. Sort both lists descending by amount
4. Greedily match largest creditor with largest debtor, creating a transaction for `min(credit, debt)`
5. This minimizes total number of transactions needed to settle

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | No | Create account |
| POST | /api/auth/login | No | Get JWT token |
| GET | /api/auth/me | Yes | Get current user |
| GET | /api/groups | Yes | List user's groups |
| POST | /api/groups | Yes | Create group |
| GET | /api/groups/:id | Yes | Get group + members |
| POST | /api/groups/:id/members | Yes | Add member by email |
| GET | /api/groups/:id/expenses | Yes | List expenses |
| POST | /api/expenses | Yes | Add expense |
| DELETE | /api/expenses/:id | Yes | Delete expense |
| GET | /api/groups/:id/balances | Yes | Get balances + suggested transactions |
| POST | /api/expenses/settle | Yes | Record settlement |
| POST | /api/ai/categorize | Yes | AI expense categorization |
| POST | /api/ai/insights | Yes | AI spending insights |

---

## License

MIT — Built for NeevAI SuperCloud internship assignment, 2026.
