## What and why

<!-- One or two sentences. What changed, and why it was needed. -->

Closes #

## How I checked it

- [ ] `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` pass locally
- [ ] I tried it in the browser (phone width too, if it is UI)
- [ ] Money and dates use the shared utilities (no floats, no `new Date("YYYY-MM-DD")`)

## Safety

- [ ] No secrets, keys or real data in this diff
- [ ] New tables have Row Level Security, and policies check `user_id`
