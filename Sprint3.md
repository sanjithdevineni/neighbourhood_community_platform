# Sprint 3

# Sprint 3 Demo Video

[Sprint 3 Demo Video Link](https://youtu.be/WxU0e8vZE10)

# Frontend – Sprint 3 Completed Work

**Frontend:**
- Sanjith
- Bindhu

---

## 1. Neighborhood Map Feature

Implemented a new Neighborhood page with interactive map functionality.

- Added routing for `/neighborhood`
- Connected the `Neighborhood` sidebar button to the new route
- Created a dedicated Neighborhood component
- Integrated Leaflet map library
- Displayed the map on page load
- Enabled zoom controls (zoom in and zoom out)
- Ensured streets and landmarks render correctly
- Kept map behavior local to Gainesville with category-based points
- Applied styling consistent with the rest of the app

---

## 2. Account Page Navigation Enhancement

Improved navigation flow from the Account page.

- Added a clear `Back to Home` button on the Account page
- Positioned it near the top section for intuitive back navigation
- Implemented routing to `/` without page refresh
- Kept button styling consistent with the design system

---

## 3. Event Creation With Validation

Implemented event creation UI with improved validation and UX.

- Built Create Event modal
- Added validation using Angular template-driven forms (`ngForm`)
- Enforced required fields:
  - Event name
  - Date
  - Month
  - Time
  - Location
- Displayed inline validation error messages
- Disabled submit button for invalid forms
- Implemented image upload with preview
- Added image validation to allow only valid image files
- Reset form and modal state after successful submission

---

## 4. Event Delete Functionality

Implemented delete functionality for user-created events.

- Added `Delete` button for `createdByUser` events
- Showed delete option only for user-created events
- Added confirmation dialog before deletion
- Updated UI immediately after delete using local state
- Preserved compatibility with `Your Events` filtering

---

## 5. Empty State Handling for Events

Implemented dynamic empty-state UX on the Events page.

- Displayed `No events available` when no events exist
- Displayed `No events created yet` when filtering to user events
- Added contextual helper messaging
- Added `Create an event` CTA inside empty state
- Kept alignment and styling consistent

---

## 6. Events Filtering (Your Events Toggle)

Implemented filtering functionality.

- Added toggle between `All Events` and `Your Events`
- Filtered events based on `createdByUser`
- Integrated filtering with empty-state logic
- Ensured dynamic UI updates without refresh

---

## 7. Conditional Rendering Improvements

Improved UI behavior across event states.

- Displayed events grid when data exists
- Displayed empty state when data is unavailable
- Controlled visibility of:
  - Header `Create Event` button
  - Empty-state CTA button
- Maintained consistent UX across scenarios

---

## 8. Frontend Unit Tests (Angular/Vitest)

Frontend unit tests added/updated for Sprint 3 work:

- `frontend/src/app/pages/neighborhood/neighborhood.spec.ts`
- `frontend/src/app/pages/events/events.spec.ts`
- `frontend/src/app/pages/account/account.component.spec.ts`
- `frontend/src/app/navbar/navbar.spec.ts`
- `frontend/src/app/app.routes.spec.ts`

Coverage highlights:

- Neighborhood page render, category switching, and item-focus map flow
- Events empty states, create modal flow, form validation, and delete flow
- Account page Home return flow (`Back to Home`)
- Navbar search submit behavior and Account routing behavior
- Core route config checks (`account` guard and `neighborhood` route)

---

## How To Run Frontend Unit Tests

From `frontend/`:

1. Install dependencies:
   - `npm install`
2. Run unit tests:
   - `npm run test:unit`
3. Optional headless run:
   - `npm run test:unit -- --watch=false --browsers=ChromeHeadless`

Note:
- Angular CLI requires Node `>=20.19` (or `>=22.12`).

---

## Frontend Sprint 3 Status

Frontend Sprint 3 deliverables were completed, including navigation improvements, map integration, Events UX enhancements, and expanded frontend unit-test coverage.

---

# Backend – Sprint 3 Project documentation

**Backend:**  
- Parvathi  
- Justin  

---

# Backend - Sprint 3 Detailed Work (Parvathi)

## Overview

In Sprint 3, I focused on implementing the new Events feature end-to-end on the backend, including the data model, API endpoints, image upload handling, and route integration with authentication. I also continued improving the codebase with structured logging in the new controller and ensured the Events feature followed the same patterns established in Sprint 2 for error handling, observability, and token-based access control.

---

## 1. Event Data Model

Designed and implemented the `Event` model for community events.

Model fields:
- `ID` — auto-generated primary key (via `gorm.Model`)
- `Title` — event title (required)
- `Date` — event date string (required)
- `Time` — event time string (required)
- `Location` — event location (required)
- `ImageURL` — optional image URL for event flyer/image
- `Author` — user ID of the authenticated creator (required)
- `CreatedAt` / `UpdatedAt` / `DeletedAt` — automatic GORM timestamps

File added:
- `models/event.go`

Benefits:
- Clean, minimal schema aligned with frontend event card design
- Consistent use of `gorm.Model` for automatic timestamps and soft deletes
- JSON tags matching the frontend's expected response shape

---

## 2. Events Controller — API Handlers

Implemented two event API handlers in `controllers/event_controller.go`.

### GET /api/events — Fetch All Events
- Returns all events ordered by newest first (`created_at desc`)
- Public endpoint — no authentication required
- Returns JSON array of event objects

### POST /api/events — Create Event
- Accepts `multipart/form-data` to support image uploads alongside text fields
- Parses form fields: `title`, `date`, `time`, `location`
- Validates all required fields are present
- Extracts authenticated user ID from the JWT middleware context as the event author
- Returns `401 Unauthorized` if user identity cannot be determined

Implementation details:
- Uses `c.PostForm()` for form field parsing instead of JSON binding (to support file uploads)
- Author is derived from the authenticated `userID` context value, not from the request body
- Returns `201 Created` on success with the full event object

Benefits:
- Consistent error handling using the centralized `utils.RespondWithError()` pattern
- Structured `slog` logging on event creation and fetch
- Follows the same controller patterns established for announcements

---

## 3. Image Upload Support

Implemented optional image upload for events with secure file handling.

Upload flow:
1. Check if an `image` field is present in the multipart form
2. Create `./uploads` directory if it does not exist
3. Generate a unique filename using `timestamp_uuid.extension` to prevent collisions
4. Save the uploaded file to `./uploads/<unique-name>`
5. Store the relative URL path `/uploads/<unique-name>` in the event's `ImageURL` field

File handling details:
- Uses `uuid.New()` from `github.com/google/uuid` for collision-free filenames
- Preserves original file extension
- Serves uploaded files via Gin's static file serving (`router.Static("/uploads", "./uploads")`)

Dependencies added:
- `github.com/google/uuid` — for generating unique upload filenames

Static file serving:
- Added `router.Static("/uploads", "./uploads")` in `main.go`
- Frontend can load event images via `<img src="/uploads/filename.jpg">`
- Works with both local development and the Angular proxy setup

Benefits:
- Safe concurrent uploads without filename collisions
- Frontend can reference uploaded images directly via `/uploads/...` URL
- Image is optional — events can be created without an image
- Simple, no-dependency approach to serving user-uploaded images

---

## 4. Route Registration

Registered the new event endpoints in the backend router.

Routes added:
- `GET /api/events` — public, fetches all events
- `POST /api/events` — protected with `AuthMiddleware()`, creates a new event

File updated:
- `routes/routes.go`

Benefits:
- Creating events requires valid JWT authentication
- Viewing events is publicly accessible
- Consistent route structure matching existing announcement endpoints

---

## 5. Database Migration Update

Updated the auto-migration to include the new Event model.

Change:
- Added `models.Event{}` to the `AutoMigrate` call in `main.go`

Behavior:
- On server startup, the `events` table is automatically created if it doesn't exist
- Existing tables (`users`, `announcements`) are unaffected

Benefits:
- Zero-downtime schema evolution
- No manual SQL scripts needed
- Consistent with existing migration approach

---

## API Endpoints Added

### 8) Get Events
- `GET /api/events` (public)
- Success: `200 OK` with event array ordered by newest first
- Response example:
```json
[
  {
    "ID": 1,
    "CreatedAt": "2026-04-10T14:23:15Z",
    "UpdatedAt": "2026-04-10T14:23:15Z",
    "DeletedAt": null,
    "title": "Community BBQ",
    "date": "2026-04-20",
    "time": "5:00 PM",
    "location": "Central Park Pavilion",
    "image_url": "/uploads/1712345678_abc123.jpg",
    "author": "7"
  }
]
```

### 9) Create Event
- `POST /api/events` (protected)
- Content-Type: `multipart/form-data`
- Form fields:
  - `title` (required)
  - `date` (required)
  - `time` (required)
  - `location` (required)
  - `image` (optional file)
- Success: `201 Created`

---

# Backend — Sprint 3 Contribution (Justin)

## User Stories Implemented

- As a developer, I want comprehensive unit tests covering all backend controllers so we can catch regressions early.
- As a developer, I want unit tests for the events feature to validate the new API endpoints work correctly.
- As a developer, I want test coverage for edge cases and error paths so the backend handles failures gracefully.

---

## Overview

In Sprint 3 I focused on writing comprehensive unit tests for the newly implemented Events feature.

The new tests in controllers/controllers_test.go validate both event read behavior (GetEvents) and event creation behavior (CreateEvent) using the same Gin + in-memory SQLite pattern as your announcement tests.
They specifically exercise multipart form handling, auth context (userID), required field validation, and optional image upload behavior.

- `TestGetEvents_EmptyList`: Calls GET /api/events with no seeded rows and asserts 200 plus an empty JSON array.
- `TestGetEvents_SortedByCreatedAtDesc`: Seeds 3 events with different timestamps and verifies response order is newest-first.
- `TestCreateEvent_SuccessfulCreation`: Sends valid multipart form fields with mocked userID; expects 201 and confirms DB row values.
- `TestCreateEvent_MissingRequiredField_Title/Date/Time/Location`: Omits one required field per test; each must return 400.
- `TestCreateEvent_NoAuthToken`: Calls create route without setting userID; expects 401.
- `TestCreateEvent_WithImageUpload` : Sends multipart form plus image bytes; expects 201, non-empty image_url, and persisted image URL.
- `TestCreateEvent_WithoutImage_Optional`: Sends valid form without image; expects 201 and successful save with empty image_url.

### Support changes included

Added multipart request helper so tests can mimic real multipart/form-data uploads.
Updated test DB migration to include models.Event, so event tests run against the in-memory schema automatically.

### Existing Test Reference

Tests from Sprint 2 that remain valid and should continue passing:
- `TestGetAnnouncements`
- `TestCreateAnnouncement`
- `TestUpdateAnnouncement`
- `TestDeleteAnnouncement`
- `TestSignup`
- `TestLogin`
- `TestAuthMiddleware`
- `TestAuthMiddleware_ValidToken`
- `TestCORSMiddleware`
- `TestRegisterRoutes`
- `TestSetupRouter`

### How to Run Tests

```bash
cd backend
go test -v ./...
```

### Test Helper Notes

- Use `setupControllerTestDB(t)` for in-memory SQLite per test (already exists)
- Add `models.Event{}` to the `AutoMigrate` call in `setupControllerTestDB` to support event tests
- For multipart form tests, use a multipart request helper `performMultipartRequest()` which uses `mime/multipart` and `bytes.Buffer` to construct the request body
- Set `c.Set("userID", "<id>")` in test middleware to simulate authenticated requests

---

## Incomplete Issues

### Event Update / Delete Endpoints
- Update and delete event endpoints are not yet implemented
- Can be added in Sprint 4 if needed by frontend

### Alerts Feature Backend
- Alerts model and API endpoints were planned for Sprint 3
- Deferred to Sprint 4 due to Events feature prioritization

### Additional Production Hardening
- File size limits for image uploads not yet enforced
- Image type validation (MIME type checking) not yet implemented
- Can be addressed in Sprint 4

### Continued unit testing for Announcements and Authentication
- Create more fail cases to confirm expected results

---

## Notes

Sprint 3 focused on delivering the Events feature as a new user-facing backend capability, while maintaining the infrastructure and quality improvements from Sprint 2. The Events feature follows the same patterns for error handling, logging, authentication, and testing established in prior sprints.

To ensure the quality of the new Events feature, we also wrote a comprehensive unit test suite for Sprint 3, with multiple fail cases being covered for each function.

---

# Sprint 3 Status

Core Sprint 3 backend deliverables were completed:
- Events data model and database migration
- Events API endpoints (GET and POST) with authentication
- Image upload support with unique filename generation
- Static file serving for uploaded images
- Structured logging for events controller
- Test outline prepared for Justin's test implementation

This sprint added a significant new feature to the platform while preserving backend stability and code quality.

---

# Next Steps (Sprint 4)

- Implement event update and delete endpoints
- Implement alerts feature backend (model, routes, controller)
- Add file size and MIME type validation for image uploads
- Expand unit test coverage based on Sprint 3 test results
- Continue frontend-backend integration for events
- Consider adding pagination for events and announcements lists
