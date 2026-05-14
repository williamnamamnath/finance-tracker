FinanceTracker (Budget App)
===========================

This repository contains a minimal full-stack scaffold for FinanceTracker (budget app) based on the planning notes in the planning folder.

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
   Optional: run the SQL in packages/api/supabase.sql against your Supabase project's SQL editor to create tables and RPC function
   npm run dev
3. Web:
   cd packages/web
   npm install
   npm run dev

Notes
- API uses Supabase when the expected tables exist and falls back to local file storage for local development when they do not.
- If the Supabase users and transactions tables are missing, the API now falls back to local file storage in packages/api/data/store.json so signup and the dashboard still work locally.
- Authentication is JWT-based (simple, for demo). In production use HTTPS, secrets management, refresh tokens.
