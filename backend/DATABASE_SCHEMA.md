# Collabzy Database Schema - Entity Relationship Diagram

## Overview
This document describes the complete database schema for Collabzy's MongoDB database with 9 main collections.

---

## Collections Summary

| Collection | Purpose | Key Relationships |
|------------|---------|-------------------|
| **User** | Authentication & core user data | → InfluencerProfile, BrandProfile |
| **InfluencerProfile** | Influencer-specific data & stats | User ← |
| **BrandProfile** | Brand company information | User ← |
| **Campaign** | Brand advertising campaigns | BrandProfile ←, → Application |
| **Application** | Influencer applications to campaigns | Campaign ←, InfluencerProfile ←, → Deal |
| **Deal** | Accepted collaboration contracts | Application ←, → Review |
| **Review** | Ratings & feedback | Deal ← |
| **Message** | Chat messages between users | User ← (sender/recipient) |
| **Notification** | User alerts & notifications | User ← (recipient) |

---

## Entity Relationship Diagram (Text Format)

```
┌──────────────┐
│     User     │ (Authentication)
│              │
│ _id          │
│ email        │
│ password     │ (hashed)
│ role         │ (influencer/brand/admin)
│ isActive     │
│ timestamps   │
└──────┬───────┘
       │
       │ (1:1)
       ├─────────────────────────────┐
       │                             │
       ▼                             ▼
┌──────────────────┐       ┌────────────────┐
│ InfluencerProfile│       │  BrandProfile  │
│                  │       │                │
│ user (ref)       │       │ user (ref)     │
│ name             │       │ companyName    │
│ bio              │       │ logo           │
│ avatar           │       │ description    │
│ niche[]          │       │ industry       │
│ platformType     │       │ location       │
│ youtubeUrl       │       │ contactPerson  │
│ followers        │       │ websiteUrl     │
│ engagementRate   │       │ companySize    │
│ trustScore       │       │ monthlyBudget  │
│ isVerified       │       │ isVerified     │
│ services[]       │       │ statistics     │
│ portfolioLinks[] │       │ preferences    │
│ statistics       │       │ timestamps     │
│ timestamps       │       └────────┬───────┘
└──────────────────┘                │
                                    │ (1:N)
                                    ▼
                          ┌──────────────────┐
                          │    Campaign      │
                          │                  │
                          │ _id              │
                          │ brand (ref)      │
                          │ brandProfile     │
                          │ title            │
                          │ description      │
                          │ category         │
                          │ platformType     │
                          │ budget{min,max}  │
                          │ deliverables[]   │
                          │ deadline         │
                          │ eligibility{     │
                          │   minFollowers   │
                          │   minEngagement  │
                          │   requiredNiches │
                          │   minTrustScore  │
                          │ }                │
                          │ status           │
                          │ timestamps       │
                          └────────┬─────────┘
                                   │
                                   │ (1:N)
                                   ▼
                          ┌──────────────────┐
                          │   Application    │
                          │                  │
                          │ _id              │
                          │ campaign (ref)   │
                          │ influencer (ref) │
                          │ influencerProfile│
                          │ brand (ref)      │
                          │ proposalText     │
                          │ quotedPrice      │
                          │ deliveryPlan     │
                          │ status           │
                          │ matchScore       │
                          │ portfolioSamples │
                          │ statusHistory[]  │
                          │ timestamps       │
                          └────────┬─────────┘
                                   │
                                   │ (1:1 when accepted)
                                   ▼
                          ┌──────────────────┐
                          │       Deal       │
                          │                  │
                          │ _id              │
                          │ application (ref)│
                          │ campaign (ref)   │
                          │ influencer (ref) │
                          │ brand (ref)      │
                          │ agreedPrice      │
                          │ deliverables[]   │
                          │ deadline         │
                          │ status           │
                          │ milestones[]     │
                          │ submissions[]    │
                          │ revisionRequests │
                          │ payment{}        │
                          │ notes[]          │
                          │ timestamps       │
                          └────────┬─────────┘
                                   │
                                   │ (1:1 after completion)
                                   ▼
                          ┌──────────────────┐
                          │      Review      │
                          │                  │
                          │ _id              │
                          │ deal (ref)       │
                          │ campaign (ref)   │
                          │ reviewer (ref)   │
                          │ reviewee (ref)   │
                          │ rating (1-5)     │
                          │ reviewText       │
                          │ specificRatings{ │
                          │   communication  │
                          │   quality        │
                          │   timeliness     │
                          │   professionalism│
                          │ }                │
                          │ isPublic         │
                          │ response{}       │
                          │ timestamps       │
                          └──────────────────┘


┌──────────────┐                    ┌──────────────────┐
│     User     │ ◄─────────────────►│     Message      │
│              │    (sender/        │                  │
│ _id          │     recipient)     │ _id              │
└──────────────┘                    │ conversationId   │
                                    │ sender (ref)     │
                                    │ recipient (ref)  │
                                    │ content          │
                                    │ messageType      │
                                    │ attachments[]    │
                                    │ isRead           │
                                    │ isDelivered      │
                                    │ relatedDeal      │
                                    │ relatedCampaign  │
                                    │ timestamps       │
                                    └──────────────────┘


┌──────────────┐                    ┌──────────────────┐
│     User     │ ◄──────────────────│  Notification    │
│              │    (recipient)     │                  │
│ _id          │                    │ _id              │
└──────────────┘                    │ recipient (ref)  │
                                    │ sender (ref)     │
                                    │ type             │
                                    │ title            │
                                    │ message          │
                                    │ relatedCampaign  │
                                    │ relatedApplication│
                                    │ relatedDeal      │
                                    │ actionUrl        │
                                    │ isRead           │
                                    │ priority         │
                                    │ timestamps       │
                                    └──────────────────┘
```

