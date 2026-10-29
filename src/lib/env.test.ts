import { describe, expect, it } from 'vitest'
import { parseEnv } from './env'

const goodKey = 'sb_publishable_abcdefghijklmnopqrstuvwxyz'
const good = {
  VITE_SUPABASE_URL: 'https://abc.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: goodKey,
}

// Builds a fake legacy JWT whose payload carries the given role.
function fakeJwt(role: string) {
  const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '')
  return `${b64({ alg: 'HS256' })}.${b64({ role })}.signature-placeholder`
}

describe('parseEnv', () => {
  it('accepts valid values', () => {
    expect(parseEnv(good).VITE_SUPABASE_URL).toBe('https://abc.supabase.co')
  })

  it('rejects a missing URL', () => {
    expect(() => parseEnv({ VITE_SUPABASE_PUBLISHABLE_KEY: goodKey })).toThrow(/VITE_SUPABASE_URL/)
  })

  it('rejects a URL that is not a URL', () => {
    expect(() => parseEnv({ ...good, VITE_SUPABASE_URL: 'not a url' })).toThrow()
  })

  it('rejects a new-style secret key', () => {
    const bad = { ...good, VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_abcdefghijklmnopqrstuvwxyz' }
    expect(() => parseEnv(bad)).toThrow(/admin key/)
  })

  it('rejects a legacy service_role JWT but accepts an anon JWT', () => {
    const service = { ...good, VITE_SUPABASE_PUBLISHABLE_KEY: fakeJwt('service_role') }
    expect(() => parseEnv(service)).toThrow(/admin key/)
    const anon = { ...good, VITE_SUPABASE_PUBLISHABLE_KEY: fakeJwt('anon') }
    expect(() => parseEnv(anon)).not.toThrow()
  })

  it('never prints the secret value in its error message', () => {
    const secret = 'sb_secret_abcdefghijklmnopqrstuvwxyz'
    try {
      parseEnv({ ...good, VITE_SUPABASE_PUBLISHABLE_KEY: secret })
    } catch (error) {
      expect(String(error)).not.toContain(secret)
    }
  })
})
