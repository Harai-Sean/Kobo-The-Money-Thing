import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { Providers } from './app/providers'
import { parseEnv } from './lib/env'
import { createSupabaseClient } from './lib/supabase/client'
import './index.css'

const root = createRoot(document.getElementById('root')!)

try {
  // Fails fast with a clear error if the environment variables are missing or wrong.
  const supabase = createSupabaseClient(parseEnv(import.meta.env))
  root.render(
    <StrictMode>
      <Providers auth={supabase.auth}>
        <App />
      </Providers>
    </StrictMode>,
  )
} catch (error) {
  // The message names the broken variable but never its value, so logging it is safe.
  console.error(error)
  root.render(
    <main
      style={{ maxWidth: 480, margin: '4rem auto', padding: '0 1.5rem', fontFamily: 'sans-serif' }}
    >
      <h1>Kobo cannot start</h1>
      <p>The app is not configured correctly. Check the environment variables and try again.</p>
    </main>,
  )
}
