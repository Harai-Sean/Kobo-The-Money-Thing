import { z } from 'zod'

export const changePasswordSchema = z
  .object({
    password: z.string().min(10, 'Use at least 10 characters.'),
    confirm: z.string(),
  })
  .refine((values) => values.password === values.confirm, {
    message: 'The two passwords do not match.',
    path: ['confirm'], // attach the error to the confirm field
  })
