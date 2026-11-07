// A category keeps the same colour everywhere (list dots, donut, legend) and in every month,
// because the colour comes from its position in the user's category list, not from this month's
// ranking. The list is sorted the same way every time (see api.ts), so positions never shuffle.
export const PALETTE = [
  '#FFC933',
  '#2D4BFF',
  '#8B5CF6',
  '#1AA364',
  '#FF7A45',
  '#38BDF8',
  '#E0559A',
  '#14B8A6',
] as const
export const UNCATEGORISED_COLOR = '#8A948E'

export function categoryColor(categories: readonly { id: string }[], id: string | null): string {
  const index = categories.findIndex((c) => c.id === id)
  return index === -1
    ? UNCATEGORISED_COLOR
    : (PALETTE[index % PALETTE.length] ?? UNCATEGORISED_COLOR)
}
