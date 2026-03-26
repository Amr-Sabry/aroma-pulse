import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  // Match all paths except static files and API routes
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};

export function middleware(request: NextRequest) {
  // Simple redirect for unauthenticated users
  // NextAuth will handle the actual session validation
  const url = request.nextUrl.clone();

  if (!url.pathname.startsWith("/login")) {
    // Let the page handle auth check, just continue
    return NextResponse.next();
  }

  return NextResponse.next();
}
