import { validatePasswordPolicy, getPasswordStrength } from '../../utils/passwordPolicy';

describe('Password policy helpers', () => {
  it('rejects short or weak passwords', () => {
    const result = validatePasswordPolicy('Abc123');

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('at least 12 characters')]))
  });

  it('accepts strong passwords with mixed complexity', () => {
    const result = validatePasswordPolicy('SecurePass123!');

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('scores password strength for feedback', () => {
    const score = getPasswordStrength('Password123!');

    expect(score.score).toBeGreaterThan(2);
    expect(score.feedback).toContain('strong');
  });
});
