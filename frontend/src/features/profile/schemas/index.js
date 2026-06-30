import { z } from 'zod';

const optionalEnum = (values) =>
  z.union([z.enum(values), z.literal('')]).optional();

export const updateProfileSchema = z.object({
  gender: optionalEnum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']),
  age: z.coerce.number().int().min(13).max(120).optional().or(z.literal('')),
  height: z.coerce.number().min(50).max(300).optional().or(z.literal('')),
  weight: z.coerce.number().min(20).max(500).optional().or(z.literal('')),
  body_type: optionalEnum(['SLIM', 'ATHLETIC', 'AVERAGE', 'CURVY', 'PLUS_SIZE']),
  skin_tone: optionalEnum([
    'FAIR',
    'LIGHT',
    'MEDIUM',
    'OLIVE',
    'TAN',
    'BROWN',
    'DARK',
  ]),
});

export const personalInfoSchema = z.object({
  first_name: z.string().max(60).optional().or(z.literal('')),
  last_name: z.string().max(60).optional().or(z.literal('')),
  email: z.string().optional(),
  phone: z.string().max(30).optional().or(z.literal('')),
  gender: optionalEnum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']),
  age: z.coerce.number().int().min(13).max(120).optional().or(z.literal('')),
  date_of_birth: z.string().optional().or(z.literal('')),
  occupation: z.string().max(80).optional().or(z.literal('')),
  city: z.string().max(120).optional().or(z.literal('')),
  country: z.string().max(120).optional().or(z.literal('')),
  bio: z.string().max(280).optional().or(z.literal('')),
});

const PASSWORD_STRENGTH_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const changePasswordSchema = z
  .object({
    current: z.string().min(1, 'Current password is required'),
    next: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        PASSWORD_STRENGTH_REGEX,
        'Password must include uppercase, lowercase, number, and special character',
      ),
    confirm: z.string().min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.next === data.confirm, {
    message: 'New passwords do not match',
    path: ['confirm'],
  })
  .refine((data) => data.next !== data.current, {
    message: 'New password must be different from your current password',
    path: ['next'],
  });
