import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { ThemeToggle } from './ThemeToggle'

afterEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})

describe('ThemeToggle', () => {
  it('cycles Auto, Light, Dark, Auto and remembers the choice', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)
    const root = document.documentElement

    await user.click(screen.getByRole('button', { name: 'Theme: Auto. Switch to Light.' }))
    expect(root).toHaveAttribute('data-theme', 'light')
    expect(localStorage.getItem('kobo-theme')).toBe('light')

    await user.click(screen.getByRole('button', { name: 'Theme: Light. Switch to Dark.' }))
    expect(root).toHaveAttribute('data-theme', 'dark')

    await user.click(screen.getByRole('button', { name: 'Theme: Dark. Switch to Auto.' }))
    expect(root).not.toHaveAttribute('data-theme') // back to following the device
    expect(localStorage.getItem('kobo-theme')).toBeNull()
  })

  it('starts from the saved choice', () => {
    localStorage.setItem('kobo-theme', 'dark')
    render(<ThemeToggle />)
    expect(screen.getByRole('button', { name: 'Theme: Dark. Switch to Auto.' })).toBeInTheDocument()
  })
})
