import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEFAULT_CURRENCY } from "@/config/currencies";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const existingCookie = request.cookies.get("payload-currency");

  // If the user hasn't explicitly set a currency preference...
  if (!existingCookie) {
    response.cookies.set("payload-currency", DEFAULT_CURRENCY, {
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - admin (Payload admin panel)
     * - api (Payload REST/GraphQL API)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!admin|api|_next/static|_next/image|favicon.ico).*)",
  ],
};
