export interface PasswordPolicyResult {
  isValid: boolean;
  errors: string[];
  score: number;
  feedback: string;
}

const hasUpper = (value: string) => /[A-Z]/.test(value);
const hasLower = (value: string) => /[a-z]/.test(value);
const hasNumber = (value: string) => /\d/.test(value);
const hasSpecial = (value: string) => /[^A-Za-z0-9]/.test(value);

export const validatePasswordPolicy = (password: string): PasswordPolicyResult => {
  const errors: string[] = [];

  if (password.length < 12) errors.push('Password must be at least 12 characters long.');
  if (password.length > 128) errors.push('Password must not exceed 128 characters.');
  if (!hasUpper(password)) errors.push('Password must contain at least one uppercase letter.');
  if (!hasLower(password)) errors.push('Password must contain at least one lowercase letter.');
  if (!hasNumber(password)) errors.push('Password must contain at least one number.');
  if (!hasSpecial(password)) errors.push('Password must contain at least one special character.');

  const score = [hasUpper(password), hasLower(password), hasNumber(password), hasSpecial(password)].filter(Boolean).length;
  const feedback = score >= 4 ? 'Password is strong.' : score >= 3 ? 'Password is moderate.' : 'Password is weak.';

  return { isValid: errors.length === 0, errors, score, feedback };
};

export const getPasswordStrength = (password: string) => {
  const result = validatePasswordPolicy(password);
  const score = Math.min(4, result.score + (password.length >= 16 ? 1 : 0));
  return {
    score,
    feedback: score >= 4 ? 'Password is strong.' : score >= 3 ? 'Password is moderate.' : 'Password is weak.',
    meetsPolicy: result.isValid,
  };
};
