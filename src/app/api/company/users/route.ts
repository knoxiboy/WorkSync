// NEW: src/app/api/company/users/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/neon";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUsers = await sql`SELECT "companyId" FROM "User" WHERE "clerkId" = ${userId} LIMIT 1`;
    const dbUser = dbUsers[0] as any;

    if (!dbUser?.companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 404 });
    }

    const users = await sql`
      SELECT id, name, "clerkId" FROM "User"
      WHERE "companyId" = ${dbUser.companyId}
    `;

    return NextResponse.json(users);
  } catch (error) {
    console.error("[COMPANY_USERS]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
