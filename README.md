# Kobo

A fast, private expense tracker. Type an expense the way you would say it ("bolt 2.5k yesterday"),
and see where your money went at the end of the month. Built for a small group of invited users,
in naira.

**Status:** v0.1 in development. See [docs/STATUS.md](docs/STATUS.md).

## Stack

Vite, React, TypeScript (strict), Tailwind CSS, React Router, TanStack Query, Supabase (Auth,
Postgres, Row Level Security), Zod, Vitest and Testing Library, GitHub Actions, Vercel.

## Run it locally

```bash
git clone <your-repo-url> && cd kobo
npm install
cp .env.example .env.local   # then fill in your Supabase URL and publishable key
npm run dev
```

Requires Node 22 (see `.nvmrc`).

## Scripts

| Command             | What it does                        |
| ------------------- | ----------------------------------- |
| `npm run dev`       | Start the dev server                |
| `npm test`          | Run all tests once                  |
| `npm run lint`      | Lint with oxlint                    |
| `npm run typecheck` | Type-check with TypeScript          |
| `npm run format`    | Format everything with Prettier     |
| `npm run build`     | Type-check and build for production |

## Project layout

```
src/app/            app shell, routes, providers
src/features/       one folder per feature (quick-add, transactions, month wrap, ...)
src/lib/            pure logic and clients (env, supabase, money, parser)
supabase/migrations database schema as versioned SQL
supabase/tests      manual security checks for Row Level Security
docs/               status, decision records (ADRs)
```

## Security notes

- Row Level Security is enabled on every table; users can only read and write their own rows.
- Only the Supabase **publishable** key is used in the browser. Admin keys never enter this repo.
- `.env.local` is gitignored. If a secret is ever committed, rotate it immediately.
- Public signup is disabled; accounts are created by the owner.

## Contributing workflow

Work happens on short-lived branches and pull requests, with
[Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `test:`, `docs:`,
`chore:`). CI must pass before merging to `main`.

## Licence

MIT. See [LICENSE](LICENSE).
