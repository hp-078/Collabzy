const mongoose = require('mongoose');

/**
 * Middleware to validate MongoDB ObjectId in route parameters
 * Usage: router.get('/:id', validateObjectId('id'), controller.getById)
 */
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (!id) {
      return res.status(400).json({
        success: false,
        message: `${paramName} is required`
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`
      });
    }

    next();
  };
};

/**
 * Validate multiple ObjectId parameters
 * Usage: router.get('/:campaignId/:userId', validateObjectIds(['campaignId', 'userId']), ...)
 */
const validateObjectIds = (paramNames = []) => {
  return (req, res, next) => {
    const invalidParams = [];

    for (const paramName of paramNames) {
      const id = req.params[paramName];
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        invalidParams.push(paramName);
      }
    }

    if (invalidParams.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid format for: ${invalidParams.join(', ')}`
      });
    }

    next();
  };
};

module.exports = { validateObjectId, validateObjectIds };
