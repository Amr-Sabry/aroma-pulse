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

  if (pathname === "/login") {
    const session = await auth();
    if (session?.user) {
      const role = session.user.role || "creative";
      return NextResponse.redirect(new URL(roleRoutes[role], request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = session.user.role || "creative";
  const routePrefix = pathname.split("/")[1];

  const rolePrefixes: Record<string, string> = {
    admin: "admin",
    producer: "producer",
    head: "head",
    creative: "designer",
  };

  if (routePrefix && routePrefix !== rolePrefixes[role]) {
    return NextResponse.redirect(new URL(roleRoutes[role], request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
};
