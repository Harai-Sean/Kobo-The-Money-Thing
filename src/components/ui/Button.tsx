import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary'
  size?: 'md' | 'icon'
}

const variants = {
  primary: 'border-ink bg-brand text-white hover:bg-ink',
  secondary: 'border-ink bg-card text-ink hover:bg-sun',
}
const sizes = { md: 'px-5 py-3', icon: 'size-12 text-xl' }

// type defaults to "button" so a button inside a form never submits by accident.
// A disabled button is plainly grey, so it never looks like a faded "live" one.
export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={`rounded-full border-2 font-display font-bold transition active:scale-[0.97] disabled:border-ink/20 disabled:bg-ink/10 disabled:text-muted disabled:active:scale-100 ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    />
  )
}
