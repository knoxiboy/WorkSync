import { sql } from "@/lib/core/neon";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 1. Identify the unique constraint name for clerkId
    // Based on previous debug, it was "User_clerkId_key"
    await sql`ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_clerkId_key"`;
    
    return NextResponse.json({ message: "ClerkId unique constraint dropped successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
