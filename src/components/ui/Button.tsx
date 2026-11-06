import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' }

const styles = {
  primary: 'bg-brand text-white hover:bg-deep',
  secondary: 'border-2 border-ink/80 bg-card text-ink hover:bg-ink hover:text-white',
}

// type defaults to "button" so a button inside a form never submits by accident.
export function Button({ variant = 'primary', type = 'button', className = '', ...rest }: Props) {
  return (
    <button
      type={type}
      className={`rounded-sm px-4 py-2 font-semibold transition active:scale-[0.97] disabled:opacity-50 ${styles[variant]} ${className}`}
      {...rest}
    />
  )
}
