/**
 * A record scope as a Prisma `where` fragment: `{}` is every record,
 * `{ createdById }` the user's own, and `{ createdById: { in: [] } }` none
 * (Prisma reads an empty `in` list as "matches nothing").
 */
export type RecordScope = { createdById?: string | { in: string[] } };

/**
 * A record scope narrowed by a list's "owner" filter. The filter can only
 * narrow the scope, never replace it: someone limited to their own records
 * who asks for another owner's gets nothing back.
 */
export function narrowScopeToOwner(
  scope: { createdById?: string },
  ownerId: string | null | undefined,
): RecordScope {
  if (!ownerId) return scope;
  if (scope.createdById !== undefined && scope.createdById !== ownerId) {
    return { createdById: { in: [] } };
  }
  return { createdById: ownerId };
}
