const CATEGORY_OPTIONS = [
  'Fashion',
  'Beauty',
  'Food',
  'Travel',
  'Technology',
  'Gaming',
  'Fitness',
  'Lifestyle',
  'Education',
  'Entertainment',
  'Business',
  'Health',
  'Sports',
  'Music',
  'Art',
  'Photography',
  'Finance',
  'Parenting',
  'Home & Garden',
  'Automotive',
  'Pet & Animals',
  'Other'
];

const CATEGORY_ALIASES = {
  'fashion & lifestyle': 'Fashion',
  'beauty & skincare': 'Beauty',
  'food & beverage': 'Food',
  'food & cooking': 'Food',
  'travel & adventure': 'Travel',
  tech: 'Technology',
  'tech & gadgets': 'Technology',
  'fitness & health': 'Fitness'
};

const normalizeCategory = (value) => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const exact = CATEGORY_OPTIONS.find(category => category.toLowerCase() === trimmed.toLowerCase());
  if (exact) {
    return exact;
  }

  return CATEGORY_ALIASES[trimmed.toLowerCase()] || null;
};

const normalizeCategoryList = (values) => {
  if (!Array.isArray(values)) {
    return [];
  }

  const normalized = values
    .map(value => normalizeCategory(value))
    .filter(Boolean);

  return [...new Set(normalized)];
};

module.exports = {
  CATEGORY_OPTIONS,
  normalizeCategory,
  normalizeCategoryList
};
