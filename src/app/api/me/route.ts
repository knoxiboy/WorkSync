import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/core/neon";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

    const profiles = await sql`
      SELECT u.*, row_to_json(c.*) as company
      FROM "User" u
      LEFT JOIN "Company" c ON u."companyId" = c.id
      WHERE u."clerkId" = ${clerkId}
      ORDER BY u."createdAt" DESC
    `;

    return NextResponse.json(profiles);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
