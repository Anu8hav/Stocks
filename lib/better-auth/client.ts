"use client";

import { createAuthClient } from "better-auth/react";

const resolvedBaseUrl =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_BETTER_AUTH_BASE_URL ??
      `${window.location.origin}/api/auth`)
    : (process.env.NEXT_PUBLIC_BETTER_AUTH_BASE_URL ??
      "http://localhost:3000/api/auth");

console.log("Auth Base URL:", resolvedBaseUrl);
console.log("Env var:", process.env.NEXT_PUBLIC_BETTER_AUTH_BASE_URL);
console.log(
  "Window origin:",
  typeof window !== "undefined" ? window.location.origin : "N/A",
);

export const authClient = createAuthClient({
  baseURL: resolvedBaseUrl,
});
