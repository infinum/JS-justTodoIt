# Just Todo It

Welcome to Just Todo It!

This onboarding project will help you build fundamental knowledge of various parts of the framework that you will be working with.

## 0. Prerequisites

- Node.js 24.18.1
- pnpm 11.18.0

Both of these can be install using Mise. You can read more about Mise [here](https://mise.sh/) in the docs, or [here](https://infinum.com/handbook/frontend/node/security/securing-your-development-tools) in the Infinum's Node security guide.

## 1. What you will build

You will be developing a simple to-do list application. Requirements are simple but ensure that you make good use of various framework features, including areas which are not covered very often in various online tutorials.

Just Todo It is a practical application of knowledge, without too much hand-holding. There is a big focus on authentication handling because that is a part of almost every application but is rarely covered in various framework tutorial/courses, so it is good to learn some best practices early-on.

The requirements describe **what** the app must do, not how. You'll almost certainly build it with an AI agent, and that's expected. The interesting part is the decisions you make along the way, and that's what review focuses on (see [How review works](#6-how-review-works-decisions-over-code)).

This repository is a GitHub template. Your mentor creates a new repository from it for you, and you open your PRs there.

## 2. Project structure

This repository contains some README files and `api/` directory. The frontend app you will be developing should be placed in a sibling directory, next to `/api` directory. To get started:

- React
  ```bash
  pnpm create next-app just-todo-it -e https://github.com/infinum/JS-React-Example/tree/onboarding-starter-v2
  ```
- Angular
  ```bash
  ng new just-todo-it
  ```

Your final structure might look something like this:

```
├── api
│   ├── package.json
│   └── ...
├── just-todo-it
│   ├── package.json
│   └── ...
├── ...
└── README.md
```

As for the frontend application file and folder organization, please refer to:

- React - [Project structure](https://infinum.com/handbook/frontend/react/project-structure) Handbook chapter
- Angular - [File and module organization and naming](https://infinum.com/handbook/books/frontend/angular/angular-guidelines-and-best-practices/file-and-module-organization-and-naming) Handbook chapter

## 3. Application requirements & notes

The app's requirements are the same for both frameworks: [Requirements.md](./Requirements.md).

Framework-specific notes (scaffolding, optional suggestions and reading, and the concepts you'll be asked to explain in review):

- [Next.js](./Nextjs.md)
- [Angular](./Angular.md)

## 4. API

To start the API server:

```bash
cd api
cp .env.example .env
pnpm install
pnpm start
```

The server starts on `localhost:8080`. You can browse the endpoints and their schemas in Swagger at [localhost:8080/swagger](http://localhost:8080/swagger).

`api/.env` configures the API (all variables are listed in [`api/README.md`](./api/README.md#environment-variables)). Two matter for local development:

- `FRONTEND_URL` (default in `.env.example`: `http://localhost:3000`) is the only browser origin the API accepts requests from, and the base of the links in activation and password reset emails. If your app runs somewhere else (e.g. Angular's `http://localhost:4200`), change it and restart the API.
- `RESEND_API_KEY` is left unset, so every email the API would send is printed to the terminal where the API is running instead.

The API uses SQLite. To clear the database and start from the beginning, stop the server, delete `api/database.sqlite` and start it again. **If you have a `database.sqlite` from an older version of this repository, delete it before starting the API**: the schema changed (Todo list titles became unique per user, not globally), and an old file may make the API fail.

### 4.1. Requests, responses and errors

- Send and accept JSON (`Content-Type: application/json`, `Accept: application/json`).
- The session lives in a cookie, so every request must be sent with credentials (e.g. `credentials: 'include'` for `fetch`, `withCredentials` for Angular's `HttpClient` or axios). Never set an `Authorization` header.
- Responses never include password hashes or activation and reset tokens.
- Every error response has the same body:

  ```json
  {
    "code": "todo_list_with_same_title_exists",
    "message": "Resource already exists",
    "requestId": "8f1c…"
  }
  ```

  `code` is stable and meant for your code to branch on. `message` is for humans and may change. `details` is only present on validation errors and lists the failed fields. Error bodies never contain SQL or table and column names.

Status codes you'll meet:

| Status | When                                                                                              | Example `code`s                                                                                                                    |
| ------ | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `200`  | Success with a body (including `POST` that creates something)                                     |                                                                                                                                    |
| `204`  | Success without a body: logout, request password reset, resend activation, delete a list          |                                                                                                                                    |
| `400`  | Invalid body or query params, invalid reset token, item from another list                         | `validation_error`, `invalid_relation`, `password_reset_token_expired_or_invalid`, `todo_item_not_in_list`, `user_does_not_exists` |
| `401`  | Any authentication failure: no cookie, invalid, expired or revoked token, wrong email or password | `token_missing`, `token_invalid`, `incorrect_email_or_password`                                                                    |
| `403`  | Invalid or expired activation token                                                               | `activation_token_expired_or_invalid`                                                                                              |
| `404`  | Unknown Todo list, or one that belongs to another user                                            | `not_found`                                                                                                                        |
| `409`  | Email already registered, or you already have a Todo list with that title                         | `user_with_same_email_exists`, `todo_list_with_same_title_exists`                                                                  |
| `412`  | Correct email and password, but the account isn't activated yet                                   | `user_not_activated`                                                                                                               |
| `422`  | Resend activation email for an account that is already active                                     | `user_already_activated`                                                                                                           |

### 4.2. Authentication

| Method | Route                           | Body                   | Success                           |
| ------ | ------------------------------- | ---------------------- | --------------------------------- |
| `POST` | `/auth/register`                | `{ email, password? }` | `200` user                        |
| `POST` | `/auth/resend-activation-email` | `{ email }`            | `204`                             |
| `POST` | `/auth/activate`                | `{ token, password }`  | `200` user                        |
| `POST` | `/auth/login`                   | `{ email, password }`  | `200` user + session cookie       |
| `POST` | `/auth/logout`                  | —                      | `204` + cookie cleared            |
| `GET`  | `/auth/user`                    | —                      | `200` the logged-in user          |
| `POST` | `/auth/request-password-reset`  | `{ email }`            | `204` (also for an unknown email) |
| `POST` | `/auth/reset-password`          | `{ token, password }`  | `200` user                        |

#### Registration and activation

If you register with only an email, the API sends an activation email (printed to the API's terminal). It contains a link to **your frontend app** with the activation token in the query string:

```
http://localhost:3000/activate-account?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiNDhmNzFjZDAtZWJkNC00NDA2LWI5ZDQtMzdmNmVlMmUwMDVkIiwiZW1haWwiOiJqb2huLnNtaXRoQGV4YW1wbGUuY29tIiwiaWF0IjoxNTk0NjQ2NzQwLCJleHAiOjE1OTQ5MDU5NDB9.X0QXlQU3rK8dMCIYFGCHPLWbex_LWh8FfpIJmdOya4Q
```

So your app needs an `/activate-account` page. It reads `token` from the URL, lets the user choose a password and sends both to `POST /auth/activate`. The token is a JWT that expires after 3 days. You can decode it (no secret needed) to read the email and check the expiry before asking for a password:

![Decoded JWT activation token](./.assets/other/activation-token.png)

If you register with an email **and** a password, the account is active straight away and no email is sent. Registering doesn't log you in: call `POST /auth/login` afterwards either way.

#### Password reset

`POST /auth/request-password-reset` emails a link to `{FRONTEND_URL}/reset-password?token=…` (valid for 24 hours). It responds `204` whether or not the email exists, so it can't be used to discover accounts. Your `/reset-password` page sends the token and the new password to `POST /auth/reset-password`.

#### Session cookie

A successful login sets a `token` cookie. You can't read or modify it from JS, and you don't need to: the browser sends it with every request made with credentials.

| Flag       | Value                                                                                                                   |
| ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| `HttpOnly` | Always (unless `COOKIE_HTTP_ONLY=false`)                                                                                |
| `Secure`   | Not set locally (`COOKIE_SECURE=false` in `.env.example`, so it works over plain `http://localhost`); set in production |
| `SameSite` | `Lax`                                                                                                                   |
| `Path`     | `/`                                                                                                                     |
| `Max-Age`  | 10 days                                                                                                                 |

While the session is in use, the API extends it: on an authenticated request made more than an hour after the token was issued, the response sets a fresh `token` cookie with the same flags. `POST /auth/logout` is the only way to clear the cookie, since JS can't touch it. A `401` from any endpoint other than login means the session is gone and the user is logged out.

### 4.3. Todo lists

Every route requires a session and only ever sees the logged-in user's lists.

| Method   | Route               | Body                 | Success              |
| -------- | ------------------- | -------------------- | -------------------- |
| `GET`    | `/todo-lists`       | —                    | `200` array of lists |
| `GET`    | `/todo-lists/:uuid` | —                    | `200` list           |
| `POST`   | `/todo-lists`       | `{ title, todos? }`  | `200` created list   |
| `PATCH`  | `/todo-lists/:uuid` | `{ title?, todos? }` | `200` updated list   |
| `DELETE` | `/todo-lists/:uuid` | —                    | `204`                |

A list is `{ uuid, title, created, todos? }` and an item is `{ uuid, title, done }`. Items created with `POST /todo-lists` always start as not done (`{ title }` is all you send per item).

Titles have to be unique per user: two users can both have a "Groceries" list, but the same user can't have two, whether creating or renaming (`409 todo_list_with_same_title_exists`). Item titles have to be unique within their list.

#### Query parameters for `GET /todo-lists`

| Param           | Values                                           | Default   |
| --------------- | ------------------------------------------------ | --------- |
| `pageNumber`    | `1`, `2`, … (1-indexed)                          | `1`       |
| `pageSize`      | number of lists per page                         | `5`       |
| `sortBy`        | `created`, `title`                               | `created` |
| `sortDirection` | `ASC`, `DESC` (uppercase only, `asc` is a `400`) | `DESC`    |
| `title`         | text; returns lists whose title contains it      | —         |
| `relations`     | `todos`                                          | none      |

`relations=todos` (also accepted by `GET /todo-lists/:uuid`) includes each list's items. Without it, lists come back without `todos`.

The response body is a plain array of the requested page. The total number of lists matching the filter is only in the `X-TOTAL-COUNT` response header (readable cross-origin). For example, with 12 lists and the defaults, the first page has 5 lists and `X-TOTAL-COUNT: 12`, so there are 3 pages.

#### Updating a list with `PATCH`

- Send only what you want to change. To rename a list, send `{ "title": "New title" }` and omit `todos`. The items stay as they are.
- If you send `todos`, it **replaces the whole item list**:
  - an item with a `uuid` updates that existing item,
  - an item without a `uuid` is created,
  - any existing item you leave out is deleted.
- Each item is written exactly as sent: a missing `done` means `false`, even for an item that was done.
- So to tick one item, send every item, keeping their `uuid`s, `title`s and `done` values, with that one item's `done` changed.
- A `uuid` that isn't one of this list's items is a `400 todo_item_not_in_list`, and nothing is changed.
- A rejected `PATCH` (e.g. a title conflict) changes nothing.

### 4.4. Constraints to design around

This is an API you don't control, like most APIs you'll work with. These behaviours are deliberate. Working around them is part of the assignment, so describe how you did it in your PR's Decisions section:

- **`PATCH` replaces all items.** Updating one item means sending all of them. Think about where the current items come from, what happens when two changes overlap, and what the user sees while a request is in flight.
- **The total count is only in the `X-TOTAL-COUNT` header.** Your data-fetching layer has to expose response headers, not only the body.
- **Pages are 1-indexed.** Many table and pagination components count from 0.
- **`sortDirection` is uppercase** (`ASC`/`DESC`).
- **`DELETE` responds `204` even if the list didn't exist.**
- **The session cookie can't be read from JS.** You find out who's logged in (or that nobody is) by calling `GET /auth/user`, and only the API can log you out.

## 5. Set up your AI workflow

Before writing any app code, set up your AI tooling with the Infinum AI stack:

1. Open [`prompts/ai-engineering-setup.md`](https://github.com/infinum/ai/blob/main/prompts/ai-engineering-setup.md) in the [`infinum/ai`](https://github.com/infinum/ai) repository. It's an internal repository, so ask your mentor for access if you can't open it.
2. Run that prompt with your coding agent **at project level, inside your app directory** (e.g. `just-todo-it/`), not globally. The setup (including the local PR review skill) then lives in your app and is committed to your repository with it.
3. Commit the resulting configuration.

**Before opening every PR**, run the local PR review skill it installed (e.g. `pr-review-code-simplicity`) on your branch. Fix or answer what it finds, then tick the self-review box in the PR description.

## 6. How review works: decisions over code

Your agent reviews the code. Your mentor reviews the decisions.

- Line-level issues (naming, duplication, dead code, obvious bugs) should already be gone by the time a PR is opened. That's what the self-review in [step 5](#5-set-up-your-ai-workflow) is for.
- Every PR uses the [PR template](./.github/pull_request_template.md), which you'll find in `.github/pull_request_template.md`. It's part of this template repository, so GitHub fills it in automatically in your repository. It asks for what changed, the **decisions** you made (options considered and trade-offs), open questions, and confirmation that you ran the self-review.
- Review is a conversation about those decisions. Expect to be asked why you chose one approach over another, and to explain the concepts listed in your framework's notes file using your own code.
- The API's quirks described in [section 4](#4-api) are deliberate constraints of an API you don't control. Deciding how to work around them is part of the assignment, so they belong in the Decisions section.

# License

The [MIT License](LICENSE)

# Credits

learnAngular is maintained and sponsored by
[Infinum](https://www.infinum.com).

<p align="center">
  <a href='https://infinum.com'>
    <picture>
        <source srcset="https://assets.infinum.com/brand/logo/static/white.svg" media="(prefers-color-scheme: dark)">
        <img src="https://assets.infinum.com/brand/logo/static/default.svg">
    </picture>
  </a>
</p>
