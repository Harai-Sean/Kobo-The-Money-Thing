import { useId, type InputHTMLAttributes } from 'react'

type Props = { label: string; error?: string | undefined } & InputHTMLAttributes<HTMLInputElement>

/** A labelled input. The label is linked to the input, and any error is announced with it. */
export function TextField({ label, error, id, ...inputProps }: Props) {
  const autoId = useId()
  const inputId = id ?? autoId
  const errorId = `${inputId}-error`
  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="mt-1 block w-full rounded-md border border-ink/30 bg-card px-3 py-2"
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
