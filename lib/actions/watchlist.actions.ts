"use server";

import { connectToDatabase } from "@/database/mongoose";
import { Watchlist } from "@/database/models/watchlist.model";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export interface PersistedWatchlistStock {
  id: string;
  symbol: string;
  company: string;
  addedAt: string;
}

export async function getWatchlistSymbolsByEmail(
  email: string,
): Promise<string[]> {
  if (!email) return [];

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("MongoDB connection not found");

    // Better Auth stores users in the "user" collection
    const user = await db
      .collection("user")
      .findOne<{ _id?: unknown; id?: string; email?: string }>({ email });

    if (!user) return [];

    const userId = (user.id as string) || String(user._id || "");
    if (!userId) return [];

    const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
    return items.map((i) => String(i.symbol));
  } catch (err) {
    console.error("getWatchlistSymbolsByEmail error:", err);
    return [];
  }
}

async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id || !session?.user?.email) return null;

  return {
    id: session.user.id,
    email: session.user.email,
  };
}

export async function getCurrentUserWatchlist(): Promise<
  PersistedWatchlistStock[]
> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return [];

  try {
    await connectToDatabase();
    const items = await Watchlist.find(
      { userId: currentUser.id },
      { symbol: 1, company: 1, addedAt: 1 },
    )
      .sort({ addedAt: -1 })
      .lean();

    return items.map((item) => ({
      id: String(item._id),
      symbol: String(item.symbol || "").toUpperCase(),
      company: String(item.company || item.symbol || ""),
      addedAt: item.addedAt
        ? new Date(item.addedAt).toISOString()
        : new Date().toISOString(),
    }));
  } catch (err) {
    console.error("getCurrentUserWatchlist error:", err);
    return [];
  }
}

export async function isSymbolInWatchlist(symbol: string): Promise<boolean> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return false;

  try {
    await connectToDatabase();
    const normalized = symbol.trim().toUpperCase();
    const exists = await Watchlist.exists({
      userId: currentUser.id,
      symbol: normalized,
    });

    return Boolean(exists);
  } catch (err) {
    console.error("isSymbolInWatchlist error:", err);
    return false;
  }
}

export async function addStockToWatchlist(symbol: string, company: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    await connectToDatabase();
    const normalized = symbol.trim().toUpperCase();

    await Watchlist.updateOne(
      { userId: currentUser.id, symbol: normalized },
      {
        $set: {
          userId: currentUser.id,
          symbol: normalized,
          company,
        },
        $setOnInsert: {
          addedAt: new Date(),
        },
      },
      { upsert: true },
    );

    revalidatePath(`/stocks/${normalized}`);
    revalidatePath("/watchlist");

    return { success: true };
  } catch (err) {
    console.error("addStockToWatchlist error:", err);
    return { success: false, message: "Failed to add stock" };
  }
}

export async function removeStockFromWatchlist(symbol: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    await connectToDatabase();
    const normalized = symbol.trim().toUpperCase();

    await Watchlist.deleteOne({ userId: currentUser.id, symbol: normalized });

    revalidatePath(`/stocks/${normalized}`);
    revalidatePath("/watchlist");

    return { success: true };
  } catch (err) {
    console.error("removeStockFromWatchlist error:", err);
    return { success: false, message: "Failed to remove stock" };
  }
}

export async function removeManyFromWatchlist(symbols: string[]) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, message: "Unauthorized" };
  }

  const normalizedSymbols = Array.from(
    new Set(
      (symbols || [])
        .map((symbol) => symbol.trim().toUpperCase())
        .filter(Boolean),
    ),
  );

  if (normalizedSymbols.length === 0) {
    return { success: true };
  }

  try {
    await connectToDatabase();
    await Watchlist.deleteMany({
      userId: currentUser.id,
      symbol: { $in: normalizedSymbols },
    });

    revalidatePath("/watchlist");
    return { success: true };
  } catch (err) {
    console.error("removeManyFromWatchlist error:", err);
    return { success: false, message: "Failed to remove selected stocks" };
  }
}

export async function clearCurrentUserWatchlist() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    await connectToDatabase();
    await Watchlist.deleteMany({ userId: currentUser.id });

    revalidatePath("/watchlist");
    return { success: true };
  } catch (err) {
    console.error("clearCurrentUserWatchlist error:", err);
    return { success: false, message: "Failed to clear watchlist" };
  }
}
