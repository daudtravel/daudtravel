import { buildMeta, resolvePagination, resolveSort } from './pagination.util';

describe('resolvePagination', () => {
  it('defaults to page 1 / 10 per page', () => {
    expect(resolvePagination()).toEqual({ page: 1, limit: 10, skip: 0 });
  });

  it('computes skip', () => {
    expect(resolvePagination(3, 20)).toEqual({ page: 3, limit: 20, skip: 40 });
  });

  it('ignores invalid values', () => {
    expect(resolvePagination(0, -5)).toEqual({ page: 1, limit: 10, skip: 0 });
    expect(resolvePagination(1.5, 2.5)).toEqual({
      page: 1,
      limit: 10,
      skip: 0,
    });
  });
});

describe('buildMeta', () => {
  it('rounds pages up and never reports 0 pages', () => {
    expect(buildMeta(21, 1, 10).totalPages).toBe(3);
    expect(buildMeta(0, 1, 10).totalPages).toBe(1);
  });
});

describe('resolveSort', () => {
  const allowed = ['name', 'createdAt'] as const;

  it('accepts whitelisted fields', () => {
    expect(resolveSort('name', 'asc', allowed, 'createdAt')).toEqual({
      field: 'name',
      order: 'asc',
    });
  });

  it('falls back for unknown fields (no Prisma 500)', () => {
    expect(resolveSort('password', undefined, allowed, 'createdAt')).toEqual({
      field: 'createdAt',
      order: 'desc',
    });
  });
});
