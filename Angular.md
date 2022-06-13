# Notes for Angular

Before you start, we suggest reading through our [Angular Handbook](https://infinum.com/handbook/books/frontend/angular/introduction) and going through the official [Tour of Heroes tutorial](https://angular.io/tutorial) before starting this project as it explains many Angular features along the way.

## Requirements & limitations

- Choose some nice prefix
- Use lazy loading of modules
- Use SCSS
- Use OnPush change detection
  - Run this command right after you generate the project
    ```bash
    ng config schematics.@schematics/angular.component.changeDetection OnPush
    ```
  - When using OnPush CD, [use async pipe at much as possible](https://infinum.com/handbook/books/frontend/angular/angular-guidelines-and-best-practices/formatting-naming-and-best-practices#avoid-manual-subscriptions-and-asynchronous-property-assignment)
- Use [Angular Material](https://material.angular.io/guide/getting-started) to speed up component development
  - Use whichever theme you prefer
- Create `src/app/styles` directory for your shared SCSS partials
  - Use [Style preprocessor options](https://angular.io/guide/workspace-config#style-preprocessor-options) to make SCSS import paths nicer
- Use `APP_INITIALIZER` to fetch user data on initial application load
  - Initialize User/Auth service with user data on success
- Use [the single observable pattern](https://infinum.com/handbook/books/frontend/angular/angular-guidelines-and-best-practices/formatting-naming-and-best-practices#the-single-observable-pattern) in order to avoid `ng-container` hell
- [Create multiple layout components](https://indepth.dev/posts/1235/how-to-reuse-common-layouts-in-angular-using-router-2)
