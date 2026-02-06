// Export all models
const User = require('./User.model');
const InfluencerProfile = require('./InfluencerProfile.model');
const BrandProfile = require('./BrandProfile.model');
const Campaign = require('./Campaign.model');
const Application = require('./Application.model');
const Deal = require('./Deal.model');
const Message = require('./Message.model');
const Notification = require('./Notification.model');
const Review = require('./Review.model');

module.exports = {
  User,
  InfluencerProfile,
  BrandProfile,
  Campaign,
  Application,
  Deal,
  Message,
  Notification,
  Review
};
