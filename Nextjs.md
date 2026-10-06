# Notes for Next.js

What the app must do is described in [Requirements.md](./Requirements.md). This file only covers how to get started on the Next.js track, some optional suggestions, and the concepts you'll be asked to explain in review.

## 1. Scaffold

From the repository root, next to `api/`:

```bash
pnpm --config.minimum-release-age=10080 create next-app@^16 just-todo-it --skip-install \
  -e https://github.com/infinum/JS-React-Example/tree/onboarding-starter-v3
```

This copies our Next.js starter into `just-todo-it/`. `--config.minimum-release-age=10080` applies the same 7-day rule as `api/` to the scaffolding tool itself, so it picks a release that's at least a week old. `--skip-install` holds off installing until you're inside the app, where the starter's own `pnpm-workspace.yaml` applies that rule to the app's dependencies too.

Then install inside the app:

```bash
cd just-todo-it
mise trust  # the starter has its own mise.toml, which `mise trust --all` didn't cover
pnpm install
cp .env.example .env.local
```

`.env.local` holds your API's URL as `NEXT_PUBLIC_API_ENDPOINT` (change the port if you changed `HTTP_PORT`). Only variables prefixed with `NEXT_PUBLIC_` reach the browser.

The starter comes with:

- Next.js 16 with the App Router and TypeScript
- Tailwind and a few [shadcn/ui](https://ui.shadcn.com/) components in `src/components/ui`, plus the company fonts
- ESLint, Prettier and `pnpm typecheck`
- Jest with Testing Library and jest-axe
- a pre-commit hook (husky and lint-staged) that lints and formats staged files

It doesn't include an auth library or a data-fetching layer. Choosing those is up to you. Check the starter against [Requirements §6](./Requirements.md#6-code-quality-expectations) as part of your first PR (see [README §5](./README.md#5-how-review-works-decisions-over-code)). For example, the hook doesn't type-check yet.

## 2. Suggested libraries (optional)

None of these are required. Use them, replace them or skip them, and record the choice and why in your PR.

- **Auth:** this API already owns the session through its HTTP-only cookie, so plain `fetch` calls plus redirect logic can be enough, and **no auth library** is a good default. Libraries like [Better Auth](https://www.better-auth.com/docs) are common in Next.js apps, but they expect to own the session themselves, so adopting one here means deciding how it fits around the API's cookie. Either way, you should be able to explain what your choice does for you and what it doesn't.
- **UI:** the starter uses [Tailwind](https://tailwindcss.com/) and [shadcn/ui](https://ui.shadcn.com/), like most of our React projects. Add more components with `pnpm exec shadcn add <component>` (shadcn is already a dev dependency).
- **Forms:** [React Hook Form](https://react-hook-form.com/), including [`useFieldArray`](https://react-hook-form.com/docs/usefieldarray) for dynamic item lists and [`FormProvider`/`useFormContext`](https://react-hook-form.com/docs/formprovider) for sharing a form across components.
- **Testing:** the starter sets up Jest with [Testing Library](https://testing-library.com/docs/react-testing-library/intro/). Add end-to-end tests if you want them.

## 3. Suggested reading (optional)

- Infinum Handbook: [Getting started with React](https://infinum.com/handbook/frontend/react/getting-started/ecosystem), [React guidelines and practices](https://infinum.com/handbook/books/frontend/react/react-guidelines-and-best-practices), [Testing best practices](https://infinum.com/handbook/frontend/react/testing/best-practices)
- Next.js: [Getting started](https://nextjs.org/docs/app/getting-started), [Fetching data](https://nextjs.org/docs/app/getting-started/fetching-data), [Mutating data (Server Functions)](https://nextjs.org/docs/app/getting-started/mutating-data), [Caching](https://nextjs.org/docs/app/getting-started/caching), [Testing](https://nextjs.org/docs/app/guides/testing)
- React: [react.dev](https://react.dev/)

## 4. Concepts you'll be asked to explain

In review, expect to walk through these using your own code:

- **Server vs client data fetching.** Which data you fetch in Server Components, which on the client, and why. What happens to the API's session cookie when the request is made from the Next.js server instead of the browser.
- **Server Actions and mutations.** Whether you used them for create/edit/delete, and how the table and details page get fresh data afterwards (revalidation, refetching, cache invalidation).
- **Caching.** What Next.js caches by default for your requests and routes, and how that interacts with per-user data.
- **How the user is loaded on first render.** Where `GET /auth/user` is called on a full page reload, and how you avoid flashing the logged-out UI.
- **Where redirects happen.** Middleware/proxy, layouts, pages or the client, and what each option costs.
- **URL as state.** How the table's page, sort and filter live in search params, and how navigation and the back button restore them.
- **Debouncing and race conditions.** How filtering avoids request spam, and how a stale response is prevented from winning.
- **Replace-all updates.** How your edit form turns the user's changes into the full item list the API expects.
- **Reading response headers.** Where the total count from `X-TOTAL-COUNT` enters your data flow.
- **Form reuse.** How create and edit (and activation and reset password) share fields and validation without duplicating them.
- **Client/server boundaries.** Where `'use client'` sits in your tree and why it's there and not higher.
