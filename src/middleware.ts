import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

const roleRoutes = {
  admin: "/admin",
  producer: "/producer",
  head: "/head",
  creative: "/designer",
} as const;

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes
  if (pathname === "/login" || pathname === "/") {
    const session = await auth();
    if (session?.user && pathname === "/") {
      const role = session.user.role || "creative";
      return NextResponse.redirect(new URL(roleRoutes[role], request.url));
    }
    return NextResponse.next();
  }

  // Redirect root to login
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Auth check for protected routes
  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Role-based route protection
  const role = session.user.role || "creative";
  const routeRole = pathname.split("/")[1] as string;

  if (routeRole && routeRole !== role) {
    // Trying to access another role's route
    return NextResponse.redirect(new URL(roleRoutes[role as keyof typeof roleRoutes], request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
};
