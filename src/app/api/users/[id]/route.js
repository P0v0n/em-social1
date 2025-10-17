import { NextResponse } from "next/server";
import { connectToDB } from "@/app/lib/mongodb";
import User from "@/app/models/users";

// ✅ Get Single User (GET /api/users/:id)
export async function GET(req, { params }) {
    try {
        await connectToDB();
        const user = await User.findById(params.id).select("-password");
        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }
        return NextResponse.json({ success: true, user });
    } catch (err) {
        console.error("❌ Error fetching user:", err);
        return NextResponse.json(
            { success: false, message: "Error fetching user" },
            { status: 500 }
        );
    }
}

// ✅ Update User (PUT /api/users/:id)
export async function PUT(req, { params }) {
    try {
        await connectToDB();
        const { email, password } = await req.json();

        const user = await User.findById(params.id);
        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        if (email) user.email = email;
        if (password) user.password = password; // 🔥 will be hashed by pre("save") hook
        await user.save();

        return NextResponse.json({ success: true, user });
    } catch (err) {
        console.error("❌ Error updating user:", err);
        return NextResponse.json(
            { success: false, message: "Error updating user" },
            { status: 500 }
        );
    }
}

// ✅ Delete User (DELETE /api/users/:id)
export async function DELETE(req, { params }) {
    try {
        await connectToDB();
        const deleted = await User.findByIdAndDelete(params.id);
        if (!deleted) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: "User deleted" });
    } catch (err) {
        console.error("❌ Error deleting user:", err);
        return NextResponse.json(
            { success: false, message: "Error deleting user" },
            { status: 500 }
        );
    }
}
