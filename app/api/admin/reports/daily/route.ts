import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

function parseMonth(value: string | null) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month] = value.split("-").map(Number);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return null;
  }

  return {
    year,
    month,
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1)),
  };
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();

    if (auth.error) {
      return auth.error;
    }

    const { searchParams } = new URL(request.url);
    const monthValue = searchParams.get("month");

    const parsedMonth = parseMonth(monthValue);

    if (!parsedMonth) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid month. Use the YYYY-MM format.",
        },
        { status: 400 }
      );
    }

    const academicDays = await db.academicDay.findMany({
      where: {
        date: {
          gte: parsedMonth.start,
          lt: parsedMonth.end,
        },
        type: "WORKING_DAY",
        semester: {
          isActive: true,
          studyYear: {
            isActive: true,
          },
        },
      },
      include: {
        semester: {
          include: {
            studyYear: true,
          },
        },
        sessions: {
          include: {
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
            },
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    const completedSessions = academicDays.flatMap((day) =>
      day.sessions
        .filter(
          (session) => session.status === "COMPLETED"
        )
        .map((session) => ({
          day,
          session,
        }))
    );

    const branchMap = new Map<
      number,
      {
        branch: {
          id: number;
          name: string;
          code: string;
        };
        totalStudents: number;
        presentStudents: number;
        absentStudents: number;
      }
    >();

    const studentMap = new Map<
      number,
      {
        studentId: number;
        hallTicket: string;
        name: string;
        branch: {
          id: number;
          name: string;
          code: string;
        };
        studyYear: {
          id: number;
          name: string;
          number: number;
        };
        totalDays: number;
        presentDays: number;
        absentDays: number;
      }
    >();

    for (const { session } of completedSessions) {
      for (const record of session.attendance) {
        const student = record.student;

        if (
          !student.isActive ||
          !student.userId
        ) {
          continue;
        }

        const branch = student.branch;
        const studyYear = student.studyYear;

        if (!branchMap.has(branch.id)) {
          branchMap.set(branch.id, {
            branch: {
              id: branch.id,
              name: branch.name,
              code: branch.code,
            },
            totalStudents: 0,
            presentStudents: 0,
            absentStudents: 0,
          });
        }

        const branchSummary = branchMap.get(
          branch.id
        )!;

        branchSummary.totalStudents += 1;

        if (record.status === "PRESENT") {
          branchSummary.presentStudents += 1;
        }

        if (record.status === "ABSENT") {
          branchSummary.absentStudents += 1;
        }

        if (!studentMap.has(student.id)) {
          studentMap.set(student.id, {
            studentId: student.id,
            hallTicket: student.hallTicket,
            name: student.name,
            branch: {
              id: branch.id,
              name: branch.name,
              code: branch.code,
            },
            studyYear: {
              id: studyYear.id,
              name: studyYear.name,
              number: studyYear.number,
            },
            totalDays: 0,
            presentDays: 0,
            absentDays: 0,
          });
        }

        const studentSummary = studentMap.get(
          student.id
        )!;

        studentSummary.totalDays += 1;

        if (record.status === "PRESENT") {
          studentSummary.presentDays += 1;
        }

        if (record.status === "ABSENT") {
          studentSummary.absentDays += 1;
        }
      }
    }

    const studentReports = Array.from(
      studentMap.values()
    )
      .map((student) => ({
        ...student,
        percentage:
          student.totalDays === 0
            ? 0
            : Number(
                (
                  (student.presentDays /
                    student.totalDays) *
                  100
                ).toFixed(2)
              ),
      }))
      .sort((a, b) =>
        a.name.localeCompare(b.name)
      );

    const branchReports = Array.from(
      branchMap.values()
    )
      .map((branch) => ({
        ...branch,
        percentage:
          branch.totalStudents === 0
            ? 0
            : Number(
                (
                  (branch.presentStudents /
                    branch.totalStudents) *
                  100
                ).toFixed(2)
              ),
      }))
      .sort((a, b) =>
        a.branch.name.localeCompare(
          b.branch.name
        )
      );

    const totalPresent = studentReports.reduce(
      (sum, student) =>
        sum + student.presentDays,
      0
    );

    const totalAbsent = studentReports.reduce(
      (sum, student) =>
        sum + student.absentDays,
      0
    );

    const totalAttendanceRecords =
      totalPresent + totalAbsent;

    const overallPercentage =
      totalAttendanceRecords === 0
        ? 0
        : Number(
            (
              (totalPresent /
                totalAttendanceRecords) *
              100
            ).toFixed(2)
          );

    return NextResponse.json({
      success: true,
      data: {
        report: {
          type: "MONTHLY",
          month: monthValue,
          monthName: new Date(
            Date.UTC(
              parsedMonth.year,
              parsedMonth.month - 1,
              1
            )
          ).toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          }),

          summary: {
            totalWorkingDays: academicDays.length,
            completedAttendanceDays:
              completedSessions.length,
            pendingAttendanceDays:
              academicDays.length -
              completedSessions.length,
            totalAttendanceRecords,
            presentRecords: totalPresent,
            absentRecords: totalAbsent,
            percentage: overallPercentage,
          },

          branches: branchReports,
          students: studentReports,

          days: completedSessions.map(
            ({ day, session }) => ({
              academicDayId: day.id,
              date: day.date,
              semester: {
                id: day.semester.id,
                name: day.semester.name,
                number: day.semester.number,
              },
              studyYear: {
                id: day.semester.studyYear.id,
                name:
                  day.semester.studyYear.name,
                number:
                  day.semester.studyYear.number,
              },
              branch: {
                id: session.branch.id,
                name: session.branch.name,
                code: session.branch.code,
              },
              session: {
                id: session.id,
                status: session.status,
                completedAt:
                  session.completedAt,
              },
              summary: {
                totalStudents:
                  session.attendance.length,
                presentStudents:
                  session.attendance.filter(
                    (record) =>
                      record.status ===
                      "PRESENT"
                  ).length,
                absentStudents:
                  session.attendance.filter(
                    (record) =>
                      record.status ===
                      "ABSENT"
                  ).length,
              },
            })
          ),
        },
      },
    });
  } catch (error) {
    console.error(
      "Monthly report error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to generate monthly report.",
      },
      { status: 500 }
    );
  }
}
