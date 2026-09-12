import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { NextResponse } from "next/server";
import { z } from "zod";

const createSemesterSchema = z.object({
  studyYearId: z
    .number()
    .int()
    .positive(),

  name: z
    .string()
    .trim()
    .min(1, "Semester name is required.")
    .max(100),

  number: z
    .number()
    .int()
    .min(1)
    .max(2),

  startDate: z
    .string()
    .min(1, "Start date is required."),

  endDate: z
    .string()
    .min(1, "End date is required."),
});

function parseDate(
  value: string
): Date | null {
  const date = new Date(
    `${value}T00:00:00.000Z`
  );

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

/*
 * GET
 *
 * Optional:
 *
 * /api/admin/semesters?studyYearId=1
 *
 * If studyYearId is provided, only semesters
 * belonging to that study year are returned.
 */

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

    const studyYearIdParam =
      searchParams.get(
        "studyYearId"
      );

    let studyYearId: number | undefined;

    if (studyYearIdParam) {
      studyYearId = Number(
        studyYearIdParam
      );

      if (
        !Number.isInteger(
          studyYearId
        ) ||
        studyYearId <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid study year ID.",
          },
          { status: 400 }
        );
      }
    }

    const semesters =
      await db.semester.findMany({
        where: studyYearId
          ? {
              studyYearId,
              isActive: true,
            }
          : {
              isActive: true,
            },

        include: {
          studyYear: {
            select: {
              id: true,
              name: true,
              number: true,
            },
          },
        },

        orderBy: [
          {
            studyYear: {
              number: "asc",
            },
          },
          {
            number: "asc",
          },
        ],
      });

    return NextResponse.json({
      success: true,

      data: semesters.map(
        (semester) => ({
          id: semester.id,
          name: semester.name,
          number: semester.number,

          startDate:
            semester.startDate,

          endDate:
            semester.endDate,

          isActive:
            semester.isActive,

          studyYear: {
            id:
              semester.studyYear.id,

            name:
              semester.studyYear.name,

            number:
              semester.studyYear.number,
          },
        })
      ),
    });
  } catch (error) {
    console.error(
      "Semester list error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load semesters.",
      },
      { status: 500 }
    );
  }
}

/*
 * POST
 *
 * Creates a semester for a study year.
 *
 * The Admin provides:
 *
 * studyYearId
 * name
 * number
 * startDate
 * endDate
 *
 * No default dates are generated.
 */

export async function POST(
  request: Request
) {
  try {
    const auth = await requireAdmin();

    if (auth.error) {
      return auth.error;
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid JSON request body.",
        },
        { status: 400 }
      );
    }

    const parsed =
      createSemesterSchema.safeParse(
        body
      );

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid semester data.",
          errors:
            parsed.error.flatten()
              .fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      studyYearId,
      name,
      number,
      startDate,
      endDate,
    } = parsed.data;

    const parsedStartDate =
      parseDate(startDate);

    const parsedEndDate =
      parseDate(endDate);

    if (
      !parsedStartDate ||
      !parsedEndDate
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid start or end date.",
        },
        { status: 400 }
      );
    }

    if (
      parsedStartDate >=
      parsedEndDate
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "End date must be after the start date.",
        },
        { status: 400 }
      );
    }

    const studyYear =
      await db.studyYear.findUnique({
        where: {
          id: studyYearId,
        },
      });

    if (!studyYear) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Study year not found.",
        },
        { status: 404 }
      );
    }

    if (!studyYear.isActive) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The selected study year is inactive.",
        },
        { status: 400 }
      );
    }

    const existingSemester =
      await db.semester.findUnique({
        where: {
          studyYearId_number: {
            studyYearId,
            number,
          },
        },
      });

    if (existingSemester) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Semester ${number} already exists for ${studyYear.name}.`,
        },
        { status: 409 }
      );
    }

    /*
     * Prevent overlapping semester
     * periods within the same study year.
     *
     * Example:
     *
     * Semester 1
     * 01-07-2026 → 30-11-2026
     *
     * Semester 2
     * 01-12-2026 → 30-04-2027
     *
     * is valid.
     *
     * Overlapping dates are rejected.
     */

    const overlappingSemester =
      await db.semester.findFirst({
        where: {
          studyYearId,

          OR: [
            {
              startDate: {
                lt: parsedEndDate,
              },
              endDate: {
                gt: parsedStartDate,
              },
            },
          ],
        },
      });

    if (overlappingSemester) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The selected semester period overlaps with another semester in this study year.",
        },
        { status: 409 }
      );
    }

    const semester =
      await db.semester.create({
        data: {
          studyYearId,
          name,
          number,
          startDate:
            parsedStartDate,
          endDate:
            parsedEndDate,
          isActive: true,
        },

        include: {
          studyYear: {
            select: {
              id: true,
              name: true,
              number: true,
            },
          },
        },
      });

    return NextResponse.json(
      {
        success: true,
        message:
          "Semester created successfully.",

        data: {
          id: semester.id,
          name: semester.name,
          number: semester.number,

          startDate:
            semester.startDate,

          endDate:
            semester.endDate,

          isActive:
            semester.isActive,

          studyYear:
            semester.studyYear,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Semester creation error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to create semester.",
      },
      { status: 500 }
    );
  }
}