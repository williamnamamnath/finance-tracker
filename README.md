FinanceTracker
===========================

This is a repository for a budget app that allows users to enter their income and expenses in order to budget more efficiently.

Structure
- packages/api: Express + TypeScript + Prisma (SQLite) backend
- packages/web: Vite + React + TypeScript frontend with Tailwind

Note: This scaffold can use Supabase as the database. See packages/api/.env and packages/api/supabase.sql for schema.

Quick start
1. From repo root open two terminals.
2. API:
   cd packages/api
   npm install
   copy .env .env and fill SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
   npm run dev
3. Web:
   cd packages/web
   npm install
   npm run dev
