// backend/services/trustScore.service.js
// Trust score calculation and management system

const InfluencerProfile = require('../models/InfluencerProfile.model');
const Deal = require('../models/Deal.model');
const Review = require('../models/Review.model');
const Violation = require('../models/Violation.model');

// Trust score change reasons and points
const TRUST_SCORE_EVENTS = {
    DEAL_COMPLETED: { change: 3, reason: 'Successfully completed a brand deal' },
    POSITIVE_REVIEW: { change: 2, reason: 'Received positive review (4+ stars)' },
    NEGATIVE_REVIEW: { change: -3, reason: 'Received negative review (< 3 stars)' },
    DEAL_CANCELLED: { change: -5, reason: 'Deal cancelled or failed to deliver' },
    CONTACT_VIOLATION: { change: -2, reason: 'Attempted to share contact info before deal' },
    REPEATED_VIOLATIONS: { change: -5, reason: 'Multiple violation attempts detected' },
    PROFILE_VERIFIED: { change: 5, reason: 'Profile verified by admin' },
    RESPONSE_TIME: { change: 1, reason: 'Excellent response time (< 2 hours)' },
    LATE_DELIVERY: { change: -2, reason: 'Delivered content past deadline' },
    EARLY_DELIVERY: { change: 1, reason: 'Delivered content ahead of schedule' },
    ACCOUNT_WARNING: { change: -10, reason: 'Received formal warning from admin' },
    SUSPENSION: { change: -20, reason: 'Account temporarily suspended' }
};

// Trust level thresholds
const TRUST_LEVELS = {
    UNVERIFIED: { min: 0, max: 49, label: 'Unverified', color: 'gray' },
    BEGINNER: { min: 50, max: 69, label: 'Beginner', color: 'blue' },
    TRUSTED: { min: 70, max: 84, label: 'Trusted', color: 'green' },
    VERIFIED: { min: 85, max: 94, label: 'Verified', color: 'purple' },
    ELITE: { min: 95, max: 100, label: 'Elite', color: 'gold' }
};

class TrustScoreService {
    /**
     * Calculate initial trust score for new influencer
     */
    calculateInitialScore(profile) {
        let score = 50; // Base score

        // Followers bonus (capped at 10 points)
        const totalFollowers = (profile.instagram?.followersCount || 0) + 
                              (profile.youtube?.subscribersCount || 0);
        
        if (totalFollowers >= 1000000) score += 10;
        else if (totalFollowers >= 500000) score += 8;
        else if (totalFollowers >= 100000) score += 6;
        else if (totalFollowers >= 50000) score += 4;
        else if (totalFollowers >= 10000) score += 2;

        // Engagement rate bonus (capped at 5 points)
        const avgEngagement = profile.instagram?.engagementRate || 0;
        if (avgEngagement >= 5) score += 5;
        else if (avgEngagement >= 3) score += 3;
        else if (avgEngagement >= 1) score += 1;

        return Math.min(score, 65); // New users max 65
    }

    /**
     * Update trust score with event
     */
    async updateTrustScore(influencerId, eventType, metadata = {}) {
        try {
            const profile = await InfluencerProfile.findOne({ userId: influencerId });
            
            if (!profile) {
                throw new Error('Influencer profile not found');
            }

            const event = TRUST_SCORE_EVENTS[eventType];
            if (!event) {
                throw new Error(`Invalid trust score event: ${eventType}`);
            }

            const oldScore = profile.trustScore;
            let newScore = oldScore + event.change;

            // Clamp score between 0 and 100
            newScore = Math.max(0, Math.min(100, newScore));

            // Update profile
            profile.trustScore = newScore;

            // Add to history
            const historyEntry = {
                score: newScore,
                change: event.change,
                reason: event.reason,
                metadata,
                date: new Date()
            };

            if (!profile.trustScoreHistory) {
                profile.trustScoreHistory = [];
            }
            profile.trustScoreHistory.push(historyEntry);

            // Keep only last 50 history entries
            if (profile.trustScoreHistory.length > 50) {
                profile.trustScoreHistory = profile.trustScoreHistory.slice(-50);
            }

            await profile.save();

            console.log(`Trust score updated for ${influencerId}: ${oldScore} → ${newScore} (${event.change > 0 ? '+' : ''}${event.change})`);

            return {
                oldScore,
                newScore,
                change: event.change,
                reason: event.reason,
                level: this.getTrustLevel(newScore)
            };
        } catch (error) {
            console.error('Trust score update error:', error);
            throw error;
        }
    }

    /**
     * Get trust level from score
     */
    getTrustLevel(score) {
        for (const [key, level] of Object.entries(TRUST_LEVELS)) {
            if (score >= level.min && score <= level.max) {
                return {
                    key,
                    ...level
                };
            }
        }
        return TRUST_LEVELS.UNVERIFIED;
    }

