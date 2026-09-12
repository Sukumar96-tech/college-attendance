import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { NextResponse } from "next/server";

const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid login data",
          errors: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { username, password } = result.data;

    const normalizedUsername = username.toUpperCase();

    const user = await db.user.findUnique({
      where: {
        username:
          normalizedUsername === "ADMIN" ? "admin" : normalizedUsername,
      },
      include: {
        student: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid username or password.",
        },
        { status: 401 }
      );
    }

    if (user.status === "PENDING") {
      return NextResponse.json(
        {
          success: false,
          message: "Your account is waiting for HOD approval.",
        },
        { status: 403 }
      );
    }

    if (user.status === "REJECTED") {
      return NextResponse.json(
        {
          success: false,
          message: "Your registration has been rejected.",
        },
        { status: 403 }
      );
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid username or password.",
        },
        { status: 401 }
      );
    }

    await createSession({
      userId: user.id,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      message: "Login successful.",
      data: {
        userId: user.id,
        username: user.username,
        role: user.role,
        status: user.status,
        studentId: user.student?.id ?? null,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to complete login.",
      },
      { status: 500 }
    );
  }
}