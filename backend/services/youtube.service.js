import axios from 'axios';

/**
 * YouTube Data API Service
 * Handles all YouTube API interactions for profile automation
 */

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

/**
 * Parse YouTube URL to extract channel ID or handle
 * Supports multiple URL formats
 */
export const parseYouTubeUrl = (url) => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    // Validate YouTube domain
    if (!hostname.includes('youtube.com') && !hostname.includes('youtu.be')) {
      return { success: false, error: 'Invalid YouTube URL' };
    }

    const pathname = urlObj.pathname;

    // Pattern 1: youtube.com/channel/{channelId}
    if (pathname.includes('/channel/')) {
      const channelId = pathname.split('/channel/')[1].split('/')[0];
      return { success: true, type: 'channelId', value: channelId };
    }

    // Pattern 2: youtube.com/c/{customName}
    if (pathname.includes('/c/')) {
      const customName = pathname.split('/c/')[1].split('/')[0];
      return { success: true, type: 'customName', value: customName };
    }

    // Pattern 3: youtube.com/@{handle}
    if (pathname.includes('/@')) {
      const handle = pathname.split('/@')[1].split('/')[0];
      return { success: true, type: 'handle', value: handle };
    }

    // Pattern 4: youtube.com/user/{username}
    if (pathname.includes('/user/')) {
      const username = pathname.split('/user/')[1].split('/')[0];
      return { success: true, type: 'username', value: username };
    }

    return { success: false, error: 'Unable to parse channel identifier from URL' };
  } catch (error) {
    return { success: false, error: 'Invalid URL format' };
  }
};

/**
 * Resolve custom name or handle to channel ID
 */
export const resolveToChannelId = async (type, value) => {
  if (type === 'channelId') {
    return { success: true, channelId: value };
  }

  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API key not configured');
  }

  try {
    // For handles (starts with @), remove @ symbol
    const searchQuery = type === 'handle' ? value.replace('@', '') : value;

    // Use search endpoint to find channel
    const searchResponse = await axios.get(`${YOUTUBE_API_BASE_URL}/search`, {
      params: {
        part: 'snippet',
        q: searchQuery,
        type: 'channel',
        maxResults: 1,
        key: YOUTUBE_API_KEY
      }
    });

    if (searchResponse.data.items && searchResponse.data.items.length > 0) {
      const channelId = searchResponse.data.items[0].snippet.channelId;
      return { success: true, channelId };
    }

    return { success: false, error: 'Channel not found' };
  } catch (error) {
    console.error('YouTube API Error (resolve):', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Failed to resolve channel ID');
  }
};

/**
 * Fetch channel statistics
 * Returns subscriber count, view count, video count
 */
export const fetchChannelStats = async (channelId) => {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API key not configured');
  }

  try {
    const response = await axios.get(`${YOUTUBE_API_BASE_URL}/channels`, {
      params: {
        part: 'statistics,snippet',
        id: channelId,
        key: YOUTUBE_API_KEY
      }
    });

    if (!response.data.items || response.data.items.length === 0) {
      throw new Error('Channel not found');
    }

    const channel = response.data.items[0];
    const stats = channel.statistics;
    const snippet = channel.snippet;

    return {
      success: true,
      data: {
        channelId: channel.id,
        channelTitle: snippet.title,
        channelDescription: snippet.description,
        thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
        subscriberCount: parseInt(stats.subscriberCount || 0),
        totalViews: parseInt(stats.viewCount || 0),
        videoCount: parseInt(stats.videoCount || 0),
        publishedAt: snippet.publishedAt
      }
    };
  } catch (error) {
    console.error('YouTube API Error (channel stats):', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Failed to fetch channel statistics');
  }
};

/**
 * Fetch recent videos from channel
 */
export const fetchRecentVideos = async (channelId, maxResults = 10) => {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API key not configured');
  }

  try {
    // Get uploads playlist ID
    const channelResponse = await axios.get(`${YOUTUBE_API_BASE_URL}/channels`, {
      params: {
        part: 'contentDetails',
        id: channelId,
        key: YOUTUBE_API_KEY
      }
    });

    if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
      throw new Error('Channel not found');
    }

    const uploadsPlaylistId = channelResponse.data.items[0].contentDetails.relatedPlaylists.uploads;

    // Get videos from uploads playlist
    const playlistResponse = await axios.get(`${YOUTUBE_API_BASE_URL}/playlistItems`, {
      params: {
        part: 'snippet',
        playlistId: uploadsPlaylistId,
        maxResults: maxResults,
        key: YOUTUBE_API_KEY
      }
    });

    const videoIds = playlistResponse.data.items.map(item => item.snippet.resourceId.videoId).join(',');

    // Get video statistics
    const videosResponse = await axios.get(`${YOUTUBE_API_BASE_URL}/videos`, {
      params: {
        part: 'statistics,snippet',
        id: videoIds,
        key: YOUTUBE_API_KEY
      }
    });

    return {
      success: true,
      videos: videosResponse.data.items.map(video => ({
        videoId: video.id,
        title: video.snippet.title,
        publishedAt: video.snippet.publishedAt,
        viewCount: parseInt(video.statistics.viewCount || 0),
        likeCount: parseInt(video.statistics.likeCount || 0),
        commentCount: parseInt(video.statistics.commentCount || 0)
      }))
    };
  } catch (error) {
    console.error('YouTube API Error (recent videos):', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Failed to fetch recent videos');
  }
};

