# Sprint 2

## Frontend – Sprint 2 Completed Work

### 1. Announcement API Integration

Completed full backend integration for announcements:

- Replaced static mock data with real backend API calls.
- Implemented `GET /api/announcements` to fetch announcements dynamically.
- Implemented `POST /api/announcements` to create new announcements using authenticated requests.
- Implemented `POST /api/announcements/update` to update announcements using authenticated requests.
- Implemented `POST /api/announcements/delete` to delete announcements using authenticated requests.
- Implemented delete functionality connected to backend delete API.
- Added loading and error states for fetch/create/update/delete API calls.
- Ensured UI updates immediately after create/update/delete operations without page refresh.

### 2. Authentication Integration

- Integrated JWT-based authentication with backend.
- Stored authentication token in `localStorage` after login.
- Attached `Authorization: Bearer <token>` header for protected API requests.
- Resolved 401 Unauthorized issues through proper header handling.
- Implemented logout functionality clearing stored token.
- Protected app routes with auth guard and redirected unauthenticated users to `/login`.

### 3. Model & UI Refactoring

- Updated `Announcement` interface to match backend schema (`id`, `title`, `content`, `author`, `created_at`, `updated_at`, `deleted_at`).
- Removed legacy mock-only fields (likes, category, comments, imageUrl).
- Refactored `PostCard` component to align with backend response structure.
- Standardized usage of `ID` instead of `id` across components.
- Formatted timestamps for display using component helper logic.
- UI still uses placeholders for `category`, `likes`, and `comments` until backend supports those values.

### 4. API Configuration & Environment Setup

- Removed hardcoded backend URLs.
- Configured Angular proxy to route `/api` requests to backend.
- Integrated backend CORS middleware to allow frontend communication.
- Verified API connectivity using browser DevTools and curl testing.

### 5. Validation & UX Improvements

- Prevented empty announcement submissions.
- Improved error handling for create and fetch failures.
- Maintained consistent UI state after API operations.

### 6. Testing

- Implemented unit tests for major components and services.
- Added Cypress E2E validation for login form behavior.
- Verified announcement create, fetch, and delete flows through testing.

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