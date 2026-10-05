# Notes for Angular

What the app must do is described in [Requirements.md](./Requirements.md). This file only covers how to get started on the Angular track, some optional suggestions, and the concepts you'll be asked to explain in review.

Reference screenshots for this track are in [`.assets/app/angular/`](./.assets/app/angular/), together with a [demo video](./.assets/app/angular/demo.mp4). They come from an older version of the app and are reference, not spec. Where they differ from Requirements.md (e.g. the `/todo-lists` route, a page size of 10, forgot-password as a modal), Requirements.md wins.

## 1. Scaffold

From the repository root, next to `api/`:

```bash
pnpm --config.minimum-release-age=10080 dlx @angular/cli@^22 new just-todo-it --style=scss --ssr=false --prefix=xyz --ai-config=none --package-manager=pnpm --skip-git --skip-install
```

Replace `xyz` with a component prefix you like. The other flags answer the questions `ng new` would otherwise ask:

- `--config.minimum-release-age=10080`: applies the same 7-day rule as `api/` to the CLI itself, so it picks a release that's at least a week old. Without it, an Angular release from the last few days would make the install below fail, because the new project pins Angular to the CLI's version.
- `--style=scss`: SCSS (see the suggestions below). Pick CSS or Tailwind instead if you prefer.
- `--ssr=false`: the requirements don't need server-side rendering, and leaving it out keeps the auth flow in the browser. Turning it on is a valid decision, but then you have to handle the session cookie on the server too.
- `--ai-config=none`: your AI setup comes from [README §2.1](./README.md#21-set-up-your-ai-workflow), so don't let Angular generate a separate one.
- `--skip-git`: you're already inside a git repository, so `just-todo-it/` isn't the git root. Keep that in mind when you set up the pre-commit hook, and check that a commit with a lint error is actually rejected.
- `--skip-install`: you'll install after the next step.

Then install inside the app:

```bash
cd just-todo-it
echo 'minimumReleaseAge: 10080 # 7 days, the same as api/' > pnpm-workspace.yaml
pnpm install
```

The install stops with `ERR_PNPM_IGNORED_BUILDS`, because pnpm 11 doesn't run a dependency's build script (here `esbuild`, `lmdb`, `@parcel/watcher` and `msgpackr-extract`) until you approve it. pnpm has already added them to `pnpm-workspace.yaml` under `allowBuilds:` with the placeholder `set this to true or false`. Set each one to `true` (or run `pnpm approve-builds`, which is interactive), then run `pnpm install` again.

There's no global `ng`: inside the app, run the CLI as `pnpm ng …` (e.g. `pnpm ng serve`).

A new project has no environment files, so pick how the app learns the API's URL: `pnpm ng generate environments`, or a [dev-server proxy](https://angular.dev/tools/cli/serve#proxying-to-a-backend-server) (which also avoids CORS). Either way, remember the API's `FRONTEND_URL` must be `http://localhost:4200` (README §4).

## 2. Suggestions (optional)

None of these are required. Use them, replace them or skip them, and record the choice and why in your PR.

- **UI:** [Angular Material](https://material.angular.dev/guide/getting-started), with whichever theme you prefer.
- **Styles:** SCSS, with shared partials in e.g. `src/app/styles` and [style preprocessor options](https://angular.dev/reference/configs/workspace-config#style-preprocessor-options) to keep import paths short.
- **Tokens:** [jwt-decode](https://github.com/auth0/jwt-decode) if you want to read data (e.g. the email) from the activation or reset token.
- **Linting:** Infinum's [ESLint config](https://github.com/infinum/js-linters). See the [code quality tools](https://infinum.com/handbook/frontend/code-quality/tools) handbook chapter.

## 3. Suggested reading (optional)

- Infinum Handbook: [Angular Handbook](https://infinum.com/handbook/books/frontend/angular/introduction), [File and module organization and naming](https://infinum.com/handbook/books/frontend/angular/angular-guidelines-and-best-practices/file-and-module-organization-and-naming), [Formatting, naming and best practices](https://infinum.com/handbook/books/frontend/angular/angular-guidelines-and-best-practices/formatting-naming-and-best-practices)
- Angular: [official tutorials](https://angular.dev/tutorials)
- [Nested routes](https://angular.dev/guide/routing/define-routes#nested-routes) for sharing a layout between pages

## 4. Concepts you'll be asked to explain

In review, expect to walk through these using your own code:

- **OnPush change detection** (the default for new components since Angular 22). What triggers a re-render under OnPush, and how your components get new data without manual subscriptions (e.g. the async pipe or signals).
- **The [single observable pattern](https://infinum.com/handbook/books/frontend/angular/angular-guidelines-and-best-practices/formatting-naming-and-best-practices#the-single-observable-pattern).** How you avoid nested `ng-container` / async pipe chains in templates.
- **App initialisation.** How the current user is fetched from `GET /auth/user` before the first route renders (e.g. an app initializer), and how the auth state is then shared.
- **Guards and redirects.** How logged-in and logged-out redirects are enforced, including on a full page reload.
- **Multiple layouts without conditionals.** The activation and reset pages in the reference screenshots use a different layout (no header, centred content). How you get that from routing rather than `if`s or style overrides.
- **Lazy loading.** Which routes are lazy-loaded and what that buys you.
- **HTTP handling.** How the session cookie is sent with every request, and where `401` responses are handled once for the whole app.
- **Debouncing and race conditions.** Which RxJS operators keep filtering from spamming the API and keep a stale response from winning, and why those operators.
- **URL as state.** How the table's page, sort and filter live in query params and are restored on reload and back navigation.
- **Replace-all updates.** How your edit form turns the user's changes into the full item list the API expects.
- **Reading response headers.** How the total count from `X-TOTAL-COUNT` reaches the pagination.
- **Form reuse.** How create and edit (and activation and reset password) share form structure without duplication.
