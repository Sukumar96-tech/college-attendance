import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
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

    const newPassword =
      typeof body.newPassword === "string"
        ? body.newPassword
        : "";

    const confirmPassword =
      typeof body.confirmPassword === "string"
        ? body.confirmPassword
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

    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password must contain at least 8 characters.",
        },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message:
            "New password and confirm password do not match.",
        },
        { status: 400 }
      );
    }

    const student =
      await db.student.findUnique({
        where: {
          hallTicket,
        },
        select: {
          id: true,
          userId: true,
          hallTicket: true,
          email: true,
          isActive: true,
          user: {
            select: {
              id: true,
              username: true,
              passwordHash: true,
              role: true,
              status: true,
            },
          },
        },
      });

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Student account could not be found.",
        },
        { status: 404 }
      );
    }

    if (!student.email) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No registered email is associated with this student account.",
        },
        { status: 400 }
      );
    }

    if (
      student.email.toLowerCase() !== email
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Hall ticket and registered email do not match.",
        },
        { status: 400 }
      );
    }

    if (!student.isActive) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This student account is inactive.",
        },
        { status: 403 }
      );
    }

    if (
      student.user.role !== "STUDENT"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This account is not a student account.",
        },
        { status: 403 }
      );
    }

    if (
      student.user.status !== "APPROVED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This student account is not approved.",
        },
        { status: 403 }
      );
    }

    /*
     * Hash the new password using the same
     * bcrypt algorithm used by the application.
     */
    const newPasswordHash =
      await bcrypt.hash(
        newPassword,
        12
      );

    /*
     * Update the password in the User table.
     */
    await db.user.update({
      where: {
        id: student.userId,
      },
      data: {
        passwordHash: newPasswordHash,
      },
    });

    /*
     * Verify that the newly stored password
     * can actually be checked successfully.
     */
    const updatedUser =
      await db.user.findUnique({
        where: {
          id: student.userId,
        },
        select: {
          passwordHash: true,
        },
      });

    if (!updatedUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password was not saved correctly.",
        },
        { status: 500 }
      );
    }

    const passwordVerified =
      await bcrypt.compare(
        newPassword,
        updatedUser.passwordHash
      );

    if (!passwordVerified) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password verification failed. Please try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Password reset successfully. You can now login using your hall ticket and new password.",
    });
  } catch (error) {
    console.error(
      "Forgot password reset error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to reset password.",
      },
      { status: 500 }
    );
  }
}