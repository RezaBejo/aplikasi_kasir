import { withAuth, NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Redirect logged-in users away from login page
    if (pathname === "/login") {
      if (!token) return NextResponse.next();
      const dest = token.role === "OWNER" ? "/admin" : "/pos";
      return NextResponse.redirect(new URL(dest, req.url));
    }

    // Block CASHIER from /admin/*
    if (pathname.startsWith("/admin") && token?.role !== "OWNER") {
      return NextResponse.redirect(new URL("/pos", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const { pathname } = req.nextUrl;
        if (pathname === "/login") return true;
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/", "/login", "/pos/:path*", "/admin/:path*"],
};
