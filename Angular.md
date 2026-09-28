# Notes for Angular

What the app must do is described in [Requirements.md](./Requirements.md). This file only covers how to get started on the Angular track, some optional suggestions, and the concepts you'll be asked to explain in review.

Reference screenshots for this track are in [`.assets/app/angular/`](./.assets/app/angular/), together with a [demo video](./.assets/app/angular/demo.mp4). Like the Next.js set, they're reference, not spec.

## 1. Scaffold

From the repository root, next to `api/`:

```bash
ng new just-todo-it
```

Pick a component prefix you like.

## 2. Suggestions (optional)

None of these are required. Use them, replace them or skip them, and record the choice and why in your PR.

- **OnPush change detection** as the default for generated components. Run this right after generating the project:
  ```bash
  ng config schematics.@schematics/angular.component.changeDetection OnPush
  ```
- **UI:** [Angular Material](https://material.angular.dev/guide/getting-started), with whichever theme you prefer.
- **Styles:** SCSS, with shared partials in e.g. `src/app/styles` and [style preprocessor options](https://angular.dev/reference/configs/workspace-config#style-preprocessor-options) to keep import paths short.
- **Tokens:** [jwt-decode](https://github.com/auth0/jwt-decode) if you want to read data (e.g. the email) from the activation or reset token.
- **Linting:** Infinum's [ESLint config](https://github.com/infinum/js-linters). See the [code quality tools](https://infinum.com/handbook/frontend/code-quality/tools) handbook chapter.

## 3. Suggested reading (optional)

- Infinum Handbook: [Angular Handbook](https://infinum.com/handbook/books/frontend/angular/introduction), [File and module organization and naming](https://infinum.com/handbook/books/frontend/angular/angular-guidelines-and-best-practices/file-and-module-organization-and-naming), [Formatting, naming and best practices](https://infinum.com/handbook/books/frontend/angular/angular-guidelines-and-best-practices/formatting-naming-and-best-practices)
- Angular: [official tutorials](https://angular.dev/tutorials)
- [Reusing common layouts using the router](https://indepth.dev/posts/1235/how-to-reuse-common-layouts-in-angular-using-router-2)

## 4. Concepts you'll be asked to explain

In review, expect to walk through these using your own code:

- **OnPush change detection.** What triggers a re-render under OnPush, and how your components get new data without manual subscriptions (e.g. the async pipe or signals).
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
