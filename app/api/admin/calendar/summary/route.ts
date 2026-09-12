import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  semesterId: z.coerce
    .number()
    .int()
    .positive(),
});

export async function GET(
  request: Request
) {
  try {
    const auth =
      await requireAdmin();

    if (auth.error) {
      return auth.error;
    }

    const { searchParams } =
      new URL(request.url);

    const result =
      querySchema.safeParse({
        semesterId:
          searchParams.get(
            "semesterId"
          ),
      });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A valid semester ID is required.",
        },
        { status: 400 }
      );
    }

    const { semesterId } =
      result.data;

    const semester =
      await db.semester.findUnique({
        where: {
          id: semesterId,
        },

        include: {
          studyYear: true,
        },
      });

    if (!semester) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Semester not found.",
        },
        { status: 404 }
      );
    }

    const [
      totalDays,
      workingDays,
      holidays,
      completedAttendance,
      draftAttendance,
    ] = await Promise.all([
      /*
       * Total academic days
       * configured for this semester.
       */
      db.academicDay.count({
        where: {
          semesterId,
        },
      }),

      /*
       * Working days configured
       * by the Admin.
       */
      db.academicDay.count({
        where: {
          semesterId,
          type: "WORKING_DAY",
        },
      }),

      /*
       * Holidays configured
       * by the Admin.
       */
      db.academicDay.count({
        where: {
          semesterId,
          type: "HOLIDAY",
        },
      }),

      /*
       * Only COMPLETED attendance
       * sessions count toward
       * attendance completion.
       */
      db.attendanceSession.count({
        where: {
          academicDay: {
            semesterId,
          },
          status: "COMPLETED",
        },
      }),

      /*
       * Draft attendance sessions
       * do not count as completed.
       */
      db.attendanceSession.count({
        where: {
          academicDay: {
            semesterId,
          },
          status: "DRAFT",
        },
      }),
    ]);

    /*
     * A working day is pending when
     * attendance has not yet been
     * completed for that day.
     */
    const pendingAttendance =
      Math.max(
        workingDays -
          completedAttendance,
        0
      );

    return NextResponse.json({
      success: true,

      data: {
        studyYear: {
          id:
            semester.studyYear.id,

          name:
            semester.studyYear.name,

          number:
            semester.studyYear.number,
        },

        semester: {
          id:
            semester.id,

          name:
            semester.name,

          number:
            semester.number,

          startDate:
            semester.startDate,

          endDate:
            semester.endDate,
        },

        totalDays,

        workingDays,

        holidays,

        attendance: {
          completed:
            completedAttendance,

          draft:
            draftAttendance,

          pending:
            pendingAttendance,
        },
      },
    });
  } catch (error) {
    console.error(
      "Calendar summary error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load calendar summary.",
      },
      { status: 500 }
    );
  }
}