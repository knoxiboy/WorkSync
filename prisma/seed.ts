import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding data...");

  // 1. Create Company
  const company = await prisma.company.upsert({
    where: { inviteCode: "DEMO123" },
    update: {},
    create: {
      name: "TechCorp",
      inviteCode: "DEMO123",
    },
  });

  // 2. Create Manager
  const manager = await prisma.user.upsert({
    where: { email: "arjun@techcorp.com" },
    update: {},
    create: {
      clerkId: "user_manager_123",
      name: "Arjun Sharma",
      email: "arjun@techcorp.com",
      role: "MANAGER",
      companyId: company.id,
    },
  });

  // 3. Create Employees
  const rahul = await prisma.user.upsert({
    where: { email: "rahul@techcorp.com" },
    update: {},
    create: {
      clerkId: "user_employee_1",
      name: "Rahul Verma",
      email: "rahul@techcorp.com",
      role: "EMPLOYEE",
      companyId: company.id,
    },
  });

  const priya = await prisma.user.upsert({
    where: { email: "priya@techcorp.com" },
    update: {},
    create: {
      clerkId: "user_employee_2",
      name: "Priya Patel",
      email: "priya@techcorp.com",
      role: "EMPLOYEE",
      companyId: company.id,
    },
  });

  // 4. Create Meeting
  const meeting = await prisma.meeting.create({
    data: {
      transcript: "Rahul will build the login API by Friday. Priya needs to complete the dashboard UI by next Monday. This is high priority for both.",
      companyId: company.id,
    },
  });

  // 5. Create Tasks
  await prisma.task.createMany({
    data: [
      {
        title: "Build the login API",
        owner: "Rahul",
        ownerId: rahul.id,
        deadline: "2026-03-27T00:00:00Z",
        priority: "high",
        status: "todo",
        meetingId: meeting.id,
      },
      {
        title: "Complete the dashboard UI",
        owner: "Priya",
        ownerId: priya.id,
        deadline: "2026-03-30T00:00:00Z",
        priority: "high",
        status: "todo",
        meetingId: meeting.id,
      },
      {
        title: "General project documentation",
        owner: "Arjun",
        ownerId: manager.id,
        deadline: null,
        priority: "medium",
        status: "in_progress",
        meetingId: meeting.id,
      },
    ],
  });

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
