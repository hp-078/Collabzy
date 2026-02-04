const axios = require('axios');

/**
 * Instagram Service - Handle Instagram profile and post analytics
 * 
 * Note: Instagram doesn't have a free public API like YouTube.
 * Options:
 * 1. Instagram Basic Display API (personal accounts, limited)
 * 2. Instagram Graph API (business accounts, requires Facebook)
 * 3. Third-party APIs (RapidAPI, etc.)
 * 4. Web scraping (public data only)
 * 
 * This implementation uses a hybrid approach:
 * - Instagram Graph API for business accounts (if configured)
 * - Fallback to public profile scraping for basic stats
 */

class InstagramService {
  constructor() {
    this.accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    this.graphApiUrl = 'https://graph.instagram.com';
    this.rapidApiKey = process.env.RAPIDAPI_KEY; // Optional third-party API
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
   * Requires: Instagram Business Account + Facebook Page + Access Token
   */
  async fetchProfileGraphAPI(username) {
    try {
      if (!this.accessToken) {
        throw new Error('Instagram Graph API access token not configured');
      }

      // Step 1: Get Instagram Business Account ID
      const businessDiscoveryUrl = `${this.graphApiUrl}/me`;
      const response = await axios.get(businessDiscoveryUrl, {
        params: {
          fields: `business_discovery.username(${username}){followers_count,follows_count,media_count,profile_picture_url,biography,username,name}`,
          access_token: this.accessToken,
        },
      });

      const profile = response.data.business_discovery;

      return {
        username: profile.username,
        name: profile.name || profile.username,
        biography: profile.biography || '',
        profilePicture: profile.profile_picture_url,
        followers: profile.followers_count,
        following: profile.follows_count,
        posts: profile.media_count,
        isVerified: false, // Not available in basic response
        isBusinessAccount: true,
      };
    } catch (error) {
      throw new Error(`Graph API error: ${error.message}`);
    }
  }

  /**
   * Fetch Instagram profile using RapidAPI (Third-party service)
   * More reliable than scraping, provides comprehensive data
   */
  async fetchProfileRapidAPI(username) {
    try {
      if (!this.rapidApiKey) {
        throw new Error('RapidAPI key not configured');
      }

      const response = await axios.get(
        `https://instagram-scraper-api2.p.rapidapi.com/v1/info`,
        {
          params: { username_or_id_or_url: username },
          headers: {
            'X-RapidAPI-Key': this.rapidApiKey,
            'X-RapidAPI-Host': 'instagram-scraper-api2.p.rapidapi.com',
          },
        }
      );

      const data = response.data.data;

      return {
        username: data.username,
        name: data.full_name || data.username,
        biography: data.biography || '',
        profilePicture: data.profile_pic_url_hd || data.profile_pic_url,
        followers: data.follower_count,
        following: data.following_count,
        posts: data.media_count,
        isVerified: data.is_verified || false,
        isBusinessAccount: data.is_business_account || false,
        externalUrl: data.external_url || null,
        category: data.category_name || null,
      };
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Instagram profile not found');
      }
      throw new Error(`RapidAPI error: ${error.message}`);
    }
  }

  /**
   * Fetch Instagram profile - tries multiple methods
   * Priority: Graph API > RapidAPI > Manual input
   */
  async fetchProfile(instagramUrl) {
    try {
      const username = this.parseInstagramURL(instagramUrl);
      let profile = null;
      let method = 'unknown';

      // Try Graph API first (if configured and business account)
      if (this.accessToken) {
        try {
          profile = await this.fetchProfileGraphAPI(username);
          method = 'graph_api';
        } catch (error) {
          console.log('Graph API failed, trying alternative:', error.message);
        }
      }

      // Try RapidAPI as fallback
      if (!profile && this.rapidApiKey) {
        try {
          profile = await this.fetchProfileRapidAPI(username);
          method = 'rapid_api';
        } catch (error) {
          console.log('RapidAPI failed:', error.message);
        }
      }

      // If all methods fail, return basic structure for manual input
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
   * Fetch recent Instagram posts and calculate engagement
   * Using RapidAPI for post data
   */
  async fetchRecentPosts(username, count = 12) {
    try {
      if (!this.rapidApiKey) {
        throw new Error('RapidAPI key required for post fetching');
      }

      const response = await axios.get(
        `https://instagram-scraper-api2.p.rapidapi.com/v1/posts`,
        {
          params: {
            username_or_id_or_url: username,
            amount: count,
          },
          headers: {
            'X-RapidAPI-Key': this.rapidApiKey,
            'X-RapidAPI-Host': 'instagram-scraper-api2.p.rapidapi.com',
          },
        }
      );

      const posts = response.data.data.items || [];

      return posts.map(post => ({
        id: post.id,
        shortcode: post.code,
        caption: post.caption?.text || '',
        mediaType: post.media_type, // 1=photo, 2=video, 8=carousel
        likes: post.like_count,
        comments: post.comment_count,
        timestamp: post.taken_at,
        thumbnailUrl: post.thumbnail_url || post.image_versions?.items?.[0]?.url,
        videoViews: post.play_count || 0,
      }));
    } catch (error) {
      throw new Error(`Failed to fetch posts: ${error.message}`);
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

      // Step 2: Try to get recent posts (optional, may fail)
      let posts = [];
      let metrics = {
        engagementRate: 0,
        averageLikes: 0,
        averageComments: 0,
      };

      try {
        posts = await this.fetchRecentPosts(profile.username, 12);
        const engagementRate = this.calculateEngagementRate(posts, profile.followers);
        const { averageLikes, averageComments } = this.calculateAverageEngagement(posts);

        metrics = {
          engagementRate,
          averageLikes,
          averageComments,
        };
      } catch (error) {
        console.log('Could not fetch posts:', error.message);
        // Continue without post data
      }

      return {
        success: true,
        method: profileResult.method,
        data: {
          profile,
          metrics,
          recentPosts: posts.slice(0, 6), // Return only 6 for display
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
   * Analyze a specific Instagram post
   */
  async analyzePost(postUrl) {
    try {
      if (!this.rapidApiKey) {
        throw new Error('RapidAPI key required for post analysis');
      }

      // Extract shortcode from URL
      const shortcode = this.extractPostShortcode(postUrl);

      const response = await axios.get(
        `https://instagram-scraper-api2.p.rapidapi.com/v1/post_info`,
        {
          params: { code_or_id_or_url: shortcode },
          headers: {
            'X-RapidAPI-Key': this.rapidApiKey,
            'X-RapidAPI-Host': 'instagram-scraper-api2.p.rapidapi.com',
          },
        }
      );

      const post = response.data.data;

      return {
        success: true,
        data: {
          id: post.id,
          shortcode: post.code,
          caption: post.caption?.text || '',
          username: post.user.username,
          likes: post.like_count,
          comments: post.comment_count,
          timestamp: post.taken_at,
          mediaType: post.media_type === 2 ? 'video' : post.media_type === 8 ? 'carousel' : 'photo',
          videoViews: post.play_count || 0,
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
