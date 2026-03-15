import { NextRequest } from "next/server";

import configPromise from "@payload-config";
import { getPayload } from "payload";
import type { RequiredDataFromCollectionSlug } from "payload";

import type { User } from "@/payload-types";
import type { AppUser } from "@/types/user";
import { buildAccountCreatedEmail } from "@/utilities/email/templates";

const MIN_PASSWORD_LENGTH = 8;

type AccountRequest = {
  accountInviteToken?: string;
  password?: string;
  marketingOptIn?: boolean;
};

type ErrorResponse = {
  error: string;
};

function jsonError(message: string, status: number) {
  const payload: ErrorResponse = { error: message };
  return Response.json(payload, { status });
}

export async function POST(request: NextRequest) {
  let body: AccountRequest;
  try {
    body = (await request.json()) as AccountRequest;
  } catch (error) {
    return jsonError("Invalid JSON payload.", 400);
  }

  if (!body || typeof body !== "object") {
    return jsonError("Invalid account conversion payload.", 400);
  }

  const { accountInviteToken, password, marketingOptIn } = body;

  if (!accountInviteToken || typeof accountInviteToken !== "string") {
    return jsonError("Account invite token is required.", 400);
  }

  if (!password || typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return jsonError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`, 400);
  }

  const payload = await getPayload({ config: configPromise });

  const orders = await payload.find({
    collection: "orders",
    where: {
      "accountInvite.token": {
        equals: accountInviteToken,
      },
    },
    limit: 1,
    depth: 2,
  });

  const order = orders.docs[0];

  if (!order) {
    return jsonError("Invite token is invalid or has already been used.", 400);
  }

  const invite = order.accountInvite;

  if (!invite?.expiresAt || !invite.token) {
    return jsonError("Invite token is invalid or has already been used.", 400);
  }

  if (invite.redeemedAt) {
    return jsonError("This invite token was already redeemed.", 400);
  }

  const expiresAt = new Date(invite.expiresAt);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
    return jsonError("Invite token has expired. Request a new invite from support.", 400);
  }

  const customerEmail = order.customerEmail || order.contact?.email;
  if (!customerEmail) {
    payload.logger.error("Order missing customer email during account conversion.");
    return jsonError("Order is missing contact information. Please reach out to support.", 400);
  }

  const existingUsers = await payload.find({
    collection: "users",
    where: {
      email: {
        equals: customerEmail,
      },
    },
    limit: 1,
  });

  if (existingUsers.totalDocs > 0) {
    return jsonError("An account already exists for this email. Try signing in instead.", 400);
  }

  const fullName = [order.contact?.firstName, order.contact?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  let user: User;
  try {
    type CustomerRoles = NonNullable<AppUser["roles"]>;
    type CustomerCreateData = RequiredDataFromCollectionSlug<"users"> & {
      roles: CustomerRoles;
      password: string;
      name: string;
    };

    const userData: CustomerCreateData = {
      _verified: true,
      email: customerEmail,
      marketingOptIn:
        typeof marketingOptIn === "boolean"
          ? marketingOptIn
          : (order.contact?.marketingOptIn ?? false),
      password,
      roles: ["customer"],
      name: fullName || customerEmail,
    };

    user = await payload.create({
      collection: "users",
      data: userData,
    });
  } catch (error) {
    payload.logger.error(error, "Failed to create user during account conversion.");
    return jsonError("Unable to create account. Please contact support.", 500);
  }

  const redeemedAt = new Date().toISOString();
  const updatedContact = {
    email: order.contact?.email ?? customerEmail,
    firstName: order.contact?.firstName,
    lastName: order.contact?.lastName,
    phone: order.contact?.phone,
    marketingOptIn:
      typeof marketingOptIn === "boolean"
        ? marketingOptIn
        : (order.contact?.marketingOptIn ?? false),
  };

  try {
    await payload.update({
      collection: "orders",
      id: order.id,
      data: {
        customer: user.id,
        contact: updatedContact,
        accountInvite: {
          token: null,
          expiresAt: invite.expiresAt,
          redeemedAt,
          user: user.id,
        },
      },
    });
  } catch (error) {
    payload.logger.error(error, "Failed to update order after account conversion.");
    return jsonError(
      "Account created, but order could not be linked. Support has been notified.",
      500,
    );
  }

  if (Array.isArray(order.transactions) && order.transactions.length > 0) {
    for (const transactionRef of order.transactions) {
      const transactionId = typeof transactionRef === "object" ? transactionRef.id : transactionRef;
      if (!transactionId) continue;
      try {
        await payload.update({
          collection: "transactions",
          id: transactionId,
          data: {
            customer: user.id,
            customerEmail,
          },
        });
      } catch (error) {
        payload.logger.warn(
          error,
          "Failed to associate transaction with new customer during account conversion.",
        );
      }
    }
  }

  payload.logger.info(
    {
      orderID: order.id,
      userID: user.id,
    },
    "Guest checkout successfully converted into customer account.",
  );

  try {
    const emailMessage = buildAccountCreatedEmail({
      email: customerEmail,
    });

    await payload.sendEmail({
      to: customerEmail,
      subject: emailMessage.subject,
      html: emailMessage.html,
      text: emailMessage.text,
    });
  } catch (error) {
    payload.logger.warn(error, "Failed to send account creation email.");
  }

  return Response.json({
    message: "Account created and linked to your order history.",
  });
}
