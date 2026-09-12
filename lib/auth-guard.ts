import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

type AuthResult = {
  session: Awaited<ReturnType<typeof getSession>>;
  user: Awaited<
    ReturnType<typeof db.user.findUnique>
  >;
  error: NextResponse | null;
};

function unauthorizedResponse() {
  return NextResponse.json(
    {
      success: false,
      message: "Authentication required.",
    },
    { status: 401 }
  );
}

function forbiddenResponse(
  message: string
) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status: 403 }
  );
}

export async function requireAuth(): Promise<AuthResult> {
  const session = await getSession();

  if (!session) {
    return {
      session: null,
      user: null,
      error: unauthorizedResponse(),
    };
  }

  const user = await db.user.findUnique({
    where: {
      id: session.userId,
    },
    include: {
      student: true,
    },
  });

  if (!user) {
    return {
      session: null,
      user: null,
      error: unauthorizedResponse(),
    };
  }

  /*
   * Make sure the role stored in the database
   * still matches the role inside the session.
   *
   * This prevents an old/stale session from
   * being trusted after the user's role changes.
   */
  if (user.role !== session.role) {
    return {
      session: null,
      user: null,
      error: forbiddenResponse(
        "Session authorization is no longer valid."
      ),
    };
  }

  /*
   * Only approved accounts can use the system.
   */
  if (user.status !== "APPROVED") {
    return {
      session: null,
      user: null,
      error: forbiddenResponse(
        "Your account is not approved."
      ),
    };
  }

  return {
    session,
    user,
    error: null,
  };
}

export async function requireAdmin(): Promise<AuthResult> {
  const result = await requireAuth();

  if (result.error) {
    return result;
  }

  if (
    !result.user ||
    result.user.role !== "ADMIN"
  ) {
    return {
      session: result.session,
      user: result.user,
      error: forbiddenResponse(
        "Admin access required."
      ),
    };
  }

  return result;
}

export async function requireStudent(): Promise<AuthResult> {
  const result = await requireAuth();

  if (result.error) {
    return result;
  }

  if (
    !result.user ||
    result.user.role !== "STUDENT"
  ) {
    return {
      session: result.session,
      user: result.user,
      error: forbiddenResponse(
        "Student access required."
      ),
    };
  }

  if (!result.user.student) {
    return {
      session: result.session,
      user: result.user,
      error: forbiddenResponse(
        "Student profile not found."
      ),
    };
  }

  /*
   * Inactive students must not access
   * student APIs even if their User account
   * is still approved.
   */
  if (!result.user.student.isActive) {
    return {
      session: result.session,
      user: result.user,
      error: forbiddenResponse(
        "Your student account is inactive."
      ),
    };
  }

  return result;
}