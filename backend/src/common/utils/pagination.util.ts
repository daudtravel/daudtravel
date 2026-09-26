export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export const DEFAULT_PAGE_LIMIT = 10;

export function resolvePagination(page?: number, limit?: number) {
  const safeLimit =
    Number.isInteger(limit) && (limit as number) > 0
      ? (limit as number)
      : DEFAULT_PAGE_LIMIT;
  const safePage =
    Number.isInteger(page) && (page as number) > 0 ? (page as number) : 1;
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
}

export function buildMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  return {
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

/**
 * Picks a whitelisted sort field so arbitrary input can never reach Prisma's
 * orderBy (which would throw a 500 for unknown fields).
 */
export function resolveSort<T extends string>(
  sortBy: string | undefined,
  sortOrder: 'asc' | 'desc' | undefined,
  allowed: readonly T[],
  fallback: T,
  fallbackOrder: 'asc' | 'desc' = 'desc',
): { field: T; order: 'asc' | 'desc' } {
  const field = (allowed as readonly string[]).includes(sortBy ?? '')
    ? (sortBy as T)
    : fallback;
  return { field, order: sortOrder ?? fallbackOrder };
}
