import axios from 'axios';
import { connectToDB } from '@/app/lib/mongodb';
import { getModelForKeyword } from '@/app/models/socialSchema'; // new schema

export async function POST(req) {
  try {
    const { query, maxResults = 20} = await req.json();

    if (!query) {
      return Response.json({ error: 'Missing query' }, { status: 400 });
    }

    if (!process.env.YOUTUBE_API_KEY) {
      return Response.json({ error: 'YouTube API key (YOUTUBE_API_KEY) is not set' }, { status: 500 });
    }

    await connectToDB();

    // Use the new unified model for this query
    const SocialPostModel = getModelForKeyword(query);

  // Search for videos
  const searchRes = await axios.get('https://www.googleapis.com/youtube/v3/search', {
    params: {
      key: process.env.YOUTUBE_API_KEY,
      q: query,
      part: 'snippet',
      maxResults,
      type: 'video',
    },
  });

  const videos = (searchRes.data.items || [])
    .filter(item => item.id.videoId)
    .map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description || '',
      thumbnail: item.snippet.thumbnails?.default?.url || '',
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));

  if (videos.length === 0) {
    return Response.json({ message: 'No videos found.' });
  }

  // Fetch video statistics
  const ids = videos.map(v => v.id).join(',');
  const statsRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
    params: {
      key: process.env.YOUTUBE_API_KEY,
      id: ids,
      part: 'statistics',
    },
  });

  const statsMap = Object.fromEntries(
    statsRes.data.items.map(item => [item.id, item.statistics])
  );

  // Map to unified schema
  const docs = videos.map(vid => ({
    keyword: query,
    postId: vid.id,
    text: `${vid.title}\n\n${vid.description}`,
    createdAt: new Date(vid.publishedAt),
    likeCount: parseInt(statsMap[vid.id]?.likeCount || 0),
    commentCount: parseInt(statsMap[vid.id]?.commentCount || 0),
    shareCount: null,
    viewCount: parseInt(statsMap[vid.id]?.viewCount || 0),
    mediaUrl: vid.thumbnail,
    postUrl: vid.videoUrl,
    analysis: {},
  }));

  await Promise.all(
    docs.map(doc =>
      SocialPostModel.updateOne(
        { postId: doc.postId },
        { $set: doc },
        { upsert: true, runValidators: true }
      )
    )
  );
  return Response.json({ message: 'Videos saved successfully', count: docs.length });
  } catch (error) {
    const status = error.response?.status || 500;
    const detail = error.response?.data || error.message;
    console.error('YouTube API Error:', detail);
    return Response.json({ error: 'Failed to fetch or save YouTube videos', detail }, { status });
  }
}
