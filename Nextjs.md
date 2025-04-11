# Notes for Next.js

Before you start, we suggest reading through our [Getting started with React](https://infinum.com/handbook/frontend/react/getting-started-with-react/ecosystem) guide. During development, we recommend referencing our more in-depth [React guidelines and practices](https://infinum.com/handbook/books/frontend/react/react-guidelines-and-best-practices) handbook.\*\*\*\*

You will build this app with Next.js framework so we also suggest you go through the official [Learn Next.js](https://nextjs.org/learn/basics/create-nextjs-app) tutorial.

If you need information about the React core API be sure to check the [React Docs](https://react.dev/).

## 1. Application requirements & notes

Please follow these requirements:

- Use React hooks
- Get familiar with [Tailwind](http://tailwindcss.com/) and [ShadCN](https://ui.shadcn.com/) component library
- Use [React Hook Form](https://react-hook-form.com/) for handling forms
- Use [React Hook Form - Error Message](https://github.com/react-hook-form/error-message)
- Use [React Hook Form - useFieldArray](https://react-hook-form.com/api/usefieldarray) for adding and removing todos
- Use Next Auth to handle authentication:
  - [NextAuth.js](https://next-auth.js.org/)
  - [NextAuth handbook chapter](https://infinum.com/handbook/frontend/react/recipes/next-auth)
- Get familiar with Next.js data fetching concepts:
  - [Data Fetching and Caching](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching)
  - [Server Actions and Mutations](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
  - Incremental Static Regeneration (ISR): [revalidate](https://nextjs.org/docs/pages/building-your-application/data-fetching/incremental-static-regeneration)
- Get familiar with Bugsnag [React integration](https://docs.bugsnag.com/platforms/javascript/react/)
  - Check next.js setup example [here](https://github.com/bugsnag/bugsnag-js/tree/next/examples/js/nextjs)
  - Check [webpack-bugsnag-plugins](https://github.com/bugsnag/webpack-bugsnag-plugins) for more info about sending source maps to bugsnag.
  - Initial project will have Bugsnag integration already set up, but you will need to add `NEXT_PUBLIC_BUGSNAG_API_KEY` to `.env` file, check the "Bugsnag setup" section for more info.

Application UI structure:

- `Layout` component for sharing navigation between pages
  - `Navigation` component with application title and user menu
    - User menu shows `Log in` and `Register` links if the user is not logged in
    - User menu shows the user's email and `Log out` button if the user is logged in
- `TodoLists` component for rendering, sorting, filtering and creation of paginated `TodoList` collection
- `TodoListDetails` component for preview and update `TodoList` details
- `TodoListForm` component which uses `useFieldArray` and `useForm` for handling form inputs

> Check the [Project structure](https://infinum.com/handbook/frontend/react/project-structure#app-router) Handbook for better understanding

API Development proxy setup:

To make it work you just need to duplicate `.env.example` file, and rename it to `.env.local`.
If you need more info about the setup you can find it [here](https://infinum.com/handbook/frontend/react/next/development-proxy).

Bugsnag setup:

To get `NEXT_PUBLIC_BUGSNAG_API_KEY` you need to log in to the [Bugsnag dashboard](https://app.bugsnag.com/user/sign_in) using the credentials from the Infinum's 1Password app using this email `accounts.bugsnag.js@infinum.com`. After the successful login, you should see the `js-react-example` project in the dashboard. After that, open the project settings by clicking on the gear icon in the top right and selecting `Project settings`. There you will find `Notifier API key`, copy it and paste it into your `.env` file.

### 1.1. Authorization flow

If a logged in user tries to navigate to some of authorization pages, they should be redirected to the homepage, since it does not make sense for logged in user to see the login page.

If a logged out user tries to navigate to some of the pages that require login, they should be redirected to the login page.

#### 1.1.1. Registration

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
  - Make use of [NextAuth hooks](https://next-auth.js.org/getting-started/client) to get access to user object
- If user enters `/login` route while already logged in, he should be redirected to `/`
- If user enters any secure route (e.g. `/`, `/:uuid`) while not logged in, he should be redirected to `/login`

_Note_: Backend server that is running locally does not sent an actual email. Activation link can be seen in terminal log of the server.

![Register](./.assets/app/nextjs/register.png)

#### 1.1.2. Login

![Login](./.assets/app/nextjs/login.png)

#### 1.1.3. Request password reset

Similar to registration, password reset sends an email with password reset link that includes a token. Again, no actual email is sent, you can get the link from the terminal log of the server.

![Request password reset](./.assets/app/nextjs/forgot-password.png)

#### 1.1.4. Account activation

![Account activation](./.assets/app/nextjs/activation.png)

#### 1.1.5. Password reset

This page is opened once the user follows the link from request password reset email. URL contains a token similar to the one for activation. Again, more info about these tokens can be found in a later chapter.

![Reset password](./.assets/app/nextjs/reset-password.png)

#### 1.1.6. User menu

Once the user is logged in, they can see an avatar icon in the header menu and trigger a log out action from the dropdown menu that is opened when the user clicks on their email.

![Reset password](./.assets/app/nextjs/user-menu.png)

### 1.2. Managing Todos

All of the todo management routes should be protected with a guard that does not allow unauthorized users to see these pages. If an unauthorized user tries opening one of these routes, they should be redirected to login page.

#### 1.2.1. Table of Todo lists

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

#### 1.2.2. Create a new Todo list

Todo form consists of:

- Todo list name
- Array of Todo items
  - Each Todo item has a name and `done` state

Please ensure that all the form validations are implemented:

- Todo list name is required
- At least one Todo item is required
- Todo item name is required

User should not be able to trigger an API call if the form is invalid.

Think about how to design component API and break it in multiple parts so you can compose both create and edit forms from the same components.

Suggested composition:

- `TodoForm` component that is responsible for rendering the form
- `TodoFormFields` component that is responsible for rendering the form fields
- `TodoFormSubmit` component that is responsible for rendering the form submit button

Things to investigate:

- [useFieldArray](https://react-hook-form.com/api/usefieldarray/) hook. It will help you with managing the array of Todo items.
- [FormProvider](https://react-hook-form.com/api/formprovider/) and [useFormContext](https://react-hook-form.com/api/useformcontext/) hooks. They will help you with re-using the form for both create and edit actions.
- [Multipart Component](https://kentcdodds.com/blog/compound-components-with-react-hooks) also known as Compound Components. It will help you with re-using the form for both create and edit actions.

##### Empty state

![Create new Todo empty state](./.assets/app/nextjs/todo-form-create-new-empty.png)

##### Filled out

![Create new Todo filled state](./.assets/app/nextjs/todo-form-create-new-filled.png)

##### Validation error example #1

![Create new Todo error example #1](./.assets/app/nextjs/todo-form-error.png)

#### 1.2.3. Edit existing Todo

When the user clicks "Details" action in the table, they are navigated to a particular Todo page where they can edit the Todo. The form is identical, but the API call is different. Find a way to re-use the form from the Create Todo modal.

![Edit existing Todo](./.assets/app/nextjs/todo-form-edit-existing.png)

## 1.4. Testing

To get on board with testing best practices and to get familiar with the testing library, make sure to read these articles:

- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Infinum Handbooks - Testing Best Practices](https://infinum.com/handbook/frontend/react/testing-best-practices)
- [Next.js - Testing](https://nextjs.org/docs/testing)

Write some tests, for example:

- TodoFormFields

  - `should show title`
  - `should update title`
  - `should mark as done`
  - `should handle removing`

- TodoList
  - `should show empty state`
  - `should show list of items`
  - `should show pagination`
  - `should show sorting`
  - `should show filtering`
  - `should show delete confirmation`
  - `should delete item`
  - `should navigate to edit page`

> **Note:** The test cases above are just examples. Real test cases depends on how you implement the components, but they should be similar to the ones above. Feel free to add more test cases.