---

## Detailed Schema Descriptions

### 1. User Collection
**Purpose**: Core authentication and user account management

**Key Fields**:
- `email`: Unique, validated email address
- `password`: Bcrypt hashed (12 salt rounds)
- `role`: Enum - influencer, brand, or admin
- `isActive`: Account active status
- `isEmailVerified`: Email verification status
- `lastLogin`: Last login timestamp

**Relationships**:
- 1:1 with InfluencerProfile (if role = influencer)
- 1:1 with BrandProfile (if role = brand)

**Indexes**:
- Unique index on `email`

---

### 2. InfluencerProfile Collection
**Purpose**: Detailed influencer information, statistics, and services

**Key Fields**:
- `user`: Reference to User collection (unique)
- `name`, `bio`, `avatar`: Basic profile info
- `niche[]`: Array of categories (Fashion, Tech, Gaming, etc.)
- `platformType`: YouTube, Instagram, TikTok, or Multiple
- `youtubeUrl`, `youtubeChannelId`: Social media links
- `followers`, `totalViews`, `engagementRate`: Auto-fetched stats
- `trustScore`: 0-100 calculated score
- `isVerified`: Verification status
- `services[]`: Array of offered services with pricing
- `portfolioLinks[]`: Past work samples
- `completedCollaborations`, `averageRating`: Statistics

**Methods**:
- `calculateTrustScore()`: Calculates trust score based on multiple factors

**Indexes**:
- Text index on `name` and `bio`
- Compound index on `niche` and `platformType`
- Compound index on `trustScore` and `followers` (descending)

---

### 3. BrandProfile Collection
**Purpose**: Brand company information and preferences

**Key Fields**:
- `user`: Reference to User collection (unique)
- `companyName`, `logo`, `description`: Company info
- `industry`: Business category
- `contactPerson`: {name, email, phone}
- `websiteUrl`: Company website
- `companySize`: Employee count range
- `monthlyBudget`: {min, max} spending range
- `activeCampaigns`, `completedCampaigns`, `totalSpent`: Statistics
- `preferredNiches[]`, `preferredPlatforms[]`: Campaign preferences
- `isVerified`: Verification status

