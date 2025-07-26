import { NextRequest, NextResponse } from "next/server";
import Cookies from "universal-cookie";
import { jwtDecode } from "jwt-decode";

export async function middleware(request: NextRequest) {
  const cookies = new Cookies(request.headers.get("cookie"));
  const accessToken = cookies.get("accessToken");

  if (!accessToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const decoded: any = jwtDecode(accessToken);
    const role = decoded.role;
    const path = request.nextUrl.pathname;

    // Admin access to all routes
    if (role === 'admin') {
      return NextResponse.next();
    }

    // CEO access
    if (role === 'ceo') {
      if (path.startsWith("/ceo") || path.startsWith("/dashboard")) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    // Laboratory routes
    if (path.startsWith("/laboratory")) {
      return role === 'laboratory' 
        ? NextResponse.next() 
        : NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    // Pharmacy routes - allow both pharmacy and admin
    if (path.startsWith("/pharmacy")) {
      return (role === 'pharmacy' || role === 'admin') 
        ? NextResponse.next() 
        : NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    // Default deny
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  } catch (error) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/laboratory/:path*",
    "/pharmacy/:path*",
    "/ceo/:path*",
    "/dashboard/:path*",
  ],
};