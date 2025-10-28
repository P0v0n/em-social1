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
import { analyseSentiments } from '@/app/lib/localSentiment';

export async function POST(_req, { params }) {
  try {
    const keyword = params?.query; // dynamic path param, e.g., /analyse/ipl

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

    // Focus analytics on comments if present; otherwise include all
    const commentDocs = docs.filter(d => typeof d.postId === 'string' && (d.postId.startsWith('comment-') || d.postId.startsWith('reply-')));
    const sourceDocs = commentDocs.length > 0 ? commentDocs : docs;

    // Local sentiment per text
    const texts = sourceDocs.map(d => (d.text || '').toString().slice(0, 5000));
    const created = sourceDocs.map(d => d.createdAt ? new Date(d.createdAt) : null);
    const senti = await analyseSentiments(texts);
    const counts = { positive: 0, neutral: 0, negative: 0 };
    const samples = { en: [], hi: [], mr: [] };
    const trendMap = new Map(); // date -> {pos,neu,neg,total}
    const wordLengths = [];

    senti.forEach((s, i) => {
      const sentiment = s.sentiment;
      counts[sentiment] = (counts[sentiment] || 0) + 1;

      const t = texts[i] || '';
      const tokensCount = (t.match(/\S+/g) || []).length;
      wordLengths.push(tokensCount);
      const isDevanagari = /[\u0900-\u097F]/.test(t);
      const lang = isDevanagari ? 'hi' : 'en';
      if (samples[lang].length < 50) {
        samples[lang].push({ text: t.slice(0, 240).replace(/\s+/g, ' ').trim(), sentiment, confidence: Number(s.confidence?.toFixed?.(3) || s.confidence || 0) });
      }

      const dt = created[i];
      if (dt && !isNaN(dt)) {
        const day = dt.toISOString().slice(0,10);
        const bucket = trendMap.get(day) || { date: day, positive: 0, neutral: 0, negative: 0, total: 0 };
        bucket[sentiment] += 1;
        bucket.total += 1;
        trendMap.set(day, bucket);
      }
    });

    const trend = Array.from(trendMap.values()).sort((a,b)=> a.date.localeCompare(b.date));

    // Keyword frequency (simple token counts)
    const freq = {};
    for (const t of texts) {
      const tokens = (t.toLowerCase().match(/[a-z\u0900-\u097F]+/g) || []).slice(0, 200);
      for (const tok of tokens) freq[tok] = (freq[tok] || 0) + 1;
    }
    const topFreq = Object.fromEntries(Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0, 100));

    // Word count stats
    const wcAvg = wordLengths.length ? (wordLengths.reduce((a,b)=>a+b,0) / wordLengths.length) : 0;
    const wcMax = wordLengths.length ? Math.max(...wordLengths) : 0;
    const wcMin = wordLengths.length ? Math.min(...wordLengths) : 0;

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
  "trend": Array<{"date": string, "positive": number, "neutral": number, "negative": number, "total": number}>,
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
For "trend", aggregate posts per calendar day (UTC) using the post's createdAt field; include counts per sentiment and total; only include days present in the data; sort ascending; prefer last 90 days if many.
For topKeywords, lemmatize/stem and aggregate within each language; include Devanagari tokens for hi/mr.
themes should be concise labels with 1-2 short example posts each (in original language).
Keep arrays short (<=10 items). Numbers must be numbers. Strings must not contain newlines.
IMPORTANT: Output ONLY JSON without any extra commentary. No code fences.
IMPORTANT: Include keywordFrequency as an object with top keywords and their counts for word cloud visualization.

Data to analyze (newline-separated JSON objects):\n\n
${docs.map(d => JSON.stringify(d)).join('\n')}
    `;

    let narrative = '';
    try {
      if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY missing');
      console.log('[ANALYSE API] Calling Gemini for narrative...');
      const geminiRes = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const content = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      narrative = String(content).slice(0, 2000);
    } catch (e) {
      console.warn('[ANALYSE API] Narrative generation skipped:', e?.message || e);
    }

    // Robust JSON extraction from potential fenced code blocks or commentary
    function tryParse(jsonText) {
      if (!jsonText) return null;
      try {
        return JSON.parse(jsonText);
      } catch (_) {
        return null;
      }
    }

    let body = String(content);
    // Prefer fenced block if present
    const fenced = body.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced && fenced[1]) body = fenced[1];
    body = body.trim();

    let analysis = tryParse(body);
    if (!analysis) {
      // Strip any stray backticks or language hints
      let stripped = body.replace(/```[a-z]*\s*/gi, '').replace(/```/g, '').trim();
      analysis = tryParse(stripped);
    }
    if (!analysis) {
      // Remove trailing commas before closing braces/brackets
      const withoutTrailingCommas = body.replace(/,(\s*[}\]])/g, '$1');
      analysis = tryParse(withoutTrailingCommas);
    }
    if (!analysis) {
      // Fallback: extract first {...} block
      const start = body.indexOf('{');
      const end = body.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        const candidate = body.slice(start, end + 1);
        analysis = tryParse(candidate);
      }
    }
    // Build fallback analysis when narrative not parsed
    if (!analysis) {
      analysis = {
        summary: {
          overallDistribution: counts,
          overallConfidenceAvg: 0,
          narrative: narrative || 'Narrative unavailable.',
          highlights: [],
          recommendations: [],
        },
        trend,
        languages: {
          en: { distribution: counts, confidenceAvg: 0, topKeywords: [], themes: [], samplePosts: samples.en },
          hi: { distribution: counts, confidenceAvg: 0, topKeywords: [], themes: [], samplePosts: samples.hi },
          mr: { distribution: counts, confidenceAvg: 0, topKeywords: [], themes: [], samplePosts: samples.mr },
        },
        topEngagers: [],
        wordCountStats: { avg: wcAvg, max: wcMax, min: wcMin },
        keywordFrequency: topFreq,
      };
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