    /**
     * Calculate trust score based on complete history
     */
    async recalculateTrustScore(influencerId) {
        try {
            const profile = await InfluencerProfile.findOne({ userId: influencerId });
            
            if (!profile) {
                throw new Error('Influencer profile not found');
            }

            // Start with initial score
            let score = this.calculateInitialScore(profile);

            // Add completed deals
            const completedDeals = await Deal.countDocuments({
                influencerId,
                status: 'completed'
            });
            score += completedDeals * TRUST_SCORE_EVENTS.DEAL_COMPLETED.change;

            // Add cancelled deals penalty
            const cancelledDeals = await Deal.countDocuments({
                influencerId,
                status: 'cancelled'
            });
            score += cancelledDeals * TRUST_SCORE_EVENTS.DEAL_CANCELLED.change;

            // Add review scores
            const reviews = await Review.find({ influencerId });
            reviews.forEach(review => {
                if (review.rating >= 4) {
                    score += TRUST_SCORE_EVENTS.POSITIVE_REVIEW.change;
                } else if (review.rating < 3) {
                    score += TRUST_SCORE_EVENTS.NEGATIVE_REVIEW.change;
                }
            });

            // Add violation penalties
            const violations = await Violation.countDocuments({
                userId: influencerId,
                reviewStatus: { $ne: 'dismissed' }
            });
            score += violations * TRUST_SCORE_EVENTS.CONTACT_VIOLATION.change;

            // Check for repeated violations
            if (violations >= 3) {
                score += TRUST_SCORE_EVENTS.REPEATED_VIOLATIONS.change;
            }

            // Add verification bonus
            if (profile.verified) {
                score += TRUST_SCORE_EVENTS.PROFILE_VERIFIED.change;
            }

            // Clamp score
            score = Math.max(0, Math.min(100, score));

            // Update profile
            profile.trustScore = score;
            await profile.save();

            return {
                score,
                level: this.getTrustLevel(score),
                factors: {
                    completedDeals,
                    cancelledDeals,
                    reviewsCount: reviews.length,
                    violations,
                    verified: profile.verified
                }
            };
        } catch (error) {
            console.error('Trust score recalculation error:', error);
            throw error;
        }
    }

    /**
     * Get trust score statistics for influencer
     */
    async getTrustScoreStats(influencerId) {
        try {
            const profile = await InfluencerProfile.findOne({ userId: influencerId });
            
            if (!profile) {
                throw new Error('Influencer profile not found');
            }

            const currentScore = profile.trustScore;
            const level = this.getTrustLevel(currentScore);
            const history = profile.trustScoreHistory || [];

            // Calculate trend (last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            const recentHistory = history.filter(h => new Date(h.date) >= sevenDaysAgo);
            const scoreTrend = recentHistory.reduce((sum, h) => sum + h.change, 0);

            // Next level info
            let nextLevel = null;
            for (const [key, lvl] of Object.entries(TRUST_LEVELS)) {
                if (lvl.min > currentScore) {
                    nextLevel = {
                        key,
                        ...lvl,
                        pointsNeeded: lvl.min - currentScore
                    };
                    break;
                }
            }

            return {
                currentScore,
                level,
                trend: scoreTrend,
                nextLevel,
                history: history.slice(-10), // Last 10 entries
                lastUpdated: history.length > 0 ? history[history.length - 1].date : null
            };
        } catch (error) {
            console.error('Get trust score stats error:', error);
            throw error;
        }
    }

    /**
     * Get platform-wide trust score statistics (admin)
     */
    async getPlatformTrustStats() {
        try {
            const allProfiles = await InfluencerProfile.find({});

            const stats = {
                totalInfluencers: allProfiles.length,
                averageScore: 0,
                distribution: {
                    UNVERIFIED: 0,
                    BEGINNER: 0,
                    TRUSTED: 0,
                    VERIFIED: 0,
                    ELITE: 0
                },
                scoreRanges: {
                    '0-20': 0,
                    '21-40': 0,
                    '41-60': 0,
                    '61-80': 0,
                    '81-100': 0
                }
            };

            if (allProfiles.length === 0) {
                return stats;
            }

            let totalScore = 0;

            allProfiles.forEach(profile => {
                const score = profile.trustScore;
                totalScore += score;

                // Level distribution
                const level = this.getTrustLevel(score);
                stats.distribution[level.key]++;

                // Score ranges
                if (score <= 20) stats.scoreRanges['0-20']++;
                else if (score <= 40) stats.scoreRanges['21-40']++;
                else if (score <= 60) stats.scoreRanges['41-60']++;
                else if (score <= 80) stats.scoreRanges['61-80']++;
                else stats.scoreRanges['81-100']++;
            });

            stats.averageScore = Math.round(totalScore / allProfiles.length);

            return stats;
        } catch (error) {
            console.error('Get platform trust stats error:', error);
            throw error;
        }
    }
}

module.exports = new TrustScoreService();
