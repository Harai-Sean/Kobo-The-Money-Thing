// Adds matchers like expect(el).toBeInTheDocument() to Vitest.
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Testing Library only cleans up automatically when Vitest "globals" are on. We keep globals
// off (explicit imports), so we unmount rendered pages after every test ourselves.
afterEach(() => cleanup())
