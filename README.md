# Kobo

A fast, private expense tracker. Type an expense the way you would say it (`bolt 2.5k yesterday`)
and see where your money went at the end of the month. Built for a small group of invited users,
in naira.

**Live app:** add your Vercel link here · **Status:** v0.1

<!-- Add two screenshots to docs/screenshots/ and uncomment:
![Home](docs/screenshots/home.png)
![Month summary](docs/screenshots/summary.png)
-->

## What it does

- **Quick add with live preview.** `coffee 1500`, `bolt 2.5k yesterday`, `+salary 500k`,
  `lunch ₦4,500 3/10`. Amount, category and date appear as chips you can correct before saving.
  Corrections teach the app: a fixed category becomes a saved rule.
- **Month at a glance.** Money in and out, change against last month, and a donut with a legend
  showing each category's share. Percentages always add up to exactly 100.
- **Entries by day** with daily totals, delete with an "are you sure?" step plus undo, and a month switcher.
- **A spreadsheet view.** See every entry as a table, search and filter it, sort any column, tick
  rows to add them up (shift-click for a range), and copy the table straight into Excel or Sheets.
- **Light and dark themes** that follow your device, with a one-tap override.
- **Playful comments.** When spending on choices like eating out jumps, Kobo teases you a little.
  Never about rent, groceries, health or family, and you can switch it off in Settings.
- **Smart shorthand.** `2h` is ₦200, `5k` is ₦5,000, and `add 5000`, `received 5k` or
  `salary 500k` are recognised as income.
- **Your data stays yours.** Download everything as CSV from Settings. No bank linking, no ads.
- **Accessible by design.** Keyboard shortcuts (`/` or `n` jumps to quick add), labelled controls,
  text alongside every colour, and all motion switches off for people who ask their device for less.

## How it is built

| Concern        | Choice                                        | Why                                                                 |
| -------------- | --------------------------------------------- | ------------------------------------------------------------------- |
| UI             | React, TypeScript (strict), Tailwind v4       | Typed components, design tokens in one place                        |
| Server state   | TanStack Query                                | Optimistic add and delete, cache per month                          |
| Backend        | Supabase (Auth, Postgres, Row Level Security) | Free, and security lives in the database                            |
| Validation     | Zod                                           | Environment variables and database rows are checked at the boundary |
| Tests          | Vitest and Testing Library                    | Logic and screens tested like a user would use them                 |
| CI and hosting | GitHub Actions, Vercel                        | Every change is linted, type-checked, tested and built              |

Decisions worth reading: [ADR-001](docs/adr/0001-supabase-direct-no-offline.md).

### Things done on purpose

- **Money is integer kobo.** No floating-point arithmetic touches an amount. Text is converted to
  kobo digit by digit, and the database refuses non-positive or absurd amounts.
- **Dates are plain `YYYY-MM-DD` text,** never timestamps, so a transaction can never shift a day
  because of a time zone. The date tests run in several time zones.
- **The parser is a pure function** with a table of tests and a 2,000-input stress test proving
  it never throws. Anything it does not understand stays in the note; nothing is dropped.
- **Optimistic updates with rollback.** Entries get their ID in the browser, so the instant row is
  the real row.
- **The database enforces privacy.** Row Level Security on every table, plus composite foreign
  keys so one user can never point at another user's category. `supabase/tests/rls_check.sql`
  proves it with two accounts (and was verified to fail when a policy is broken).
- **Secrets stay out.** Only the publishable key reaches the browser. The environment check
  refuses an admin key and never prints values. CSV export neutralises spreadsheet formulas.

## Run it locally

```bash
git clone <your-repo-url> && cd kobo
npm install
cp .env.example .env.local   # fill in your Supabase URL and publishable key
npm run dev
```

The URL must be the bare project address, like `https://abc.supabase.co`, with nothing after it.
Requires Node 22 (see `.nvmrc`).

| Command             | What it does                        |
| ------------------- | ----------------------------------- |
| `npm run dev`       | Start the dev server                |
| `npm test`          | Run all tests once                  |
| `npm run lint`      | Lint with oxlint                    |
| `npm run typecheck` | Type-check with TypeScript          |
| `npm run format`    | Format everything with Prettier     |
| `npm run build`     | Type-check and build for production |

## Database setup

1. Create a Supabase project. Under Authentication, Sign In / Providers, switch **Allow new users to
   sign up** on, switch **Confirm email** off (the built-in email sender only reaches your own team and
   is capped at about 2 emails an hour), and set the minimum password length to 10.
2. Run `supabase/migrations/*.sql` in order in the SQL editor.
3. People can now create their own accounts on the sign-up page. (You can still add users by hand in
   Authentication, Users, with Auto Confirm ticked.)
4. Verify security with `supabase/tests/rls_check.sql` (instructions inside the file).
5. Optional: add repository secrets `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` so the
   keep-alive workflow can stop the free project pausing.

## Project layout

```
src/app/              app shell, routes, providers
src/features/         auth, transactions (quick add, list, summary, data layer)
src/lib/              pure logic: money, dates, parser, csv, env
src/components/       shared UI pieces
supabase/migrations   database schema as versioned SQL
supabase/tests        security checks for Row Level Security
docs/                 status and decision records
```

## Workflow

Short-lived branches and pull requests with
[Conventional Commits](https://www.conventionalcommits.org/). CI must pass before merging to
`main`. Dependabot proposes dependency updates weekly.

## Not in v0.1

Editing entries, budgets, offline writes, bank connections, password reset by email, and a PWA install.

## Licence

MIT. See [LICENSE](LICENSE).
