import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email inválido').transform((v) => v.toLowerCase().trim()),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export const validationSchema = z.object({
  code: z
    .string()
    .regex(/^\d{6}$/, 'El código debe tener exactamente 6 dígitos'),
});

export const loginSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const personalDataSchema = z.object({
  name: z.string().min(1).trim(),
  lastName: z.string().min(1).trim(),
  nif: z.string().min(1).trim(),
});

const addressSchema = z.object({
  street: z.string().optional(),
  number: z.string().optional(),
  postal: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
});

export const companySchema = z.discriminatedUnion('isFreelance', [
  z.object({
    isFreelance: z.literal(true),
  }),
  z.object({
    isFreelance: z.literal(false),
    name: z.string().min(1).trim(),
    cif: z.string().min(1).trim(),
    address: addressSchema.optional(),
  }),
]);

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
    newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'La nueva contraseña debe ser diferente a la actual',
    path: ['newPassword'],
  });

export const inviteSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  password: z.string().min(8),
  name: z.string().min(1).trim().optional(),
  lastName: z.string().min(1).trim().optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'El refresh token es requerido'),
});
