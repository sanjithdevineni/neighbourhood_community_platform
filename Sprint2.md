# Sprint 2

# Frontend – Sprint 2 Completed Work

**Frontend:**  
- Sanjith  
- Bindhu  

---

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

---
---

# Backend – Sprint 2 Completed Work

**Backend:**  
- Parvathi  
- Justin  

---

## Backend - Sprint 2 Detailed Work (Parvathi)

## Overview

In Sprint 2, I focused on frontend and backend integration and helping out the frontend people and also on backend infrastructure improvements that made the application more production-ready and easier to monitor.  
The main work included structured logging, request tracing, better observability, and support for secure frontend-backend token communication.


---

## 1. Structured Logging Middleware

Implemented structured logging using Go's standard `log/slog` library.

Features logged:
- HTTP method
- Request path
- Response status code
- Request latency in milliseconds
- Client IP address
- User agent

Implementation details:
- Added centralized logger setup
- Created Gin logging middleware in `middleware/logger.go`
- Registered the middleware in the backend router setup

Benefits:
- Better API monitoring
- Easier debugging
- Consistent machine-readable JSON logs

---

## 2. Centralized Logger Setup

Created a reusable logger configuration for the backend.

Behavior:
- Logs are written in JSON format
- Output goes to both standard output and `logs/app.log`
- Logging is initialized at application startup

Benefits:
- Single source for logging configuration
- Easier local debugging
- Persistent logs for later inspection

---

## 3. Grafana + Loki + Promtail Log Monitoring

Integrated a monitoring stack for backend log visualization.

Components added:
- Grafana
- Loki
- Promtail
- Docker Compose configuration

Files added:
- `log/logger.go`
- `middleware/logger.go`
- `docker-compose.yml`
- `promtail-config.yml`
- `grafana/provisioning/datasources/loki.yml`

Purpose:
- Collect backend logs from `logs/app.log`
- Push logs to Loki
- Visualize and filter logs in Grafana

Example monitoring use cases:
- View all backend requests
- Filter only error logs
- Inspect failed requests with status `500`
- Track user login and announcement activity

---

## 4. Controller-Level Logging Enhancements

Added structured log statements to important backend components.

Updated areas:
- `auth_controller.go`
- `announcement_controller.go`
- `database.go`
- `config.go`
- `main.go`

Examples of actions logged:
- Successful signup
- Successful login
- Failed authentication attempts
- Password validation issues
- Database connection success/failure
- Announcement CRUD activity
- Unauthorized access attempts
- Server startup events

Benefits:
- Faster root cause analysis
- Easier troubleshooting of auth and database issues
- Better visibility into backend behavior

---

## 5. Token Integration Support

Supported secure frontend-backend token integration.

Work completed:
- Ensured backend supports `Authorization` header usage for protected APIs
- Verified token-based request flow for authenticated routes
- Confirmed protected routes can be accessed using `Bearer <token>`

Protected routes validated for token flow:
- Create announcement
- Update announcement
- Delete announcement

Benefits:
- Smooth frontend integration
- Reliable JWT-based authentication flow
- Better readiness for end-to-end usage

---

## 6. Routing and Middleware Improvements

Improved router initialization for better middleware support.

Changes:
- Switched to `gin.New()` setup
- Added recovery middleware
- Added custom logger middleware into the request pipeline

Benefits:
- Cleaner middleware orchestration
- Better panic recovery
- Full request lifecycle logging

---

## Testing Performed

- Verified backend builds successfully using:

```bash
go build ./...
```

- Ran backend locally and confirmed JSON logs appear in terminal
- Confirmed logs are written to `logs/app.log`
- Started Grafana stack using Docker Compose
- Verified logs can be queried in Grafana through Loki
- Tested filtering logs by status and error level
- Verified protected routes work with bearer token headers

---

## DevOps / Observability Commands

### Run backend
```bash
cd backend
go run main.go
```

### Start Grafana stack
```bash
cd backend
docker compose up -d
```

