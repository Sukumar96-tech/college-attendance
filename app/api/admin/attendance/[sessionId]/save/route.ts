import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

type AttendanceInput = {
  studentId: number;
  status: "PRESENT" | "ABSENT";
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

    if (
      !body ||
      !Array.isArray(body.attendance)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Attendance data must be provided as an array.",
        },
        { status: 400 }
      );
    }

    let attendance: AttendanceInput[];

    try {
      attendance =
        body.attendance.map(
          (record: unknown) => {
            if (
              typeof record !==
                "object" ||
              record === null
            ) {
              throw new Error(
                "INVALID_ATTENDANCE_DATA"
              );
            }

            const item =
              record as Record<
                string,
                unknown
              >;

            const studentId = Number(
              item.studentId
            );

            const status =
              item.status;

            if (
              !Number.isInteger(
                studentId
              ) ||
              studentId <= 0
            ) {
              throw new Error(
                "INVALID_STUDENT_ID"
              );
            }

            if (
              status !== "PRESENT" &&
              status !== "ABSENT"
            ) {
              throw new Error(
                "INVALID_ATTENDANCE_STATUS"
              );
            }

            return {
              studentId,
              status,
            };
          }
        );
    } catch (error) {
      if (
        error instanceof Error
      ) {
        throw error;
      }

      throw new Error(
        "INVALID_ATTENDANCE_DATA"
      );
    }

    /*
     * Prevent duplicate student IDs
     * in the same request.
     */
    const studentIds =
      attendance.map(
        (record) =>
          record.studentId
      );

    if (
      new Set(studentIds).size !==
      studentIds.length
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Duplicate student attendance records are not allowed.",
        },
        { status: 400 }
      );
    }

    /*
     * Load the attendance session
     * together with:
     *
     * - Academic Day
     * - Semester
     * - Study Year
     * - Branch
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
     * Attendance can only be saved
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
            "Attendance can only be saved for a working day.",
        },
        { status: 400 }
      );
    }

    /*
     * Completed attendance is
     * permanently locked.
     */
    if (
      session.status ===
      "COMPLETED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Attendance has already been completed and is locked.",
        },
        { status: 409 }
      );
    }

    /*
     * The semester and study year
     * must be active.
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
    if (
      !session.branch.isActive
    ) {
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
     * Get only the students who are
     * allowed to have attendance in
     * this exact session.
     *
     * Required conditions:
     *
     * 1. Active student
     * 2. Approved student account
     * 3. STUDENT role
     * 4. Same Study Year
     * 5. Same Branch
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
        },
      });

    const allowedStudentIds =
      new Set(
        activeStudents.map(
          (student) =>
            student.id
        )
      );

    /*
     * Make sure every submitted student
     * belongs to:
     *
     * - This session's branch
     * - This session's study year
     * - An active student account
     * - An approved student user
     */
    const invalidStudents =
      attendance.filter(
        (record) =>
          !allowedStudentIds.has(
            record.studentId
          )
      );

    if (
      invalidStudents.length > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Attendance contains an invalid, inactive, wrong-branch, or wrong-study-year student.",
        },
        { status: 400 }
      );
    }

    /*
     * Make sure the submitted
     * attendance belongs to records
     * created for this session.
     *
     * This prevents inserting an
     * arbitrary student's attendance
     * directly into the session.
     */
    const existingAttendance =
      await db.attendance.findMany({
        where: {
          sessionId:
            parsedSessionId,

          studentId: {
            in: studentIds,
          },
        },

        select: {
          studentId: true,
        },
      });

    const existingStudentIds =
      new Set(
        existingAttendance.map(
          (record) =>
            record.studentId
        )
      );

    const missingSessionRecords =
      attendance.filter(
        (record) =>
          !existingStudentIds.has(
            record.studentId
          )
      );

    if (
      missingSessionRecords.length > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "One or more students do not belong to this attendance session.",
        },
        { status: 400 }
      );
    }

    /*
     * Save all attendance records
     * inside one transaction.
     *
     * The session can be saved multiple
     * times while it is still DRAFT.
     */
    await db.$transaction(
      async (tx) => {
        /*
         * Re-check the session status
         * inside the transaction.
         */
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

        /*
         * Prevent changes after
         * completion.
         */
        if (
          currentSession.status ===
          "COMPLETED"
        ) {
          throw new Error(
            "SESSION_ALREADY_COMPLETED"
          );
        }

        /*
         * Update each attendance
         * record.
         */
        for (
          const record of attendance
        ) {
          await tx.attendance.update({
            where: {
              sessionId_studentId: {
                sessionId:
                  parsedSessionId,

                studentId:
                  record.studentId,
              },
            },

            data: {
              status:
                record.status,
            },
          });
        }
      }
    );

    /*
     * Return the complete saved
     * attendance list.
     */
    const savedAttendance =
      await db.attendance.findMany({
        where: {
          sessionId:
            parsedSessionId,
        },

        include: {
          student: {
            select: {
              id: true,

              hallTicket: true,

              name: true,

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
          student: {
            hallTicket: "asc",
          },
        },
      });

    return NextResponse.json({
      success: true,

      message:
        "Attendance saved successfully.",

      data: {
        sessionId:
          parsedSessionId,

        status: "DRAFT",

        attendance:
          savedAttendance.map(
            (record) => ({
              id: record.id,

              studentId:
                record.studentId,

              hallTicket:
                record.student
                  .hallTicket,

              name:
                record.student.name,

              branch:
                record.student.branch,

              status:
                record.status,
            })
          ),
      },
    });
  } catch (error) {
    console.error(
      "Save attendance error:",
      error
    );

    if (
      error instanceof Error &&
      error.message ===
        "INVALID_ATTENDANCE_DATA"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid attendance record.",
        },
        { status: 400 }
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "INVALID_STUDENT_ID"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid student ID.",
        },
        { status: 400 }
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "INVALID_ATTENDANCE_STATUS"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Attendance status must be PRESENT or ABSENT.",
        },
        { status: 400 }
      );
    }

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
            "Attendance has already been completed and is locked.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to save attendance.",
      },
      { status: 500 }
    );
  }
}