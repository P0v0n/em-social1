import { NextResponse } from "next/server";
import { verifyToken } from "@/app/lib/jwt";

export async function GET(request) {
    const token = request.cookies.get("auth")?.value;

    if (!token) {
        return NextResponse.json({ success: false, message: "No token" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
    }

    return NextResponse.json({ success: true, user: decoded });
}
