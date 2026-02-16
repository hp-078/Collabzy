const axios = require('axios');

/**
 * Instagram Service - Handle Instagram profile and post analytics
 * 
 * Uses Instagram Graph API (Business Discovery) with:
 * - INSTAGRAM_ACCESS_TOKEN (Facebook Page access token)
 * - INSTAGRAM_PAGE_ID (Instagram Business Account ID linked to the Facebook Page)
 */

class InstagramService {
  constructor() {
    this.accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    this.pageId = process.env.INSTAGRAM_PAGE_ID; // Instagram Business Account / Page ID
    this.graphApiUrl = 'https://graph.facebook.com/v21.0';
  }

  /**
   * Parse Instagram URL and extract username
   * Supports:
   * - instagram.com/{username}
   * - instagram.com/{username}/
   * - instagram.com/p/{postId}/ (extract username from post)
   */
  parseInstagramURL(url) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // Remove leading and trailing slashes
      const parts = pathname.split('/').filter(p => p);

      // If URL is a post, we can't directly get username without API call
      if (parts[0] === 'p' || parts[0] === 'reel' || parts[0] === 'tv') {
        throw new Error('Please provide profile URL, not post URL');
      }

      // First part should be username
      if (parts.length > 0 && parts[0]) {
        return parts[0];
      }

