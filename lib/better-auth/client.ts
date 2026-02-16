"use client";

import { createAuthClient } from "better-auth/react";

const resolvedBaseUrl =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_BETTER_AUTH_BASE_URL ??
      `${window.location.origin}/api/auth`
    : process.env.NEXT_PUBLIC_BETTER_AUTH_BASE_URL ??
      "http://localhost:3000/api/auth";

export const authClient = createAuthClient({
  baseURL: resolvedBaseUrl,
});
