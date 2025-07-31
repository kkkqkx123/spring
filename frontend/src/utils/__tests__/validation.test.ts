import {
  validateEmail,
  validatePassword,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validatePhoneNumber,
  validateEmployeeNumber,
  createValidationSchema,
} from '../validation';

describe('validation utilities', () => {
  describe('validateEmail', () => {
    it('validates correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('test+tag@example.org')).toBe(true);
    });

    it('rejects invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test..test@example.com')).toBe(false);
    });

    it('handles empty values', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail(null)).toBe(false);
      expect(validateEmail(undefined)).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('validates strong passwords', () => {
      expect(validatePassword('Password123!')).toBe(true);
      expect(validatePassword('MySecure@Pass1')).toBe(true);
      expect(validatePassword('Complex#Pass99')).toBe(true);
    });

    it('rejects weak passwords', () => {
      expect(validatePassword('password')).toBe(false); // No uppercase, number, special char
      expect(validatePassword('PASSWORD')).toBe(false); // No lowercase, number, special char
      expect(validatePassword('Password')).toBe(false); // No number, special char
      expect(validatePassword('Pass123')).toBe(false); // Too short
    });

    it('handles empty values', () => {
      expect(validatePassword('')).toBe(false);
      expect(validatePassword(null)).toBe(false);
      expect(validatePassword(undefined)).toBe(false);
    });
  });

  describe('validateRequired', () => {
    it('validates non-empty values', () => {
      expect(validateRequired('test')).toBe(true);
      expect(validateRequired('0')).toBe(true);
      expect(validateRequired(0)).toBe(true);
      expect(validateRequired(false)).toBe(true);
    });

    it('rejects empty values', () => {
      expect(validateRequired('')).toBe(false);
      expect(validateRequired('   ')).toBe(false); // Whitespace only
      expect(validateRequired(null)).toBe(false);
      expect(validateRequired(undefined)).toBe(false);
    });
  });

  describe('validateMinLength', () => {
    it('validates strings meeting minimum length', () => {
      expect(validateMinLength('hello', 3)).toBe(true);
      expect(validateMinLength('hello', 5)).toBe(true);
      expect(validateMinLength('test', 4)).toBe(true);
    });

    it('rejects strings below minimum length', () => {
      expect(validateMinLength('hi', 3)).toBe(false);
      expect(validateMinLength('test', 5)).toBe(false);
      expect(validateMinLength('', 1)).toBe(false);
    });

    it('handles non-string values', () => {
      expect(validateMinLength(null, 3)).toBe(false);
      expect(validateMinLength(undefined, 3)).toBe(false);
      expect(validateMinLength(123, 3)).toBe(false);
    });
  });

  describe('validateMaxLength', () => {
    it('validates strings within maximum length', () => {
      expect(validateMaxLength('hello', 10)).toBe(true);
      expect(validateMaxLength('test', 4)).toBe(true);
      expect(validateMaxLength('', 5)).toBe(true);
    });

    it('rejects strings exceeding maximum length', () => {
      expect(validateMaxLength('hello world', 5)).toBe(false);
      expect(validateMaxLength('testing', 6)).toBe(false);
    });

    it('handles non-string values', () => {
      expect(validateMaxLength(null, 3)).toBe(true); // null/undefined are considered valid for max length
      expect(validateMaxLength(undefined, 3)).toBe(true);
      expect(validateMaxLength(123, 3)).toBe(false);
    });
  });

  describe('validatePhoneNumber', () => {
    it('validates correct phone numbers', () => {
      expect(validatePhoneNumber('+1234567890')).toBe(true);
      expect(validatePhoneNumber('(555) 123-4567')).toBe(true);
      expect(validatePhoneNumber('555-123-4567')).toBe(true);
      expect(validatePhoneNumber('5551234567')).toBe(true);
    });

    it('rejects invalid phone numbers', () => {
      expect(validatePhoneNumber('123')).toBe(false);
      expect(validatePhoneNumber('abc-def-ghij')).toBe(false);
      expect(validatePhoneNumber('555-123-456')).toBe(false); // Too short
    });

    it('handles empty values', () => {
      expect(validatePhoneNumber('')).toBe(false);
      expect(validatePhoneNumber(null)).toBe(false);
      expect(validatePhoneNumber(undefined)).toBe(false);
    });
  });

  describe('validateEmployeeNumber', () => {
    it('validates correct employee numbers', () => {
      expect(validateEmployeeNumber('EMP001')).toBe(true);
      expect(validateEmployeeNumber('EMP-2023-001')).toBe(true);
      expect(validateEmployeeNumber('E12345')).toBe(true);
    });

    it('rejects invalid employee numbers', () => {
      expect(validateEmployeeNumber('123')).toBe(false); // No letters
      expect(validateEmployeeNumber('ABC')).toBe(false); // No numbers
      expect(validateEmployeeNumber('E1')).toBe(false); // Too short
    });

    it('handles empty values', () => {
      expect(validateEmployeeNumber('')).toBe(false);
      expect(validateEmployeeNumber(null)).toBe(false);
      expect(validateEmployeeNumber(undefined)).toBe(false);
    });
  });

  describe('createValidationSchema', () => {
    it('creates validation schema with multiple rules', () => {
      const schema = createValidationSchema({
        email: [validateRequired, validateEmail],
        password: [validateRequired, validatePassword],
        name: [validateRequired, (value: any) => validateMinLength(value, 2)],
      });

      const validData = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'John Doe',
      };

      const invalidData = {
        email: 'invalid-email',
        password: 'weak',
        name: 'J',
      };

      expect(schema.validate(validData)).toEqual({ isValid: true, errors: {} });

      const invalidResult = schema.validate(invalidData);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.email).toBeDefined();
      expect(invalidResult.errors.password).toBeDefined();
      expect(invalidResult.errors.name).toBeDefined();
    });

    it('handles partial validation', () => {
      const schema = createValidationSchema({
        email: [validateRequired, validateEmail],
        name: [validateRequired],
      });

      const partialData = {
        email: 'test@example.com',
        // name is missing
      };

      const result = schema.validate(partialData);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBeDefined();
      expect(result.errors.email).toBeUndefined();
    });

    it('returns custom error messages', () => {
      const schema = createValidationSchema({
        email: [
          { validator: validateRequired, message: 'Email is required' },
          { validator: validateEmail, message: 'Invalid email format' },
        ],
      });

      const result = schema.validate({ email: 'invalid' });
      expect(result.errors.email).toBe('Invalid email format');
    });

    it('handles async validation', async () => {
      const asyncValidator = async (value: string) => {
        return new Promise(resolve => {
          setTimeout(() => resolve(value !== 'taken'), 100);
        });
      };

      const schema = createValidationSchema({
        username: [validateRequired, asyncValidator],
      });

      const result = await schema.validateAsync({ username: 'taken' });
      expect(result.isValid).toBe(false);
      expect(result.errors.username).toBeDefined();
    });
  });
});