      throw new Error('Invalid Instagram URL format');
    } catch (error) {
      throw new Error(`Failed to parse Instagram URL: ${error.message}`);
    }
  }

  /**
   * Fetch Instagram profile using Graph API (for business accounts)
   * Requires: Instagram Page ID + Access Token
   * Uses business_discovery to look up any business/creator account by username
   */
  async fetchProfileGraphAPI(username) {
    try {
      if (!this.accessToken) {
        throw new Error('Instagram Graph API access token not configured');
      }
      if (!this.pageId) {
        throw new Error('Instagram Page ID not configured');
      }

      // Use business_discovery with the configured Page ID
      const response = await axios.get(`${this.graphApiUrl}/${this.pageId}`, {
        params: {
          fields: `business_discovery.username(${username}){followers_count,follows_count,media_count,profile_picture_url,biography,username,name,ig_id,media.limit(12){timestamp,like_count,comments_count,media_type,caption,permalink,thumbnail_url,media_url}}`,
          access_token: this.accessToken,
        },
      });

      const profile = response.data.business_discovery;
      const recentMedia = profile.media?.data || [];

      return {
        username: profile.username,
        name: profile.name || profile.username,
        biography: profile.biography || '',
        profilePicture: profile.profile_picture_url,
        followers: profile.followers_count,
        following: profile.follows_count,
        posts: profile.media_count,
        isVerified: false,
        isBusinessAccount: true,
        recentMedia, // Include media for engagement calculation
      };
    } catch (error) {
      if (error.response?.data?.error) {
        const igError = error.response.data.error;
        console.error('Instagram Graph API error details:', igError);
        throw new Error(`Graph API error: ${igError.message}`);
      }
      throw new Error(`Graph API error: ${error.message}`);
    }
  }

  /**
   * Fetch Instagram profile using Graph API
   * Falls back to manual input if Graph API fails
   */
  async fetchProfile(instagramUrl) {
    try {
      const username = this.parseInstagramURL(instagramUrl);
      let profile = null;
      let method = 'unknown';

      // Try Graph API (requires access token + page ID)
      if (this.accessToken && this.pageId) {
        try {
          profile = await this.fetchProfileGraphAPI(username);
          method = 'graph_api';
        } catch (error) {
          console.log('Graph API failed:', error.message);
        }
      }

      // If Graph API fails, return structure for manual input
      if (!profile) {
        return {
          success: false,
          requiresManualInput: true,
          username,
          message: 'Automatic fetching unavailable. Please enter stats manually.',
          profileUrl: `https://instagram.com/${username}`,
        };
      }

      return {
        success: true,
        method,
        data: {
          ...profile,
          profileUrl: `https://instagram.com/${username}`,
          fetchedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Calculate Instagram engagement rate
   * Formula: ((likes + comments) / followers) * 100
   * Average across recent posts
   */
  calculateEngagementRate(posts, followerCount) {
    if (!posts || posts.length === 0 || !followerCount) {
      return 0;
    }

    const totalEngagement = posts.reduce((sum, post) => {
      return sum + (post.likes + post.comments);
    }, 0);

    const averageEngagement = totalEngagement / posts.length;
    const engagementRate = (averageEngagement / followerCount) * 100;

    return parseFloat(engagementRate.toFixed(2));
  }

  /**
   * Calculate average likes and comments
   */
  calculateAverageEngagement(posts) {
    if (!posts || posts.length === 0) {
      return { averageLikes: 0, averageComments: 0 };
    }

    const totalLikes = posts.reduce((sum, post) => sum + post.likes, 0);
    const totalComments = posts.reduce((sum, post) => sum + post.comments, 0);

    return {
      averageLikes: Math.round(totalLikes / posts.length),
      averageComments: Math.round(totalComments / posts.length),
    };
  }

  /**
   * Fetch complete Instagram profile with analytics
   */
  async fetchCompleteProfile(instagramUrl) {
    try {
      // Step 1: Get profile data
      const profileResult = await this.fetchProfile(instagramUrl);

      if (!profileResult.success) {
        return profileResult;
      }

      const profile = profileResult.data;

      // Step 2: Calculate engagement from media data
      let posts = [];
      let metrics = {
        engagementRate: 0,
        averageLikes: 0,
        averageComments: 0,
      };

      // Use media data returned inline from Graph API
      if (profile.recentMedia && profile.recentMedia.length > 0) {
        posts = profile.recentMedia.map(media => ({
          id: media.id,
          caption: media.caption || '',
          mediaType: media.media_type,
          likes: media.like_count || 0,
          comments: media.comments_count || 0,
          timestamp: media.timestamp,
          thumbnailUrl: media.thumbnail_url || media.media_url,
          permalink: media.permalink,
        }));

        const engagementRate = this.calculateEngagementRate(posts, profile.followers);
        const { averageLikes, averageComments } = this.calculateAverageEngagement(posts);
        metrics = { engagementRate, averageLikes, averageComments };
      }

      // Remove recentMedia from profile before returning (already processed)
      const { recentMedia, ...profileClean } = profile;

      return {
        success: true,
        method: profileResult.method,
        data: {
          profile: profileClean,
          metrics,
          recentPosts: posts.slice(0, 6),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Analyze a specific Instagram post using Graph API
   * Uses the oembed endpoint for public post data
   */
  async analyzePost(postUrl) {
    try {
      if (!this.accessToken) {
        throw new Error('Instagram access token required for post analysis');
      }

      // Extract shortcode from URL
      const shortcode = this.extractPostShortcode(postUrl);

      // Use Instagram oEmbed endpoint via Graph API
      const response = await axios.get(`${this.graphApiUrl}/instagram_oembed`, {
        params: {
          url: postUrl,
          access_token: this.accessToken,
        },
      });

      const data = response.data;

      return {
        success: true,
        data: {
          shortcode,
          authorName: data.author_name || '',
          title: data.title || '',
          html: data.html || '',
          thumbnailUrl: data.thumbnail_url || '',
          providerUrl: data.provider_url || '',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Extract post shortcode from Instagram URL
   */
  extractPostShortcode(url) {
    try {
      const urlObj = new URL(url);
      const parts = urlObj.pathname.split('/').filter(p => p);

      // URL format: instagram.com/p/{shortcode}/ or /reel/{shortcode}/
      if ((parts[0] === 'p' || parts[0] === 'reel') && parts[1]) {
        return parts[1];
      }

      throw new Error('Invalid Instagram post URL');
    } catch (error) {
      throw new Error(`Failed to extract post shortcode: ${error.message}`);
    }
  }

  /**
   * Manual profile input - when automatic fetching fails
   * Validates and structures manually entered data
   */
  createManualProfile(data) {
    const { username, followers, following, posts } = data;

    if (!username || !followers) {
      throw new Error('Username and follower count are required');
    }

    return {
      success: true,
      method: 'manual',
      data: {
        username,
        name: data.name || username,
        biography: data.biography || '',
        profilePicture: data.profilePicture || `https://ui-avatars.com/api/?name=${username}&size=200`,
        followers: parseInt(followers),
        following: parseInt(following) || 0,
        posts: parseInt(posts) || 0,
        isVerified: false,
        isBusinessAccount: false,
        profileUrl: `https://instagram.com/${username}`,
        fetchedAt: new Date().toISOString(),
        manuallyEntered: true,
      },
    };
  }
}

module.exports = new InstagramService();
