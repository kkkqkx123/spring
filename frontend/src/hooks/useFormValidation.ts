import React from 'react';

/**
 * Hook to handle form validation state
 */
export const useFormValidation = () => {
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  const [serverErrors, setServerErrors] = React.useState<
    Record<string, string>
  >({});

  const markFieldTouched = (fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
  };

  const markAllFieldsTouched = (fieldNames: string[]) => {
    const touchedFields = fieldNames.reduce(
      (acc, name) => {
        acc[name] = true;
        return acc;
      },
      {} as Record<string, boolean>
    );
    setTouched(touchedFields);
  };

  const setServerError = (fieldName: string, error: string) => {
    setServerErrors(prev => ({ ...prev, [fieldName]: error }));
  };

  const clearServerErrors = () => {
    setServerErrors({});
  };

  const clearServerError = (fieldName: string) => {
    setServerErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  return {
    touched,
    serverErrors,
    markFieldTouched,
    markAllFieldsTouched,
    setServerError,
    clearServerErrors,
    clearServerError,
  };
};
