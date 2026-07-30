import { evaluateTwoFactorLogin } from '../../utils/twoFactor';

describe('Two-factor login enforcement', () => {
  it('requires a code for users with 2FA enabled', () => {
    const result = evaluateTwoFactorLogin({ twoFactorEnabled: true, twoFactorSecret: 'SECRET123' });

    expect(result.required).toBe(true);
    expect(result.message).toBe('Two-factor authentication code is required');
  });

  it('accepts a valid code for enabled users', () => {
    const result = evaluateTwoFactorLogin({ twoFactorEnabled: true, twoFactorSecret: 'SECRET123' }, '000000');

    expect(result.required).toBe(true);
    expect(result.message).toBe('Invalid two-factor authentication code');
  });
});
