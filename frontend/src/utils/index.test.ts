import { describe, it, expect } from 'vitest';
import {
  cn,
  formatDate,
  formatCurrency,
  validation,
  arrayUtils,
} from './index';

describe('Utility Functions', () => {
  describe('cn', () => {
    it('should combine class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });
  });

  describe('formatDate', () => {
    it('should format date in short format', () => {
      const date = new Date('2023-12-25');
      const formatted = formatDate(date, 'short');
      expect(formatted).toContain('Dec');
      expect(formatted).toContain('25');
      expect(formatted).toContain('2023');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(1000, 'EUR')).toBe('€1,000.00');
    });
  });

  describe('validation', () => {
    it('should validate email correctly', () => {
      expect(validation.isEmail('test@example.com')).toBe(true);
      expect(validation.isEmail('invalid-email')).toBe(false);
    });

    it('should validate phone correctly', () => {
      expect(validation.isPhone('+1234567890')).toBe(true);
      expect(validation.isPhone('123-456-7890')).toBe(true);
      expect(validation.isPhone('invalid')).toBe(false);
    });

    it('should validate strong password', () => {
      expect(validation.isStrongPassword('Password123')).toBe(true);
      expect(validation.isStrongPassword('weak')).toBe(false);
    });
  });

  describe('arrayUtils', () => {
    it('should return unique values', () => {
      expect(arrayUtils.unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
    });

    it('should group by key', () => {
      const data = [
        { type: 'A', value: 1 },
        { type: 'B', value: 2 },
        { type: 'A', value: 3 },
      ];
      const grouped = arrayUtils.groupBy(data, 'type');
      expect(grouped.A).toHaveLength(2);
      expect(grouped.B).toHaveLength(1);
    });

    it('should sort by key', () => {
      const data = [{ name: 'Charlie' }, { name: 'Alice' }, { name: 'Bob' }];
      const sorted = arrayUtils.sortBy(data, 'name');
      expect(sorted[0].name).toBe('Alice');
      expect(sorted[1].name).toBe('Bob');
      expect(sorted[2].name).toBe('Charlie');
    });
  });
});
