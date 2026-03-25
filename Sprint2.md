# Sprint 2

## Frontend Unit Tests (Angular/Vitest)

Unit tests currently implemented in `frontend/src/app`:

- `app.spec.ts`
- `layout/layout.spec.ts`
- `navbar/navbar.spec.ts`
- `guards/auth.guard.spec.ts`
- `pages/home/home.spec.ts`
- `pages/alerts/alerts.spec.ts`
- `pages/events/events.spec.ts`
- `pages/login/login.component.spec.ts`
- `pages/signup/signup.component.spec.ts`
- `pages/account/account.component.spec.ts`
- `announcement-list/announcement-list.component.spec.ts`
- `post-card/post-card.component.spec.ts`
- `services/announcement.service.spec.ts`

Coverage highlights for major features:

- Signup page form validation and submit success/error.
- Login page form validation, successful login flow, and auth error handling.
- Announcement create/edit/delete flows.
- Account page rendering, optional bio placeholder, and logout flow.
- Navbar account navigation and auth route guard behavior.

## Cypress Test Implemented

Simple Cypress E2E spec:

- `frontend/cypress/e2e/login-validation.cy.ts`

What it validates:

- Open `/login`.
- Submit empty login form.
- Verify required field errors for email and password are displayed.

## How To Run Frontend Tests

From `frontend/`:

1. Unit tests (headless):
   - `npm run test:unit`
   - or `npm run test -- --watch=false --progress=false`
2. Start frontend app in another terminal:
   - `npm start`
3. Cypress test (headless):
   - `npm run test:cypress`
4. Cypress interactive UI:
   - `npm run test:cypress:open`

## Frontend Test Results

1. Unit tests:
   - Terminal summary shows `Test Files` and `Tests` passed/failed counts.
2. Cypress:
   - `npm run test:cypress` prints pass/fail in terminal for each `.cy.ts` spec.
   - In open mode, Cypress app shows per-step execution and screenshots on failure.

## Cypress Troubleshooting

- If Cypress fails to boot and your environment sets `ELECTRON_RUN_AS_NODE=1`, use the provided scripts (`test:cypress`, `test:cypress:open`) which unset that variable automatically.
- Keep `ng serve` running on `http://localhost:4200` before running Cypress.
