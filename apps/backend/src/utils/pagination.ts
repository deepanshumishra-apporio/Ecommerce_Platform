import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from "../config/constants.js";

export const getPagination = (page?: unknown, limit?: unknown) => {
  const parsedPage = Number(page ?? DEFAULT_PAGE);
  const parsedLimit = Number(limit ?? DEFAULT_LIMIT);

  const safePage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : DEFAULT_PAGE;
  const safeLimit =
    Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, MAX_LIMIT)
      : DEFAULT_LIMIT;

  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
  };
};
