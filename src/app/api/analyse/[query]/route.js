// import axios from 'axios';
// import { connectToDB } from '@/app/lib/mongodb';
// import { getModelForKeyword } from '@/app/models/socialSchema';

// export async function POST(_, { params }) {
//   const keyword = params.query; // dynamic path param, e.g., /analyse/ipl

//   if (!keyword) {
//     return Response.json({ error: 'Missing keyword' }, { status: 400 });
//   }

//   await connectToDB();

//   const Model = getModelForKeyword(keyword);
//   const docs = await Model.find().lean();

//   if (!docs.length) {
//     return Response.json({ error: 'No data found for keyword' }, { status: 404 });
//   }

//   const prompt = `
// Analyze the following social media data for "${keyword}" and return a compact JSON with:

// - sentimentDistribution (positive, neutral, negative summaries)
// - topEngagers (top 3 with reason)
// - contentThemes (main topics with examples)
// - keywordFrequency (top 10 keywords and counts)
// - wordCountStats (average words, max words, min words)
// - topPositiveWords (top 5 words)
// - topNegativeWords (top 5 words)

// No extra text. Only valid JSON.

// Data:
// \n\n
// ${docs.map(d => JSON.stringify(d)).join('\n')}
//   `;

//   const geminiRes = await axios.post(
//     `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
//     {
//       contents: [{ parts: [{ text: prompt }] }],
//     },
//     { headers: { 'Content-Type': 'application/json' } }
//   );

//   const content = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text;

//   let analysis;
//   try {
//     const cleaned = content
//       .replace(/^```json\s*/i, '')
//       .replace(/```$/, '')
//       .trim();

//     analysis = JSON.parse(cleaned);
//   } catch (e) {
//     return Response.json({ error: 'Failed to parse Gemini response', raw: content }, { status: 500 });
//   }

//   await Promise.all(
//     docs.map(d =>
//       Model.updateOne({ _id: d._id }, { $set: { analysis } })
//     )
//   );

//   return Response.json({ keyword, analysis });
// }


import axios from 'axios';
import { connectToDB } from '@/app/lib/mongodb';
import { getModelForKeyword } from '@/app/models/socialSchema';

export async function POST(req, context) {
  try {
    const { params } = context;
    const { query } = await params;
    const keyword = query; // dynamic path param, e.g., /analyse/ipl

    if (!keyword) {
      return Response.json({ error: 'Missing keyword' }, { status: 400 });
    }

    console.log(`[ANALYSE API] Analysing collection: ${keyword}`);

    await connectToDB();

    const Model = getModelForKeyword(keyword);
    const docs = await Model.find().lean();

    if (!docs.length) {
      console.log(`[ANALYSE API] No data found for keyword: ${keyword}`);
      return Response.json({ error: 'No data found for keyword' }, { status: 404 });
    }

    console.log(`[ANALYSE API] Found ${docs.length} documents for ${keyword}`);

    const prompt = `
You are a multilingual social media analyst. Analyze the following posts about "${keyword}". The text may include English (en), Hindi (hi), and Marathi (mr). Detect the language per post and perform sentiment analysis accordingly.

Return ONLY valid minified JSON matching this schema exactly:
{
  "summary": {
    "overallDistribution": {"positive": number, "neutral": number, "negative": number},
    "overallConfidenceAvg": number,
    "narrative": string,
    "highlights": Array<string>,
    "recommendations": Array<string>
  },
  "languages": {
    "en": {
      "distribution": {"positive": number, "neutral": number, "negative": number},
      "confidenceAvg": number,
      "topKeywords": Array<{"keyword": string, "count": number}>,
      "themes": Array<{"theme": string, "examples": Array<string>}>,
      "samplePosts": Array<{"text": string, "sentiment": "positive"|"neutral"|"negative", "confidence": number}>
    },
    "hi": {
      "distribution": {"positive": number, "neutral": number, "negative": number},
      "confidenceAvg": number,
      "topKeywords": Array<{"keyword": string, "count": number}>,
      "themes": Array<{"theme": string, "examples": Array<string>}>,
      "samplePosts": Array<{"text": string, "sentiment": "positive"|"neutral"|"negative", "confidence": number}>
    },
    "mr": {
      "distribution": {"positive": number, "neutral": number, "negative": number},
      "confidenceAvg": number,
      "topKeywords": Array<{"keyword": string, "count": number}>,
      "themes": Array<{"theme": string, "examples": Array<string>}>,
      "samplePosts": Array<{"text": string, "sentiment": "positive"|"neutral"|"negative", "confidence": number}>
    }
  },
  "topEngagers": Array<{"channelTitle": string, "reason": string}>,
  "wordCountStats": {"avg": number, "max": number, "min": number},
  "keywordFrequency": Object
}

Guidance:
Perform language detection using cues in text; map to keys: en, hi, mr.
Classify sentiment as positive, neutral, or negative. Provide a confidence 0..1.
For topKeywords, lemmatize/stem and aggregate within each language; include Devanagari tokens for hi/mr.
themes should be concise labels with 1-2 short example posts each (in original language).
Keep arrays short (<=10 items). Numbers must be numbers. Strings must not contain newlines.
IMPORTANT: Output ONLY JSON without any extra commentary. No code fences.
IMPORTANT: Include keywordFrequency as an object with top keywords and their counts for word cloud visualization.

Data to analyze (newline-separated JSON objects):\n\n
${docs.map(d => JSON.stringify(d)).join('\n')}
    `;

    console.log('[ANALYSE API] Calling Gemini API...');
    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const content = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text;

    let analysis;
    try {
      const cleaned = content
        .replace(/^```json\s*/i, '')
        .replace(/```$/, '')
        .trim();

      analysis = JSON.parse(cleaned);
    } catch (e) {
      console.error('[ANALYSE API] Failed to parse Gemini response:', e);
      return Response.json({ error: 'Failed to parse Gemini response', raw: content }, { status: 500 });
    }

    await Promise.all(
      docs.map(d =>
        Model.updateOne({ _id: d._id }, { $set: { analysis } })
      )
    );

    console.log(`[ANALYSE API] Analysis completed for ${keyword}`);
    return Response.json({ keyword, analysis });
  } catch (error) {
    console.error('[ANALYSE API] Error:', error);
    return Response.json(
      { error: 'Analysis failed', detail: error.message },
      { status: 500 }
    );
  }
}