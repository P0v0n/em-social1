import { NextResponse } from "next/server";
import { connectToDB } from "@/app/lib/mongodb";  // ✅ updated import
import User from "@/app/models/users";
import { signToken } from "@/app/lib/jwt";

export async function POST(request) {
    try {
        const { email, password } = await request.json();

        // ✅ Connect to DB
        await connectToDB();

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        // Verify password (using schema method from User model)
        const valid = await user.comparePassword(password);
        if (!valid) {
            return NextResponse.json(
                { success: false, message: "Invalid password" },
                { status: 401 }
            );
        }

        // Generate JWT
        const token = signToken({ id: user._id, email: user.email });

        // Set JWT in HttpOnly cookie
        const response = NextResponse.json({
            success: true,
            // user: { id: user._id, email: user.email },
        });
        response.cookies.set("auth", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
        });

        return response;
    } catch (err) {
        console.error("❌ Login error:", err);
        return NextResponse.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}
