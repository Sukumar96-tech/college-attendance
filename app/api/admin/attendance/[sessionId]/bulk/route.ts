import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { NextResponse } from "next/server";
import { z } from "zod";

const bulkAttendanceSchema = z.object({
  status: z.enum(["PRESENT", "ABSENT"]),
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
      !Number.isInteger(parsedSessionId) ||
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
      bulkAttendanceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid attendance status.",
        },
        { status: 400 }
      );
    }

    const session =
      await db.attendanceSession.findUnique({
        where: {
          id: parsedSessionId,
        },
      });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Attendance session not found.",
        },
        { status: 404 }
      );
    }

    if (session.status === "COMPLETED") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Completed attendance is locked.",
        },
        { status: 409 }
      );
    }

    const result =
      await db.attendance.updateMany({
        where: {
          sessionId: parsedSessionId,
        },

        data: {
          status: parsed.data.status,
        },
      });

    return NextResponse.json({
      success: true,

      message:
        parsed.data.status === "PRESENT"
          ? "All students marked Present."
          : "All students marked Absent.",

      data: {
        updatedCount: result.count,
        status: parsed.data.status,
      },
    });
  } catch (error) {
    console.error(
      "Bulk attendance update error:",
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