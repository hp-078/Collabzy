import Joi from 'joi';

// Validation middleware factory
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true, // Remove unknown keys
    });

    if (error) {
      const errors = error.details.map((err) => ({
        field: err.path.join('.'),
        message: err.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    // Replace req.body with validated value
    req.body = value;
    next();
  };
};

// Common validation schemas
export const authSchemas = {
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters',
      'any.required': 'Password is required'
    }),
    role: Joi.string().valid('brand', 'influencer').required().messages({
      'any.only': 'Role must be either brand or influencer',
      'any.required': 'Role is required'
    })
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    })
  })
};

export const influencerSchemas = {
  createProfile: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    bio: Joi.string().max(500).allow(''),
    niche: Joi.string().required(),
    platformType: Joi.string().valid('YouTube', 'Instagram', 'Both').required(),
    youtubeChannelUrl: Joi.string().uri().allow(''),
    instagramHandle: Joi.string().allow(''),
    contentTypes: Joi.array().items(Joi.string())
  }),

  updateStats: Joi.object({
    subscriberCount: Joi.number().min(0),
    followerCount: Joi.number().min(0),
    totalViews: Joi.number().min(0),
    averageViews: Joi.number().min(0),
    engagementRate: Joi.number().min(0).max(100)
  })
};

export const campaignSchemas = {
  createCampaign: Joi.object({
    title: Joi.string().min(10).max(200).required(),
    description: Joi.string().min(20).max(2000).required(),
    category: Joi.string().required(),
    platformType: Joi.string().valid('YouTube', 'Instagram', 'Both').required(),
    budget: Joi.object({
      min: Joi.number().min(0).required(),
      max: Joi.number().min(Joi.ref('min')).required()
    }).required(),
    deliverables: Joi.array()
      .items(
        Joi.object({
          type: Joi.string().required(),
          quantity: Joi.number().min(1).required(),
          description: Joi.string().allow('')
        })
      )
      .min(1)
      .required(),
    timeline: Joi.object({
      startDate: Joi.date().default(Date.now),
      endDate: Joi.date().greater(Date.now()).required()
    }).required(),
    eligibilityCriteria: Joi.object({
      minFollowers: Joi.number().min(0).default(0),
      maxFollowers: Joi.number().min(Joi.ref('minFollowers')).allow(null),
      minEngagementRate: Joi.number().min(0).max(100).default(0),
      requiredNiche: Joi.string().allow(''),
      minTrustScore: Joi.number().min(0).max(100).default(0)
    })
  })
};

export const applicationSchemas = {
  createApplication: Joi.object({
    campaignId: Joi.string().required(),
    proposalText: Joi.string().min(50).max(1000).required(),
    quotedPrice: Joi.number().min(0).required(),
    deliveryPlan: Joi.string().max(500).required(),
    estimatedCompletionDate: Joi.date().greater(Date.now()).required(),
    portfolioSamples: Joi.array().items(
      Joi.object({
        title: Joi.string().required(),
        url: Joi.string().uri().required(),
        platform: Joi.string().allow('')
      })
    )
  })
};

export default { validate, authSchemas, influencerSchemas, campaignSchemas, applicationSchemas };
