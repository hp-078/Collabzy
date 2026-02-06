const BrandProfile = require('../models/BrandProfile.model');
const User = require('../models/User.model');

/**
 * Get own brand profile
 * GET /api/brand/profile/me
 */
exports.getOwnProfile = async (req, res) => {
  try {
    const profile = await BrandProfile.findOne({ user: req.user._id })
      .populate('user', 'name email role avatar');

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Brand profile not found'
      });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Get own brand profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
};

/**
 * Get brand profile by ID
 * GET /api/brand/:id
 */
exports.getProfileById = async (req, res) => {
  try {
    const profile = await BrandProfile.findById(req.params.id)
      .populate('user', 'name email');

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found'
      });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Get brand profile by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch brand profile'
    });
  }
};

/**
 * Update brand profile
 * PUT /api/brand/profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    let profile = await BrandProfile.findOne({ user: userId });

    if (!profile) {
      // Create new profile if doesn't exist
      profile = new BrandProfile({
        user: userId,
        companyName: req.body.companyName || req.user.name
      });
    }

    // Update basic fields
    const allowedFields = [
      'companyName', 'logo', 'description', 'location',
      'websiteUrl', 'instagramUrl', 'twitterUrl', 'linkedinUrl', 'facebookUrl'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        profile[field] = req.body[field];
      }
    });

    // Handle industry (enum validated) - only set if a valid value is provided
    if (req.body.industry !== undefined && req.body.industry !== '') {
      profile.industry = req.body.industry;
    }

    // Handle companySize (enum validated) - only set if a valid value is provided
    if (req.body.companySize !== undefined && req.body.companySize !== '') {
      profile.companySize = req.body.companySize;
    }

    // Handle contactPerson (nested object)
    if (req.body.contactPerson) {
      profile.contactPerson = {
        name: req.body.contactPerson.name || profile.contactPerson?.name || '',
        email: req.body.contactPerson.email || profile.contactPerson?.email || '',
        phone: req.body.contactPerson.phone || profile.contactPerson?.phone || ''
      };
    }

    // Handle monthlyBudget (nested object)
    if (req.body.monthlyBudget) {
      profile.monthlyBudget = {
        min: req.body.monthlyBudget.min || profile.monthlyBudget?.min || 0,
        max: req.body.monthlyBudget.max || profile.monthlyBudget?.max || 0
      };
    }

    // Handle preferredNiches (array)
    if (req.body.preferredNiches !== undefined) {
      profile.preferredNiches = Array.isArray(req.body.preferredNiches)
        ? req.body.preferredNiches
        : [];
    }

    // Handle preferredPlatforms (array)
    if (req.body.preferredPlatforms !== undefined) {
      profile.preferredPlatforms = Array.isArray(req.body.preferredPlatforms)
        ? req.body.preferredPlatforms
        : [];
    }

    await profile.save();

    // Sync companyName to User.name so auth/me returns updated name
    if (req.body.companyName && req.body.companyName !== req.user.name) {
      await User.findByIdAndUpdate(req.user._id, { name: req.body.companyName });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: profile
    });
  } catch (error) {
    console.error('Update brand profile error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

/**
 * List all brands with filters
 * GET /api/brand/list
 */
exports.listBrands = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      industry,
      search,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const filter = {};

    if (industry) {
      filter.industry = industry;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [brands, total] = await Promise.all([
      BrandProfile.find(filter)
        .populate('user', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      BrandProfile.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: brands,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('List brands error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch brands'
    });
  }
};
