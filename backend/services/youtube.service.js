const axios = require('axios');

/**
 * YouTube Service - Handle YouTube Data API v3 operations
 * Quota Management: Each request costs units (1-100)
 * Daily Quota: 10,000 units
 */

class YouTubeService {
  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY;
    this.baseURL = 'https://www.googleapis.com/youtube/v3';
    this.quotaUsed = 0; // Track quota usage (reset daily)
  }

  /**
   * Parse YouTube URL and extract channel identifier
   * Supports multiple URL formats:
   * - youtube.com/channel/{channelId}
   * - youtube.com/c/{customName}
   * - youtube.com/@{handle}
   * - youtube.com/user/{username}
   */
  parseYouTubeURL(url) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // Direct channel ID format: /channel/UCxxxxx
      if (pathname.startsWith('/channel/')) {
        return {
          type: 'channelId',
          value: pathname.replace('/channel/', ''),
        };
      }

      // Custom URL format: /c/customName
      if (pathname.startsWith('/c/')) {
        return {
          type: 'customUrl',
          value: pathname.replace('/c/', ''),
        };
      }

      // Modern handle format: /@handle
      if (pathname.startsWith('/@')) {
        return {
          type: 'handle',
          value: pathname.replace('/@', ''),
        };
      }

      // Legacy username format: /user/username
      if (pathname.startsWith('/user/')) {
        return {
          type: 'username',
          value: pathname.replace('/user/', ''),
        };
      }

      throw new Error('Invalid YouTube URL format');
    } catch (error) {
      throw new Error(`Failed to parse YouTube URL: ${error.message}`);
    }
  }

  /**
   * Resolve channel ID from custom URL, handle, or username
   * Cost: 1 quota unit per search
   */
  async resolveChannelId(identifier) {
    const { type, value } = identifier;

    // If already a channel ID, return it
    if (type === 'channelId') {
      return value;
    }

    try {
      // Search for channel by different identifiers
      let searchQuery = '';
      if (type === 'customUrl' || type === 'username') {
        searchQuery = value;
      } else if (type === 'handle') {
        searchQuery = `@${value}`;
      }

      const response = await axios.get(`${this.baseURL}/search`, {
        params: {
          part: 'snippet',
          q: searchQuery,
          type: 'channel',
          maxResults: 1,
          key: this.apiKey,
        },
      });

      this.quotaUsed += 100; // search.list costs 100 units

      if (response.data.items && response.data.items.length > 0) {
        return response.data.items[0].snippet.channelId;
      }

      throw new Error('Channel not found');
    } catch (error) {
      if (error.response?.status === 403) {
        throw new Error('YouTube API quota exceeded or invalid API key');
      }
      throw new Error(`Failed to resolve channel ID: ${error.message}`);
    }
  }

  /**
   * Fetch channel statistics and information
   * Cost: 1 quota unit
   */
  async getChannelStats(channelId) {
    try {
      const response = await axios.get(`${this.baseURL}/channels`, {
        params: {
          part: 'snippet,statistics,brandingSettings',
          id: channelId,
          key: this.apiKey,
        },
      });

      this.quotaUsed += 1; // channels.list costs 1 unit

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error('Channel not found');
      }

      const channel = response.data.items[0];
      const snippet = channel.snippet;
      const statistics = channel.statistics;

      return {
        channelId: channel.id,
        title: snippet.title,
        description: snippet.description,
        customUrl: snippet.customUrl || null,
        thumbnail: snippet.thumbnails.high?.url || snippet.thumbnails.default.url,
        subscriberCount: parseInt(statistics.subscriberCount) || 0,
        videoCount: parseInt(statistics.videoCount) || 0,
        viewCount: parseInt(statistics.viewCount) || 0,
        publishedAt: snippet.publishedAt,
        country: snippet.country || null,
      };
    } catch (error) {
      if (error.response?.status === 403) {
        throw new Error('YouTube API quota exceeded or invalid API key');
      }
      throw new Error(`Failed to fetch channel stats: ${error.message}`);
    }
  }

  /**
   * Fetch recent videos from a channel
   * Cost: 1 quota unit for search + 1 for video details
   */
  async getRecentVideos(channelId, maxResults = 10) {
    try {
      // Get video IDs from channel
      const searchResponse = await axios.get(`${this.baseURL}/search`, {
        params: {
          part: 'id',
          channelId: channelId,
          type: 'video',
          order: 'date',
          maxResults: maxResults,
          key: this.apiKey,
        },
      });

      this.quotaUsed += 100; // search.list costs 100 units

      const videoIds = searchResponse.data.items.map(item => item.id.videoId).join(',');

      if (!videoIds) {
        return [];
      }

      // Get detailed video statistics
      const videosResponse = await axios.get(`${this.baseURL}/videos`, {
        params: {
          part: 'snippet,statistics',
          id: videoIds,
          key: this.apiKey,
        },
      });

      this.quotaUsed += 1; // videos.list costs 1 unit

      return videosResponse.data.items.map(video => ({
        videoId: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        publishedAt: video.snippet.publishedAt,
        thumbnail: video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default.url,
        views: parseInt(video.statistics.viewCount) || 0,
        likes: parseInt(video.statistics.likeCount) || 0,
        comments: parseInt(video.statistics.commentCount) || 0,
      }));
    } catch (error) {
      if (error.response?.status === 403) {
        throw new Error('YouTube API quota exceeded or invalid API key');
      }
      throw new Error(`Failed to fetch recent videos: ${error.message}`);
    }
  }

  /**
   * Calculate engagement rate from videos
   * Formula: Average((likes + comments) / views * 100) across all videos
   */
  calculateEngagementRate(videos) {
    if (!videos || videos.length === 0) {
      return 0;
    }

    const engagementRates = videos.map(video => {
      if (video.views === 0) return 0;
      return ((video.likes + video.comments) / video.views) * 100;
    });

    const averageEngagement = engagementRates.reduce((sum, rate) => sum + rate, 0) / engagementRates.length;
    return parseFloat(averageEngagement.toFixed(2));
  }

  /**
   * Calculate average views per video
   */
  calculateAverageViews(videos) {
    if (!videos || videos.length === 0) {
      return 0;
    }

    const totalViews = videos.reduce((sum, video) => sum + video.views, 0);
    return Math.round(totalViews / videos.length);
  }

  /**
   * Fetch complete YouTube profile with analytics
   * This is the main function that combines all data
   * Total cost: ~102 quota units (100 for search, 1 for channel, 1 for videos)
   */
  async fetchCompleteProfile(youtubeUrl) {
    try {
      // Step 1: Parse URL and get identifier
      const identifier = this.parseYouTubeURL(youtubeUrl);

      // Step 2: Resolve to channel ID
      const channelId = await this.resolveChannelId(identifier);

      // Step 3: Get channel statistics
      const channelStats = await this.getChannelStats(channelId);

      // Step 4: Get recent videos
      const recentVideos = await this.getRecentVideos(channelId, 10);

      // Step 5: Calculate engagement metrics
      const engagementRate = this.calculateEngagementRate(recentVideos);
      const averageViews = this.calculateAverageViews(recentVideos);

      return {
        success: true,
        data: {
          channel: channelStats,
          metrics: {
            engagementRate,
            averageViews,
          },
          recentVideos: recentVideos.slice(0, 5), // Return only top 5 for response
          quotaUsed: this.quotaUsed,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        quotaUsed: this.quotaUsed,
      };
    }
  }

  /**
   * Analyze a specific YouTube video
   * Cost: 1 quota unit
   */
  async analyzeVideo(videoUrl) {
    try {
      // Extract video ID from URL
      const videoId = this.extractVideoId(videoUrl);

      const response = await axios.get(`${this.baseURL}/videos`, {
        params: {
          part: 'snippet,statistics',
          id: videoId,
          key: this.apiKey,
        },
      });

      this.quotaUsed += 1;

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error('Video not found');
      }

      const video = response.data.items[0];
      const views = parseInt(video.statistics.viewCount) || 0;
      const likes = parseInt(video.statistics.likeCount) || 0;
      const comments = parseInt(video.statistics.commentCount) || 0;
      
      const engagementRate = views > 0 ? ((likes + comments) / views) * 100 : 0;

      return {
        success: true,
        data: {
          videoId: video.id,
          title: video.snippet.title,
          channelTitle: video.snippet.channelTitle,
          publishedAt: video.snippet.publishedAt,
          views,
          likes,
          comments,
          engagementRate: parseFloat(engagementRate.toFixed(2)),
        },
        quotaUsed: this.quotaUsed,
      };
    } catch (error) {
      if (error.response?.status === 403) {
        throw new Error('YouTube API quota exceeded or invalid API key');
      }
      return {
        success: false,
        error: error.message,
        quotaUsed: this.quotaUsed,
      };
    }
  }

  /**
   * Extract video ID from YouTube video URL
   */
  extractVideoId(url) {
    try {
      const urlObj = new URL(url);
      
      // Standard format: youtube.com/watch?v=VIDEO_ID
      if (urlObj.searchParams.has('v')) {
        return urlObj.searchParams.get('v');
      }
      
      // Short format: youtu.be/VIDEO_ID
      if (urlObj.hostname === 'youtu.be') {
        return urlObj.pathname.slice(1);
      }

      throw new Error('Invalid YouTube video URL');
    } catch (error) {
      throw new Error(`Failed to extract video ID: ${error.message}`);
    }
  }

  /**
   * Get current quota usage (for monitoring)
   */
  getQuotaUsage() {
    return {
      used: this.quotaUsed,
      limit: 10000,
      remaining: 10000 - this.quotaUsed,
      percentage: ((this.quotaUsed / 10000) * 100).toFixed(2),
    };
  }
}

module.exports = new YouTubeService();
