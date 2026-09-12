import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { NextResponse } from "next/server";
import { z } from "zod";

const createAcademicDaySchema = z.object({
  semesterId: z
    .number()
    .int()
    .positive("Invalid semester"),

  date: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Date must be in YYYY-MM-DD format"
    ),

  type: z.enum([
    "WORKING_DAY",
    "HOLIDAY",
  ]),

  remarks: z
    .string()
    .trim()
    .max(
      500,
      "Remarks are too long"
    )
    .optional()
    .or(z.literal("")),
});

export async function GET() {
  try {
    const auth = await requireAdmin();

    if (auth.error) {
      return auth.error;
    }

    const academicDays =
      await db.academicDay.findMany({
        include: {
          semester: {
            include: {
              studyYear: true,
            },
          },

          sessions: {
            include: {
              branch: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
        },

        orderBy: {
          date: "desc",
        },
      });

    return NextResponse.json({
      success: true,

      data: academicDays.map(
        (day) => ({
          id: day.id,
          date: day.date,
          type: day.type,
          remarks: day.remarks,

          studyYear: {
            id: day.semester.studyYear.id,
            name:
              day.semester.studyYear.name,
            number:
              day.semester.studyYear.number,
          },

          semester: {
            id: day.semester.id,
            name: day.semester.name,
            number: day.semester.number,
            startDate:
              day.semester.startDate,
            endDate:
              day.semester.endDate,
          },

          attendanceSessions:
            day.sessions.map(
              (session) => ({
                id: session.id,

                branch: {
                  id: session.branch.id,
                  name: session.branch.name,
                  code: session.branch.code,
                },

                status:
                  session.status,

                completedAt:
                  session.completedAt,
              })
            ),

          createdAt:
            day.createdAt,

          updatedAt:
            day.updatedAt,
        })
      ),
    });
  } catch (error) {
    console.error(
      "Academic calendar list error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load academic calendar.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    const auth =
      await requireAdmin();

    if (auth.error) {
      return auth.error;
    }

    let body: unknown;

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid JSON request body.",
        },
        { status: 400 }
      );
    }

    const result =
      createAcademicDaySchema.safeParse(
        body
      );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid academic day data.",
          errors:
            result.error.flatten()
              .fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      semesterId,
      date,
      type,
      remarks,
    } = result.data;

    const parsedDate =
      new Date(
        `${date}T00:00:00.000Z`
      );

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid date.",
        },
        { status: 400 }
      );
    }

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

    if (!semester.isActive) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected semester is inactive.",
        },
        { status: 400 }
      );
    }

    if (
      !semester.studyYear.isActive
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected study year is inactive.",
        },
        { status: 400 }
      );
    }

    /*
     * The Admin controls the semester
     * period.
     *
     * An academic day can only be created
     * inside the Admin-defined semester
     * start and end dates.
     */

    if (
      parsedDate <
        semester.startDate ||
      parsedDate >
        semester.endDate
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The selected date is outside the semester date range.",
        },
        { status: 400 }
      );
    }

    /*
     * Date uniqueness is scoped to the
     * semester.
     *
     * This allows the same calendar date
     * to exist in different semester
     * configurations if required.
     */

    const existingDay =
      await db.academicDay.findUnique({
        where: {
          semesterId_date: {
            semesterId,
            date: parsedDate,
          },
        },
      });

    if (existingDay) {
      return NextResponse.json(
        {
          success: false,
          message:
            "An academic day already exists for this date in the selected semester.",
        },
        { status: 409 }
      );
    }

    /*
     * Holiday:
     *
     * Create only the academic day.
     * No attendance session is created.
     */

    if (
      type === "HOLIDAY"
    ) {
      const academicDay =
        await db.academicDay.create({
          data: {
            semesterId,
            date: parsedDate,
            type: "HOLIDAY",
            remarks:
              remarks || null,
            markedBy:
              auth.user!.id,
          },

          include: {
            semester: {
              include: {
                studyYear: true,
              },
            },
          },
        });

      return NextResponse.json(
        {
          success: true,

          message:
            "Holiday created successfully.",

          data: {
            id:
              academicDay.id,

            date:
              academicDay.date,

            type:
              academicDay.type,

            remarks:
              academicDay.remarks,

            studyYear: {
              id:
                academicDay
                  .semester
                  .studyYear.id,

              name:
                academicDay
                  .semester
                  .studyYear
                  .name,

              number:
                academicDay
                  .semester
                  .studyYear
                  .number,
            },

            semester: {
              id:
                academicDay
                  .semester.id,

              name:
                academicDay
                  .semester.name,

              number:
                academicDay
                  .semester.number,

              startDate:
                academicDay
                  .semester
                  .startDate,

              endDate:
                academicDay
                  .semester
                  .endDate,
            },

            attendanceSessions:
              [],
          },
        },
        { status: 201 }
      );
    }

    /*
     * Working day:
     *
     * Only the academic day is created.
     * Module 7 creates the attendance
     * session when attendance is started.
     */

    const academicDay =
      await db.academicDay.create({
        data: {
          semesterId,
          date: parsedDate,
          type: "WORKING_DAY",
          remarks:
            remarks || null,
          markedBy:
            auth.user!.id,
        },

        include: {
          semester: {
            include: {
              studyYear: true,
            },
          },
        },
      });

    return NextResponse.json(
      {
        success: true,

        message:
          "Working day created successfully.",

        data: {
          id:
            academicDay.id,

          date:
            academicDay.date,

          type:
            academicDay.type,

          remarks:
            academicDay.remarks,

          studyYear: {
            id:
              academicDay
                .semester
                .studyYear.id,

            name:
              academicDay
                .semester
                .studyYear
                .name,

            number:
              academicDay
                .semester
                .studyYear
                .number,
          },

          semester: {
            id:
              academicDay
                .semester.id,

            name:
              academicDay
                .semester.name,

            number:
              academicDay
                .semester.number,

            startDate:
              academicDay
                .semester
                .startDate,

            endDate:
              academicDay
                .semester
                .endDate,
          },

          attendanceSessions:
            [],
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Academic calendar create error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to create academic day.",
      },
      { status: 500 }
    );
  }
}