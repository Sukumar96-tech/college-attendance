import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();

    if (auth.error) {
      return auth.error;
    }

    const { searchParams } = new URL(
      request.url
    );

    const studentIdParam =
      searchParams.get("studentId");

    if (!studentIdParam) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Student ID is required.",
        },
        { status: 400 }
      );
    }

    const studentId = Number(
      studentIdParam
    );

    if (
      !Number.isInteger(studentId) ||
      studentId <= 0
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

    const student =
      await db.student.findUnique({
        where: {
          id: studentId,
        },

        include: {
          branch: true,
          academicYear: true,
          user: true,
        },
      });

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Student not found.",
        },
        { status: 404 }
      );
    }

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

            academicDay: {
              type: "WORKING_DAY",
            },
          },
        },

        include: {
          session: {
            include: {
              academicDay: {
                include: {
                  semester: {
                    include: {
                      academicYear: true,
                    },
                  },
                },
              },
            },
          },
        },

        orderBy: {
          session: {
            academicDay: {
              date: "asc",
            },
          },
        },
      });

    const totalWorkingDays =
      attendanceRecords.length;

    const presentDays =
      attendanceRecords.filter(
        (record) =>
          record.status ===
          "PRESENT"
      ).length;

    const absentDays =
      attendanceRecords.filter(
        (record) =>
          record.status ===
          "ABSENT"
      ).length;

    const percentage =
      totalWorkingDays === 0
        ? 0
        : (presentDays /
            totalWorkingDays) *
          100;

    return NextResponse.json({
      success: true,

      data: {
        student: {
          id: student.id,

          hallTicket:
            student.hallTicket,

          name: student.name,

          email:
            student.email,

          phone:
            student.phone,

          branch: {
            id:
              student.branch.id,

            name:
              student.branch.name,

            code:
              student.branch.code,
          },

          academicYear: {
            id:
              student.academicYear.id,

            name:
              student.academicYear.name,

            startDate:
              student.academicYear
                .startDate,

            endDate:
              student.academicYear
                .endDate,
          },

          year:
            student.year,

          section:
            student.section,

          isActive:
            student.isActive,

          accountStatus:
            student.user.status,
        },

        summary: {
          totalWorkingDays,

          presentDays,

          absentDays,

          percentage:
            Number(
              percentage.toFixed(2)
            ),
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
                  .academicDay
                  .date,

              status:
                record.status,

              remarks:
                record.session
                  .academicDay
                  .remarks,

              semester: {
                id:
                  record.session
                    .academicDay
                    .semester.id,

                name:
                  record.session
                    .academicDay
                    .semester
                    .name,

                number:
                  record.session
                    .academicDay
                    .semester
                    .number,

                academicYear:
                  record.session
                    .academicDay
                    .semester
                    .academicYear
                    .name,
              },
            })
          ),
      },
    });
  } catch (error) {
    console.error(
      "Student-wise attendance report error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to generate student attendance report.",
      },
      {
        status: 500,
      }
    );
  }
}