import { Prisma } from '@prisma/client';

const LISTING_COLUMN = /accommodation_?id/i;

function namesListingColumn(value: unknown): boolean {
  const names: unknown[] = Array.isArray(value) ? value : [value];
  return names.some(
    (name) => typeof name === 'string' && LISTING_COLUMN.test(name),
  );
}

/**
 * The error code for a hotel write that lost a race over its website listing
 * after the pre-check: another save linked the listing first (unique index)
 * or the listing was deleted (foreign key). Null for any other error.
 */
export function listingLinkErrorCode(
  error: unknown,
): 'ACCOMMODATION_ALREADY_LINKED' | 'ACCOMMODATION_NOT_FOUND' | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return null;

  if (error.code === 'P2002') {
    // Postgres names the column; a hotel has no other unique column a write
    // can hit, so a report without one is read the same way
    const target = error.meta?.target;
    const named = typeof target === 'string' || Array.isArray(target);
    return !named || namesListingColumn(target)
      ? 'ACCOMMODATION_ALREADY_LINKED'
      : null;
  }

  if (error.code === 'P2003' && namesListingColumn(error.meta?.field_name)) {
    return 'ACCOMMODATION_NOT_FOUND';
  }
  return null;
}
