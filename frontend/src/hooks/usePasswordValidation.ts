import React from 'react';

const getPasswordStrengthLabel = (strength: number): string => {
  switch (strength) {
    case 0:
    case 1:
      return 'Very Weak';
    case 2:
      return 'Weak';
    case 3:
      return 'Fair';
    case 4:
      return 'Good';
    case 5:
      return 'Strong';
    default:
      return 'Unknown';
  }
};

/**
 * Hook to validate password strength
 */
export const usePasswordValidation = (password: string) => {
  const rules = React.useMemo(
    () => [
      {
        label: 'At least 8 characters long',
        valid: password.length >= 8,
      },
      {
        label: 'Contains uppercase letter',
        valid: /[A-Z]/.test(password),
      },
      {
        label: 'Contains lowercase letter',
        valid: /[a-z]/.test(password),
      },
      {
        label: 'Contains number',
        valid: /\d/.test(password),
      },
      {
        label: 'Contains special character',
        valid: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      },
    ],
    [password]
  );

  const isValid = rules.every(rule => rule.valid);
  const strength = rules.filter(rule => rule.valid).length;

  return {
    rules,
    isValid,
    strength,
    strengthLabel: getPasswordStrengthLabel(strength),
  };
};
