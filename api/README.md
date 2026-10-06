# backend

> An awesome project based on Ts.ED framework

See [Ts.ED](https://tsed.io) project for more information.

## Build setup

> **Important!** This API requires the exact Node and pnpm versions pinned in `package.json` (see the root README).

```batch
# install dependencies
$ pnpm install

# serve
$ pnpm start

# build for production
$ pnpm build
$ pnpm start:prod
```

## Environment variables

| Variable name                         | Description                                                                                                     | Example value                                                            | Default value                 | Required |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------- | -------- |
| `FRONTEND_URL`                        | The URL on which the FE app is hosted. Required for generating links in emails.                                 | `https://js-api-onboarding.byinfinum.co`                                 | -                             | ✅       |
| `JWT_SECRET`                          | A secret key used for signing and verifying JWT tokens. Should be a long cryptographically strong random string | `au2o8sjoa2js...`                                                        | -                             | ✅       |
| `RESEND_API_KEY`                      | API key for email sending. When unset, emails are printed to the terminal instead                              | `re_Rkjhakd...`                                                          | -                             | ❌       |
| `COOKIE_HTTP_ONLY`                    | Set to `true` in order to flag the cookie as `HttpOnly`                                                         | `true`                                                                   | `true`                        | ❌       |
| `COOKIE_SECURE`                       | Set to `true` in order to flag the cookie as `Secure`                                                           | `true`                                                                   | `true`                        | ❌       |
| `CORS_ALLOWED_ORIGINS`                | A comma-separated list of allowed `Origin`s that is added in addition to the value from `FRONTEND_URL`          | `https://js-api-onboarding.byinfinum.co,https://another-app.example.com` | Inherited from `FRONTEND_URL` | ❌       |
| `EXTEND_TOKEN_DURATION_AUTOMATICALLY` | Whether the token should be extended automatically                                                              | `true`                                                                   | `true`                        | ❌       |
| `HTTP_PORT`                           | The port in which the server listen for HTTP requests                                                           | `8080`                                                                   | `8080`                        | ❌       |
| `DB_PATH`                             | Path to the SQLite database file                                                                                | `/tmp/test.sqlite`                                                       | `database.sqlite`             | ❌       |
