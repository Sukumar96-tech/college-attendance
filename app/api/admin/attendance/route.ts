import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const auth = await requireAdmin();

    if (auth.error) {
      return auth.error;
    }

    const sessions =
      await db.attendanceSession.findMany({
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
            },
          },

          attendance: {
            select: {
              studentId: true,
              status: true,
            },
          },
        },

        orderBy: {
          academicDay: {
            date: "desc",
          },
        },
      });

    return NextResponse.json({
      success: true,

      data: sessions.map((session) => ({
        id: session.id,

        status: session.status,

        completedAt: session.completedAt,

        createdAt: session.createdAt,

        academicDay: {
          id: session.academicDay.id,

          date: session.academicDay.date,

          type: session.academicDay.type,

          remarks:
            session.academicDay.remarks,
        },

        branch: {
          id: session.branch.id,

          name: session.branch.name,

          code: session.branch.code,
        },

        studyYear: {
          id:
            session.academicDay.semester
              .studyYear.id,

          name:
            session.academicDay.semester
              .studyYear.name,

          number:
            session.academicDay.semester
              .studyYear.number,
        },

        semester: {
          id:
            session.academicDay.semester.id,

          name:
            session.academicDay.semester.name,

          number:
            session.academicDay.semester
              .number,

          startDate:
            session.academicDay.semester
              .startDate,

          endDate:
            session.academicDay.semester
              .endDate,
        },

        attendance: session.attendance,
      })),
    });
  } catch (error) {
    console.error(
      "Attendance session list error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load attendance sessions.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    const auth = await requireAdmin();

    if (auth.error) {
      return auth.error;
    }

    const body = await request.json();

    const academicDayId = Number(
      body.academicDayId
    );

    const branchId = Number(
      body.branchId
    );

    /*
     * Validate academic day ID.
     */
    if (
      !Number.isInteger(academicDayId) ||
      academicDayId <= 0
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

    /*
     * Validate branch ID.
     */
    if (
      !Number.isInteger(branchId) ||
      branchId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid branch ID.",
        },
        { status: 400 }
      );
    }

    /*
     * Load the academic day together with
     * semester and study year.
     */
    const academicDay =
      await db.academicDay.findUnique({
        where: {
          id: academicDayId,
        },

        include: {
          semester: {
            include: {
              studyYear: true,
            },
          },
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
     * Attendance is allowed only for
     * WORKING_DAY.
     */
    if (
      academicDay.type !==
      "WORKING_DAY"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Attendance cannot be created for a holiday.",
        },
        { status: 400 }
      );
    }

    /*
     * The semester must be active.
     */
    if (
      !academicDay.semester.isActive
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The semester is inactive.",
        },
        { status: 400 }
      );
    }

    /*
     * The study year must be active.
     */
    if (
      !academicDay.semester.studyYear
        .isActive
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The study year is inactive.",
        },
        { status: 400 }
      );
    }

    /*
     * Load the selected branch.
     */
    const branch =
      await db.branch.findUnique({
        where: {
          id: branchId,
        },
      });

    if (!branch) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Branch not found.",
        },
        { status: 404 }
      );
    }

    /*
     * Attendance can only be created
     * for an active branch.
     */
    if (!branch.isActive) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The selected branch is inactive.",
        },
        { status: 400 }
      );
    }

    /*
     * Check whether this specific
     * Branch + Academic Day already
     * has an attendance session.
     */
    const existingSession =
      await db.attendanceSession.findUnique({
        where: {
          academicDayId_branchId: {
            academicDayId,
            branchId,
          },
        },
      });

    if (existingSession) {
      if (
        existingSession.status ===
        "COMPLETED"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Attendance for this date and branch has already been completed and is locked.",
            data: {
              sessionId:
                existingSession.id,

              status:
                existingSession.status,
            },
          },
          { status: 409 }
        );
      }

      /*
       * If a DRAFT already exists,
       * return the existing session.
       */
      return NextResponse.json({
        success: true,
        message:
          "A draft attendance session already exists for this date and branch.",
        data: {
          sessionId:
            existingSession.id,

          status:
            existingSession.status,

          existing: true,
        },
      });
    }

    /*
     * Get only active and approved students
     * belonging to BOTH:
     *
     * 1. Selected Study Year
     * 2. Selected Branch
     */
    const students =
      await db.student.findMany({
        where: {
          isActive: true,

          branchId,

          studyYearId:
            academicDay.semester
              .studyYearId,

          user: {
            role: "STUDENT",

            status: "APPROVED",
          },
        },

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

        orderBy: {
          hallTicket: "asc",
        },
      });

    /*
     * Prevent creating an empty attendance
     * session when there are no students
     * in the selected Branch + Study Year.
     */
    if (students.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No active approved students were found for the selected branch and study year.",
        },
        { status: 404 }
      );
    }

    /*
     * Create the session and initial
     * UNMARKED attendance records atomically.
     */
    const session =
      await db.$transaction(
        async (tx) => {
          /*
           * Double-check for an existing
           * Branch + Academic Day session
           * inside the transaction.
           */
          const sessionAlreadyExists =
            await tx.attendanceSession.findUnique(
              {
                where: {
                  academicDayId_branchId: {
                    academicDayId,
                    branchId,
                  },
                },
              }
            );

          if (sessionAlreadyExists) {
            return sessionAlreadyExists;
          }

          /*
           * Create branch-specific
           * attendance session.
           */
          const newSession =
            await tx.attendanceSession.create(
              {
                data: {
                  academicDayId,

                  branchId,

                  status: "DRAFT",

                  createdBy:
                    auth.user!.id,
                },
              }
            );

          /*
           * Create one UNMARKED record
           * for every student in the selected
           * Branch + Study Year.
           */
          await tx.attendance.createMany({
            data: students.map(
              (student) => ({
                sessionId:
                  newSession.id,

                studentId:
                  student.id,

                status:
                  "UNMARKED",
              })
            ),
          });

          return newSession;
        }
      );

    /*
     * Load the created session together
     * with branch, academic information,
     * and student attendance records.
     */
    const createdSession =
      await db.attendanceSession.findUnique(
        {
          where: {
            id: session.id,
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
              },
            },

            attendance: {
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
            },
          },
        }
      );

    if (!createdSession) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to load the created attendance session.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,

        message:
          "Attendance session created successfully.",

        data: {
          id:
            createdSession.id,

          status:
            createdSession.status,

          academicDay: {
            id:
              createdSession
                .academicDay.id,

            date:
              createdSession
                .academicDay.date,

            type:
              createdSession
                .academicDay.type,

            remarks:
              createdSession
                .academicDay
                .remarks,
          },

          branch: {
            id:
              createdSession.branch.id,

            name:
              createdSession.branch.name,

            code:
              createdSession.branch.code,
          },

          studyYear: {
            id:
              createdSession
                .academicDay
                .semester
                .studyYear.id,

            name:
              createdSession
                .academicDay
                .semester
                .studyYear.name,

            number:
              createdSession
                .academicDay
                .semester
                .studyYear
                .number,
          },

          semester: {
            id:
              createdSession
                .academicDay
                .semester.id,

            name:
              createdSession
                .academicDay
                .semester
                .name,

            number:
              createdSession
                .academicDay
                .semester
                .number,

            startDate:
              createdSession
                .academicDay
                .semester
                .startDate,

            endDate:
              createdSession
                .academicDay
                .semester
                .endDate,
          },

          students:
            createdSession.attendance.map(
              (record) => ({
                attendanceId:
                  record.id,

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
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Attendance session creation error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to create attendance session.",
      },
      { status: 500 }
    );
  }
}