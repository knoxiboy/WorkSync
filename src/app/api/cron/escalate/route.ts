import { NextResponse } from "next/server";
import { runEscalationCheck } from "@/lib/escalation";

export async function GET(req: Request) {
  // Simple secret check for "cron" (in production use a real auth header or Vercel Cron secret)
  const authHeader = req.headers.get("authorization");
  if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const result = await runEscalationCheck();
  return NextResponse.json(result);
}
