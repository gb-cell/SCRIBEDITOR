import { auth } from "@/auth";
import { isAuthDisabled } from "@/lib/auth-access";
import { NextResponse } from "next/server";

export default auth((req) => {
  if (isAuthDisabled()) {
    return NextResponse.next();
  }

  const path = req.nextUrl.pathname;
  const isLoggedIn = !!req.auth?.user;

  if (path.startsWith("/login")) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/", req.nextUrl.origin));
    }
    return NextResponse.next();
  }

  if (path.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    const login = new URL("/login", req.nextUrl.origin);
    if (path !== "/") {
      login.searchParams.set("callbackUrl", path);
    }
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
