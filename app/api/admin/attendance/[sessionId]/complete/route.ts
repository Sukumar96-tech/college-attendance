import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

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

    /*
     * Load the session together with:
     *
     * - Academic Day
     * - Semester
     * - Study Year
     * - Branch
     * - Attendance records
     */
    const session =
      await db.attendanceSession.findUnique(
        {
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

            branch: {
              select: {
                id: true,
                name: true,
                code: true,
                isActive: true,
              },
            },

            attendance: {
              select: {
                id: true,
                studentId: true,
                status: true,
              },
            },
          },
        }
      );

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

    /*
     * Attendance can only be completed
     * for a WORKING DAY.
     */
    if (
      session.academicDay.type !==
      "WORKING_DAY"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Attendance can only be completed for a working day.",
        },
        { status: 400 }
      );
    }

    /*
     * A completed session is permanently
     * locked.
     */
    if (
      session.status ===
      "COMPLETED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Attendance for this date and branch has already been completed and is locked.",
        },
        { status: 409 }
      );
    }

    /*
     * The semester and study year must
     * still be active.
     */
    if (
      !session.academicDay.semester
        .isActive ||
      !session.academicDay.semester
        .studyYear.isActive
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The semester or study year is inactive.",
        },
        { status: 400 }
      );
    }

    /*
     * The branch must still be active.
     */
    if (!session.branch.isActive) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The branch assigned to this attendance session is inactive.",
        },
        { status: 400 }
      );
    }

    const studyYearId =
      session.academicDay.semester
        .studyYearId;

    const branchId =
      session.branch.id;

    /*
     * Get only active and approved
     * students belonging to BOTH:
     *
     * - The session's Study Year
     * - The session's Branch
     */
    const activeStudents =
      await db.student.findMany({
        where: {
          isActive: true,

          studyYearId,

          branchId,

          user: {
            role: "STUDENT",
            status: "APPROVED",
          },
        },

        select: {
          id: true,
          hallTicket: true,
          name: true,
        },

        orderBy: {
          hallTicket: "asc",
        },
      });

    /*
     * Do not allow completion if there
     * are no students in this
     * Branch + Study Year.
     */
    if (
      activeStudents.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No active approved students were found for this branch and study year.",
        },
        { status: 400 }
      );
    }

    /*
     * Build a map of the attendance
     * records currently stored in the
     * session.
     */
    const attendanceMap =
      new Map(
        session.attendance.map(
          (record) => [
            record.studentId,
            record.status,
          ]
        )
      );

    /*
     * Every active student in this
     * Branch + Study Year must have
     * either PRESENT or ABSENT.
     */
    const unmarkedStudents =
      activeStudents.filter(
        (student) => {
          const status =
            attendanceMap.get(
              student.id
            );

          return (
            status !== "PRESENT" &&
            status !== "ABSENT"
          );
        }
      );

    if (
      unmarkedStudents.length > 0
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Attendance cannot be completed because some students are still unmarked.",

          data: {
            unmarkedCount:
              unmarkedStudents.length,

            unmarkedStudents:
              unmarkedStudents.map(
                (student) => ({
                  id: student.id,

                  hallTicket:
                    student.hallTicket,

                  name:
                    student.name,
                })
              ),
          },
        },
        { status: 400 }
      );
    }

    /*
     * Create a Set containing the
     * students who are actually allowed
     * in this session.
     */
    const activeStudentIds =
      new Set(
        activeStudents.map(
          (student) =>
            student.id
        )
      );

    /*
     * Make sure the session does not
     * contain attendance records for
     * students outside the current
     * Branch + Study Year.
     */
    const invalidAttendance =
      session.attendance.filter(
        (record) =>
          !activeStudentIds.has(
            record.studentId
          )
      );

    if (
      invalidAttendance.length > 0
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Attendance contains students who are not part of the current branch and study year.",
        },
        { status: 400 }
      );
    }

    /*
     * Also make sure the number of
     * attendance records matches the
     * number of required students.
     *
     * This provides an additional
     * protection against incomplete
     * attendance sessions.
     */
    if (
      session.attendance.length !==
      activeStudents.length
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Attendance records are incomplete. Please make sure every student has an attendance record.",
        },
        { status: 400 }
      );
    }

    /*
     * Complete the session inside a
     * transaction.
     *
     * The status is checked again to
     * prevent another request from
     * completing an already-completed
     * session.
     */
    const completedSession =
      await db.$transaction(
        async (tx) => {
          const currentSession =
            await tx.attendanceSession.findUnique(
              {
                where: {
                  id: parsedSessionId,
                },

                select: {
                  id: true,
                  status: true,
                },
              }
            );

          if (!currentSession) {
            throw new Error(
              "SESSION_NOT_FOUND"
            );
          }

          if (
            currentSession.status ===
            "COMPLETED"
          ) {
            throw new Error(
              "SESSION_ALREADY_COMPLETED"
            );
          }

          return tx.attendanceSession.update(
            {
              where: {
                id: parsedSessionId,
              },

              data: {
                status:
                  "COMPLETED",

                completedAt:
                  new Date(),
              },

              select: {
                id: true,

                status: true,

                completedAt: true,
              },
            }
          );
        }
      );

    return NextResponse.json({
      success: true,

      message:
        "Attendance completed successfully and is now locked.",

      data: {
        sessionId:
          completedSession.id,

        status:
          completedSession.status,

        completedAt:
          completedSession.completedAt,
      },
    });
  } catch (error) {
    console.error(
      "Complete attendance error:",
      error
    );

    if (
      error instanceof Error &&
      error.message ===
        "SESSION_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Attendance session not found.",
        },
        { status: 404 }
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "SESSION_ALREADY_COMPLETED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Attendance has already been completed and locked.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to complete attendance.",
      },
      { status: 500 }
    );
  }
}