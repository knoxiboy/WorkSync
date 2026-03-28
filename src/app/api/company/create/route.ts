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
    const { name } = body;
    
    if (!name) {
      return new NextResponse("Missing name", { status: 400 });
    }
    
    const uName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User";
    const uEmail = user.emailAddresses[0].emailAddress;

    const inviteCode = randomBytes(4).toString('hex').toUpperCase();
    const newCompanies = await sql`
      INSERT INTO "Company" (id, name, "inviteCode", "createdAt")
      VALUES (${createId()}, ${name}, ${inviteCode}, NOW())
      RETURNING *
    `;
    const company = newCompanies[0] as any;

    // Create a new User profile for this specific company
    await sql`
      INSERT INTO "User" (id, "clerkId", name, email, "companyId", role, "createdAt")
      VALUES (${createId()}, ${userId}, ${uName}, ${uEmail}, ${company.id}, 'MANAGER', NOW())
    `;

    return NextResponse.json(company);
  } catch (error) {
    console.error("[COMPANY_CREATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
