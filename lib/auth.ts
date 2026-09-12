import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "attendance_session";

const SESSION_DURATION_SECONDS =
  60 * 60 * 24 * 7; // 7 days

const secret = process.env.AUTH_SECRET;

if (!secret) {
  throw new Error(
    "AUTH_SECRET is not configured in .env"
  );
}

if (secret.length < 32) {
  throw new Error(
    "AUTH_SECRET must contain at least 32 characters."
  );
}

const secretKey =
  new TextEncoder().encode(secret);

export type SessionPayload = {
  userId: number;
  role: "ADMIN" | "STUDENT";
};

export async function createSession(
  payload: SessionPayload
) {
  const token = await new SignJWT({
    userId: payload.userId,
    role: payload.role,
  })
    .setProtectedHeader({
      alg: "HS256",
      typ: "JWT",
    })
    .setIssuedAt()
    .setExpirationTime(
      `${SESSION_DURATION_SECONDS}s`
    )
    .sign(secretKey);

  const cookieStore =
    await cookies();

  cookieStore.set(
    SESSION_COOKIE_NAME,
    token,
    {
      httpOnly: true,

      secure:
        process.env.NODE_ENV ===
        "production",

      sameSite: "lax",

      path: "/",

      maxAge:
        SESSION_DURATION_SECONDS,
    }
  );
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore =
      await cookies();

    const token =
      cookieStore.get(
        SESSION_COOKIE_NAME
      )?.value;

    if (!token) {
      return null;
    }

    const { payload } =
      await jwtVerify(
        token,
        secretKey,
        {
          algorithms: ["HS256"],
        }
      );

    if (
      typeof payload.userId !==
      "number"
    ) {
      return null;
    }

    if (
      payload.userId <= 0
    ) {
      return null;
    }

    if (
      payload.role !== "ADMIN" &&
      payload.role !== "STUDENT"
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore =
    await cookies();

  cookieStore.set(
    SESSION_COOKIE_NAME,
    "",
    {
      httpOnly: true,

      secure:
        process.env.NODE_ENV ===
        "production",

      sameSite: "lax",

      path: "/",

      maxAge: 0,
    }
  );
}