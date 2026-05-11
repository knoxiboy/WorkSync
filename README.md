<div align="center">
  <img src="https://via.placeholder.com/1200x300/020617/38bdf8?text=WorkSyncAI" alt="WorkSyncAI Banner">
</div>

# WorkSyncAI 

> **AI-Powered Workspace Orchestration & Team Performance Intelligence.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-Online-00C7B7?style=for-the-badge&logo=vercel)](#)
[![Documentation](https://img.shields.io/badge/Docs-Read-blue?style=for-the-badge&logo=read-the-docs)](#)
[![License](https://img.shields.io/badge/license-MIT-purple.svg?style=for-the-badge)](LICENSE)

---

## Preview

<div align="center">
  <img src="https://via.placeholder.com/800x400/0f172a/38bdf8?text=Manager+Dashboard" alt="WorkSyncAI Dashboard">
  <p><i>Transforming meetings into accountability.</i></p>
</div>

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Solution Overview](#solution-overview)
- [Core Features](#core-features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation Guide](#installation-guide)
- [AI Validation Pipeline](#ai-validation-pipeline)
- [Performance Optimization](#performance-optimization)
- [Roadmap](#roadmap)

---

## Problem Statement

Agile teams bleed productivity during status updates. Meetings result in massive, unorganized transcripts, ambiguous action items, and lost accountability. Managers spend hours manually tracking whether assigned tasks match the code actually merged in GitHub Pull Requests. 

---

## Solution Overview

**WorkSyncAI** is an end-to-end orchestration platform for high-velocity engineering teams. It bridges the gap between *what is discussed* and *what is built*.

It listens to meetings, extracts precise action items, assigns them, tracks them in a Kanban board, and then **autonomously evaluates GitHub Pull Requests** to ensure the code actually fulfills the meeting's requirements.

---

## Core Features

### 🎙️ Live AI Transcription & Extraction
- **What it does**: Real-time speech-to-text during meetings, automatically summarizing and extracting Action Items.
- **Why it matters**: Zero manual note-taking.
- **Technical implementation**: Standard Web Speech APIs piped into an LLM for semantic extraction.

### 🤖 Ambiguity Detection
- **What it does**: The AI pauses and asks for clarification if a task owner or deadline is missing.
- **Why it matters**: Prevents "floating" tasks that no one takes responsibility for.

### 💻 Automated PR Evaluation
- **What it does**: When a developer opens a PR, WorkSyncAI reads the diff and compares it against the original task generated from the meeting.
- **Why it matters**: Automates Code Review and ensures feature completeness.
- **Technical implementation**: GitHub Webhooks linked to a specialized code-evaluator LLM agent.

### 📊 Manager Dashboard & Proactive Nudges
- **What it does**: Visualizes team velocity and automatically sends follow-ups for at-risk SLAs.
- **Why it matters**: Keeps sprints on track without micromanagement.

---

## System Architecture

<div align="center">
  <img src="https://via.placeholder.com/800x400/020617/38bdf8?text=Data+Flow+Architecture" alt="Architecture Diagram">
</div>

### Data Flow
1. **Ingestion**: Audio captured on frontend -> Transcribed -> LLM extracts Tasks.
2. **Storage**: Tasks stored in PostgreSQL via Prisma.
3. **Action**: Developer pushes code -> GitHub Webhook triggers Next.js API.
4. **Validation**: AI evaluates PR Diff vs. Database Task constraints.
5. **Feedback**: AI comments directly on the GitHub PR.

---

## Tech Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| **Frontend** | Next.js 16 (App Router), Tailwind | Responsive, server-rendered UI |
| **Backend** | Next.js Server Actions | API logic and Webhooks |
| **Database** | PostgreSQL, Prisma ORM | Relational data integrity |
| **Authentication** | Clerk | Enterprise-grade auth |
| **AI/LLM** | OpenAI API | Extraction and Code Evaluation |

---

## Project Structure

```bash
WorkSync/
 ┣ prisma/         # Database schema and migrations
 ┣ src/
 ┃ ┣ app/          # App Router pages
 ┃ ┣ components/   # UI blocks
 ┃ ┣ lib/          # Utilities and Prisma client
 ┃ ┗ proxy.ts      # Edge middleware configurations
```

---

## Installation Guide

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL Database
- Clerk Account

### 2. Clone & Install
```bash
git clone https://github.com/your-org/WorkSync.git
cd WorkSync
npm install
```

### 3. Setup Database & Env
Set up `.env` with `DATABASE_URL` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.
```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```

---

## AI Validation Pipeline (Crucial)

WorkSyncAI's most innovative feature is its **Code Validation Agent**.
When a PR is submitted, the pipeline:
1. **Fetches Context**: Retrieves the specific task ticket, including the transcript context from the original meeting.
2. **Diff Analysis**: Pulls the `git diff` from the PR.
3. **Chain of Thought**: The LLM evaluates: *Did the developer implement X? Did they handle Y edge case discussed in the meeting?*
4. **Outcome**: The AI approves the PR or requests changes, directly injecting context from the meeting into the PR comments.

---

## Performance Optimization

- **Edge Middleware**: Authentication state is checked at the edge using Clerk, ensuring instant redirects for unauthenticated users.
- **Optimistic UI**: Task state updates (e.g., moving a Kanban card) are immediate on the client side while the server syncs in the background.

---

## Roadmap

- [x] Live Transcription & Extraction
- [x] Basic GitHub PR Evaluation
- [ ] Slack/Microsoft Teams Bot Integration
- [ ] Advanced Developer Velocity Metrics

---

## License

This project is licensed under the MIT License.

---
<div align="center">
<i>Zero-friction execution loops for elite teams.</i>
</div>
