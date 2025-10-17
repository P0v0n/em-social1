import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not set. Add it to your environment (.env.local)");
}

// Generate token
export function signToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
}

// Verify token
export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
}
