import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const auth = await requireAdmin();

    if (auth.error) {
      return auth.error;
    }

    const { sessionId } = await context.params;

    const parsedSessionId = Number(sessionId);

    if (
      !Number.isInteger(parsedSessionId) ||
      parsedSessionId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid attendance session ID.",
        },
        { status: 400 }
      );
    }

    const session =
      await db.attendanceSession.findUnique({
        where: {
          id: parsedSessionId,
        },

        include: {
          academicDay: {
            include: {
              semester: {
                include: {
                  studyYear: true,
                },
              },
            },
          },

          branch: true,

          attendance: {
            include: {
              student: {
                include: {
                  branch: true,
                  studyYear: true,
                },
              },
            },

            orderBy: {
              student: {
                name: "asc",
              },
            },
          },
        },
      });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Attendance session not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,

      data: {
        id: session.id,

        status: session.status,

        completedAt: session.completedAt,

        academicDay: {
          id: session.academicDay.id,
          date: session.academicDay.date,
          type: session.academicDay.type,
          remarks: session.academicDay.remarks,
        },

        branch: {
          id: session.branch.id,
          name: session.branch.name,
          code: session.branch.code,
        },

        studyYear: {
          id: session.academicDay.semester.studyYear.id,
          name: session.academicDay.semester.studyYear.name,
          number:
            session.academicDay.semester.studyYear.number,
        },

        semester: {
          id: session.academicDay.semester.id,
          name: session.academicDay.semester.name,
          number:
            session.academicDay.semester.number,
          startDate:
            session.academicDay.semester.startDate,
          endDate:
            session.academicDay.semester.endDate,
        },

        students: session.attendance.map(
          (record) => ({
            attendanceId: record.id,

            studentId: record.student.id,

            hallTicket:
              record.student.hallTicket,

            name: record.student.name,

            status: record.status,

            branch: {
              id: record.student.branch.id,
              name:
                record.student.branch.name,
              code:
                record.student.branch.code,
            },

            studyYear: {
              id:
                record.student.studyYear.id,
              name:
                record.student.studyYear.name,
              number:
                record.student.studyYear.number,
            },
          })
        ),
      },
    });
  } catch (error) {
    console.error(
      "Attendance session details error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load attendance session.",
      },
      { status: 500 }
    );
  }
}