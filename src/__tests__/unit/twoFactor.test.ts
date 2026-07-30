import { generateTwoFactorSecret, buildOtpAuthUrl } from '../../utils/twoFactor';

describe('Two-factor helpers', () => {
  it('generates a non-empty secret for setup', () => {
    const secret = generateTwoFactorSecret();

    expect(secret).toBeTruthy();
    expect(secret.length).toBeGreaterThan(10);
  });

  it('builds an otpauth URL for QR-code setup', () => {
    const secret = 'ABC123DEF456GHI789';
    const url = buildOtpAuthUrl(secret, 'user@example.com');

    expect(url).toContain('otpauth://totp/Jhasha%20Restaurant:user@example.com');
    expect(url).toContain('secret=ABC123DEF456GHI789');
  });
});
