# Just Todo It

Welcome to Just Todo It!

This onboarding project will help you build fundamental knowledge of various parts of the framework that you will be working with.

After you read through this main README file, please check out framework-specific notes ([Next.js](./Nextjs.md), [Angular](./Angular.md))

## 1. What you will build

You will be developing a simple to-do list application. Requirements are simple but ensure that you make good use of various framework features, including areas which are not covered very often in various online tutorials.

Just Todo It is a practical application of knowledge, without too much hand-holding. There is a big focus on authentication handling because that is a part of almost every application but is rarely covered in various framework tutorial/courses.

Take a look at this short video demonstrating what the final application might look like:

https://user-images.githubusercontent.com/3170728/131492134-b85e0e60-8981-4a6a-a9ac-d8d49db62b79.mp4

Please note that the video is a recording of Angular application implementation. Next.js app might look quite a bit different, but this is the general gist of the flows.

## 2. Project structure

This repository contains some README files and `api/` directory. The frontend app you will be developing should be placed in a sibling directory, next to `/api` directory. To get started:

  - React - `npx create-next-app@latest --typescript just-todo-it`
  - Angular - `ng new just-todo-it`

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

As for the frontend application file and folder organization, please refer to

- React - [Project structure](https://infinum.com/handbook/frontend/react/project-structure) Handbook chapter
- Angular - [File and module organization and naming](https://infinum.com/handbook/books/frontend/angular/angular-guidelines-and-best-practices/file-and-module-organization-and-naming) Handbook chapter

## 3. Application requirements & notes

When implementing the application, please:

- Add eslint, prettier and husky
  - Use Infinum's [config for eslint](https://github.com/infinum/js-linters) and follow the [handbook](https://infinum.com/handbook/frontend/code-quality/tools)
  - Run linters and check if the app compiles (e.g. using `tsc --no-emit`) in a pre-commit hook
- Use [jwt-decode](https://github.com/auth0/jwt-decode) to parse data from tokens
- Store table pagination, sorting and filtering state in URL
- Re-use certain forms that have the same structure
  - e.g. activation and reset password forms

Please make sure to follow any additional framework-specific requirements for [Next.js](./Nextjs.md) and [Angular](./Angular.md).

### 3.1. Authorization flow

If a logged in user tries to navigate to some of authorization pages, they should be redirected to the homepage, since it does not make sense for logged in user to see the login page.

If a logged out user tries to navigate to some of the pages that require login, they should be redirected to the login page.

#### 3.1.1. Registration

During registration, user enters only their e-mail address. An email is sent with activation link that the user can click. This link contains a token that you can read more about in a later section of this readme.

_Note_: Backend server that is running locally does not sent an actual email. Activation link can be seen in terminal log of the server (as demonstrated in the video).

![Register](./.assets/app/register.png)

#### 3.1.2. Login

![Login](./.assets/app/login.png)

#### 3.1.3. Request password reset

Similar to registration, password reset sends an email with password reset link that includes a token. Again, no actual email is sent, you can get the link from the terminal log of the server.

![Request password reset](./.assets/app/request-password-reset.png)

#### 3.1.4. Account activation

Account activation and password reset pages are a bit different from other pages - they do not have the same layout - there is no header component and the content of the page is centred in the middle of the screen. Think about how you can achieve this without having `if`s for hiding/showing elements or style adjustments.

![Account activation](./.assets/app/account-activation.png)

#### 3.1.5. Password reset

This page is opened once the user follows the link from request password reset email. URL contains a token similar to the one for activation. Again, more info about these tokens can be found in a later chapter.

![Reset password](./.assets/app/reset-password.png)

#### 3.1.6. User menu

Once the user is logged in, they can see their email in the header menu and trigger log out action from the dropdown menu that is opened when the user clicks on their email.

![Reset password](./.assets/app/user-menu.png)

### 3.2. Managing Todos

All of the todo management routes should be protected with a guard that does not allow unauthorized users to see these pages. If an unauthorized user tries opening one of these routes, they should be redirected to login page.

#### 3.2.1. Table of Todo lists

This page shows a paginated table of all of the user's Todo lists:

- User can go to next/previous page
- User can sort Todo lists by name and creation date
  - Default sort: creation date, descending
- User can filter Todo lists by name
  - API calls should be made on-the-fly as the user types (there is no submit button), with some debounce time
  - Avoid making unnecessary API calls
  - Ensure that results from the API are processed in correct order and that there are no race conditions
- User should be able to both sort and filter simultaneously
- Pagination, sorting and filtering parameters should be preserved if:
  - The user refreshes the page
  - The user goes to some Todo details and comes back to the list
- Default page size should be 5
- Pagination component should show the total count of results
- User can navigate to edit page of a particular Todo
- User can delete a particular Todo (with confirmation dialog prompt)

##### Empty state:
![Empty state](./.assets/app/todo-list-empty.png)

##### Table with some items:
![Empty state](./.assets/app/todo-list.png)

##### Sorted by name:
![Sort by name](./.assets/app/todo-list-sort.png)

##### Name filter:
![Name filter](./.assets/app/todo-list-filters.png)

##### Delete action prompt:
![Delete action prompt](./.assets/app/todo-list-delete-confirmation.png)


#### 3.2.2. Create a new Todo list

Todo form consists of:
- Todo list name
- Array of Todo items
  - Each Todo item has a name and done state

Please ensure that all the form validations are implemented:
- Todo list name is required
- At least one Todo item is required
- Todo item name is required

User should not be able to trigger an API call if the form is invalid.

##### Empty state
![Create new Todo empty state](./.assets/app/todo-form-create-new-empty.png)

##### Filled out
![Create new Todo empty state](./.assets/app/todo-form-create-new-filled.png)

##### Validation error example #1
![Create new Todo error example #1](./.assets/app/todo-form-error-1.png)

##### Validation error example #2
![Create new Todo error example #2](./.assets/app/todo-form-error-2.png)

#### 3.2.3. Edit existing Todo list

When the users clicks "Details" action in the table, he is navigated to a particular Todo page where they can edit the Todo. The form is identical, but the API call is different. Find a way to re-use this form.

![Edit existing Todo](./.assets/app/todo-form-edit-existing.png)

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
