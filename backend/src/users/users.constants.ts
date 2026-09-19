import { Prisma } from '@prisma/client';

/** Staff password rule: 8–128 chars with at least one letter and one digit. */
export const PASSWORD_REGEX = /^(?=.*[A-Za-zÀ-￿])(?=.*\d).{8,128}$/;
export const PASSWORD_MESSAGE = 'PASSWORD_TOO_WEAK';

export const BCRYPT_ROUNDS = 10;

/** Never select the password hash. */
export const USER_PUBLIC_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  position: true,
  isAdmin: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  roles: {
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  },
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{
  select: typeof USER_PUBLIC_SELECT;
}>;

export const normalizeEmail = (email: string) => email.trim().toLowerCase();
