import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [branches, studyYears] =
      await Promise.all([
        db.branch.findMany({
          where: {
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            code: true,
          },
          orderBy: {
            name: "asc",
          },
        }),

        db.studyYear.findMany({
          where: {
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            number: true,
          },
          orderBy: {
            number: "asc",
          },
        }),
      ]);

    return NextResponse.json({
      success: true,

      data: {
        branches,

        studyYears,
      },
    });
  } catch (error) {
    console.error(
      "Registration options error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load registration options.",
      },
      { status: 500 }
    );
  }
}
