import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' }

const styles = {
  primary: 'bg-brand text-white',
  secondary: 'border border-ink/30 bg-card text-ink',
}

// type defaults to "button" so a button inside a form never submits by accident.
export function Button({ variant = 'primary', type = 'button', className = '', ...rest }: Props) {
  return (
    <button
      type={type}
      className={`rounded-md px-4 py-2 font-medium disabled:opacity-60 ${styles[variant]} ${className}`}
      {...rest}
    />
  )
}
