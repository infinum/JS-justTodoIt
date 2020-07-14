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
- learn-angular/ - _created by @angular/cli_
  - package.json
  - angular.json
  - ...
- README.md

## 3. Application requirements / notes

Please follow these requirements:

- Use lazy loading of modules
- Use SCSS
- Use OnPush change detection
  - Run this command right after you generate the project
    ```bash
    ng config schematics.@schematics/angular.component.changeDetection OnPush
    ```
- Use [Angular Material](https://material.angular.io/guide/getting-started) to speed up component development
  - Use whichever theme you prefer
- Use [jwt-decode](https://github.com/auth0/jwt-decode) to parse data from tokens

Application UI structure:

- Header section with application title and user menu
  - User menu shows `Log in` and `Register` links if the user is not logged in
  - User menu shows user's email and `Log out` button if the user is logged in
- Content section which renders different pages, based on route

### 3.1. Authorization flow

You should implement the following routes/pages:

- Registration - `/register`
  - Should show a link to `/login` route
- Account activation - `/activation?token=...`
- Log in - `/login`
  - Should show links to `/register` and `/forgot-password` routes
- Forgot password - `/forgot-password`
- Reset password - `/reset-password?token=...`

Additional notes:
- User should be able to log out
- Application should load user data upon full page reload
  - Utilize `GET` `/auth/user` API call and think about what is the best way to load user data during app initialization
- If user enters `/login` route while already logged in, he should be redirected to `/`
- If user enters any secure route (e.g. `/`, `/:uuid`) while not logged in, he should be redirected to `/login`

### 3.2. Managing Todos

You should implement the following routes/pages:

- Todos list - `/`
  - Should show a paginated list of all of the user's Todos
    - Default page size is 5
    - User can go to next/previous page
  - Do not show Todo item for each Todo, just show a list of Todos
  - User can sort Todos by name and creation date
    - Default sort: creation date, descending
  - User can filter Todos by name
  - User should be able to both sort and filter simultaneously
  - Pagination, sorting and filtering parameters should be preserved if:
    - the user refreshes the page
    - the user goes to some Todo details and comes back to the list
  - Todos are shown paginated with arbitrary page size
    - Page size and number are query parameters, default page size should be 5
- Todo details - `/:uuid`
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

### Login

Successful login API calls return `set-cookie` header - token will be stored in a HTTP-only cookie. You will not be able to read or modify this cookie using JS, this is the most secure option. Because of this, your API calls will need to be made with `withCredentials` option and there will be no manual setting of Authorization headers or anything like that.

In production and for real projects, token cookie would be flagged as `secure` as well, but since you will be developing locally it is not (to keep things simple by avoiding the use of HTTPS on localhost with self-signed certificates).

### Logout

Since the cookie is HTTP-only, you have to make an API call to clear the cookie.

### 4.2. Managing Todos

Todo titles have to be unique for the user. Two user can have Todos with same title, but one user's specific Todos must all have unique titles.

One specific Todo must have items of unique titles.

#### Pagination

Todo fetching results are paginated. To find out how many pages there are, check value of `X-TOTAL-COUNT` response header. If there are 12 Todos in the database, first page will return 5 results and the header will contain value `12. You can use this value together with request query parameters (current page and page size) to determine whether you can load next or previous page of results.

#### Relations

When fetching all or some specific Todo, you can send relation query param with a list of relations which should be loaded. Currently available values for relations are:

- `items` - includes all Todo items in the response

#### Partial updates

When updating a specific Todo, you can make a PATCH call with JSON which contains only those values which you want to update.

If you want to update Todo title, just send a JSON with new `title` value and omit `items`.

If you want to update items, you always have to send all the items. Any missing items from the PATCH call will get removed and any new ones will get added.

If you want to mark some todo item as done or simply rename it, sent a PATCH call with all other items as well and for this one specific item keep the same `uuid` but change `done` and/or `title` properties.

You can do all these partial updates at the same time or one by one.
