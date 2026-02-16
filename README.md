# Stocks App (Next.js + Better Auth + MongoDB)

A modern stock tracking app with authentication, watchlists, stock detail pages, technical analysis widgets, and personalized email workflows.

## Key Features

- Email/password authentication with Better Auth
- Google Sign-In / Sign-Up with OAuth callback flow
- Protected routes with middleware + server session checks
- Watchlist management (add/remove, list view, quick actions)
- Stock details page with chart, peers, metrics, and news
- Technical Analysis panel on both watchlist and stock details pages
- MongoDB persistence for users and watchlist data
- Inngest-based background workflows for personalized email/news tasks

## Project Note

This app was built with the help of a YouTube tutorial, but many features were implemented independently and bugs were fixed individually during development.

## Tech Stack

- Next.js 16 (App Router + Turbopack)
- TypeScript
- Better Auth
- MongoDB + Mongoose
- Tailwind CSS
- Inngest
- TradingView embedded widgets

## Prerequisites (Beginner Friendly)

Install these first:

- Node.js (recommended v20+)
- npm (comes with Node.js)
- Git
- A MongoDB database URI (MongoDB Atlas is easiest)
- A Finnhub API key
- (Optional but recommended) Google OAuth credentials for Google Sign-In

## 1) Clone and Install

```bash
git clone https://github.com/Anu8hav/Stocks.git
cd Stocks
npm install
```

## 2) Create Environment File

Copy `.env.example` to `.env` and fill in values.

### Required env vars

```env
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000

MONGO_URI=your_mongodb_uri

BETTER_AUTH_SECRET=your_secret
BETTER_AUTH_BASE_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_BASE_URL=http://localhost:3000/api/auth

NEXT_PUBLIC_FINNHUB_API_KEY=your_finnhub_key

GEMINI_API_KEY=your_gemini_key
NODEMAILER_EMAIL=your_email
NODEMAILER_PASSWORD=your_email_app_password
```

### Google OAuth (if using Google Sign-In)

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

In Google Cloud Console > OAuth Client (Web application), set:

- Authorized JavaScript origin: `http://localhost:3000`
- Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

## 3) Run the App

```bash
npm run dev
```

Then open:

- `http://localhost:3000`

## 4) Optional: Run Inngest Dev

In a separate terminal:

```bash
npx inngest-cli@latest dev
```

## Common Issues and Quick Fixes

### 1) Port 3000 not starting / lock issue

```bash
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
if (Test-Path .next\dev\lock) { Remove-Item .next\dev\lock -Force }
npm run dev
```

### 2) Google auth failed

Check these exactly:

- `BETTER_AUTH_BASE_URL=http://localhost:3000`
- `NEXT_PUBLIC_BETTER_AUTH_BASE_URL=http://localhost:3000/api/auth`
- Redirect URI in Google Console matches exactly

### 3) Build/type errors

```bash
npx tsc --noEmit
```

## Scripts

```bash
npm run dev     # Start dev server
npm run build   # Production build
npm run start   # Start production server
npm run lint    # ESLint
```

## Making Changes

- Most routes are under `app/`
- Shared UI components are in `components/`
- Server actions are in `lib/actions/`
- Auth config is in `lib/better-auth/auth.ts`
- Global types are in `types/global.d.ts`

After editing files, run:

```bash
npx tsc --noEmit
npm run lint
```

## License

This project currently has no explicit license file.
