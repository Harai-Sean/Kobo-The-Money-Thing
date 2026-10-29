import { z } from 'zod'

/**
 * True if a Supabase key would grant admin powers. Such a key must NEVER reach the browser.
 * New-style secret keys start with "sb_secret_"; legacy keys are JWTs whose payload has
 * role "service_role".
 */
function isPrivilegedKey(key: string): boolean {
  if (key.startsWith('sb_secret_')) return true
  if (!key.startsWith('eyJ')) return false
  try {
    const payload = key.split('.')[1] ?? ''
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return (JSON.parse(json) as { role?: string }).role === 'service_role'
  } catch {
    return false
  }
}

const envSchema = z.object({
  VITE_SUPABASE_URL: z.url(),
  VITE_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(20)
    .refine((key) => !isPrivilegedKey(key), 'This is an admin key. Use the publishable key.'),
})

export type Env = z.infer<typeof envSchema>

/**
 * Validates environment variables and fails loudly at startup if any is missing or wrong.
 * Error messages name the variable but never print its value, so secrets cannot leak into logs.
 */
export function parseEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw)
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n')
    throw new Error(`Invalid environment variables:\n${problems}`)
  }
  return result.data
}
