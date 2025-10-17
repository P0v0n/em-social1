import mongoose from 'mongoose';
import { connectToDB } from '@/app/lib/mongodb';

export async function GET(req, context) {
  const { params } = context;
  const { collectionName } = await params;

  try {
    await connectToDB();
    const db = mongoose.connection.db;

    if (!db) {
      return Response.json({ error: 'Database not connected' }, { status: 500 });
    }

    // Only return the analysis field from each document
    const docs = await db.collection(collectionName).find({}, { projection: { analysis: 1 } }).toArray();

    const analysisData = docs.map((doc) => doc.analysis).filter(Boolean); // Remove undefined/nulls

    return Response.json({ analysis: analysisData });
  } catch (error) {
    console.error(`Error fetching analysis for ${collectionName}:`, error);
    return Response.json(
      { error: 'Failed to fetch analysis', detail: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req, context) {
  const { params } = context;
  const { collectionName } = await params;

  try {
    const body = await req.json();
    const overrides = body?.overrides || {};

    if (typeof overrides !== 'object' || Array.isArray(overrides)) {
      return Response.json({ error: 'Invalid overrides payload' }, { status: 400 });
    }

    await connectToDB();
    const db = mongoose.connection.db;

    if (!db) {
      return Response.json({ error: 'Database not connected' }, { status: 500 });
    }

    // Persist overrides in analysis for all docs in this collection so reports can read them consistently
    const result = await db.collection(collectionName).updateMany(
      {},
      { $set: { 'analysis.overrides': overrides } }
    );

    return Response.json({ updatedCount: result.modifiedCount ?? 0 });
  } catch (error) {
    console.error(`Error updating analysis overrides for ${collectionName}:`, error);
    return Response.json(
      { error: 'Failed to update analysis overrides', detail: error.message },
      { status: 500 }
    );
  }
}