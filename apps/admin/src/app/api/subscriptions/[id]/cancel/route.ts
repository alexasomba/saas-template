import { NextResponse } from "next/server";
import { getPayload } from "payload";
import configPromise from "@payload-config";
import { headers as getHeaders } from "next/headers.js";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const headers = await getHeaders();
  const payload = await getPayload({ config: configPromise });
  const { user } = await payload.auth({ headers });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscriptionID = Number.parseInt(id, 10);

  if (Number.isNaN(subscriptionID)) {
    return NextResponse.json({ error: "Invalid subscription ID" }, { status: 400 });
  }

  const sub = await payload.findByID({
    collection: "subscriptions",
    id: subscriptionID,
    user,
    overrideAccess: false,
  });

  if (!sub) {
    return NextResponse.json({ error: "Not found or permission denied" }, { status: 403 });
  }

  await payload.update({
    collection: "subscriptions",
    id: subscriptionID,
    data: { status: "cancelled" },
    user,
    overrideAccess: false,
  });

  // redirect back to subscriptions page
  return NextResponse.redirect(new URL("/account/subscriptions", request.url), 303);
}
