# Just Todo It

Welcome to Just Todo It!

This onboarding project will help you build fundamental knowledge of various parts of the framework that you will be working with.

## 1. What you will build

You will be developing a simple to-do list application. Requirements are simple but ensure that you make good use of various framework features, including areas which are not covered very often in various online tutorials.

Just Todo It is a practical application of knowledge, without too much hand-holding. There is a big focus on authentication handling because that is a part of almost every application but is rarely covered in various framework tutorial/courses, so it is good to learn some best practices early-on.

Take a look at this short video demonstrating what the final application might look like:

https://user-images.githubusercontent.com/3170728/131492134-b85e0e60-8981-4a6a-a9ac-d8d49db62b79.mp4

Please note that the video is a recording of Angular application implementation. Next.js app might look quite a bit different, but this is the general gist of the flows.

## 2. Project structure

This repository contains some README files and `api/` directory. The frontend app you will be developing should be placed in a sibling directory, next to `/api` directory. To get started:

  - React
    ```bash
    npx create-next-app@latest just-todo-it -e https://github.com/infinum/JS-React-Example/tree/onboarding-starter --use-npm
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

Please check out framework-specific requirements & notes:
- [Next.js](./Nextjs.md)
- [Angular](./Angular.md)

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

During registration, the user enters their email and receives an email with activation link (email is logged to terminal). This link is a link to the frontend application and it contains the activation token. Activation token is a JWT token containing user email. Example link:

```
http://localhost:4200/activation?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiNDhmNzFjZDAtZWJkNC00NDA2LWI5ZDQtMzdmNmVlMmUwMDVkIiwiZW1haWwiOiJqb2huLnNtaXRoQGV4YW1wbGUuY29tIiwiaWF0IjoxNTk0NjQ2NzQwLCJleHAiOjE1OTQ5MDU5NDB9.X0QXlQU3rK8dMCIYFGCHPLWbex_LWh8FfpIJmdOya4Q
```

You can decode the token, check if it has expired or not and read the email from it:

![Decoded JWT activation token](./.assets/other/activation-token.png)

#### Login

Successful login API calls return `set-cookie` header - token will be stored in a HTTP-only cookie. You will not be able to read or modify this cookie using JS, this is the most secure option. Because of this, your API calls will need to be made with `withCredentials` option and there will be no manual setting of Authorization headers or anything like that.

In production and for real projects, token cookie would be flagged as `secure` as well, but since you will be developing locally it is not (to keep things simple by avoiding the use of HTTPS on localhost with self-signed certificates).

#### Logout

Since the cookie is HTTP-only, you have to make an API call to clear the cookie.

### 4.2. Managing Todo lists

Todo titles have to be unique for the user. Two different users can have Todo lists with the same title, but one specific user's Todo lists must all have unique titles.

All items of a specific Todo list must have unique titles.

#### Pagination

Todo fetching results are paginated. To find out how many pages there are, check value of `X-TOTAL-COUNT` response header. If there are 12 Todo lists in the database, first page will return 5 results and the header will contain value `12`. You can use this value together with request query parameters (current page and page size) to determine whether you can load next or previous page of results.

#### Relations

When fetching all or some specific Todo, you can send relation query param with a list of relations which should be loaded. Currently available values for relations are:

- `todos` - includes all Todo items in the response

#### Partial updates

When updating a specific Todo, you can make a PATCH call with JSON which contains only those values which you want to update.

If you want to update Todo title, just send a JSON with new `title` value and omit `todos`.

If you want to update items, you always have to send all the items. Any missing items from the PATCH call will get removed and any new ones will get added.

If you want to mark some todo item as done or simply rename it, sent a PATCH call with all other items as well and for this one specific item keep the same `uuid` but change `done` and/or `title` properties.

You can do all these partial updates at the same time or one by one.

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
