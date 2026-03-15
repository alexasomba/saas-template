import { NextRequest } from "next/server";

import configPromise from "@payload-config";
import { getPayload } from "payload";

type VerifyEmailRequest = {
  email?: string;
  token?: string;
};

const INVALID_TOKEN_MESSAGE = "Verification token is invalid.";
const GENERIC_ERROR_MESSAGE = "Unable to verify email.";

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  let body: VerifyEmailRequest;

  try {
    body = (await request.json()) as VerifyEmailRequest;
  } catch {
    return jsonError("Invalid JSON payload.", 400);
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!token) {
    return jsonError("Verification token is required.", 400);
  }

  const payload = await getPayload({ config: configPromise });

  try {
    await payload.verifyEmail({
      collection: "users",
      token,
    });

    return Response.json({
      status: "verified" as const,
      message: "Email verified successfully.",
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error && error.message ? error.message : GENERIC_ERROR_MESSAGE;

    if (errorMessage !== INVALID_TOKEN_MESSAGE || !email) {
      return jsonError(
        errorMessage === INVALID_TOKEN_MESSAGE ? INVALID_TOKEN_MESSAGE : GENERIC_ERROR_MESSAGE,
        errorMessage === INVALID_TOKEN_MESSAGE ? 403 : 400,
      );
    }

    const matchingUsers = await payload.find({
      collection: "users",
      limit: 1,
      where: {
        email: {
          equals: email,
        },
      },
      overrideAccess: true,
    });

    const user = matchingUsers.docs[0];

    if (user?._verified === true) {
      return Response.json({
        status: "already_verified" as const,
        message: "Email already verified. Please sign in.",
      });
    }

    return jsonError(INVALID_TOKEN_MESSAGE, 403);
  }
}