/**
 * Fetch specific video statistics
 */
export const fetchVideoStats = async (videoId) => {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API key not configured');
  }

  try {
    const response = await axios.get(`${YOUTUBE_API_BASE_URL}/videos`, {
      params: {
        part: 'statistics,snippet',
        id: videoId,
        key: YOUTUBE_API_KEY
      }
    });

    if (!response.data.items || response.data.items.length === 0) {
      throw new Error('Video not found');
    }

    const video = response.data.items[0];
    const stats = video.statistics;

    return {
      success: true,
      data: {
        videoId: video.id,
        title: video.snippet.title,
        publishedAt: video.snippet.publishedAt,
        viewCount: parseInt(stats.viewCount || 0),
        likeCount: parseInt(stats.likeCount || 0),
        commentCount: parseInt(stats.commentCount || 0),
        engagementRate: calculateEngagementRate(
          parseInt(stats.likeCount || 0),
          parseInt(stats.commentCount || 0),
          parseInt(stats.viewCount || 0)
        )
      }
    };
  } catch (error) {
    console.error('YouTube API Error (video stats):', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Failed to fetch video statistics');
  }
};

/**
 * Calculate average engagement from recent videos
 */
export const calculateAverageEngagement = async (channelId) => {
  try {
    const recentVideos = await fetchRecentVideos(channelId, 10);

    if (!recentVideos.success || recentVideos.videos.length === 0) {
      return { success: false, error: 'No videos found' };
    }

    let totalEngagement = 0;
    let totalViews = 0;

    recentVideos.videos.forEach(video => {
      const engagement = (video.likeCount + video.commentCount) / video.viewCount;
      totalEngagement += engagement;
      totalViews += video.viewCount;
    });

    const averageEngagementRate = (totalEngagement / recentVideos.videos.length) * 100;
    const averageViews = totalViews / recentVideos.videos.length;

    return {
      success: true,
      averageEngagementRate: parseFloat(averageEngagementRate.toFixed(2)),
      averageViews: Math.round(averageViews),
      videoCount: recentVideos.videos.length
    };
  } catch (error) {
    console.error('Error calculating average engagement:', error.message);
    throw error;
  }
};

/**
 * Calculate engagement rate for a video
 */
export const calculateEngagementRate = (likes, comments, views) => {
  if (views === 0) return 0;
  return parseFloat((((likes + comments) / views) * 100).toFixed(2));
};

/**
 * Main function to fetch complete channel profile
 * This is the primary function to use for automation
 */
export const fetchCompleteChannelProfile = async (youtubeUrl) => {
  try {
    // Step 1: Parse URL
    const parseResult = parseYouTubeUrl(youtubeUrl);
    if (!parseResult.success) {
      return { success: false, error: parseResult.error };
    }

    // Step 2: Resolve to channel ID
    const resolveResult = await resolveToChannelId(parseResult.type, parseResult.value);
    if (!resolveResult.success) {
      return { success: false, error: resolveResult.error };
    }

    const channelId = resolveResult.channelId;

    // Step 3: Fetch channel stats
    const channelStats = await fetchChannelStats(channelId);
    if (!channelStats.success) {
      return { success: false, error: 'Failed to fetch channel statistics' };
    }

    // Step 4: Calculate average engagement
    const engagementData = await calculateAverageEngagement(channelId);

    return {
      success: true,
      data: {
        ...channelStats.data,
        averageViews: engagementData.success ? engagementData.averageViews : 0,
        engagementRate: engagementData.success ? engagementData.averageEngagementRate : 0,
        recentVideoCount: engagementData.success ? engagementData.videoCount : 0
      }
    };
  } catch (error) {
    console.error('Error fetching complete channel profile:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to fetch channel profile'
    };
  }
};

export default {
  parseYouTubeUrl,
  resolveToChannelId,
  fetchChannelStats,
  fetchRecentVideos,
  fetchVideoStats,
  calculateAverageEngagement,
  calculateEngagementRate,
  fetchCompleteChannelProfile
};
