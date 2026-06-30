import { z } from 'zod';

const MOBILE_REGEX = /^\+?[1-9]\d{7,14}$/;

const mobileSchema = z
  .string()
  .regex(MOBILE_REGEX, 'Enter a valid phone number (e.g. +919876543210)')
  .optional()
  .or(z.literal(''));

export const loginSchema = z
  .object({
    loginMethod: z.enum(['email', 'mobile']),
    email: z.string().optional().or(z.literal('')),
    mobile: mobileSchema,
    password: z.string().min(8, 'Password must be at least 8 characters'),
    rememberMe: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.loginMethod === 'email') {
      const result = z.string().email().safeParse(data.email);
      if (!result.success) {
        ctx.addIssue({
          code: 'custom',
          message: 'Enter a valid email',
          path: ['email'],
        });
      }
    }

    if (data.loginMethod === 'mobile') {
      if (!data.mobile || !MOBILE_REGEX.test(data.mobile)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Enter a valid phone number',
          path: ['mobile'],
        });
      }
    }
  });

export const registerSchema = z
  .object({
    email: z.string().email('Enter a valid email'),
    mobile: mobileSchema,
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export function toLoginPayload(values) {
  const payload = { password: values.password };

  if (values.loginMethod === 'email' && values.email) {
    payload.email = values.email;
  }

  if (values.loginMethod === 'mobile' && values.mobile) {
    payload.mobile = values.mobile;
  }

  return payload;
}

export function toRegisterPayload(values) {
  const payload = {
    email: values.email,
    password: values.password,
  };

  if (values.mobile) {
    payload.mobile = values.mobile;
  }

  return payload;
}
