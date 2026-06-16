const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 50;
const DEFAULT_ORDER_LIMIT = 20;
const MAX_ORDER_LIMIT = 100;

export function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function buildPagination(queryPage, queryLimit, options = {}) {
  const defaultLimit = options.defaultLimit ?? DEFAULT_LIMIT;
  const maxLimit = options.maxLimit ?? MAX_LIMIT;
  const page = parsePositiveInt(queryPage, DEFAULT_PAGE);
  const requestedLimit = parsePositiveInt(queryLimit, defaultLimit);
  const limit = Math.min(requestedLimit, maxLimit);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function buildPaginationMeta(total, page, limit) {
  const pages = Math.max(1, Math.ceil(total / limit));

  return {
    page,
    limit,
    pages,
    total,
    hasNextPage: page < pages,
    hasPrevPage: page > 1,
  };
}

// Escape user input so it can be used safely inside a RegExp (for case-
// insensitive substring search) without special characters breaking the query.
export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function parseNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function stableObject(value) {
  if (Array.isArray(value)) return value.map(stableObject);
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = stableObject(value[key]);
        return acc;
      }, {});
  }
  return value;
}

export function createOptionsFingerprint(options = {}) {
  return JSON.stringify(stableObject(options));
}

export const paginationPresets = {
  product: { defaultLimit: DEFAULT_LIMIT, maxLimit: MAX_LIMIT },
  order: { defaultLimit: DEFAULT_ORDER_LIMIT, maxLimit: MAX_ORDER_LIMIT },
};
