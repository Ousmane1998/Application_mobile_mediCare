import { useMemo, useState } from 'react';

export type Validator<TValues> = (value: any, values: TValues) => string | null;

export type ValidatorsMap<TValues> = {
  [K in keyof TValues]?: Validator<TValues> | Array<Validator<TValues>>;
};

export function useFormValidation<TValues extends Record<string, any>>(
  initialValues: TValues,
  validators: ValidatorsMap<TValues> = {}
) {
  const [values, setValues] = useState<TValues>(initialValues);
  const [touched, setTouched] = useState<Record<keyof TValues, boolean>>(
    Object.keys(initialValues).reduce((acc, k) => {
      // @ts-ignore
      acc[k as keyof TValues] = false;
      return acc;
    }, {} as Record<keyof TValues, boolean>)
  );

  const setField = <K extends keyof TValues>(key: K, next: TValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: next }));
  };

  const runValidators = <K extends keyof TValues>(key: K): string | null => {
    const v = validators[key];
    if (!v) return null;
    const list = Array.isArray(v) ? v : [v];
    for (const fn of list) {
      const msg = fn(values[key], values);
      if (msg) return msg;
    }
    return null;
  };

  const errors = useMemo(() => {
    const out: Partial<Record<keyof TValues, string | null>> = {};
    (Object.keys(values) as Array<keyof TValues>).forEach((k) => {
      out[k] = runValidators(k);
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  const isValid = useMemo(() => {
    return (Object.keys(values) as Array<keyof TValues>).every((k) => !errors[k]);
  }, [errors, values]);

  const handleBlur = <K extends keyof TValues>(key: K) => () => {
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const getError = <K extends keyof TValues>(key: K) => {
    return touched[key] ? errors[key] : null;
  };

  const borderStyle = <K extends keyof TValues>(key: K) => {
    return getError(key) ? { borderColor: '#dc2626' } : null;
  };

  const getInputProps = <K extends keyof TValues>(key: K) => ({
    onBlur: handleBlur(key),
    // caller should still wire value/onChangeText
  });

  const markAllTouched = () => {
    setTouched(
      (Object.keys(values) as Array<keyof TValues>).reduce((acc, k) => {
        acc[k] = true;
        return acc;
      }, {} as Record<keyof TValues, boolean>)
    );
  };

  return {
    values,
    setField,
    touched,
    setTouched,
    errors,
    isValid,
    getError,
    borderStyle,
    getInputProps,
    markAllTouched,
  } as const;
}
