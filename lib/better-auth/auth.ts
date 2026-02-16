import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { connectToDatabase } from "@/database/mongoose";
import { nextCookies } from "better-auth/next-js";
import type { Db } from "mongodb";

let authInstance: ReturnType<typeof betterAuth> | null = null;

export const getAuth = async () => {
  if (authInstance) return authInstance;

  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;

  if (!db) throw new Error("Failed to get database connection from mongoose");

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  authInstance = betterAuth({
    database: mongodbAdapter(db as unknown as Db),
    secret: process.env.BETTER_AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    baseURL:
      process.env.BETTER_AUTH_BASE_URL ??
      process.env.BETTER_AUTH_URL ??
      process.env.NEXTAUTH_URL,
    emailAndPassword: {
      enabled: true,
      disableSignUp: false,
      requiredEmailVerification: false,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      autoSignIn: true,
    },
    socialProviders:
      googleClientId && googleClientSecret
        ? {
            google: {
              clientId: googleClientId,
              clientSecret: googleClientSecret,
              prompt: "select_account",
            },
          }
        : {},
    plugins: [nextCookies()],
  });
  return authInstance;
};

export const auth = await getAuth();
