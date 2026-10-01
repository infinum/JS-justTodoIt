# Notes for Next.js

What the app must do is described in [Requirements.md](./Requirements.md). This file only covers how to get started on the Next.js track, some optional suggestions, and the concepts you'll be asked to explain in review.

## 1. Scaffold

From the repository root, next to `api/`:

```bash
pnpm create next-app just-todo-it --yes
```

`--yes` takes the defaults: TypeScript, ESLint, Tailwind, the App Router and the `@/*` import alias. Drop it if you want to choose for yourself.

Then, inside `just-todo-it/`:

- In `pnpm-workspace.yaml`, add `minimumReleaseAge: 10080` (7 days, the same as `api/`).
- Create `.env.local` with your API's URL, e.g. `NEXT_PUBLIC_API_ENDPOINT=http://localhost:8080/` (change the port if you changed `HTTP_PORT`). The name is up to you, but only variables prefixed with `NEXT_PUBLIC_` reach the browser.

This is a plain Next.js app with no auth library, test runner or pre-commit hook. Choosing and adding those is part of your first PR (see [README §5](./README.md#5-how-review-works-decisions-over-code) and [Requirements §6](./Requirements.md#6-code-quality-expectations)).

## 2. Suggested libraries (optional)

None of these are required. Use them, replace them or skip them, and record the choice and why in your PR.

- **Auth:** this API already owns the session through its HTTP-only cookie, so plain `fetch` calls plus redirect logic can be enough, and **no auth library** is a good default. Libraries like [Better Auth](https://www.better-auth.com/docs) are common in Next.js apps, but they expect to own the session themselves, so adopting one here means deciding how it fits around the API's cookie. Either way, you should be able to explain what your choice does for you and what it doesn't.
- **UI:** [Tailwind](https://tailwindcss.com/) (already in the default scaffold) and [shadcn/ui](https://ui.shadcn.com/) are what most of our React projects use.
- **Forms:** [React Hook Form](https://react-hook-form.com/), including [`useFieldArray`](https://react-hook-form.com/docs/usefieldarray) for dynamic item lists and [`FormProvider`/`useFormContext`](https://react-hook-form.com/docs/formprovider) for sharing a form across components.
- **Testing:** [Testing Library](https://testing-library.com/docs/react-testing-library/intro/) with your test runner of choice.

## 3. Suggested reading (optional)

- Infinum Handbook: [Getting started with React](https://infinum.com/handbook/frontend/react/getting-started/ecosystem), [React guidelines and practices](https://infinum.com/handbook/books/frontend/react/react-guidelines-and-best-practices), [Project structure](https://infinum.com/handbook/frontend/react/project-structure#app-router), [Testing best practices](https://infinum.com/handbook/frontend/react/testing/best-practices)
- Next.js: [Getting started](https://nextjs.org/docs/app/getting-started), [Fetching data](https://nextjs.org/docs/app/getting-started/fetching-data), [Mutating data (Server Functions)](https://nextjs.org/docs/app/getting-started/mutating-data), [Caching](https://nextjs.org/docs/app/getting-started/caching), [Testing](https://nextjs.org/docs/app/guides/testing)
- React: [react.dev](https://react.dev/)
- [Compound components](https://kentcdodds.com/blog/compound-components-with-react-hooks), one way of sharing a form between create and edit

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
