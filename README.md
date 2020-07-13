# Learn Angular

Welcome to Learn Angular!

This project will help you build fundamental knowledge of various parts of Angular.

Before you start, we suggest reading through our [Getting started with Angular](https://infinum.com/handbook/books/frontend/angular/getting-started-with-angular) guide. During development, we recommend referencing our more in-depth [Angular guidelines and practices](https://infinum.com/handbook/books/frontend/angular/angular-guidelines-and-best-practices) handbook.

## 1. What is Learn Angular

You will be developing a simple to-do list application. Requirements are simple but ensure that you make good use of various Angular features, including some features which are not covered or focused on in the official [Tour of Heroes](https://angular.io/tutorial) tutorial. We still recommend going through Tour of Heroes before starting this project as it explains many Angular features along the way.

Learn Angular is more of a practical application of that gained knowledge, without too much hand-holding. There is a big focus on authentication handling because that is part of almost every application you will be developing in the future, so it is good to learn some best practices early-on.

## 2. Project structure

This repository contains README.md file and `api/` directory. To get started, install `@angular/cli` (if you have not already) and create a new Angular project in the repository. Your final structure might look something like this:

- api/
  - package.json
  - ...
- learn-angular/
  - package.json
  - angular.json
  - ...
- README.md

## 3. Application requirements / notes

### 3.1. Authorization flow

- Registration
  - `/register` route
  - Show link to `/login` route
- Account activation
  - `/activation?token=...` route
- Log in
  - `/login` route
  - Show links to `/register` and `/forgot-password` routes
  - After the login API call passes, token will be store in a HTTP-only cookie - you will not be able to read or modify this cookie in any way. This is the most secure option.
    - Because of this, your API calls will need to be made with `withCredentials` option and there will be no manual setting of Authorization headers or anything like that
    - In production, token cookie would be flagged as `secure` as well, but since you will be developing locally it is not (to keep things simple by avoiding the use of HTTPS on localhost with self-signed certificates)
- Forgot password
  - `/forgot-password` route
- Reset password
  - `/reset-password?token=...` route
- User should be able to log out
- Application should load user data upon full page reload
  - Utilize `GET` `/auth/user` API call and `APP_INITIALIZER`
- If user enters `/login` route while already logged in, he should be redirected to `/`
- If user enters any secure route (e.g. `/`, `/:uuid`) while not logged in, he should be redirected to `/login`

### 3.2. Managing Todos

- Todos list
  - Root route (`/`) should show a list of all of the user's Todos
  - Do not show Todo item for each Todo, just show a list of Todos
  - User can sort Todos by name and creation date
    - Default sort: creation date, descending
  - User can filter Todos by name
  - Todos are shown paginated with arbitrary page size
    - Page size and number are query parameters, default page size should be 5
- Todo details
  - `/:uuid` route
  - Ability to rename
  - Ability to add or remove Todo items
  - Ability to check/uncheck a specific Todo item as done/not done

## 4. API

To start the API server:

```bash
cd api
npm install
npm start
```

The server will be started on `localhost:8080`.

You can check the API documentation on [localhost:8080/swagger](http://localhost:8080/swagger).

API uses SQLite. If at any point you want to clear the database and start from the beginning, simply delete `api/database.sqlite` file and restart the server.

For local development, all emails the API might send will actually be logged to the terminal where the API is running.

### 4.1. Authorization flow

#### Registration

During registration, the user enters his email and receives an email with activation link (email is logged to terminal). This link is a link to the frontend application and it contains the activation token. Activation token is a JWT token containing user email. Example link:

```
http://localhost:4200/activation?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiNDhmNzFjZDAtZWJkNC00NDA2LWI5ZDQtMzdmNmVlMmUwMDVkIiwiZW1haWwiOiJqb2huLnNtaXRoQGV4YW1wbGUuY29tIiwiaWF0IjoxNTk0NjQ2NzQwLCJleHAiOjE1OTQ5MDU5NDB9.X0QXlQU3rK8dMCIYFGCHPLWbex_LWh8FfpIJmdOya4Q
```

You can decode the token, check if it has expired or not and read the email from it:

![Decoded JWT activation token](./.assets/activation-token.png)

### 4.2. Managing Todos

#### Partial updates

When updating a specific Todo
