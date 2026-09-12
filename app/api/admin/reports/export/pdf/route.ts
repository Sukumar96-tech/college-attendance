import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { NextResponse } from "next/server";

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function safeText(value: unknown) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value);
}

async function createPdf(
  title: string,
  subtitle: string,
  headers: string[],
  rows: string[][]
) {
  const pdfDoc =
    await PDFDocument.create();

  const font =
    await pdfDoc.embedFont(
      StandardFonts.Helvetica
    );

  const boldFont =
    await pdfDoc.embedFont(
      StandardFonts.HelveticaBold
    );

  let page = pdfDoc.addPage([
    842,
    595,
  ]);

  const pageWidth =
    page.getWidth();

  const pageHeight =
    page.getHeight();

  const margin = 30;

  let y =
    pageHeight - margin;

  function drawHeader() {
    page.drawText(title, {
      x: margin,
      y,
      size: 16,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    y -= 22;

    page.drawText(subtitle, {
      x: margin,
      y,
      size: 9,
      font,
      color: rgb(0, 0, 0),
    });

    y -= 25;
  }

  drawHeader();

  const availableWidth =
    pageWidth -
    margin * 2;

  const columnWidth =
    availableWidth /
    headers.length;

  const rowHeight = 22;

  function drawCell(
    text: string,
    x: number,
    cellY: number,
    width: number,
    isHeader: boolean
  ) {
    const maxCharacters =
      Math.max(
        8,
        Math.floor(width / 5)
      );

    let displayText =
      text.trim();

    if (
      displayText.length >
      maxCharacters
    ) {
      displayText =
        displayText.slice(
          0,
          maxCharacters - 3
        ) + "...";
    }

    page.drawRectangle({
      x,
      y: cellY - 4,
      width,
      height: rowHeight,
      borderWidth: 0.5,
      borderColor: rgb(
        0.6,
        0.6,
        0.6
      ),
    });

    page.drawText(
      displayText,
      {
        x: x + 4,
        y:
          cellY +
          3,
        size: 7,
        font: isHeader
          ? boldFont
          : font,
        color: rgb(
          0,
          0,
          0
        ),
      }
    );
  }

  function drawTableHeader() {
    let x = margin;

    for (
      let i = 0;
      i < headers.length;
      i++
    ) {
      drawCell(
        headers[i],
        x,
        y,
        columnWidth,
        true
      );

      x += columnWidth;
    }

    y -= rowHeight;
  }

  drawTableHeader();

  for (const row of rows) {
    if (
      y <
      margin + rowHeight
    ) {
      page = pdfDoc.addPage([
        842,
        595,
      ]);

      y =
        page.getHeight() -
        margin;

      drawHeader();

      drawTableHeader();
    }

    let x = margin;

    for (
      let i = 0;
      i < headers.length;
      i++
    ) {
      drawCell(
        safeText(row[i]),
        x,
        y,
        columnWidth,
        false
      );

      x += columnWidth;
    }

    y -= rowHeight;
  }

  const pages =
    pdfDoc.getPages();

  pages.forEach(
    (pdfPage, index) => {
      pdfPage.drawText(
        `Page ${
          index + 1
        } of ${pages.length}`,
        {
          x:
            pageWidth -
            100,
          y: 15,
          size: 7,
          font,
          color: rgb(
            0.3,
            0.3,
            0.3
          ),
        }
      );
    }
  );

  return pdfDoc.save();
}

function createPdfResponse(
  pdfBytes: Uint8Array,
  filename: string
) {
  return new NextResponse(
    pdfBytes as BodyInit,
    {
      status: 200,

      headers: {
        "Content-Type":
          "application/pdf",

        "Content-Disposition":
          `attachment; filename="${filename}"`,

        "Cache-Control":
          "no-store, no-cache, must-revalidate",
      },
    }
  );
}

export async function GET(
  request: Request
) {
  try {
    const auth =
      await requireAdmin();

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
     * DAILY PDF
     */
    if (type === "daily") {
      const date =
        searchParams.get("date");

      if (!date) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Date is required.",
          },
          { status: 400 }
        );
      }

      const selectedDate =
        new Date(
          `${date}T00:00:00.000Z`
        );

      const academicDay =
        await db.academicDay.findUnique(
          {
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
                          academicYear:
                            true,
                          user: true,
                        },
                      },
                    },

                    orderBy: {
                      student: {
                        hallTicket:
                          "asc",
                      },
                    },
                  },
                },
              },

              semester: {
                include: {
                  academicYear:
                    true,
                },
              },
            },
          }
        );

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
        academicDay.session
          .status !==
          "COMPLETED"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Completed attendance is not available.",
          },
          { status: 400 }
        );
      }

      const records =
        academicDay.session.attendance.filter(
          (record) =>
            record.student
              .isActive &&
            record.student.user
              .role === "STUDENT" &&
            record.student.user
              .status === "APPROVED"
        );

      const rows =
        records.map(
          (record, index) => [
            String(index + 1),
            date,
            record.student
              .hallTicket,
            record.student.name,
            record.student
              .branch.name,
            record.student.year,
            record.student
              .section || "N/A",
            record.status ===
            "PRESENT"
              ? "Present"
              : "Absent",
          ]
        );

      const pdfBytes =
        await createPdf(
          "Daily Attendance Report",
          `Date: ${date} | Semester: ${academicDay.semester.name} | Academic Year: ${academicDay.semester.academicYear.name}`,
          [
            "S.No",
            "Date",
            "Hall Ticket",
            "Student",
            "Branch",
            "Year",
            "Section",
            "Status",
          ],
          rows
        );

      return createPdfResponse(
        pdfBytes,
        `daily-attendance-${date}.pdf`
      );
    }

    /*
     * MONTHLY PDF
     */
    if (type === "monthly") {
      const month =
        searchParams.get("month");

      if (!month) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Month is required.",
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
              "Invalid month format.",
          },
          { status: 400 }
        );
      }

      const year =
        Number(match[1]);

      const monthNumber =
        Number(match[2]);

      const startDate =
        new Date(
          Date.UTC(
            year,
            monthNumber - 1,
            1
          )
        );

      const endDate =
        new Date(
          Date.UTC(
            year,
            monthNumber,
            1
          )
        );

      const workingDays =
        await db.academicDay.findMany(
          {
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
          }
        );

      const students =
        await db.student.findMany(
          {
            where: {
              isActive: true,

              user: {
                role: "STUDENT",
                status: "APPROVED",
              },
            },

            include: {
              branch: true,
              academicYear:
                true,
            },

            orderBy: {
              hallTicket:
                "asc",
            },
          }
        );

      const totalWorkingDays =
        workingDays.length;

      const rows =
        students.map(
          (student, index) => {
            let present = 0;
            let absent = 0;

            for (const day of workingDays) {
              const record =
                day.session?.attendance.find(
                  (attendance) =>
                    attendance.studentId ===
                    student.id
                );

              if (
                record?.status ===
                "PRESENT"
              ) {
                present++;
              }

              if (
                record?.status ===
                "ABSENT"
              ) {
                absent++;
              }
            }

            const percentage =
              totalWorkingDays ===
              0
                ? 0
                : (present /
                    totalWorkingDays) *
                  100;

            return [
              String(index + 1),
              student.hallTicket,
              student.name,
              student.branch.name,
              student.academicYear
                .name,
              student.year,
              student.section ||
                "N/A",
              String(
                totalWorkingDays
              ),
              String(present),
              String(absent),
              `${Math.min(
                100,
                Math.max(
                  0,
                  percentage
                )
              ).toFixed(2)}%`,
            ];
          }
        );

      const pdfBytes =
        await createPdf(
          "Monthly Attendance Report",
          `Month: ${month}`,
          [
            "S.No",
            "Hall Ticket",
            "Student",
            "Branch",
            "Academic Year",
            "Year",
            "Section",
            "Working Days",
            "Present",
            "Absent",
            "Percentage",
          ],
          rows
        );

      return createPdfResponse(
        pdfBytes,
        `monthly-attendance-${month}.pdf`
      );
    }

    /*
     * YEARLY PDF
     */
    if (type === "yearly") {
      const academicYearId =
        Number(
          searchParams.get(
            "academicYearId"
          )
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
              "Valid academic year ID is required.",
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
        await db.academicDay.findMany(
          {
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
          }
        );

      const students =
        await db.student.findMany(
          {
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
            },

            orderBy: {
              hallTicket:
                "asc",
            },
          }
        );

      const totalWorkingDays =
        workingDays.length;

      const rows =
        students.map(
          (student, index) => {
            let present = 0;
            let absent = 0;

            for (const day of workingDays) {
              const record =
                day.session?.attendance.find(
                  (attendance) =>
                    attendance.studentId ===
                    student.id
                );

              if (
                record?.status ===
                "PRESENT"
              ) {
                present++;
              }

              if (
                record?.status ===
                "ABSENT"
              ) {
                absent++;
              }
            }

            const percentage =
              totalWorkingDays ===
              0
                ? 0
                : (present /
                    totalWorkingDays) *
                  100;

            return [
              String(index + 1),
              student.hallTicket,
              student.name,
              student.branch.name,
              student.year,
              student.section ||
                "N/A",
              String(
                totalWorkingDays
              ),
              String(present),
              String(absent),
              `${Math.min(
                100,
                Math.max(
                  0,
                  percentage
                )
              ).toFixed(2)}%`,
            ];
          }
        );

      const pdfBytes =
        await createPdf(
          "Year-wise Attendance Report",
          `Academic Year: ${academicYear.name}`,
          [
            "S.No",
            "Hall Ticket",
            "Student",
            "Branch",
            "Year",
            "Section",
            "Working Days",
            "Present",
            "Absent",
            "Percentage",
          ],
          rows
        );

      return createPdfResponse(
        pdfBytes,
        `yearly-attendance-${academicYear.name}.pdf`
      );
    }

    /*
     * BRANCH PDF
     */
    if (type === "branch") {
      const branchId =
        Number(
          searchParams.get(
            "branchId"
          )
        );

      const academicYearIdParam =
        searchParams.get(
          "academicYearId"
        );

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
              "Valid branch ID is required.",
          },
          { status: 400 }
        );
      }

      let academicYearId:
        | number
        | undefined;

      if (
        academicYearIdParam
      ) {
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
        await db.branch.findUnique(
          {
            where: {
              id: branchId,
            },
          }
        );

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
        await db.student.findMany(
          {
            where: {
              branchId,

              isActive: true,

              user: {
                role: "STUDENT",
                status: "APPROVED",
              },

              ...(academicYearId
                ? {
                    academicYearId,
                  }
                : {}),
            },

            include: {
              branch: true,
              academicYear:
                true,
            },

            orderBy: {
              hallTicket:
                "asc",
            },
          }
        );

      const workingDays =
        await db.academicDay.findMany(
          {
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
          }
        );

      const totalWorkingDays =
        workingDays.length;

      const rows =
        students.map(
          (student, index) => {
            let present = 0;
            let absent = 0;

            for (const day of workingDays) {
              const record =
                day.session?.attendance.find(
                  (attendance) =>
                    attendance.studentId ===
                    student.id
                );

              if (
                record?.status ===
                "PRESENT"
              ) {
                present++;
              }

              if (
                record?.status ===
                "ABSENT"
              ) {
                absent++;
              }
            }

            const percentage =
              totalWorkingDays ===
              0
                ? 0
                : (present /
                    totalWorkingDays) *
                  100;

            return [
              String(index + 1),
              student.hallTicket,
              student.name,
              student.academicYear
                .name,
              student.year,
              student.section ||
                "N/A",
              String(
                totalWorkingDays
              ),
              String(present),
              String(absent),
              `${Math.min(
                100,
                Math.max(
                  0,
                  percentage
                )
              ).toFixed(2)}%`,
            ];
          }
        );

      const subtitle =
        academicYearId
          ? `Branch: ${branch.name} (${branch.code}) | Academic Year ID: ${academicYearId}`
          : `Branch: ${branch.name} (${branch.code})`;

      const pdfBytes =
        await createPdf(
          "Branch-wise Attendance Report",
          subtitle,
          [
            "S.No",
            "Hall Ticket",
            "Student",
            "Academic Year",
            "Year",
            "Section",
            "Working Days",
            "Present",
            "Absent",
            "Percentage",
          ],
          rows
        );

      return createPdfResponse(
        pdfBytes,
        `branch-attendance-${branch.code}.pdf`
      );
    }

    /*
     * STUDENT PDF
     */
    if (type === "student") {
      const studentId =
        Number(
          searchParams.get(
            "studentId"
          )
        );

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
              "Valid student ID is required.",
          },
          { status: 400 }
        );
      }

      const student =
        await db.student.findUnique(
          {
            where: {
              id: studentId,
            },

            include: {
              branch: true,
              academicYear:
                true,
            },
          }
        );

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

      const records =
        await db.attendance.findMany(
          {
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
          }
        );

      const rows =
        records.map(
          (record, index) => [
            String(index + 1),
            formatDate(
              record.session
                .academicDay.date
            ),
            record.status ===
            "PRESENT"
              ? "Present"
              : "Absent",
            record.session
              .academicDay
              .remarks || "",
          ]
        );

      const pdfBytes =
        await createPdf(
          "Student Attendance Report",
          `Student: ${student.name} | Hall Ticket: ${student.hallTicket} | Branch: ${student.branch.name} | Academic Year: ${student.academicYear.name}`,
          [
            "S.No",
            "Date",
            "Status",
            "Remarks",
          ],
          rows
        );

      return createPdfResponse(
        pdfBytes,
        `student-attendance-${student.hallTicket}.pdf`
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Invalid report type.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error(
      "PDF export error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to export attendance report as PDF.",
      },
      {
        status: 500,
      }
    );
  }
}