import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateAcademicDaySchema = z.object({
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

type RouteContext = {
  params: Promise<{
    academicDayId: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const auth =
      await requireAdmin();

    if (auth.error) {
      return auth.error;
    }

    const { academicDayId } =
      await context.params;

    const parsedAcademicDayId =
      Number(academicDayId);

    if (
      !Number.isInteger(
        parsedAcademicDayId
      ) ||
      parsedAcademicDayId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid academic day ID.",
        },
        { status: 400 }
      );
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
      updateAcademicDaySchema.safeParse(
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
      type,
      remarks,
    } = result.data;

    const academicDay =
      await db.academicDay.findUnique({
        where: {
          id: parsedAcademicDayId,
        },

        include: {
          semester: {
            include: {
              studyYear: true,
            },
          },

          session: true,
        },
      });

    if (!academicDay) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Academic day not found.",
        },
        { status: 404 }
      );
    }

    /*
     * A completed attendance session
     * permanently locks the academic day.
     */

    if (
      academicDay.session?.status ===
      "COMPLETED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This academic day is locked because attendance has already been completed.",
        },
        { status: 409 }
      );
    }

    /*
     * If attendance is currently in DRAFT,
     * do not allow WORKING_DAY → HOLIDAY.
     *
     * The attendance draft must be handled
     * first.
     */

    if (
      academicDay.session?.status ===
        "DRAFT" &&
      academicDay.type ===
        "WORKING_DAY" &&
      type === "HOLIDAY"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This working day has an attendance draft. Complete or clear the attendance before changing it to a holiday.",
        },
        { status: 409 }
      );
    }

    /*
     * Validate the study year and semester.
     */

    if (
      !academicDay.semester
        .isActive
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The selected semester is inactive.",
        },
        { status: 400 }
      );
    }

    if (
      !academicDay.semester
        .studyYear.isActive
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The selected study year is inactive.",
        },
        { status: 400 }
      );
    }

    /*
     * Update the academic day.
     *
     * Changing HOLIDAY → WORKING_DAY is
     * allowed when there is no attendance
     * session.
     *
     * Module 7 creates the attendance
     * session when marking begins.
     */

    const updatedDay =
      await db.academicDay.update({
        where: {
          id: parsedAcademicDayId,
        },

        data: {
          type,
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

          session: {
            select: {
              id: true,
              status: true,
              completedAt: true,
            },
          },
        },
      });

    return NextResponse.json({
      success: true,

      message:
        type === "WORKING_DAY"
          ? "Academic day updated to working day."
          : "Academic day updated to holiday.",

      data: {
        id:
          updatedDay.id,

        date:
          updatedDay.date,

        type:
          updatedDay.type,

        remarks:
          updatedDay.remarks,

        studyYear: {
          id:
            updatedDay
              .semester
              .studyYear.id,

          name:
            updatedDay
              .semester
              .studyYear
              .name,

          number:
            updatedDay
              .semester
              .studyYear
              .number,
        },

        semester: {
          id:
            updatedDay
              .semester.id,

          name:
            updatedDay
              .semester.name,

          number:
            updatedDay
              .semester.number,

          startDate:
            updatedDay
              .semester
              .startDate,

          endDate:
            updatedDay
              .semester
              .endDate,
        },

        attendanceSession:
          updatedDay.session,
      },
    });
  } catch (error) {
    console.error(
      "Academic day update error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to update academic day.",
      },
      { status: 500 }
    );
  }
}