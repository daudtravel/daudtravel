/** Mirrors the backend rule: 8–128 chars, at least one letter and one digit. */
export const PASSWORD_REGEX = /^(?=.*[A-Za-zÀ-￿])(?=.*\d).{8,128}$/;

const LETTERS = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%*?";

function pick(chars: string, random: Uint32Array, i: number) {
  return chars[random[i] % chars.length];
}

/** 12-character password with letters, digits and a symbol (no look-alikes). */
export function generatePassword(length = 12): string {
  const random = new Uint32Array(length + 4);
  crypto.getRandomValues(random);
  const all = LETTERS + DIGITS + SYMBOLS;
  const chars = [
    pick(LETTERS, random, 0),
    pick(DIGITS, random, 1),
    pick(SYMBOLS, random, 2),
  ];
  for (let i = 3; i < length; i++) chars.push(pick(all, random, i));
  // Shuffle so the guaranteed characters aren't always first.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = random[(i + 3) % random.length] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
