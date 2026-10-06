import { Prisma } from '@prisma/client';
import { listingLinkErrorCode } from './listing-link.util';

const prismaError = (code: string, meta?: Record<string, unknown>) =>
  new Prisma.PrismaClientKnownRequestError('Request failed', {
    code,
    clientVersion: Prisma.prismaVersion.client,
    meta,
  });

describe('listingLinkErrorCode', () => {
  it('reads a unique-index failure on the listing link as already linked', () => {
    for (const target of [
      ['accommodation_id'],
      ['accommodationId'],
      'hotels_accommodation_id_key',
    ]) {
      expect(listingLinkErrorCode(prismaError('P2002', { target }))).toBe(
        'ACCOMMODATION_ALREADY_LINKED',
      );
    }
  });

  it('reads a unique-index failure without a column the same way', () => {
    // accommodation_id is the only unique column a hotel write can hit
    expect(listingLinkErrorCode(prismaError('P2002'))).toBe(
      'ACCOMMODATION_ALREADY_LINKED',
    );
  });

  it('ignores unique-index failures on other columns', () => {
    expect(
      listingLinkErrorCode(prismaError('P2002', { target: ['id'] })),
    ).toBeNull();
  });

  it('reads a foreign-key failure on the listing link as a missing listing', () => {
    expect(
      listingLinkErrorCode(
        prismaError('P2003', {
          field_name: 'hotels_accommodation_id_fkey (index)',
        }),
      ),
    ).toBe('ACCOMMODATION_NOT_FOUND');
  });

  it('ignores other foreign keys and errors', () => {
    expect(
      listingLinkErrorCode(
        prismaError('P2003', {
          field_name: 'hotel_contacts_hotel_id_fkey (index)',
        }),
      ),
    ).toBeNull();
    expect(listingLinkErrorCode(prismaError('P2003'))).toBeNull();
    expect(listingLinkErrorCode(prismaError('P2025'))).toBeNull();
    expect(listingLinkErrorCode(new Error('accommodation_id'))).toBeNull();
    expect(listingLinkErrorCode(undefined)).toBeNull();
  });
});
