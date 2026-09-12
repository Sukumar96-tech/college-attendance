import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

type CsvRow = Record<string, string | number>;

function escapeCsvValue(
  value: string | number | null | undefined
) {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  return `"${stringValue.replace(
    /"/g,
    '""'
  )}"`;
}

function createCsv(
  headers: string[],
  rows: CsvRow[]
) {
  const headerLine = headers
    .map((header) =>
      escapeCsvValue(header)
    )
    .join(",");

  const dataLines = rows.map((row) =>
    headers
      .map((header) =>
        escapeCsvValue(row[header])
      )
      .join(",")
  );

  return [
    headerLine,
    ...dataLines,
  ].join("\r\n");
}

function createCsvResponse(
  csv: string,
  filename: string
) {
  return new NextResponse(csv, {
    status: 200,

    headers: {
      "Content-Type":
        "text/csv; charset=utf-8",

      "Content-Disposition": `attachment; filename="${filename}"`,

      "Cache-Control":
        "no-store, no-cache, must-revalidate",
    },
  });
}

export async function GET(
  request: Request
) {
  try {
    const auth = await requireAdmin();

    if (auth.error) {
      return auth.error;
    }

    const { searchParams } =
      new URL(request.url);

    const type =
      searchParams.get("type");

    if (!type) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Report type is required.",
        },
        { status: 400 }
      );
    }

    /*
     * DAILY REPORT
     *
     * Example:
     * /api/admin/reports/export/csv?type=daily&date=2026-09-11
     */
    if (type === "daily") {
      const date =
        searchParams.get("date");

      if (!date) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Date is required for daily report.",
          },
          { status: 400 }
        );
      }

      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(
          date
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid date format. Use YYYY-MM-DD.",
          },
          { status: 400 }
        );
      }

      const selectedDate = new Date(
        `${date}T00:00:00.000Z`
      );

      const academicDay =
        await db.academicDay.findUnique({
          where: {
            date: selectedDate,
          },

          include: {
            session: {
              include: {
                attendance: {
                  include: {
                    student: {
                      include: {
                        branch: true,
                        academicYear: true,
                        user: true,
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
            },

            semester: {
              include: {
                academicYear: true,
              },
            },
          },
        });

      if (!academicDay) {
        return NextResponse.json(
          {
            success: false,
            message:
              "No academic day exists for the selected date.",
          },
          { status: 404 }
        );
      }

      if (
        academicDay.type !==
        "WORKING_DAY"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "The selected date is not a working day.",
          },
          { status: 400 }
        );
      }

      if (
        !academicDay.session ||
        academicDay.session.status !==
          "COMPLETED"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Completed attendance is not available for this date.",
          },
          { status: 400 }
        );
      }

      const records =
        academicDay.session.attendance.filter(
          (record) =>
            record.student.isActive &&
            record.student.user.role ===
              "STUDENT" &&
            record.student.user.status ===
              "APPROVED"
        );

      const rows: CsvRow[] =
        records.map((record, index) => ({
          "S.No": index + 1,
          "Date": date,
          "Hall Ticket":
            record.student.hallTicket,
          "Student Name":
            record.student.name,
          "Branch":
            record.student.branch.name,
          "Branch Code":
            record.student.branch.code,
          "Academic Year":
            record.student.academicYear.name,
          "Year":
            record.student.year,
          "Section":
            record.student.section ||
            "N/A",
          "Status":
            record.status ===
            "PRESENT"
              ? "Present"
              : "Absent",
        }));

      const csv = createCsv(
        [
          "S.No",
          "Date",
          "Hall Ticket",
          "Student Name",
          "Branch",
          "Branch Code",
          "Academic Year",
          "Year",
          "Section",
          "Status",
        ],
        rows
      );

      return createCsvResponse(
        csv,
        `daily-attendance-${date}.csv`
      );
    }

    /*
     * MONTHLY REPORT
     *
     * Example:
     * /api/admin/reports/export/csv?type=monthly&month=2026-09
     */
    if (type === "monthly") {
      const month =
        searchParams.get("month");

      if (!month) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Month is required for monthly report.",
          },
          { status: 400 }
        );
      }

      const match =
        /^(\d{4})-(\d{2})$/.exec(
          month
        );

      if (!match) {
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
        Number(match[1]);

      const monthNumber =
        Number(match[2]);

      if (
        monthNumber < 1 ||
        monthNumber > 12
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid month.",
          },
          { status: 400 }
        );
      }

      const startDate = new Date(
        Date.UTC(
          yearNumber,
          monthNumber - 1,
          1
        )
      );

      const endDate = new Date(
        Date.UTC(
          yearNumber,
          monthNumber,
          1
        )
      );

      const workingDays =
        await db.academicDay.findMany({
          where: {
            type: "WORKING_DAY",

            date: {
              gte: startDate,
              lt: endDate,
            },

            session: {
              status: "COMPLETED",
            },
          },

          include: {
            session: {
              include: {
                attendance: {
                  select: {
                    studentId: true,
                    status: true,
                  },
                },
              },
            },
          },
        });

      const students =
        await db.student.findMany({
          where: {
            isActive: true,

            user: {
              role: "STUDENT",
              status: "APPROVED",
            },
          },

          include: {
            branch: true,
            academicYear: true,
          },

          orderBy: {
            hallTicket: "asc",
          },
        });

      const totalWorkingDays =
        workingDays.length;

      const rows: CsvRow[] =
        students.map(
          (student, index) => {
            let presentDays = 0;
            let absentDays = 0;

            for (const day of workingDays) {
              const attendance =
                day.session?.attendance.find(
                  (record) =>
                    record.studentId ===
                    student.id
                );

              if (
                attendance?.status ===
                "PRESENT"
              ) {
                presentDays++;
              }

              if (
                attendance?.status ===
                "ABSENT"
              ) {
                absentDays++;
              }
            }

            const percentage =
              totalWorkingDays ===
              0
                ? 0
                : (presentDays /
                    totalWorkingDays) *
                  100;

            return {
              "S.No": index + 1,
              "Month": month,
              "Hall Ticket":
                student.hallTicket,
              "Student Name":
                student.name,
              "Branch":
                student.branch.name,
              "Branch Code":
                student.branch.code,
              "Academic Year":
                student.academicYear.name,
              "Year":
                student.year,
              "Section":
                student.section ||
                "N/A",
              "Completed Working Days":
                totalWorkingDays,
              "Present Days":
                presentDays,
              "Absent Days":
                absentDays,
              "Attendance Percentage":
                `${Math.min(
                  100,
                  Math.max(
                    0,
                    percentage
                  )
                ).toFixed(2)}%`,
            };
          }
        );

      const csv = createCsv(
        [
          "S.No",
          "Month",
          "Hall Ticket",
          "Student Name",
          "Branch",
          "Branch Code",
          "Academic Year",
          "Year",
          "Section",
          "Completed Working Days",
          "Present Days",
          "Absent Days",
          "Attendance Percentage",
        ],
        rows
      );

      return createCsvResponse(
        csv,
        `monthly-attendance-${month}.csv`
      );
    }

    /*
     * YEARLY REPORT
     *
     * Example:
     * /api/admin/reports/export/csv?type=yearly&academicYearId=1
     */
    if (type === "yearly") {
      const academicYearIdParam =
        searchParams.get(
          "academicYearId"
        );

      if (!academicYearIdParam) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Academic year is required.",
          },
          { status: 400 }
        );
      }

      const academicYearId =
        Number(
          academicYearIdParam
        );

      if (
        !Number.isInteger(
          academicYearId
        ) ||
        academicYearId <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid academic year ID.",
          },
          { status: 400 }
        );
      }

      const academicYear =
        await db.academicYear.findUnique(
          {
            where: {
              id: academicYearId,
            },
          }
        );

      if (!academicYear) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Academic year not found.",
          },
          { status: 404 }
        );
      }

      const workingDays =
        await db.academicDay.findMany({
          where: {
            type: "WORKING_DAY",

            semester: {
              academicYearId,
            },

            session: {
              status: "COMPLETED",
            },
          },

          include: {
            session: {
              include: {
                attendance: {
                  select: {
                    studentId: true,
                    status: true,
                  },
                },
              },
            },
          },
        });

      const students =
        await db.student.findMany({
          where: {
            isActive: true,

            academicYearId,

            user: {
              role: "STUDENT",
              status: "APPROVED",
            },
          },

          include: {
            branch: true,
            academicYear: true,
          },

          orderBy: {
            hallTicket: "asc",
          },
        });

      const totalWorkingDays =
        workingDays.length;

      const rows: CsvRow[] =
        students.map(
          (student, index) => {
            let presentDays = 0;
            let absentDays = 0;

            for (const day of workingDays) {
              const attendance =
                day.session?.attendance.find(
                  (record) =>
                    record.studentId ===
                    student.id
                );

              if (
                attendance?.status ===
                "PRESENT"
              ) {
                presentDays++;
              }

              if (
                attendance?.status ===
                "ABSENT"
              ) {
                absentDays++;
              }
            }

            const percentage =
              totalWorkingDays ===
              0
                ? 0
                : (presentDays /
                    totalWorkingDays) *
                  100;

            return {
              "S.No": index + 1,
              "Academic Year":
                academicYear.name,
              "Hall Ticket":
                student.hallTicket,
              "Student Name":
                student.name,
              "Branch":
                student.branch.name,
              "Branch Code":
                student.branch.code,
              "Year":
                student.year,
              "Section":
                student.section ||
                "N/A",
              "Completed Working Days":
                totalWorkingDays,
              "Present Days":
                presentDays,
              "Absent Days":
                absentDays,
              "Attendance Percentage":
                `${Math.min(
                  100,
                  Math.max(
                    0,
                    percentage
                  )
                ).toFixed(2)}%`,
            };
          }
        );

      const csv = createCsv(
        [
          "S.No",
          "Academic Year",
          "Hall Ticket",
          "Student Name",
          "Branch",
          "Branch Code",
          "Year",
          "Section",
          "Completed Working Days",
          "Present Days",
          "Absent Days",
          "Attendance Percentage",
        ],
        rows
      );

      return createCsvResponse(
        csv,
        `yearly-attendance-${academicYear.name}.csv`
      );
    }

    /*
     * BRANCH REPORT
     *
     * Example:
     * /api/admin/reports/export/csv?type=branch&branchId=1&academicYearId=2
     */
    if (type === "branch") {
      const branchIdParam =
        searchParams.get(
          "branchId"
        );

      const academicYearIdParam =
        searchParams.get(
          "academicYearId"
        );

      if (!branchIdParam) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Branch is required.",
          },
          { status: 400 }
        );
      }

      const branchId =
        Number(branchIdParam);

      if (
        !Number.isInteger(
          branchId
        ) ||
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

      let academicYearId:
        | number
        | undefined;

      if (academicYearIdParam) {
        academicYearId =
          Number(
            academicYearIdParam
          );

        if (
          !Number.isInteger(
            academicYearId
          ) ||
          academicYearId <= 0
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Invalid academic year ID.",
            },
            { status: 400 }
          );
        }
      }

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

      const students =
        await db.student.findMany({
          where: {
            branchId,

            isActive: true,

            ...(academicYearId
              ? {
                  academicYearId,
                }
              : {}),

            user: {
              role: "STUDENT",
              status: "APPROVED",
            },
          },

          include: {
            branch: true,
            academicYear: true,
          },

          orderBy: {
            hallTicket: "asc",
          },
        });

      const workingDays =
        await db.academicDay.findMany({
          where: {
            type: "WORKING_DAY",

            session: {
              status: "COMPLETED",
            },

            ...(academicYearId
              ? {
                  semester: {
                    academicYearId,
                  },
                }
              : {}),
          },

          include: {
            session: {
              include: {
                attendance: {
                  select: {
                    studentId: true,
                    status: true,
                  },
                },
              },
            },
          },
        });

      const totalWorkingDays =
        workingDays.length;

      const rows: CsvRow[] =
        students.map(
          (student, index) => {
            let presentDays = 0;
            let absentDays = 0;

            for (const day of workingDays) {
              const attendance =
                day.session?.attendance.find(
                  (record) =>
                    record.studentId ===
                    student.id
                );

              if (
                attendance?.status ===
                "PRESENT"
              ) {
                presentDays++;
              }

              if (
                attendance?.status ===
                "ABSENT"
              ) {
                absentDays++;
              }
            }

            const percentage =
              totalWorkingDays ===
              0
                ? 0
                : (presentDays /
                    totalWorkingDays) *
                  100;

            return {
              "S.No": index + 1,
              "Branch":
                branch.name,
              "Branch Code":
                branch.code,
              "Academic Year":
                student.academicYear.name,
              "Hall Ticket":
                student.hallTicket,
              "Student Name":
                student.name,
              "Year":
                student.year,
              "Section":
                student.section ||
                "N/A",
              "Completed Working Days":
                totalWorkingDays,
              "Present Days":
                presentDays,
              "Absent Days":
                absentDays,
              "Attendance Percentage":
                `${Math.min(
                  100,
                  Math.max(
                    0,
                    percentage
                  )
                ).toFixed(2)}%`,
            };
          }
        );

      const filename =
        academicYearId
          ? `branch-attendance-${branch.code}-${academicYearId}.csv`
          : `branch-attendance-${branch.code}.csv`;

      const csv = createCsv(
        [
          "S.No",
          "Branch",
          "Branch Code",
          "Academic Year",
          "Hall Ticket",
          "Student Name",
          "Year",
          "Section",
          "Completed Working Days",
          "Present Days",
          "Absent Days",
          "Attendance Percentage",
        ],
        rows
      );

      return createCsvResponse(
        csv,
        filename
      );
    }

    /*
     * STUDENT REPORT
     *
     * Example:
     * /api/admin/reports/export/csv?type=student&studentId=1
     */
    if (type === "student") {
      const studentIdParam =
        searchParams.get(
          "studentId"
        );

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

      const studentId =
        Number(studentIdParam);

      if (
        !Number.isInteger(
          studentId
        ) ||
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
            studentId,

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
                academicDay: true,
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

      const rows: CsvRow[] =
        attendanceRecords.map(
          (record, index) => ({
            "S.No": index + 1,
            "Hall Ticket":
              student.hallTicket,
            "Student Name":
              student.name,
            "Branch":
              student.branch.name,
            "Branch Code":
              student.branch.code,
            "Academic Year":
              student.academicYear.name,
            "Year":
              student.year,
            "Section":
              student.section ||
              "N/A",
            "Date":
              record.session
                .academicDay
                .date
                .toISOString()
                .slice(0, 10),
            "Status":
              record.status ===
              "PRESENT"
                ? "Present"
                : "Absent",
            "Remarks":
              record.session
                .academicDay
                .remarks ||
              "",
          })
        );

      const csv = createCsv(
        [
          "S.No",
          "Hall Ticket",
          "Student Name",
          "Branch",
          "Branch Code",
          "Academic Year",
          "Year",
          "Section",
          "Date",
          "Status",
          "Remarks",
        ],
        rows
      );

      return createCsvResponse(
        csv,
        `student-attendance-${student.hallTicket}.csv`
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Invalid report type. Use daily, monthly, yearly, branch, or student.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error(
      "CSV export error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to export attendance report as CSV.",
      },
      {
        status: 500,
      }
    );
  }
}