import { NextResponse } from "next/server";
import { verifyToken } from "./lib/jwt";

export function middleware(request) {
    const token = request.cookies.get("auth")?.value;

    if (process.env.NODE_ENV !== "production") {
        console.log("🔍 Middleware check", {
            path: request.nextUrl.pathname,
            hasToken: Boolean(token),
        });
    }

    // Allow public routes (login, register, API, next internals, static assets)
    const publicPaths = ["/"];
    const isPublic = publicPaths.some((path) =>
        request.nextUrl.pathname.startsWith(path)
    );

    if (isPublic) {
        if (process.env.NODE_ENV !== "production") {
            console.log("🟢 Public path, allowing:", request.nextUrl.pathname);
        }
        return NextResponse.next();
    }

    if (!token) {
        if (process.env.NODE_ENV !== "production") {
            console.log("❌ No token, redirecting to /login");
        }
        return NextResponse.redirect(new URL("/", request.nextUrl.origin));
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        if (process.env.NODE_ENV !== "production") {
            console.log("❌ Invalid token, redirecting to /login");
        }
        return NextResponse.redirect(new URL("/", request.nextUrl.origin));
    }

    if (process.env.NODE_ENV !== "production") {
        console.log("✅ Token valid, access granted");
    }
    return NextResponse.next();
}

// Apply to all routes except API, _next, static files, favicon
export const config = {
    matcher: ["/((?!api|_next|static|favicon.ico).*)"],
};
