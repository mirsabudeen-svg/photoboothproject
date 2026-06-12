import { generateDeviceToken, hashToken } from './token.util';

describe('token.util', () => {
  it('generateDeviceToken returns 64-char hex raw and 64-char hex hash', () => {
    const { raw, hash } = generateDeviceToken();
    expect(raw).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).toBe(hashToken(raw));
  });

  it('hashToken is deterministic', () => {
    const raw = 'a'.repeat(64);
    expect(hashToken(raw)).toBe(hashToken(raw));
  });
});
