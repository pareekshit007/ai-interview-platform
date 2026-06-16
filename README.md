# 🤖 AI Interview Platform

> Practice real interview questions, get instant AI-powered feedback, and walk into your next interview with confidence.

---

## ✨ What It Does

The AI Interview Platform simulates role-based mock interviews in your browser. You answer questions by voice or text, the AI evaluates your responses in real time, and you get a detailed scorecard with metrics, strengths, and areas to improve — all powered by Google Gemini.

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router v7, Recharts, Framer Motion |
| Backend | Node.js, Express |
| Database | MongoDB + Mongoose |
| AI Engine | Google Gemini API (`@google/generative-ai`) |
| Auth | JWT + bcryptjs |
| Styling | Custom CSS with full Light / Dark theme support |

---

## 📁 Project Structure

```
ai-interview-platform/
├── client/                   # React frontend (Vite)
│   └── src/
│       ├── pages/
│       │   ├── Home.jsx          # Landing page
│       │   ├── Roles.jsx         # Role selection
│       │   ├── InterviewSetup.jsx  # Difficulty & device config
│       │   ├── InterviewRoom.jsx   # Live interview (mic/camera)
│       │   ├── Feedback.jsx        # Per-question AI feedback
│       │   ├── ScoreCard.jsx       # Overall score summary
│       │   ├── ScoreCardDetail.jsx # Flip card detail view
│       │   ├── InterviewHistory.jsx # All past interviews + charts
│       │   ├── Dashboard.jsx       # User dashboard
│       │   ├── Profile.jsx         # Resume, skills, preferences
│       │   ├── Login.jsx / Signup.jsx
│       │   └── ...
│       ├── context/
│       │   ├── InterviewContext.jsx  # Global interview state
│       │   └── ThemeContext.jsx      # Light / Dark mode
│       └── styles/               # Per-page CSS files
│
└── server/                   # Express backend
    └── src/
        ├── models/
        │   ├── User.js
        │   ├── Interview.js
        │   ├── Question.js
        │   ├── Answer.js
        │   └── Feedback.js
        ├── routes/
        │   ├── authRoutes.js
        │   ├── interviewRoutes.js
        │   ├── userRoutes.js
        │   └── aiRoutes.js
        ├── services/
        │   ├── questionGenerator.js  # Gemini-powered question generation
        │   ├── feedbackGenerator.js  # AI answer evaluation
        │   └── speechToText.js       # Voice transcription
        └── server.js
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

---

### 1. Clone the repo

```bash
git clone https://github.com/your-username/ai-interview-platform.git
cd ai-interview-platform
```

---

### 2. Set up the server

```bash
cd server
npm install
```

Create a `.env` file inside `/server`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ai-interview
JWT_SECRET=your_jwt_secret_here
GEMINI_API_KEY=your_gemini_api_key_here
```

Start the server:

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The server runs on `http://localhost:5000` by default. If the port is in use, it automatically retries on `5001`.

---

### 3. Set up the client

```bash
cd ../client
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`.

---

## 🗺️ App Pages

| Route | Page | Description |
|---|---|---|
| `/` | Home | Landing page with features, stats, testimonials |
| `/roles` | Roles | Pick your target job role |
| `/setup` | Interview Setup | Choose difficulty, configure mic & camera |
| `/interview` | Interview Room | Live session with timer and voice recording |
| `/feedback` | Feedback | AI breakdown of each answer |
| `/scorecard` | Score Card | Overall score with flip card detail view |
| `/history` | Interview History | Past interviews with charts and filters |
| `/dashboard` | Dashboard | Personal stats and quick actions |
| `/profile` | Profile | Resume upload, skills, GitHub repos |
| `/login` | Login | JWT-based authentication |
| `/signup` | Sign Up | Create a new account |

---

## 🎨 Theme

The app supports **Light** and **Dark** modes. The default is dark. The theme is toggled via a button in the navbar and persisted in `localStorage`.

Dark mode: `#080c14` deep navy with neon green (`#00f5a0`) accents.
Light mode: Clean white/slate with blue accents.

---

## 🤖 AI Features

**Question Generation** — Gemini generates role-specific interview questions tailored to the selected difficulty (Easy / Medium / Hard).

**Answer Evaluation** — Each spoken or typed answer is scored across multiple dimensions: relevance, depth, clarity, and confidence. Scores are aggregated into a final verdict.

**Feedback Report** — A detailed per-question breakdown with what you did well and what to improve.

---

## 🔐 Authentication

JWT-based auth with tokens stored in `localStorage`. Protected routes redirect unauthenticated users to `/login`. Passwords are hashed with bcryptjs.

---

## 📊 Interview History & Analytics

The history page shows all past interviews with recharts-powered visualizations — score trends over time, difficulty distribution, role breakdown, and per-question performance.

---

## 📦 Available Scripts

### Server

| Script | Command |
|---|---|
| Start (production) | `npm start` |
| Start (development) | `npm run dev` |

### Client

| Script | Command |
|---|---|
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Preview build | `npm run preview` |
| Lint | `npm run lint` |

---

## 🌱 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: 5000) |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret key for signing JWTs |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |

---

## 🛣️ Roadmap

- [ ] Resume parsing for personalized questions
- [ ] Video recording & playback of interviews
- [ ] Peer interview mode (2-player)
- [ ] Email reports after each session
- [ ] Mobile app (React Native)

