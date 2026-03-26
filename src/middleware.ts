import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";

export async function middleware(request: Request) {
  const { pathname } = new URL(request.url);

  // Allow public paths
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check auth on protected routes
  const session = await auth();

  if (!session?.user && pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Role-based redirects
  if (session?.user) {
    const role = session.user.role;
    if (role === "creative" && pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/designer", request.url));
    }
    if (role === "producer" && pathname.startsWith("/admin") && !pathname.startsWith("/admin/producer")) {
      return NextResponse.redirect(new URL("/producer", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
