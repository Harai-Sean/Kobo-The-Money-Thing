/** Saves text as a file on the person's device. Nothing is uploaded anywhere. */
export function downloadTextFile(
  filename: string,
  text: string,
  type = 'text/csv;charset=utf-8',
): void {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
