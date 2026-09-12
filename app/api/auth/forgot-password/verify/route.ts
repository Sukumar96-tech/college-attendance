import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const hallTicket =
      typeof body.hallTicket === "string"
        ? body.hallTicket.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    if (!hallTicket || !email) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Hall ticket and registered email are required.",
        },
        { status: 400 }
      );
    }

    const student = await db.student.findUnique({
      where: {
        hallTicket,
      },
      select: {
        id: true,
        email: true,
        isActive: true,
        user: {
          select: {
            status: true,
            role: true,
          },
        },
      },
    });

    if (
      !student ||
      !student.email ||
      student.email.toLowerCase() !== email ||
      student.user.role !== "STUDENT" ||
      student.user.status !== "APPROVED" ||
      !student.isActive
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The hall ticket number and registered email do not match an active approved student account.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Student details verified successfully.",
    });
  } catch (error) {
    console.error(
      "Forgot password verification error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to verify student details.",
      },
      { status: 500 }
    );
  }
}