### Grafana access
- URL: `http://localhost:3000`
- Default login: `admin / admin`

Example Loki query:
```text
{job="community-platform"}
```

Error-only example:
```text
{job="community-platform", level="ERROR"}
```

---

## Sample Log Output

```json
{"time":"2026-03-23T17:30:00Z","level":"INFO","msg":"HTTP Request","method":"GET","path":"/api/health","status":200,"latency_ms":1,"client_ip":"127.0.0.1","user_agent":"curl/8.0"}
{"time":"2026-03-23T17:30:05Z","level":"INFO","msg":"User logged in successfully","user_id":1,"email":"user@example.com"}
```

---

## Backend — Sprint 2 Contribution (Justin)

## User Stories Implemented

- As a developer, I want all backend errors to follow one consistent response format so the frontend can handle failures reliably.
- As a user, I want secure token-based access to protected routes so only authenticated users can perform restricted actions.
- As a developer, I want backend APIs to return cleaner and safer error responses for better debugging and security.

---

## Completed Issues

## 1. Refactored backend toward centralized error handling
- Centralized error response + logging through RespondWithError in errors.go, instead of spreading error response logic across controllers + middleware
## 2. Standardized error response usage in controllers and middleware
- Controllers and auth middleware now consistently call RespondWithError for failures, with uniform JSON shape (error + code) and shared status-code mapping, visible in auth_controller.go, announcement_controller.go, and auth.go
## 3. Implemented toggle to enable SQL logger in dev mode
- Added DevMode detection from APP_ENV in config.go, and conditionally enabled GORM SQL logging in database.go
## 4. Implemented graceful shutdown upon DB close
- Changed server startup to managed http.Server + signal handling in main.go, then shut down HTTP gracefully and close DB using deferred CloseDatabase.
## 5. Handle DB connection errors properly
- Changed DB init to return errors instead of exiting inside the DB package, added underlying sql.DB retrieval and Ping checks, and fail fast from main when init fails in database.go and main.go.
## 6. Wrote Unit Tests
Controllers
- ``controllers/controllers_test.go`` sets up an isolated in-memory SQLite DB per test and exercises handlers via Gin httptest.
- TestGetAnnouncements: verifies seeded announcement is returned with 200.
- TestCreateAnnouncement: verifies 201 and that author is overridden by userID context.
- TestUpdateAnnouncement: verifies owner update succeeds (200) and DB fields are actually changed.
- TestDeleteAnnouncement: verifies owner delete returns 200 + success message.
- TestSignup: verifies valid signup returns 201 and stores lowercase email.
- TestLogin: verifies valid credentials return 200 and JWT token is present.

Middleware

- ```middleware/middleware_test.go```
- TestAuthMiddleware: missing token is blocked with 401.
- TestAuthMiddleware_ValidToken: valid bearer JWT passes and request succeeds with 200.
- TestCORSMiddleware: CORS preflight returns expected Access-Control-Allow-Origin.

Routes

- ```routes/routes_test.go```
- TestRegisterRoutes: confirms direct route registration exposes /api/health with 200.
- TestSetupRouter: confirms full router setup path also serves /api/health with 200.

Run unit tests by running:
```bash
go test -v ./...
```
---

## Incomplete Issues

### Optional Refresh Token Support
- Refresh token endpoint was identified as optional
- Not implemented in Sprint 2
- Can be considered later if session duration becomes a UX issue

### Additional Production Hardening
- More edge-case validation may still be needed across all controllers
- Further test coverage planned in later sprints

---

## Notes

Sprint 2 primarily focused on infrastructure improvements rather than large user-facing feature expansion.  
This sprint established stronger logging, observability, cleaner backend responses, and smoother frontend-backend integration.

Some deeper testing and production-readiness work continues in later sprints.

---

# Sprint 2 Status

Core Sprint 2 backend deliverables were completed, including structured logging, monitoring integration, middleware improvements, and token integration support.

