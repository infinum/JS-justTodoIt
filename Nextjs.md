# Notes for Next.js

This project will help you build fundamental knowledge of various parts of React and Next.js framework.

Before you start, we suggest reading through our [Getting started with React](https://infinum.com/handbook/frontend/react/getting-started-with-react/ecosystem) guide. During development, we recommend referencing our more in-depth [React guidelines and practices](https://infinum.com/handbook/books/frontend/react/react-guidelines-and-best-practices) handbook.

You will build this app with Next.js framework so we also suggest you to go through official [Learn Next.js](https://nextjs.org/learn/basics/create-nextjs-app) tutorial.

## 1. What you will build

You will be developing a simple to-do list application. Requirements are simple but ensure that you make good use of various React features.

Learn React is more of a practical application of that gained knowledge, without too much hand-holding. There is a big focus on authentication handling because that is part of almost every application you will be developing in the future, so it is good to learn some best practices early-on.

## 2. Project structure

This repository contains README.md file and `api/` directory.
To get started, use `create-next-app` and create a new Next.js project in the repository.

```bash
npx create-next-app@latest learn-react -e https://github.com/infinum/JS-React-Example/tree/onboarding-starter --use-npm
```

Your final structure might look something like this:

- api/
  - package.json
  - ...
- learn-react/ - _created by create-next-app_
  - src/
  - package.json
  - tsconfig.json
  - ...
- README.md

## 3. Application requirements / notes

Please follow these requirements:

- Use React hooks
- Get familiar with [Chakra UI](https://chakra-ui.com) component library
- Use [SWR](https://swr.vercel.app/) hook for fetching data
- Use [useMutation](https://github.com/infinum/use-mutation) hook for mutating data.
  - This is a temporary solution until SWR adds build in support for [remote mutation](https://github.com/vercel/swr/pull/1450)
- Use [React Hook Form](https://react-hook-form.com/) for handling forms
- Uee [React Hook Form - Error Message](https://github.com/react-hook-form/error-message)
- Use [React Hook Form - useFieldArray](https://react-hook-form.com/api/usefieldarray) for adding and removing todos
- Use [jwt-decode](https://github.com/auth0/jwt-decode) to parse data from tokens

Application UI structure:

- `Layout` component for sharing navigation between pages
  - `Navigation` component with application title and user menu
    - User menu shows `Log in` and `Register` links if the user is not logged in
    - User menu shows user's email and `Log out` button if the user is logged in
- `TodoLists` component for rendering, sorting, filtering and creation of paginated `TodoList` collection
- `TodoListDetails` component for preview and update `TodoList` details
- `TodoListForm` component which uses `useFieldArray` and `useForm` for handling form inputs, and `useMutation` to handle mutations

> Check the [Project structure](https://infinum.com/handbook/frontend/react/project-structure) Handbook for better understanding

API Development proxy setup:

To make it work you just need to duplicate `.env.example` file, rename it to `.env.local`.
If you need more info about the setup you can find it here [here](https://infinum.com/handbook/frontend/react/next/development-proxy).

### 3.1. Authorization flow

If a logged in user tries to navigate to some of authorization pages, they should be redirected to the homepage, since it does not make sense for logged in user to see the login page.

If a logged out user tries to navigate to some of the pages that require login, they should be redirected to the login page.

#### 3.1.1. Registration

During registration, user enters only their e-mail address. An email is sent with activation link that the user can click. This link contains a token that you can read more about in a later section of this readme.

You should implement the following pages:

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
  - implement `useUser` hook that uses `useSWR` under the hood to leverage `caching` and API calls `deduping`
- If user enters `/login` route while already logged in, he should be redirected to `/`
  - implement `AuthRedirect` component based on the handbook tutorial [Session Handling](https://infinum.com/handbook/frontend/react/recipes/session-handling)
- If user enters any secure route (e.g. `/`, `/:uuid`) while not logged in, he should be redirected to `/login`
  - use the same `AuthRedirect` utility component

_Note_: Backend server that is running locally does not sent an actual email. Activation link can be seen in terminal log of the server.

![Register](./.assets/app/rnextjs/egister.png)

#### 3.1.2. Login

![Login](./.assets/app/nextjs/login.png)

#### 3.1.3. Request password reset

Similar to registration, password reset sends an email with password reset link that includes a token. Again, no actual email is sent, you can get the link from the terminal log of the server.

![Request password reset](./.assets/app/nextjs/forgot-password.png)

#### 3.1.4. Account activation

![Account activation](./.assets/app/nextjs/activation.png)

#### 3.1.5. Password reset

This page is opened once the user follows the link from request password reset email. URL contains a token similar to the one for activation. Again, more info about these tokens can be found in a later chapter.

![Reset password](./.assets/app/nextjs/reset-password.png)

#### 3.1.6. User menu

Once the user is logged in, they can see avatar icon in the header menu and trigger log out action from the dropdown menu that is opened when the user clicks on their email.

![Reset password](./.assets/app/nextjs/user-menu.png)

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

##### Empty state

![Empty state](./.assets/app/nextjs/todo-list-empty.png)

##### Table with some items

![Empty state](./.assets/app/nextjs/todo-list.png)

##### Sorted by title

![Sort by name](./.assets/app/nextjs/todo-list-sort.png)

##### Filters

![Name filter](./.assets/app/nextjs/todo-list-filters.png)

##### Delete action prompt

![Delete action prompt](./.assets/app/nextjs/todo-list-delete-confirmation.png)

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

![Create new Todo empty state](./.assets/app/nextjs/todo-form-create-new-empty.png)

##### Filled out

![Create new Todo empty state](./.assets/app/nextjs/todo-form-create-new-filled.png)


##### Validation error example #1

![Create new Todo error example #1](./.assets/app/nextjs/todo-form-error.png)

#### 3.2.3. Edit existing Todo

When the users clicks "Details" action in the table, he is navigated to a particular Todo page where they can edit the Todo. The form is identical, but the API call is different. Find a way to re-use this form.

![Edit existing Todo](./.assets/app/nextjs/todo-form-edit-existing.png)

