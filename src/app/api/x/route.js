import axios from "axios";
import { connectToDB } from "@/app/lib/mongodb";
import { getModelForKeyword } from "@/app/models/socialSchema"; // your schema

// ---- Utility: sleep ----
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---- Utility: fetch tweets with retry/backoff ----
async function fetchTweets(query, maxResults, lang) {
  const url = "https://api.twitter.com/2/tweets/search/recent";

  let attempt = 0;
  const maxAttempts = 50;

  while (attempt < maxAttempts) {
    try {
      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${process.env.X_API_BEARER_TOKEN}` },
        params: {
          query: `${query} lang:${lang}`,
          max_results: Math.max(10, Math.min(maxResults, 100)),
          "tweet.fields": "author_id,created_at,text,public_metrics",
          expansions: "referenced_tweets.id,referenced_tweets.id.author_id",
        },
      });

      return data; // ✅ Success, return tweets
    } catch (err) {
      if (err.response?.status === 429) {
        // ---- Rate limit handling ----
        const resetTime = err.response.headers["x-rate-limit-reset"];
        const now = Math.floor(Date.now() / 1000);

        // if header available, wait until reset
        if (resetTime) {
          const waitMs = (resetTime - now + 1) * 1000;
          console.warn(
            `⚠️ Rate limit hit. Waiting ${waitMs / 1000}s before retry...`
          );
          await sleep(waitMs);
        } else {
          // fallback: exponential backoff (2^attempt seconds)
          const waitMs = Math.pow(2, attempt) * 1000;
          console.warn(
            `⚠️ Rate limit hit (no reset header). Backing off ${waitMs /
            1000}s...`
          );
          await sleep(waitMs);
        }

        attempt++;
      } else {
        console.error("❌ Twitter API error:", err.response?.data || err.message);
        throw err;
      }
    }
  }

  throw new Error("Failed after multiple attempts due to rate limits.");
}

// ---- Main API handler ----
export async function POST(req) {
  try {
    const { query, maxResults = 50, lang = "en" } = await req.json();

    if (!query) {
      return Response.json({ error: "Missing query" }, { status: 400 });
    }

    if (!process.env.X_API_BEARER_TOKEN) {
      return Response.json({ error: "X API bearer token (X_API_BEARER_TOKEN) is not set" }, { status: 500 });
    }

    // Connect DB
    await connectToDB();

    // Use unified schema
    const SocialPostModel = getModelForKeyword(query);

    // Fetch tweets safely
    const data = await fetchTweets(query, maxResults, lang);

    const tweets = data.data || [];
    const included = data.includes?.tweets || [];
    const origMap = Object.fromEntries(
      included.map((t) => [t.id, t.public_metrics])
    );

    // Map tweets to DB schema
    const docs = tweets.map((t) => {
      const isRetweet = t.referenced_tweets?.[0]?.type === "retweeted";
      const stats = isRetweet
        ? origMap[t.referenced_tweets[0].id]
        : t.public_metrics;

      return {
        keyword: query,
        postId: t.id,
        text: t.text,
        createdAt: t.created_at,
        likeCount: stats?.like_count ?? 0,
        commentCount: stats?.reply_count ?? 0,
        shareCount: stats?.retweet_count ?? 0,
        viewCount: null, // not included in this endpoint
        mediaUrl: null, // not fetching media here
        postUrl: `https://twitter.com/i/web/status/${t.id}`,
        query,
        analysis: {}, // placeholder for later
      };
    });

    // Save with upsert
    await Promise.all(
      docs.map((doc) =>
        SocialPostModel.updateOne(
          { postId: doc.postId },
          { $set: doc },
          { upsert: true, runValidators: true }
        )
      )
    );

    return Response.json({
      message: "✅ Tweets saved successfully",
      count: docs.length,
    });
  } catch (err) {
    const status = err.response?.status || 500;
    const detail = err.response?.data || err.message;
    console.error("X API Error:", detail);
    return Response.json(
      { error: "Failed to fetch or save tweets", details: detail },
      { status }
    );
  }
}