**Indexes**:
- Text index on `companyName` and `description`
- Index on `industry`

---

### 4. Campaign Collection
**Purpose**: Brand advertising campaigns that influencers can apply to

**Key Fields**:
- `brand`, `brandProfile`: References to brand user and profile
- `title`, `description`, `category`: Campaign details
- `platformType`: Required platform(s)
- `budget`: {min, max} payment range
- `deliverables[]`: Required content (Video, Post, Reel, etc.)
- `deadline`: Campaign completion deadline
- `eligibility{}`: Criteria for influencer eligibility
  - `minFollowers`, `maxFollowers`: Follower count range
  - `minEngagementRate`: Minimum engagement percentage
  - `requiredNiches[]`: Required influencer categories
  - `minTrustScore`: Minimum trust score
- `status`: draft, active, paused, closed, completed
- `applicationCount`: Number of applications received

**Methods**:
- `isEligible(influencerProfile)`: Check if influencer meets criteria
- `calculateMatchScore(influencerProfile)`: Calculate match score 0-100

**Indexes**:
- Compound index on `brand` and `status`
- Compound index on `category` and `platformType`
- Compound index on follower range
- Compound index on `deadline` and `status`

---

### 5. Application Collection
**Purpose**: Influencer applications to campaigns

**Key Fields**:
- `campaign`, `influencer`, `brand`: References
- `influencerProfile`: Reference to influencer's profile
- `proposalText`: Influencer's pitch
- `quotedPrice`: Requested payment
- `deliveryPlan`: How they'll execute
- `status`: pending, shortlisted, accepted, rejected, withdrawn
- `matchScore`: Auto-calculated compatibility score (0-100)
- `portfolioSamples[]`: Work samples attached to application
- `statusHistory[]`: Track status changes with timestamps

**Indexes**:
- Unique compound index on `campaign` and `influencer` (prevent duplicates)
- Compound index on `campaign`, `status`, and `matchScore` (descending)
- Compound index on `influencer` and `status`
- Compound index on `brand` and `status`

---

### 6. Deal Collection
**Purpose**: Accepted collaborations with deliverables and milestones

**Key Fields**:
- `application`: Reference to accepted application (unique)
- `campaign`, `influencer`, `brand`: References
- `agreedPrice`: Final negotiated price
- `deliverables[]`: Content to be created (with individual status tracking)
- `deadline`: Project completion deadline
- `status`: confirmed, in-progress, content-submitted, approved, completed, cancelled, disputed
- `milestones[]`: Project checkpoints
- `submissions[]`: Content submitted by influencer
  - `contentLinks[]`, `proofOfWork[]`
  - `status`: pending-review, approved, revision-requested
  - `feedback`: Brand feedback
- `revisionRequests[]`: Track revision requests
- `payment{}`: Payment status and details
- `notes[]`: Communication notes

**Methods**:
- `isOverdue()`: Check if past deadline
- `getProgress()`: Calculate completion percentage

**Indexes**:
- Compound index on `influencer` and `status`
- Compound index on `brand` and `status`
- Index on `campaign`
- Compound index on `status` and `deadline`

---

### 7. Review Collection
**Purpose**: Ratings and feedback after deal completion

**Key Fields**:
- `deal`: Reference to completed deal (unique)
- `reviewer`, `reviewee`: User references
- `reviewerRole`, `revieweeRole`: influencer or brand
- `rating`: 1-5 stars (required)
- `reviewText`: Written feedback
- `specificRatings{}`: Detailed ratings
  - `communication`, `quality`, `timeliness`, `professionalism`
- `isPublic`: Visibility status
- `isVerified`: Auto-verified if from completed deal
- `response{}`: Reviewee's response
- `helpfulCount`, `notHelpfulCount`: User votes

**Indexes**:
- Compound index on `reviewee` and `isPublic`
- Index on `reviewer`
- Unique index on `deal` (one review per deal)
- Compound index on `rating` and `createdAt` (descending)

---

### 8. Message Collection
**Purpose**: Chat messages between users

