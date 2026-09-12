import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateAttendanceSchema = z.object({
  attendanceId: z.number().int().positive(),

  status: z.enum([
    "PRESENT",
    "ABSENT",
  ]),
});

type RouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const auth = await requireAdmin();

    if (auth.error) {
      return auth.error;
    }

    const { sessionId } =
      await context.params;

    const parsedSessionId =
      Number(sessionId);

    if (
      !Number.isInteger(
        parsedSessionId
      ) ||
      parsedSessionId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid attendance session ID.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const parsed =
      updateAttendanceSchema.safeParse(
        body
      );

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid attendance data.",
        },
        { status: 400 }
      );
    }

    const attendance =
      await db.attendance.findUnique({
        where: {
          id: parsed.data.attendanceId,
        },

        include: {
          session: true,
        },
      });

    if (!attendance) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Attendance record not found.",
        },
        { status: 404 }
      );
    }

    if (
      attendance.sessionId !==
      parsedSessionId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Attendance record does not belong to this session.",
        },
        { status: 400 }
      );
    }

    if (
      attendance.session.status ===
      "COMPLETED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Completed attendance is locked.",
        },
        { status: 409 }
      );
    }

    const updated =
      await db.attendance.update({
        where: {
          id: attendance.id,
        },

        data: {
          status:
            parsed.data.status,
        },
      });

    return NextResponse.json({
      success: true,
      message:
        "Attendance updated successfully.",
      data: {
        attendanceId: updated.id,
        status: updated.status,
      },
    });
  } catch (error) {
    console.error(
      "Update attendance error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to update attendance.",
      },
      { status: 500 }
    );
  }
}