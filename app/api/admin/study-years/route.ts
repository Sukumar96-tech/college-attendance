import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const auth = await requireAdmin();

    if (auth.error) {
      return auth.error;
    }

    const studyYears =
      await db.studyYear.findMany({
        where: {
          isActive: true,
        },
        include: {
          semesters: {
            where: {
              isActive: true,
            },
            orderBy: {
              number: "asc",
            },
          },
        },
        orderBy: {
          number: "asc",
        },
      });

    return NextResponse.json({
      success: true,

      data: studyYears.map(
        (studyYear) => ({
          id: studyYear.id,
          name: studyYear.name,
          number: studyYear.number,

          semesters:
            studyYear.semesters.map(
              (semester) => ({
                id: semester.id,
                name: semester.name,
                number: semester.number,
                startDate:
                  semester.startDate,
                endDate:
                  semester.endDate,
              })
            ),
        })
      ),
    });
  } catch (error) {
    console.error(
      "Study year list error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load study years.",
      },
      { status: 500 }
    );
  }
}