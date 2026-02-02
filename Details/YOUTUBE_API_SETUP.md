# YouTube API Setup Guide

## 🎯 Getting Your YouTube Data API Key

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Enter project name: `Collabzy` (or your preference)
4. Click **"Create"**

### Step 2: Enable YouTube Data API v3

1. In the Google Cloud Console, go to **"APIs & Services"** → **"Library"**
2. Search for **"YouTube Data API v3"**
3. Click on it and press **"Enable"**

### Step 3: Create API Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"API Key"**
3. Copy the generated API key
4. (Optional) Click **"Restrict Key"** and limit to YouTube Data API v3 for security

### Step 4: Add API Key to Environment

1. Open `backend/.env` file
2. Add/update the line:
   ```
   YOUTUBE_API_KEY=your_copied_api_key_here
   ```
3. Save the file
4. Restart the backend server

---

## 📊 API Quota Information

**YouTube Data API v3 Quota:**
- Free tier: **10,000 units per day**
- Costs per operation:
  - `channels.list`: 1 unit
  - `playlistItems.list`: 1 unit
  - `videos.list`: 1 unit
  - `search.list`: 100 units

**Our Usage Per Profile Fetch:**
- Channel stats: 1 unit
- Channel uploads playlist: 1 unit
- Recent videos playlist: 1 unit
- Video statistics: 1 unit
- Search (for handle resolution): 100 units (if needed)

**Estimated Daily Capacity:**
- Without search: ~2,500 profile fetches/day
- With search: ~95 profile fetches/day

**Optimization Tips:**
- Cache fetched data in database
- Set `lastDataFetch` timestamp
- Only re-fetch after 24 hours
- Use channel ID directly when possible (avoids search API call)

---

## 🧪 Testing the YouTube API Integration

### Test 1: Health Check (Server Running)
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2026-02-02T...",
  "uptime": 123.45,
  "environment": "development"
}
```

### Test 2: Register Influencer Account
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "influencer@test.com",
    "password": "Test123!@#",
    "role": "influencer",
    "name": "Test Influencer"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

Copy the token from response!

### Test 3: Create Influencer Profile
```bash
curl -X POST http://localhost:5000/api/influencers/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Tech Reviewer",
    "bio": "I review the latest tech gadgets",
    "niche": "Technology",
    "platformType": "YouTube",
    "contentTypes": ["Reviews", "Tutorials"]
  }'
```

### Test 4: Fetch YouTube Profile (The Magic Moment! ✨)
```bash
curl -X POST http://localhost:5000/api/influencers/fetch-youtube \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "youtubeChannelUrl": "https://www.youtube.com/@mkbhd"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "YouTube profile data fetched successfully",
  "data": {
    "profile": {
      "subscriberCount": 19500000,
      "totalViews": 4200000000,
      "videoCount": 1850,
      "averageViews": 2500000,
      "engagementRate": 5.8,
      "trustScore": 85,
      "verificationStatus": "verified",
      "verifiedBadge": true,
      ...
    },
    "fetchedData": {
      "channelId": "UCBJycsmduvYEL83R_U4JriQ",
      "channelTitle": "Marques Brownlee",
      "subscriberCount": 19500000,
      ...
    }
  }
}
```

### Test 5: Get All Influencers (Public)
```bash
curl "http://localhost:5000/api/influencers?niche=Technology&minEngagement=3"
```

### Test 6: Analyze Specific Video
```bash
curl -X POST http://localhost:5000/api/influencers/analyze-post \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "postUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }'
```

---

## 🔍 Supported YouTube URL Formats

Our service supports all major YouTube URL formats:

1. **Channel ID (Direct)**
   ```
   https://www.youtube.com/channel/UCBJycsmduvYEL83R_U4JriQ
   ```

2. **Custom Channel Name**
   ```
   https://www.youtube.com/c/mkbhd
   ```

3. **Handle (Modern Format)**
   ```
   https://www.youtube.com/@mkbhd
   ```

4. **Legacy Username**
   ```
   https://www.youtube.com/user/marquesbrownlee
   ```

All formats will be automatically parsed and resolved to channel ID!

---

## 🚨 Common Issues & Solutions

### Issue 1: "YouTube API key not configured"
**Solution:** Ensure `YOUTUBE_API_KEY` is set in `.env` file and server is restarted.

### Issue 2: "Failed to fetch channel statistics"
**Possible causes:**
- Invalid API key
- API quota exceeded
- Invalid channel ID
- API not enabled in Google Cloud

**Solution:**
1. Verify API key in Google Cloud Console
2. Check quota usage
3. Ensure YouTube Data API v3 is enabled

### Issue 3: "Channel not found"
**Possible causes:**
- URL is incorrect
- Channel has been deleted
- Private/unlisted channel

**Solution:** Test with a well-known channel first (e.g., @mkbhd)

### Issue 4: Rate Limiting
**Error:** `403 Forbidden` with quota exceeded message

**Solution:**
- Wait until next day (quota resets at midnight Pacific Time)
- Implement caching to reduce API calls
- Consider upgrading to paid quota

---

## 📊 Sample Channels for Testing

Use these popular channels to test:

1. **MKBHD** (Tech Reviews)
   - URL: `https://www.youtube.com/@mkbhd`
   - Subscribers: 19M+
   - High engagement

2. **MrBeast** (Entertainment)
   - URL: `https://www.youtube.com/@MrBeast`
   - Subscribers: 230M+
   - Viral content

3. **Fitness Blender** (Health & Fitness)
   - URL: `https://www.youtube.com/@FitnessBlender`
   - Subscribers: 6M+
   - Niche content

4. **Tasty** (Food)
   - URL: `https://www.youtube.com/@buzzfeedtasty`
   - Subscribers: 10M+
   - Brand-friendly

---

## 🔐 Security Best Practices

1. **Never commit API keys to Git**
   - Always use `.env` file
   - Add `.env` to `.gitignore`

2. **Restrict API Key**
   - Limit to YouTube Data API v3 only
   - Add HTTP referrer restrictions (for production)

3. **Monitor Usage**
   - Set up quota alerts in Google Cloud Console
   - Log API calls for debugging

4. **Handle Errors Gracefully**
   - Return user-friendly error messages
   - Don't expose API key in error responses

---

## 📚 Official Documentation

- [YouTube Data API v3 Docs](https://developers.google.com/youtube/v3/docs)
- [API Explorer](https://developers.google.com/youtube/v3/docs/channels/list)
- [Quota Calculator](https://developers.google.com/youtube/v3/determine_quota_cost)

---

## ✅ Checklist Before Going Live

- [ ] YouTube API key obtained
- [ ] API key added to `.env`
- [ ] YouTube Data API v3 enabled in Google Cloud
- [ ] Server restarted with new environment variable
- [ ] Test with at least 3 different YouTube channels
- [ ] Verify all URL formats work (channel, @handle, /c/)
- [ ] Check trust score calculation is accurate
- [ ] Confirm verification badge appears
- [ ] Test eligibility filtering with fetched data
- [ ] Monitor API quota usage

---

**Status:** Backend implementation complete, ready for API key integration!
