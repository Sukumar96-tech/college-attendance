import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seed...");

  /*
   * ----------------------------------------------------
   * ADMIN USER
   * ----------------------------------------------------
   */

  const adminPassword = await bcrypt.hash(
    "admin123",
    12
  );

  const admin = await prisma.user.upsert({
    where: {
      username: "admin",
    },
    update: {
      passwordHash: adminPassword,
      role: "ADMIN",
      status: "APPROVED",
    },
    create: {
      username: "admin",
      passwordHash: adminPassword,
      role: "ADMIN",
      status: "APPROVED",
    },
  });

  console.log(
    `Admin user ready: ${admin.username}`
  );

  /*
   * ----------------------------------------------------
   * BRANCHES
   * ----------------------------------------------------
   *
   * Currently supported:
   * AI & ML
   * CSE
   */

  const branches = [
    {
      name: "AI & ML",
      code: "AIML",
    },
    {
      name: "CSE",
      code: "CSE",
    },
  ];

  for (const branchData of branches) {
    const branch =
      await prisma.branch.upsert({
        where: {
          code: branchData.code,
        },
        update: {
          name: branchData.name,
          isActive: true,
        },
        create: {
          name: branchData.name,
          code: branchData.code,
          isActive: true,
        },
      });

    console.log(
      `Branch ready: ${branch.name}`
    );
  }

  /*
   * ----------------------------------------------------
   * STUDY YEARS
   * ----------------------------------------------------
   *
   * 1 = First Year
   * 2 = Second Year
   * 3 = Third Year
   * 4 = Fourth Year
   *
   * No academic-year ranges are created.
   */

  const studyYears = [
    {
      number: 1,
      name: "First Year",
    },
    {
      number: 2,
      name: "Second Year",
    },
    {
      number: 3,
      name: "Third Year",
    },
    {
      number: 4,
      name: "Fourth Year",
    },
  ];

  for (const studyYearData of studyYears) {
    const studyYear =
      await prisma.studyYear.upsert({
        where: {
          number: studyYearData.number,
        },
        update: {
          name: studyYearData.name,
          isActive: true,
        },
        create: {
          number: studyYearData.number,
          name: studyYearData.name,
          isActive: true,
        },
      });

    console.log(
      `Study year ready: ${studyYear.name}`
    );
  }

  /*
   * ----------------------------------------------------
   * SEMESTERS
   * ----------------------------------------------------
   *
   * No semester records are created automatically.
   *
   * The Admin will create/configure:
   *
   * First Year
   *   Semester 1
   *   Semester 2
   *
   * Second Year
   *   Semester 1
   *   Semester 2
   *
   * Third Year
   *   Semester 1
   *   Semester 2
   *
   * Fourth Year
   *   Semester 1
   *   Semester 2
   *
   * The Admin decides the start and end dates.
   */

  console.log(
    "No semester records created. Semester periods will be configured by the Admin."
  );

  console.log(
    "Database seed completed successfully."
  );
}

main()
  .catch((error) => {
    console.error(
      "Database seed failed:",
      error
    );

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });