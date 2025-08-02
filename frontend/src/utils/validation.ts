type ValidationRule = {
  validator: (value: unknown) => boolean | Promise<boolean>;
  message?: string;
};

type SchemaDefinition = {
  [key: string]: (
    | ValidationRule
    | ((value: unknown) => boolean | Promise<boolean>)
  )[];
};

// Basic Validators
export const validateEmail = (email: unknown): boolean => {
  if (typeof email !== 'string' || !email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: unknown): boolean => {
  if (typeof password !== 'string' || !password) return false;
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return strongPasswordRegex.test(password);
};

export const validateRequired = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  return true;
};

export const validateMinLength = (
  value: unknown,
  minLength: number
): boolean => {
  if (typeof value !== 'string') return false;
  return value.length >= minLength;
};

export const validateMaxLength = (
  value: unknown,
  maxLength: number
): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value !== 'string') return false;
  return value.length <= maxLength;
};

export const validatePhoneNumber = (phone: unknown): boolean => {
  if (typeof phone !== 'string' || !phone) return false;
  // This regex is simplified, consider a more robust one for production
  const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
  return phoneRegex.test(phone);
};

export const validateEmployeeNumber = (empNumber: unknown): boolean => {
  if (typeof empNumber !== 'string' || !empNumber) return false;
  // Example: Must contain letters and numbers, and be at least 3 chars long
  const empNumberRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d-]{3,}$/;
  return empNumberRegex.test(empNumber);
};

// Schema Validation
export const createValidationSchema = (schemaDefinition: SchemaDefinition) => {
  const validate = (data: Record<string, unknown>) => {
    const errors: Record<string, string> = {};
    let isValid = true;

    for (const key in schemaDefinition) {
      const rules = schemaDefinition[key];
      const value = data[key];

      for (const rule of rules) {
        const isRuleObject = typeof rule === 'object' && rule !== null;
        const validator = isRuleObject ? rule.validator : rule;
        const message =
          (isRuleObject ? rule.message : undefined) ?? 'Invalid value';

        if (!validator(value)) {
          isValid = false;
          errors[key] = message;
          break;
        }
      }
    }
    return { isValid, errors };
  };

  const validateAsync = async (data: Record<string, unknown>) => {
    const errors: Record<string, string> = {};
    let isValid = true;

    for (const key in schemaDefinition) {
      const rules = schemaDefinition[key];
      const value = data[key];

      for (const rule of rules) {
        const isRuleObject = typeof rule === 'object' && rule !== null;
        const validator = isRuleObject ? rule.validator : rule;
        const message =
          (isRuleObject ? rule.message : undefined) ?? 'Invalid value';

        const result = await Promise.resolve(validator(value));
        if (!result) {
          isValid = false;
          errors[key] = message;
          break;
        }
      }
    }
    return { isValid, errors };
  };

  return { validate, validateAsync };
};
