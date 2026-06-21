# 🤖 AI Interview Platform

> Practice real interview questions, get instant AI-powered feedback, and walk into your next interview with confidence.

**🌐 Live Demo → [ai-interview-platform-eta-green.vercel.app](https://ai-interview-platform-eta-green.vercel.app)**

---

## ✨ What It Does

The AI Interview Platform simulates role-based mock interviews in your browser. You answer questions by voice, the AI evaluates your responses in real time, and you get a detailed scorecard with metrics, strengths, and areas to improve — all powered by Google Gemini.

Beyond solo practice, you can track your progress over time, simulate company-specific interview styles, share your results, and even run a **live video mock interview with a friend** — no account needed for them to join.

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router v7, Recharts, Framer Motion |
| Backend | Node.js, Express, Socket.io |
| Real-time / Video | WebRTC (peer-to-peer), Socket.io signaling |
| Database | MongoDB + Mongoose |
| AI Engine | Google Gemini API (`@google/generative-ai`, `gemini-2.5-flash`) |
| Auth | JWT + bcryptjs |
| File Storage | Cloudinary (resume uploads) |
| Styling | Custom CSS, dark-mode-first design system |
| Deployment | Vercel (frontend) + Render (backend) |

---

## 📁 Project Structure

```
ai-interview-platform/
├── client/                       # React frontend (Vite)
│   ├── vercel.json                  # SPA rewrite rules (fixes deep-link 404s)
│   └── src/
│       ├── pages/
│       │   ├── Home.jsx                # Landing page
│       │   ├── Roles.jsx               # Role selection
│       │   ├── InterviewSetup.jsx      # Difficulty, company mode, device check
│       │   ├── InterviewRoom.jsx       # Live interview (mic/camera, speech-to-text)
│       │   ├── Feedback.jsx            # Per-question AI feedback
│       │   ├── ScoreCard.jsx           # Post-interview score summary + share
│       │   ├── ScoreCardDetail.jsx     # History detail view + share
│       │   ├── InterviewHistory.jsx    # All past interviews + charts
│       │   ├── Dashboard.jsx           # User dashboard
│       │   ├── Progress.jsx            # Streaks, score trends, weak-topic analysis
│       │   ├── Profile.jsx             # Resume upload, skills, preferences
│       │   ├── FriendRoomCreate.jsx    # Host: create a friend-interview room
│       │   ├── FriendRoomJoin.jsx      # Guest: join via link (no login)
│       │   ├── FriendCallRoom.jsx      # Live WebRTC video call + synced questions
│       │   ├── Login.jsx / Signup.jsx
│       │   └── ...
│       ├── hooks/
│       │   ├── useRecorder.js          # Web Speech API transcription
│       │   └── useWebRTC.js            # WebRTC + Socket.io signaling client
│       ├── utils/
│       │   ├── analyzeAnswer.js        # Scores transcript (confidence/clarity/sentiment)
│       │   └── scorecardImage.js       # Canvas-based shareable scorecard image
│       ├── context/
│       │   ├── InterviewContext.jsx    # Global interview state
│       │   └── ThemeContext.jsx        # Light / Dark mode
│       └── styles/                 # Per-page CSS files
│
└── server/                       # Express backend
    └── src/
        ├── models/
        │   ├── User.js                   # incl. streak tracking
        │   ├── Interview.js               # incl. per-answer topic tags, company
        │   └── FriendInterviewRoom.js     # Friend-interview rooms (24h TTL)
        ├── routes/
        │   ├── authRoutes.js
        │   ├── interviewRoutes.js          # incl. /progress
        │   ├── userRoutes.js
        │   ├── aiRoutes.js                 # incl. /companies
        │   └── friendRoomRoutes.js
        ├── controllers/
        │   ├── interviewController.js      # incl. getProgress, streak logic
        │   ├── aiController.js
        │   └── friendRoomController.js
        ├── sockets/
        │   └── signalingServer.js          # WebRTC offer/answer/ICE relay
        ├── services/
        │   ├── questionGenerator.js        # Gemini question generation (+ company style)
        │   └── feedbackGenerator.js        # AI answer evaluation
        ├── data/
        │   └── companyProfiles.js          # Google/Amazon/Microsoft/Meta/Netflix profiles
        ├── utils/
        │   └── topicTagger.js              # Keyword-based topic classification
        ├── config/
        │   └── gemini.js                   # Gemini model config
        └── server.js                       # Express + Socket.io shared HTTP server
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
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

> ⚠️ `CLIENT_URL` supports multiple comma-separated origins (e.g. `http://localhost:5173,https://your-app.vercel.app`) — required for CORS to allow both local dev and your deployed frontend.

Start the server:

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The server runs on `http://localhost:5000` by default. If the port is in use, it automatically retries on `5001`. Socket.io (used for Friend Interview video calls) shares the same port.

---

### 3. Set up the client

```bash
cd ../client
npm install
```

Create a `.env` file inside `/client`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the dev server:

```bash
npm run dev
```

The frontend runs on `http://localhost:5173`.

> ⚠️ Camera/microphone access (required for interviews and Friend Interview calls) requires a secure context. `localhost` is allowed by browsers, but if testing across devices, both the client and a deployed backend must be served over **HTTPS**.

---

## 🗺️ App Pages

| Route | Page | Description |
|---|---|---|
| `/` | Home | Landing page with features, stats, testimonials |
| `/roles` | Roles | Pick your target job role |
| `/interview-setup/:role` | Interview Setup | Difficulty, **Company Mode**, device check |
| `/interview-room/:role` | Interview Room | Live session with timer and voice recording |
| `/feedback/:role` | Feedback | AI breakdown of each answer |
| `/scorecard/:role` | Score Card | Score summary + **Share / Download / Post to LinkedIn** |
| `/interview/:id` | Score Card Detail | Past interview detail + share |
| `/interview-history` | Interview History | Past interviews with charts and filters |
| `/dashboard` | Dashboard | Personal stats and quick actions |
| `/progress` | Progress | **Streaks, score trends, weak-topic analysis** |
| `/profile` | Profile | Resume upload, skills, GitHub repos |
| `/friend-interview/create` | Create Friend Room | Host sets up a live mock interview (auth required) |
| `/friend-interview/join/:code` | Join Friend Room | Guest joins via link — **no account needed** |
| `/friend-interview/room/:code` | Call Room | Live WebRTC video call with synced questions |
| `/login` | Login | JWT-based authentication |
| `/signup` | Sign Up | Create a new account |

---

## 🎨 Theme

The app supports **Light** and **Dark** modes. The default is dark. The theme is toggled via a button in the navbar and persisted in `localStorage`.

Dark mode: `#080c14` deep navy with neon green (`#00f5a0`) accents.
Light mode: Clean white/slate with blue accents.

---

## 🤖 AI Features

**Question Generation** — Gemini generates fresh, role-specific interview questions tailored to difficulty (Easy / Medium / Hard), with a large shuffled fallback pool if the API is unavailable.

**Company-Specific Mode** — Simulate the interview style of Google, Amazon, Microsoft, Meta, Netflix, or a generic startup. Each profile biases question generation toward that company's publicly known interview emphases (e.g. Amazon's Leadership Principles, Google's algorithmic depth).

**Answer Evaluation** — Each spoken answer is scored across multiple dimensions: confidence, clarity, sentiment, and relevance, based on the live transcript.

**Feedback Report** — A detailed per-question breakdown with strengths and study recommendations.

**Resume-Aware Questions** — Optionally tailor 1–2 questions per session to your uploaded resume/background.

---

## 📈 Progress, Streaks & Weak Topics

The `/progress` page tracks your growth over time:

- **🔥 Streak system** — daily streak counter with longest-streak record, updated automatically each time you complete an interview
- **Score trend chart** — your last 20 sessions visualized
- **Role breakdown** — average score per role you've practiced
- **Weak-topic analysis** — keyword-based topic tagging (React, SQL, System Design, Security, Algorithms, etc.) surfaces your lowest-scoring patterns once a topic appears in 2+ answers, with a linked study resource for each

---

## 📤 Share Your Scorecard

After any interview (or from your History), generate a "Wrapped"-style shareable scorecard image — rendered client-side with the Canvas API, no external dependencies:

- **Share** — uses the native mobile share sheet where available
- **Download** — saves a PNG you can post anywhere
- **Post to LinkedIn** — downloads the image and opens LinkedIn's share dialog

---

## 👥 Mock Interview with a Friend

Run a live, two-person video mock interview:

1. A logged-in user creates a room (`/friend-interview/create`), choosing role, difficulty, and who plays interviewer vs. candidate
2. A unique 6-character room code + shareable link is generated
3. The other person opens the link and joins **as a guest — no account required**
4. Both connect via **WebRTC** (peer-to-peer video/audio) with **Socket.io** handling signaling
5. The interviewer drives a synced question panel (both see the same question at the same time), can rate each answer 1–5 stars, and leave private notes
6. A built-in text chat works as a fallback if audio has issues
7. Rooms auto-expire after 24 hours (MongoDB TTL index)

**Known limitation:** the app uses a public STUN server (no TURN server configured), so most home/office network pairs connect directly without issue, but some restrictive networks (certain corporate firewalls or mobile carriers) may fail to establish a peer-to-peer connection. Adding TURN support (e.g. via Twilio or Metered.ca) would resolve this for the remaining edge cases.

---

## 🔐 Authentication

JWT-based auth with tokens stored in `localStorage`. Protected routes redirect unauthenticated users to `/login`. Passwords are hashed with bcryptjs. Friend Interview guest access is intentionally separate from this system — no account is created or required to join a room as a guest.

---

## 📊 Interview History & Analytics

The history page shows all past interviews with recharts-powered visualizations — score trends over time, difficulty distribution, role breakdown, and per-question performance. Each entry links to a detail view with the same sharing options as a freshly completed interview.

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

### Server (`/server/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: 5000) |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret key for signing JWTs |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `CLIENT_URL` | Yes | Comma-separated allowed frontend origin(s), for CORS |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary account name (resume uploads) |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret |

### Client (`/client/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes | Backend API base URL, e.g. `https://your-backend.onrender.com/api` |

> 💡 On Vercel, environment variables are baked in at **build time** — after changing `VITE_API_URL`, trigger a redeploy for the change to take effect.

---

## 🛣️ Roadmap

- [x] Resume parsing for personalized questions
- [x] Peer interview mode (2-player, live video)
- [x] Progress dashboard with streaks & weak-topic analysis
- [x] Shareable "Wrapped"-style scorecards
- [x] Company-specific interview simulation
- [ ] Video recording & playback of interviews
- [ ] TURN server support for restrictive networks
- [ ] Email reports after each session
- [ ] Mobile app (React Native)