This sprint significantly improved backend maintainability, debugging visibility, and readiness for future testing and deployment.

---

# Next Steps (Sprint 3)

- Continue writing authentication controller tests
- Implement alerts feature backend
- Add alert model and routes
- Continue writing controller and middleware unit tests
- Expand automated validation coverage



# Backend API

## Project
Neighbourhood Community Platform backend built with Go + Gin + GORM + SQLite.

## Base URL
- Local: `http://localhost:8080`
- Prefix: `/api`

## Run Instructions
```bash
go run .
```

Health check:
```bash
curl http://localhost:8080/api/health
```

## Environment Variables
- `PORT` (default: `8080`)
- `DB_NAME` (default: `community.db`)
- `JWT_SECRET` (recommended)
- `TOKEN_EXPIRY` (default: `24h`)
- `FRONTEND_URL` (default: `http://localhost:4200`)
- `APP_ENV` (`development` or `dev` enables SQL query logging)

Example `.env`:
```env
PORT=8080
DB_NAME=community.db
JWT_SECRET=my-secret
TOKEN_EXPIRY=24h
FRONTEND_URL=http://localhost:4200
APP_ENV=development
```

## Authentication
Protected routes require:
- Header: `Authorization: Bearer <token>`
- Token is obtained from `POST /api/login`

## Error Format
Standard error response:
```json
{
  "error": "message",
  "code": "ERROR_CODE"
}
```

Common codes: `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `INTERNAL_SERVER_ERROR`.

### Error Logging Behavior
- Error logging is centralized in `utils.RespondWithError(...)`.
- For `5xx`, backend logs at `ERROR` level.
- For `4xx`, backend logs at `WARN` only when extra context attrs are provided.
- Structured attrs (for example: `id`, `user_id`, `op`, `error`) are included in the same log event.
- The API response message (`error`) is sourced from the `AppError` message.

## API Endpoints

### 1) Health
- `GET /api/health` (public)
- Response:
```json
{"status":"ok"}
```

### 2) Signup
- `POST /api/signup` (public)
- Request:
```json
{
  "name": "Jane",
  "email": "jane@example.com",
  "password": "password123"
}
```
- Success: `201 Created`

### 3) Login
- `POST /api/login` (public)
- Request:
```json
{
  "email": "jane@example.com",
  "password": "password123"
}
```
- Success: `200 OK` with JWT token in `data.token`

### 4) Get Announcements
- `GET /api/announcements` (public)
- Success: `200 OK` with announcement array

### 5) Create Announcement
- `POST /api/announcements` (protected)
- Request:
```json
{
  "title": "Cleanup Event",
  "content": "Join us on Saturday"
}
```
- Success: `201 Created`

### 6) Update Announcement
- `POST /api/announcements/update` (protected)
- Request:
```json
{
  "id": 1,
  "title": "Updated title",
  "content": "Updated content"
}
```
- Success: `200 OK`
- Rule: only original author can update

### 7) Delete Announcement
- `POST /api/announcements/delete` (protected)
- Request:
```json
{
  "id": 1
}
```
- Success: `200 OK`
- Rule: only original author can delete

## Example PowerShell Flow
```powershell
# Login
$loginBody = '{"email":"ufguy@example.com","password":"gogators"}'
$loginRes = Invoke-RestMethod -Method Post -Uri "http://localhost:8080/api/login" -ContentType "application/json" -Body $loginBody
$token = $loginRes.data.token

# Create announcement
$headers = @{ Authorization = "Bearer $token" }
$createBody = '{"title":"Alligators","content":"Alligator spotting at 6pm"}'
Invoke-RestMethod -Method Post -Uri "http://localhost:8080/api/announcements" -Headers $headers -ContentType "application/json" -Body $createBody
```

## Notes for Marker
- Update/Delete are implemented as `POST` routes in this version.
- Auth endpoints return `{"data": ...}` while announcement endpoints return raw model JSON.
- App runs DB migrations automatically on startup.