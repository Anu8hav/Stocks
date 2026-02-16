"use client";

import { createAuthClient } from "better-auth/react";

const resolvedBaseUrl =
  process.env.NEXT_PUBLIC_BETTER_AUTH_BASE_URL ??
  (typeof window !== "undefined"
    ? `${window.location.origin}/api/auth`
    : "http://localhost:3000/api/auth");

export const authClient = createAuthClient({
  baseURL: resolvedBaseUrl,
});
