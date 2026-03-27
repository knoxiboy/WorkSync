import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { sql } from "@/lib/neon";
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
    
    const dbUsers = await sql`SELECT * FROM "User" WHERE "clerkId" = ${userId} LIMIT 1`;
    let dbUser = dbUsers[0] as any;

    if (!dbUser) {
      const uName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User";
      const uEmail = user.emailAddresses[0].emailAddress;
      const newUsers = await sql`
        INSERT INTO "User" (id, "clerkId", name, email, "createdAt")
        VALUES (${createId()}, ${userId}, ${uName}, ${uEmail}, NOW())
        RETURNING *
      `;
      dbUser = newUsers[0];
    }

    const companies = await sql`SELECT * FROM "Company" WHERE "inviteCode" = ${inviteCode} LIMIT 1`;
    const company = companies[0] as any;

    if (!company) {
      return new NextResponse("Invalid invite code", { status: 404 });
    }

    await sql`
      UPDATE "User"
      SET "companyId" = ${company.id}, role = 'EMPLOYEE'
      WHERE id = ${dbUser.id}
    `;

    return NextResponse.json(company);
  } catch (error) {
    console.error("[COMPANY_JOIN]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
