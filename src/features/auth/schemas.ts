import { z } from 'zod'

/** The one password rule for the whole app (sign-up and change-password). */
export const passwordSchema = z.string().min(10, 'Use at least 10 characters.')

export const changePasswordSchema = z
  .object({
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((values) => values.password === values.confirm, {
    message: 'The two passwords do not match.',
    path: ['confirm'], // attach the error to the confirm field
  })
