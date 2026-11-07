import { useId, useState, type InputHTMLAttributes } from 'react'

type Props = { label: string; error?: string | undefined } & InputHTMLAttributes<HTMLInputElement>

/**
 * A labelled input. The label is linked to the input, and any error is announced with it.
 * Password fields get a Show/Hide button so people can check what they typed.
 */
export function TextField({ label, error, id, type, ...inputProps }: Props) {
  const autoId = useId()
  const inputId = id ?? autoId
  const errorId = `${inputId}-error`
  const isPassword = type === 'password'
  const [shown, setShown] = useState(false)

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-semibold">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={inputId}
          type={isPassword && shown ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`block h-12 w-full rounded-full border-2 border-ink bg-card px-5 ${isPassword ? 'pr-20' : ''}`}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            aria-pressed={shown}
            aria-label={`${shown ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
            onClick={() => setShown(!shown)}
            className="absolute inset-y-1 right-1 rounded-full px-4 text-sm font-semibold underline hover:bg-tint-blue"
          >
            {shown ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
