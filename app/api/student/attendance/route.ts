import { db } from "@/lib/db";
import { requireStudent } from "@/lib/auth-guard";
import { getStudentAttendanceSummary } from "@/lib/attendance";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const auth = await requireStudent();

    if (auth.error) {
      return auth.error;
    }

    const student = auth.user!.student!;

    const { searchParams } =
      new URL(request.url);

    const month =
      searchParams.get("month");

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    /*
     * Optional monthly filter.
     *
     * Expected format:
     * YYYY-MM
     */
    if (month) {
      const monthMatch =
        /^(\d{4})-(\d{2})$/.exec(month);

      if (!monthMatch) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid month format. Use YYYY-MM.",
          },
          { status: 400 }
        );
      }

      const yearNumber =
        Number(monthMatch[1]);

      const monthNumber =
        Number(monthMatch[2]);

      if (
        monthNumber < 1 ||
        monthNumber > 12
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid month.",
          },
          { status: 400 }
        );
      }

      startDate = new Date(
        Date.UTC(
          yearNumber,
          monthNumber - 1,
          1
        )
      );

      endDate = new Date(
        Date.UTC(
          yearNumber,
          monthNumber,
          1
        )
      );
    }

    /*
     * Load the student's branch separately.
     *
     * requireStudent() verifies the student,
     * but it does not include the Branch relation.
     */
    const branch = await db.branch.findUnique({
      where: {
        id: student.branchId,
      },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });

    if (!branch) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Student branch could not be found.",
        },
        { status: 404 }
      );
    }

    /*
     * Get only this logged-in student's
     * attendance records.
     *
     * Attendance sessions are branch-specific,
     * so only the session belonging to the
     * student's branch is considered.
     */
    const attendanceRecords =
      await db.attendance.findMany({
        where: {
          studentId: student.id,

          status: {
            in: [
              "PRESENT",
              "ABSENT",
            ],
          },

          session: {
            status: "COMPLETED",

            branchId:
              student.branchId,

            academicDay: {
              type: "WORKING_DAY",

              ...(startDate &&
              endDate
                ? {
                    date: {
                      gte: startDate,
                      lt: endDate,
                    },
                  }
                : {}),
            },
          },
        },

        include: {
          session: {
            select: {
              id: true,

              status: true,

              branchId: true,

              academicDay: {
                select: {
                  date: true,
                  remarks: true,
                },
              },
            },
          },
        },

        orderBy: {
          session: {
            academicDay: {
              date: "desc",
            },
          },
        },
      });

    /*
     * Overall attendance summary.
     *
     * This is intentionally calculated
     * independently of the month filter.
     */
    const summary =
      await getStudentAttendanceSummary(
        student.id
      );

    return NextResponse.json({
      success: true,

      data: {
        student: {
          id: student.id,

          hallTicket:
            student.hallTicket,

          name:
            student.name,

          studyYear: {
            id:
              student.studyYearId,
          },

          branch: {
            id:
              branch.id,

            name:
              branch.name,

            code:
              branch.code,
          },
        },

        summary,

        filter: {
          month:
            month || null,
        },

        records:
          attendanceRecords.map(
            (record) => ({
              attendanceId:
                record.id,

              sessionId:
                record.session.id,

              date:
                record.session
                  .academicDay.date,

              status:
                record.status,

              remarks:
                record.session
                  .academicDay
                  .remarks,
            })
          ),
      },
    });
  } catch (error) {
    console.error(
      "Student attendance GET error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load attendance.",
      },
      { status: 500 }
    );
  }
}