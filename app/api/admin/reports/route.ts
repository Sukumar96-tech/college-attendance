import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const auth = await requireAdmin();

    if (auth.error) {
      return auth.error;
    }

    const [
      completedSessions,
      workingDays,
      holidays,
      activeStudents,
    ] = await Promise.all([
      db.attendanceSession.count({
        where: {
          status: "COMPLETED",

          academicDay: {
            type: "WORKING_DAY",
          },
        },
      }),

      db.academicDay.count({
        where: {
          type: "WORKING_DAY",
        },
      }),

      db.academicDay.count({
        where: {
          type: "HOLIDAY",
        },
      }),

      db.student.count({
        where: {
          isActive: true,

          user: {
            role: "STUDENT",
            status: "APPROVED",
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,

      data: {
        completedAttendanceSessions:
          completedSessions,

        workingDays,

        holidays,

        activeStudents,

        reportTypes: [
          "DAILY",
          "MONTHLY",
          "YEARLY",
          "BRANCH",
          "STUDENT",
        ],

        exportFormats: [
          "CSV",
          "PDF",
          "PRINT",
        ],
      },
    });
  } catch (error) {
    console.error(
      "Admin reports foundation error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load reports information.",
      },
      {
        status: 500,
      }
    );
  }
}