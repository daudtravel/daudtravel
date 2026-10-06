import { narrowScopeToOwner } from './owner-scope';

const NOTHING = { createdById: { in: [] } };

describe('narrowScopeToOwner', () => {
  it('leaves the scope alone without an owner filter', () => {
    expect(narrowScopeToOwner({}, undefined)).toEqual({});
    expect(narrowScopeToOwner({}, null)).toEqual({});
    expect(narrowScopeToOwner({}, '')).toEqual({});
    expect(narrowScopeToOwner({ createdById: 'me' }, undefined)).toEqual({
      createdById: 'me',
    });
  });

  it('lets an all-records scope narrow down to any owner', () => {
    expect(narrowScopeToOwner({}, 'someone')).toEqual({
      createdById: 'someone',
    });
  });

  it('keeps an own-records scope on its own records', () => {
    expect(narrowScopeToOwner({ createdById: 'me' }, 'me')).toEqual({
      createdById: 'me',
    });
  });

  it('finds nothing when an own-records scope asks for another owner', () => {
    expect(narrowScopeToOwner({ createdById: 'me' }, 'someone')).toEqual(
      NOTHING,
    );
  });

  it('returns a fresh "nothing" filter every time', () => {
    const a = narrowScopeToOwner({ createdById: 'me' }, 'x');
    const b = narrowScopeToOwner({ createdById: 'me' }, 'y');
    expect(a).not.toBe(b);
    expect(a.createdById).not.toBe(b.createdById);
  });
});
