This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Authentication (Better Auth + Google OAuth)

1. Copy `.env.example` to `.env` and set all values.
2. In Google Cloud Console → Credentials → OAuth Client ID (Web application):
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URI (local): `http://localhost:3000/api/auth/callback/google`
   - Authorized redirect URI (prod): `https://your-domain.com/api/auth/callback/google`
3. Ensure these env vars are set:
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   - `BETTER_AUTH_SECRET` (or `NEXTAUTH_SECRET` fallback)
   - `BETTER_AUTH_BASE_URL` (or `BETTER_AUTH_URL` / `NEXTAUTH_URL` fallback)
   - `NEXT_PUBLIC_BETTER_AUTH_BASE_URL` (usually `http://localhost:3000/api/auth`)

Notes:

- Better Auth handles OAuth state/CSRF protection and PKCE internally for OAuth flows.
- Social sign-in records are persisted in Mongo collections through the Better Auth adapter.
- Google account linkage is handled via Better Auth's `account` records keyed by provider/provider account ID.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
