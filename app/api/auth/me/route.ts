import { requireAuth } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await requireAuth();

  if (auth.error) {
    return auth.error;
  }

  return NextResponse.json({
    success: true,
    data: {
      userId: auth.user!.id,
      username: auth.user!.username,
      role: auth.user!.role,
      status: auth.user!.status,
      studentId: auth.user!.student?.id ?? null,
    },
  });
}