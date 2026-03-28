import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { sql } from "@/lib/core/neon";
import { randomBytes } from "crypto";

const createId = () => randomBytes(12).toString('hex');

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    
    if (!userId || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const body = await req.json();
    const { inviteCode } = body;
    
    if (!inviteCode) {
      return new NextResponse("Missing invite code", { status: 400 });
    }
    
    const companies = await sql`SELECT * FROM "Company" WHERE "inviteCode" = ${inviteCode} LIMIT 1`;
    const company = companies[0] as any;

    if (!company) {
      return new NextResponse("Invalid invite code", { status: 404 });
    }

    // Check if user already has a profile in THIS company
    const existing = await sql`
      SELECT id FROM "User" 
      WHERE "clerkId" = ${userId} AND "companyId" = ${company.id} 
      LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json(company); // Already a member
    }

    const uName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User";
    const uEmail = user.emailAddresses[0].emailAddress;

    // Create a NEW profile for this company
    await sql`
      INSERT INTO "User" (id, "clerkId", name, email, "companyId", role, "createdAt")
      VALUES (${createId()}, ${userId}, ${uName}, ${uEmail}, ${company.id}, 'EMPLOYEE', NOW())
    `;

    return NextResponse.json(company);
  } catch (error) {
    console.error("[COMPANY_JOIN]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
