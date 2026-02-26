/**
 * Pagination utility functions
 * Ensures safe and validated pagination parameters
 */

/**
 * Validate and sanitize pagination parameters
 * @param {Object} params - Query parameters with page and limit
 * @param {Object} options - Options for max limit and default values
 * @returns {Object} - Validated pagination parameters
 */
const validatePagination = (params = {}, options = {}) => {
  const {
    maxLimit = 100,
    defaultLimit = 20,
    defaultPage = 1
  } = options;

  let page = parseInt(params.page) || defaultPage;
  let limit = parseInt(params.limit) || defaultLimit;

  // Ensure page is at least 1
  if (page < 1 || isNaN(page)) {
    page = defaultPage;
  }

  // Ensure limit is between 1 and maxLimit
  if (limit < 1 || isNaN(limit)) {
    limit = defaultLimit;
  }
  if (limit > maxLimit) {
    limit = maxLimit;
  }

  // Calculate skip
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip
  };
};

/**
 * Build pagination response object
 * @param {Number} page - Current page number
 * @param {Number} limit - Items per page
 * @param {Number} total - Total number of items
 * @returns {Object} - Pagination response object
 */
const buildPaginationResponse = (page, limit, total) => {
  return {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  };
};

module.exports = {
  validatePagination,
  buildPaginationResponse
};
