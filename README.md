FinanceTracker
===========================

<img width="943" height="471" alt="landing-page" src="https://github.com/user-attachments/assets/78ff2e95-aa41-4571-a043-0128c4913fc6" />


This is a repository for a budget app that allows users to enter their income and expenses in order to budget more efficiently.

Structure
- packages/api: Express + TypeScript + Prisma (SQLite) backend
- packages/web: Vite + React + TypeScript frontend with Tailwind

-----

### Quick start
1. From repo root open two terminals.

2. Backend:
   - cd packages/api
   - npm install
   - copy .env and fill SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
   - npm run dev

3. Frontend:
   - cd packages/web
   - npm install
   - npm run dev
