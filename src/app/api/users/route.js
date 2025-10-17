import { NextResponse } from "next/server";
import { connectToDB } from "@/app/lib/mongodb";
import User from "@/app/models/users";

// ✅ Create User (POST /api/users)
export async function POST(req) {
    try {
        await connectToDB();
        const { email, password } = await req.json();

        const user = new User({ email, password });
        await user.save();

        return NextResponse.json({ success: true, user });
    } catch (err) {
        console.error("❌ Error creating user:", err);
        return NextResponse.json(
            { success: false, message: "Error creating user" },
            { status: 500 }
        );
    }
}

// ✅ Get All Users (GET /api/users)
export async function GET() {
    try {
        await connectToDB();
        const users = await User.find({}, "-password"); // exclude password
        return NextResponse.json({ success: true, users });
    } catch (err) {
        console.error("❌ Error fetching users:", err);
        return NextResponse.json(
            { success: false, message: "Error fetching users" },
            { status: 500 }
        );
    }
}
