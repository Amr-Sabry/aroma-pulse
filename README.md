# Aroma Pulse 🌟

**Creative Team Management System** — Built for Aroma Studios

## Tech Stack
- **Frontend:** Next.js 15 (App Router) + TypeScript
- **Styling:** Tailwind CSS + Custom Design System
- **Backend:** Firebase (Auth + Firestore)
- **Hosting:** Vercel
- **Icons:** Lucide React

## Features
- 🔐 Role-based login (Admin, Producer, Head, Creative Designer)
- ⏱️ Real-time time tracking & Studio Time Bank
- 📊 Live team status dashboard
- 📅 Gantt timeline for projects & tasks
- 🔔 Conflict detection (prevents double-booking designers)
- 🌅 Weekend rules (Fri/Sat exclusion for MENA region)
- 💾 Revision/Extension logging

## Getting Started

### 1. Firebase Setup
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create project: **Aroma Pulse**
3. Enable **Authentication** → Sign-in method → **Email/Password**
4. Create **Firestore Database** → Start in **Production mode**
5. Add your config to `.env.local` (see `.env.local.example`)

### 2. Seed Initial Data
After Firebase is configured, the system will initialize with sample data.

### 3. Environment Variables
Copy `.env.local.example` to `.env.local` and fill in your Firebase config.

### 4. Run Locally
```bash
npm install
npm run dev
```

## User Roles
| Role | Access |
|------|--------|
| **Admin** | Full studio overview + all management |
| **Producer** | Assigned projects + task creation |
| **Head** | Review queue + quality approval |
| **Creative** | Personal tasks only |

## License
Private — Aroma Studios © 2026
