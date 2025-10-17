import mongoose from 'mongoose';
import { connectToDB } from '@/app/lib/mongodb';

export async function GET(req, context) {
    const { params } = context;
    const { collectionName } = await params; // ✅ await before use

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const sortField = searchParams.get('sortField') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    await connectToDB();
    const db = mongoose.connection.db;

    const skip = (page - 1) * limit;

    const totalDocs = await db.collection(collectionName).countDocuments();
    const docs = await db
        .collection(collectionName)
        .find()
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .toArray();

    return Response.json({
        docs,
        pagination: {
            totalDocs,
            totalPages: Math.ceil(totalDocs / limit),
            currentPage: page,
            pageSize: limit,
        },
    });
}
