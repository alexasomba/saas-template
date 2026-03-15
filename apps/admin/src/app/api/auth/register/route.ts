import { NextRequest } from "next/server";

import configPromise from "@payload-config";
import { getPayload } from "payload";

import { buildVerifyEmail } from "@/utilities/email/templates";

const MIN_PASSWORD_LENGTH = 8;

type RegisterRequest = {
  email?: string;
  password?: string;
  passwordConfirm?: string;
};

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  let body: RegisterRequest;

  try {
    body = (await request.json()) as RegisterRequest;
  } catch {
    return jsonError("Invalid JSON payload.", 400);
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const passwordConfirm = typeof body.passwordConfirm === "string" ? body.passwordConfirm : "";
  const host = request.headers.get("host") || "";
  const shouldExposeVerificationToken =
    process.env.VITEST === "true" || host.includes("localhost") || host.startsWith("127.0.0.1");

  if (!email) {
    return jsonError("Email is required.", 400);
  }

  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return jsonError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`, 400);
  }

  if (password !== passwordConfirm) {
    return jsonError("Passwords do not match.", 400);
  }

  const payload = await getPayload({ config: configPromise });

  try {
    await payload.create({
      collection: "users",
      data: {
        email,
        password,
      },
      disableVerificationEmail: true,
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "There was an error creating the account.";

    return jsonError(message, 500);
  }

  const verificationUsers = await payload.find({
    collection: "users",
    limit: 1,
    overrideAccess: true,
    showHiddenFields: true,
    where: {
      email: {
        equals: email,
      },
    },
  });

  const verificationUser = verificationUsers.docs[0];
  const verificationToken =
    verificationUser &&
    typeof verificationUser === "object" &&
    "_verificationToken" in verificationUser &&
    typeof verificationUser._verificationToken === "string"
      ? verificationUser._verificationToken
      : null;

  if (!verificationToken) {
    return Response.json({
      emailSent: false,
      message:
        "Account created, but we could not prepare your verification email right now. Please try verifying again later.",
    });
  }

  try {
    const emailMessage = buildVerifyEmail({
      email,
      token: verificationToken,
    });

    await payload.sendEmail({
      to: email,
      subject: emailMessage.subject,
      html: emailMessage.html,
      text: emailMessage.text,
    });

    return Response.json({
      emailSent: true,
      message: "Account created successfully. Check your email to verify your account.",
    });
  } catch {
    return Response.json({
      emailSent: false,
      ...(shouldExposeVerificationToken ? { verificationToken } : {}),
      message:
        "Account created, but we could not send the verification email right now. Please try verifying again later.",
    });
  }
}
