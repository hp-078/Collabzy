// Export all models from a single file for easy import
module.exports = {
  User: require('./User.model'),
  InfluencerProfile: require('./InfluencerProfile.model'),
  BrandProfile: require('./BrandProfile.model'),
  Campaign: require('./Campaign.model'),
  Application: require('./Application.model'),
  Deal: require('./Deal.model'),
  Review: require('./Review.model'),
  Message: require('./Message.model'),
  Notification: require('./Notification.model'),
};
