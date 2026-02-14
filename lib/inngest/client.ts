import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "stocks-app",
  ai: { gemini: { apikey: process.env.GEMINI_API_KEY } },
});
