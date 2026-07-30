const crypto = require('crypto');

const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const decodeBase32 = (value: string) => {
  const cleaned = value.replace(/=+$/g, '').toUpperCase();
  let bits = '';
  for (const char of cleaned) {
    const index = base32Alphabet.indexOf(char);
    if (index < 0) continue;
    bits += index.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
};

export const generateTwoFactorSecret = () => {
  const random = crypto.randomBytes(10).toString('hex');
  const secret = Buffer.from(random, 'hex').toString('base64').replace(/=+$/g, '').slice(0, 24);
  return secret.toUpperCase();
};

export const buildOtpAuthUrl = (secret: string, email: string) => {
  const issuer = 'Jhasha Restaurant';
  const label = `${issuer.replace(/ /g, '%20')}:${email}`;
  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer.replace(/ /g, '%20')}&digits=6&period=30`;
};

export const generateTwoFactorCode = (secret: string) => {
  const time = Math.floor(Date.now() / 30000);
  const buffer = Buffer.alloc(8);
  buffer.writeUInt32BE(0, 0);
  buffer.writeUInt32BE(time, 4);

  const key = decodeBase32(secret);
  const hmac = crypto.createHmac('sha1', key);
  hmac.update(buffer);
  const digest = hmac.digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary = (digest.readUInt32BE(offset) & 0x7fffffff).toString();
  return (parseInt(binary.slice(-6), 10) % 1000000).toString().padStart(6, '0');
};

export const verifyTwoFactorCode = (secret: string, code: string) => {
  const expected = generateTwoFactorCode(secret);
  return code === expected;
};

export const evaluateTwoFactorLogin = (user: any, code?: string) => {
  if (!user?.twoFactorEnabled) {
    return { required: false };
  }

  if (!code) {
    return { required: true, message: 'Two-factor authentication code is required' };
  }

  if (!user.twoFactorSecret || !verifyTwoFactorCode(user.twoFactorSecret, code)) {
    return { required: true, message: 'Invalid two-factor authentication code' };
  }

  return { required: false };
};