**Key Fields**:
- `conversationId`: Unique identifier for conversation pair
- `sender`, `recipient`: User references
- `content`: Message text
- `messageType`: text, image, file, link
- `attachments[]`: File attachments with metadata
- `isRead`, `readAt`: Read status
- `isDelivered`, `deliveredAt`: Delivery status
- `relatedDeal`, `relatedCampaign`: Optional context
- `replyTo`: Reference to another message (threading)

**Static Methods**:
- `createConversationId(userId1, userId2)`: Generate consistent conversation ID

**Instance Methods**:
- `markAsRead()`: Update read status
- `markAsDelivered()`: Update delivery status

**Indexes**:
- Compound index on `conversationId` and `createdAt` (descending)
- Compound index on `sender` and `recipient`
- Compound index on `recipient` and `isRead`

---

### 9. Notification Collection
**Purpose**: User alerts and system notifications

**Key Fields**:
- `recipient`: User reference
- `sender`: Optional user reference (for user-generated notifications)
- `type`: Notification category (new_application, deal_created, etc.)
- `title`, `message`: Notification content
- `relatedCampaign`, `relatedApplication`, `relatedDeal`, etc.: Context references
- `actionUrl`, `actionText`: Call-to-action link
- `isRead`, `readAt`: Read status
- `priority`: low, medium, high, urgent
- `expiresAt`: Optional expiration date

**Static Methods**:
- `createNotification(data)`: Create and emit notification
- `markAllAsRead(userId)`: Bulk mark as read
- `getUnreadCount(userId)`: Count unread notifications
- `deleteExpired()`: Cleanup old notifications

**Indexes**:
- Compound index on `recipient`, `isRead`, and `createdAt` (descending)
- Compound index on `recipient` and `type`
- Index on `expiresAt`

---

## Key Relationships

### Primary Workflows

1. **User Registration → Profile Creation**
   ```
   User (created) → InfluencerProfile or BrandProfile (auto-created)
   ```

2. **Campaign Lifecycle**
   ```
   Brand creates Campaign → 
   Influencer submits Application → 
   Brand accepts Application → 
   Deal created (in-progress) → 
   Deal completed → 
   Review created
   ```

3. **Messaging**
   ```
   User (sender) → Message → User (recipient)
   conversationId groups all messages between two users
   ```

4. **Notifications**
   ```
   Any action (application, message, deal update) → 
   Notification created → 
   User (recipient) notified
   ```

---

## Data Integrity Rules

1. **User-Profile Relationship**: Each User must have exactly one profile (either InfluencerProfile or BrandProfile)

2. **No Self-Reviews**: Reviewer and reviewee cannot be the same user

3. **Unique Applications**: An influencer can only apply once to each campaign

4. **Deal-Application**: Each deal is linked to exactly one accepted application

5. **Review-Deal**: Each deal can have at most one review

6. **Conversation ID**: Always consistent regardless of who sends first (sorted user IDs)

---

## Performance Optimization

### Recommended Indexes Created:
- Text indexes for search functionality (profiles, campaigns)
- Compound indexes for common query patterns (status + date, user + status)
- Unique indexes to prevent duplicates (email, application, deal)

### Data Fetching Strategy:
- Use `.populate()` to join related collections
- Limit populated fields to reduce payload size
- Implement pagination for large result sets
- Cache frequently accessed data (trust scores, statistics)

---

## MongoDB Connection String Format

```
mongodb://localhost:27017/collabzy              # Local
mongodb+srv://user:pass@cluster.net/collabzy    # Atlas
```

---

## Backup & Migration Strategy

1. **Daily Backups**: User, InfluencerProfile, BrandProfile, Campaign, Application, Deal, Review
2. **Weekly Backups**: Message, Notification
3. **Data Retention**: 
   - Messages: 1 year
   - Notifications: 90 days
   - Reviews: Permanent
   - Completed Deals: Permanent

---

**Last Updated**: February 4, 2026  
**Schema Version**: 1.0.0  
**Total Collections**: 9
