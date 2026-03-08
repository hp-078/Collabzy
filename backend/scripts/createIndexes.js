// backend/scripts/createIndexes.js
// Database optimization - create all required indexes

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User.model');
const InfluencerProfile = require('../models/InfluencerProfile.model');
const BrandProfile = require('../models/BrandProfile.model');
const Campaign = require('../models/Campaign.model');
const Application = require('../models/Application.model');
const Deal = require('../models/Deal.model');
const Payment = require('../models/Payment.model');
const Message = require('../models/Message.model');
const Notification = require('../models/Notification.model');
const Review = require('../models/Review.model');
const Violation = require('../models/Violation.model');
const Report = require('../models/Report.model');

async function createIndexes() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected successfully!\n');

        console.log('Creating indexes...\n');

        // User indexes
        console.log('User indexes:');
        await User.collection.createIndex({ email: 1 }, { unique: true });
        await User.collection.createIndex({ role: 1 });
        await User.collection.createIndex({ status: 1 });
        await User.collection.createIndex({ createdAt: -1 });
        console.log('✓ User indexes created\n');

        // InfluencerProfile indexes
        console.log('InfluencerProfile indexes:');
        await InfluencerProfile.collection.createIndex({ user: 1 }, { unique: true });
        await InfluencerProfile.collection.createIndex({ niche: 1 });
        await InfluencerProfile.collection.createIndex({ platformType: 1 });
        await InfluencerProfile.collection.createIndex({ totalFollowers: -1 });
        await InfluencerProfile.collection.createIndex({ trustScore: -1 });
        await InfluencerProfile.collection.createIndex({ isVerified: 1 });
        await InfluencerProfile.collection.createIndex(
            { name: 'text', bio: 'text' },
            { weights: { name: 2, bio: 1 } }
        );
        await InfluencerProfile.collection.createIndex({ 
            niche: 1, 
            trustScore: -1, 
            totalFollowers: -1 
        });
        console.log('✓ InfluencerProfile indexes created\n');

        // BrandProfile indexes
        console.log('BrandProfile indexes:');
        await BrandProfile.collection.createIndex({ user: 1 }, { unique: true });
        await BrandProfile.collection.createIndex({ industry: 1 });
        await BrandProfile.collection.createIndex({ 
            companyName: 'text', 
            description: 'text' 
        });
        await BrandProfile.collection.createIndex({ averageRating: -1 });
        console.log('✓ BrandProfile indexes created\n');

        // Campaign indexes
        console.log('Campaign indexes:');
        await Campaign.collection.createIndex({ brand: 1 });
        await Campaign.collection.createIndex({ category: 1 });
        await Campaign.collection.createIndex({ platformType: 1 });
        await Campaign.collection.createIndex({ status: 1 });
        await Campaign.collection.createIndex({ createdAt: -1 });
        await Campaign.collection.createIndex({ deadline: 1 });
        await Campaign.collection.createIndex(
            { title: 'text', description: 'text' },
            { weights: { title: 2, description: 1 } }
        );
        await Campaign.collection.createIndex({
            status: 1,
            category: 1,
            platformType: 1
        });
        await Campaign.collection.createIndex({
            status: 1,
            deadline: 1
        });
        console.log('✓ Campaign indexes created\n');

        // Application indexes
        console.log('Application indexes:');
        await Application.collection.createIndex({ campaign: 1 });
        await Application.collection.createIndex({ influencer: 1 });
        await Application.collection.createIndex({ status: 1 });
        await Application.collection.createIndex({ createdAt: -1 });
        await Application.collection.createIndex(
            { campaign: 1, influencer: 1 },
            { unique: true }
        );
        await Application.collection.createIndex({
            campaign: 1,
            status: 1
        });
        console.log('✓ Application indexes created\n');

        // Deal indexes
        console.log('Deal indexes:');
        await Deal.collection.createIndex({ brand: 1 });
        await Deal.collection.createIndex({ influencer: 1 });
        await Deal.collection.createIndex({ campaign: 1 });
        await Deal.collection.createIndex({ application: 1 }, { unique: true });
        await Deal.collection.createIndex({ status: 1 });
        await Deal.collection.createIndex({ createdAt: -1 });
        await Deal.collection.createIndex({ deadline: 1 });
        await Deal.collection.createIndex({
            status: 1,
            deadline: 1
        });
        await Deal.collection.createIndex({
            brand: 1,
            status: 1
        });
        await Deal.collection.createIndex({
            influencer: 1,
            status: 1
        });
        console.log('✓ Deal indexes created\n');

        // Payment indexes
        console.log('Payment indexes:');
        await Payment.collection.createIndex({ dealId: 1 }, { unique: true });
        await Payment.collection.createIndex({ brandId: 1 });
        await Payment.collection.createIndex({ influencerId: 1 });
        await Payment.collection.createIndex({ razorpayOrderId: 1 });
        await Payment.collection.createIndex({ razorpayPaymentId: 1 });
        await Payment.collection.createIndex({ paymentStatus: 1 });
        await Payment.collection.createIndex({ createdAt: -1 });
        await Payment.collection.createIndex({
            paymentStatus: 1,
            createdAt: -1
        });
        await Payment.collection.createIndex({
            brandId: 1,
            paymentStatus: 1
        });
        await Payment.collection.createIndex({
            influencerId: 1,
            paymentStatus: 1
        });
        console.log('✓ Payment indexes created\n');

        // Message indexes
        console.log('Message indexes:');
        await Message.collection.createIndex({ conversationId: 1 });
        await Message.collection.createIndex({ senderId: 1 });
        await Message.collection.createIndex({ receiverId: 1 });
        await Message.collection.createIndex({ createdAt: -1 });
        await Message.collection.createIndex({ isRead: 1 });
        await Message.collection.createIndex({
            conversationId: 1,
            createdAt: -1
        });
        await Message.collection.createIndex({
            receiverId: 1,
            isRead: 1
        });
        console.log('✓ Message indexes created\n');

        // Notification indexes
        console.log('Notification indexes:');
        await Notification.collection.createIndex({ userId: 1 });
        await Notification.collection.createIndex({ isRead: 1 });
        await Notification.collection.createIndex({ createdAt: -1 });
        await Notification.collection.createIndex({
            userId: 1,
            isRead: 1,
            createdAt: -1
        });
        console.log('✓ Notification indexes created\n');

        // Review indexes
        console.log('Review indexes:');
        await Review.collection.createIndex({ deal: 1 });
        await Review.collection.createIndex({ campaign: 1 });
        await Review.collection.createIndex({ reviewer: 1 });
        await Review.collection.createIndex({ reviewee: 1 });
        await Review.collection.createIndex({ reviewType: 1 });
        await Review.collection.createIndex({ isPublic: 1 });
        await Review.collection.createIndex({ createdAt: -1 });
        await Review.collection.createIndex({
            reviewee: 1,
            isPublic: 1,
            createdAt: -1
        });
        await Review.collection.createIndex({
            deal: 1,
            reviewer: 1
        }, { unique: true });
        console.log('✓ Review indexes created\n');

        // Violation indexes
        console.log('Violation indexes:');
        await Violation.collection.createIndex({ userId: 1 });
        await Violation.collection.createIndex({ violationType: 1 });
        await Violation.collection.createIndex({ reviewStatus: 1 });
        await Violation.collection.createIndex({ createdAt: -1 });
        await Violation.collection.createIndex({
            userId: 1,
            createdAt: -1
        });
        await Violation.collection.createIndex({
            reviewStatus: 1,
            createdAt: -1
        });
        console.log('✓ Violation indexes created\n');

        // Report indexes
        console.log('Report indexes:');
        await Report.collection.createIndex({ reporter: 1 });
        await Report.collection.createIndex({ reportedUser: 1 });
        await Report.collection.createIndex({ status: 1 });
        await Report.collection.createIndex({ severity: 1 });
        await Report.collection.createIndex({ reportType: 1 });
        await Report.collection.createIndex({ createdAt: -1 });
        await Report.collection.createIndex({ assignedAdmin: 1 });
        await Report.collection.createIndex({
            status: 1,
            severity: 1,
            createdAt: -1
        });
        await Report.collection.createIndex({
            assignedAdmin: 1,
            status: 1
        });
        console.log('✓ Report indexes created\n');

        console.log('All indexes created successfully!');
        console.log('\nIndex Statistics:');
        
        const collections = [
            'users', 'influencerprofiles', 'brandprofiles', 'campaigns',
            'applications', 'deals', 'payments', 'messages',
            'notifications', 'reviews', 'violations', 'reports'
        ];

        for (const collection of collections) {
            try {
                const indexes = await mongoose.connection.db.collection(collection).indexes();
                console.log(`${collection}: ${indexes.length} indexes`);
            } catch (err) {
                console.log(`${collection}: collection not found or error`);
            }
        }

    } catch (error) {
        console.error('Error creating indexes:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
        process.exit(0);
    }
}

// Run the script
createIndexes();
