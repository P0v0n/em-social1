import axios from 'axios';
import { connectToDB } from '@/app/lib/mongodb';
import { getModelForKeyword } from '@/app/models/socialSchema'; // new schema

export async function POST(req) {
  try {
    const { query, maxResults = 200, commentsPerVideo = 50 } = await req.json();

    if (!query) {
      return Response.json({ error: 'Missing query' }, { status: 400 });
    }

    if (!process.env.YOUTUBE_API_KEY) {
      return Response.json({ error: 'YouTube API key (YOUTUBE_API_KEY) is not set' }, { status: 500 });
    }

    await connectToDB();

    // Use the new unified model for this query
    const SocialPostModel = getModelForKeyword(query);

  // Search for videos (paginate up to maxResults; YouTube caps at 50/page)
  const videos = [];
  let pageToken = undefined;
  while (videos.length < Number(maxResults)) {
    const remaining = Number(maxResults) - videos.length;
    const pageSize = Math.min(50, remaining);
    const searchRes = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        key: process.env.YOUTUBE_API_KEY,
        q: query,
        part: 'snippet',
        maxResults: pageSize,
        type: 'video',
        pageToken,
      },
    });
    const batch = (searchRes.data.items || [])
      .filter(item => item.id?.videoId)
      .map(item => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description || '',
        thumbnail: item.snippet.thumbnails?.default?.url || '',
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      }));
    videos.push(...batch);
    pageToken = searchRes.data.nextPageToken;
    if (!pageToken) break;
  }

  if (videos.length === 0) {
    return Response.json({ message: 'No videos found.' });
  }

  // Fetch video statistics in chunks of 50
  const statsMap = {};
  for (let i = 0; i < videos.length; i += 50) {
    const chunk = videos.slice(i, i + 50).map(v => v.id).join(',');
    const statsRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        key: process.env.YOUTUBE_API_KEY,
        id: chunk,
        part: 'statistics',
      },
    });
    for (const item of (statsRes.data.items || [])) {
      statsMap[item.id] = item.statistics || {};
    }
  }

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

  // Fetch top-level comments for each video (up to commentsPerVideo, max 100)
  const maxComments = Math.min(Number(commentsPerVideo) || 0, 100);
  const commentDocs = [];
  if (maxComments > 0) {
    for (const vid of videos) {
      const cRes = await axios.get('https://www.googleapis.com/youtube/v3/commentThreads', {
        params: {
          key: process.env.YOUTUBE_API_KEY,
          part: 'snippet',
          videoId: vid.id,
          maxResults: Math.min(maxComments, 100),
          order: 'relevance',
          textFormat: 'plainText',
        },
      });
      for (const item of (cRes.data.items || [])) {
        const top = item.snippet?.topLevelComment?.snippet;
        const cid = item.snippet?.topLevelComment?.id || item.id;
        if (!top || !cid) continue;
        commentDocs.push({
          keyword: query,
          postId: `comment-${cid}`,
          text: top.textDisplay || top.textOriginal || '',
          authorName: top.authorDisplayName || '',
          createdAt: new Date(top.publishedAt || Date.now()),
          likeCount: parseInt(top.likeCount || 0),
          commentCount: null,
          shareCount: null,
          viewCount: null,
          mediaUrl: '',
          postUrl: `https://www.youtube.com/watch?v=${vid.id}&lc=${cid}`,
          analysis: {},
        });
      }
    }
  }

  // Upsert videos and comments
  const ops = [];
  for (const doc of docs) {
    ops.push(SocialPostModel.updateOne(
      { postId: doc.postId },
      { $set: doc },
      { upsert: true, runValidators: true }
    ));
  }
  for (const c of commentDocs) {
    ops.push(SocialPostModel.updateOne(
      { postId: c.postId },
      { $set: c },
      { upsert: true, runValidators: true }
    ));
  }
  await Promise.all(ops);

  return Response.json({ message: 'YouTube data saved', videos: docs.length, comments: commentDocs.length });
  } catch (error) {
    const status = error.response?.status || 500;
    const detail = error.response?.data || error.message;
    console.error('YouTube API Error:', detail);
    return Response.json({ error: 'Failed to fetch or save YouTube videos', detail }, { status });
  }
}
