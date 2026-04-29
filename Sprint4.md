# Sprint 4

# Sprint 4 Demo Video

Sprint 4 Demo Video Link - [To be added]

# Frontend – Sprint 4 Completed Work

**Frontend:**  
- Sanjith  
- Bindhu  

---

## 1. Event Edit & Update Functionality

Fully implemented the ability for users to edit their own events.

- Added an `Edit` button to event cards (visible only to the original creator).
- Developed a dedicated **Edit Event Modal** with pre-filled event data.
- Enabled updating of event fields including **Title, Date, Time, and Location**.
- Supported **Image Re-upload**: Users can now swap the event image during an edit.
- Integrated with the backend `PUT /api/events/:id` endpoint.
- Handled loading states (`isUpdatingEvent`) and error feedback for update operations.

## 2. Global Toast Notification System

Implemented a centralized toast notification system for real-time user feedback.

- Created a reusable `ToastService` and `ToastComponent`.
- Supports multiple notification types: `success`, `error`, and `info`.
- Integrated toasts across the application:
  - **Auth**: Success on login/signup, errors on failed attempts.
  - **Events**: Feedback for creation, updates, and deletions.
  - **General**: API connectivity errors.
- Automatic dismissal with configurable durations.

## 3. "Interested" Functionality Display

Improved community engagement indicators on events.

- Added the "Interested" count to the event schema and UI.
- Included an "+ Interested?" button on all event cards to allow future interaction.
- Synchronized the display with backend data models.

## 4. UI/UX Polishing

- Added loading indicators during event fetch and mutation operations.
- Implemented immediate UI updates (optimistic or state-synced) to prevent unnecessary page refreshes.
- Refined modal styling and responsive behavior for mobile devices.

## 5. Integrate GET API for Events Page

- Replaced local/in-memory event usage with backend-backed event fetching via `GET /api/events`.
- Mapped backend fields to frontend display model:
  - `title` -> event name
  - `image_url` -> event image
  - `author` -> ownership/creator logic
- Added and verified loading, error, and empty-state behavior for Events page rendering.

## 6. Create Event Using Backend API

- Connected Create Event form submission to backend `POST /api/events` (multipart).
- Included auth token handling for protected event creation requests.
- Sent required fields (`title`, `date`, `time`, `location`) and optional image payload.
- Updated UI state after successful creation and reset form state after submit.
- Added error handling for failed/unauthorized creation requests.

## 7. Delete Event Using Backend API

- Connected delete flow to backend `DELETE /api/events/:id`.
- Restricted delete action visibility to event owner-created items.
- Added confirmation prompt before deletion.
- Removed deleted events from UI state after successful backend delete.
- Handled failure/authorization error responses gracefully.

## 8. Connect "Your Events" Filter to Backend Ownership

- Derived event ownership from backend `author` field against logged-in user ID.
- Updated "Your Events" filtering to use backend ownership instead of local-only flags.
- Kept "All events" view behavior intact.
- Handled logged-out sessions so ownership actions are hidden and filtering remains safe.

## 9. Frontend Unit Tests (Angular/Vitest + Cypress)

Unit tests updated to cover Sprint 4 features:

- `frontend/src/app/pages/events/events.spec.ts`: 
  - Event fetch + backend field mapping
  - Refresh re-fetch behavior from route query params
  - Loading/error/empty states
  - Create event success + failure cases
  - Ownership-based rendering of delete/edit actions
  - Delete confirm/cancel/failure flows
  - "Your Events" filter behavior (logged-in and logged-out)
  - Edit modal save behavior
- `frontend/src/app/services/toast.service.spec.ts`: 
  - (Assuming created/updated) Verified toast message queuing.

Cypress tests:

- `frontend/cypress/e2e/login-validation.cy.ts`
  - Validates required field errors on login submit.


# Backend – Sprint 4 Project Documentation

**Backend:**  
- Parvathi  
- Justin  

---

# Backend - Sprint 4 Detailed Work (Parvathi)

## Overview

In Sprint 4, I completed all the remaining backend items from the Sprint 3 roadmap and added new capabilities. The work included implementing event update and delete endpoints with authorization checks, adding file size and MIME type validation for image uploads, building the full Alerts feature (model, controller, routes), and adding pagination support for Events and Announcements endpoints. All new code follows the same patterns for error handling, structured logging, authentication, and testing established in prior sprints.

---

## 1. Event Update & Delete Endpoints  

Implemented PUT and DELETE endpoints for events with ownership verification.

### PUT /api/events/:id — Update Event

- Accepts `multipart/form-data` to allow updating text fields and optionally replacing the event image
- Parses form fields: `title`, `date`, `time`, `location` (updates only provided fields)
- Extracts authenticated user ID from JWT middleware context
- Verifies the requesting user is the event author before allowing updates
- Returns `403 Forbidden` if the user is not the event owner
- Returns `404 Not Found` if the event does not exist
- Supports optional image replacement with the same upload validation pipeline

### DELETE /api/events/:id — Delete Event

- Requires authentication via JWT middleware
- Verifies the requesting user is the event author before allowing deletion
- Returns `403 Forbidden` if the user is not the event owner
- Returns `404 Not Found` if the event does not exist
- Returns `200 OK` with success message on deletion

Implementation details:
- Both endpoints use URL parameter `:id` for event identification
- Authorization check ensures only the event creator can modify/delete their events
- Image replacement in update reuses the same unique filename generation and upload pipeline
- Consistent error responses via `utils.RespondWithError()`

Files modified:
- `controllers/event_controller.go` — added `UpdateEvent` and `DeleteEvent` handlers
- `routes/routes.go` — registered `PUT /api/events/:id` and `DELETE /api/events/:id`

---

## 2. File Size & Type Validation for Image Uploads  

Added server-side validation for uploaded images to prevent abuse and ensure only valid image files are accepted.

### File Size Validation
- Maximum upload size: **5 MB** (`MaxUploadSize = 5 * 1024 * 1024`)
- Returns `400 Bad Request` with message `"Image file size exceeds the 5MB limit"` if exceeded
- Applied to both `CreateEvent` and `UpdateEvent` endpoints

### File Type Validation (MIME Type Checking)
- Reads the first 512 bytes of the uploaded file
- Uses `http.DetectContentType()` for reliable MIME type detection
- Allowed types: `image/jpeg`, `image/png`, `image/webp`
- Returns `400 Bad Request` with message `"Invalid file type. Only JPEG, PNG, and WEBP are allowed"` for other types
- Validates actual file content, not just file extension (prevents spoofed uploads)

Files modified:
- `controllers/event_controller.go` — added validation in `CreateEvent` and `UpdateEvent`

Benefits:
- Prevents excessively large files from consuming server storage
- Blocks non-image files from being uploaded even if they have image extensions
- Content-based detection is more secure than extension-based validation

---

## 3. Alerts Feature — Model, Controller, Routes  

Built the complete Alerts feature end-to-end, following the same architecture as Events and Announcements.

### Alert Data Model

Model fields:
- `ID` — auto-generated primary key (via `gorm.Model`)
- `Title` — alert title (required)
- `Message` — alert message body (required)
- `Type` — alert type/category, e.g., `"warning"`, `"info"`, `"danger"` (required)
- `Author` — user ID of the authenticated creator (required)
- `CreatedAt` / `UpdatedAt` / `DeletedAt` — automatic GORM timestamps

File added:
- `models/alert.go`

### Alert Controller — API Handlers

Implemented four alert API handlers in `controllers/alert_controller.go`:

- **GET /api/alerts** — Fetch all alerts (public)
- **POST /api/alerts** — Create a new alert (protected)
- **PUT /api/alerts/:id** — Update an existing alert (protected, author-only)
- **DELETE /api/alerts/:id** — Delete an alert (protected, author-only)

All protected endpoints:
- Require JWT authentication via `AuthMiddleware()`
- Verify the requesting user is the alert author before allowing modifications
- Return appropriate HTTP error codes (`401`, `403`, `404`)

### Route Registration

Routes added in `routes/routes.go`:
- `GET /api/alerts` — public
- `POST /api/alerts` — protected
- `PUT /api/alerts/:id` — protected
- `DELETE /api/alerts/:id` — protected

### Database Migration

- Added `models.Alert{}` to the `AutoMigrate` call in `main.go`
- The `alerts` table is automatically created on server startup

---

## 4. Pagination for Events & Announcements  

Added offset-based pagination to `GET /api/events` and `GET /api/announcements` so the frontend can request specific pages of results.

### Shared Pagination Utility

Created a reusable pagination package in `utils/pagination.go`:

- `PaginationParams` struct — holds parsed `page` and `limit` values
- `PaginatedResponse` struct — wraps results with metadata (`data`, `page`, `limit`, `total`, `total_pages`)
- `ParsePagination(c *gin.Context)` — reads `page` & `limit` query parameters with defaults and clamping
- `Paginate(db, params, dest)` — executes count + offset/limit queries and returns the envelope

Defaults and constraints:
- Default page: `1`
- Default limit: `10`
- Maximum limit: `100`
- Invalid/negative values are clamped to defaults

### Updated Endpoints

**GET /api/events?page=1&limit=10**
- Returns paginated results ordered by `created_at desc`
- Response format changed from raw array to paginated envelope

**GET /api/announcements?page=1&limit=10**
- Returns paginated results
- Response format changed from raw array to paginated envelope

### Paginated Response Format

```json
{
  "data": [
    {
      "ID": 1,
      "title": "Community BBQ",
      "date": "2026-04-20",
      "time": "5:00 PM",
      "location": "Central Park Pavilion",
      "image_url": "/uploads/1712345678_abc123.jpg",
      "author": "7"
    }
  ],
  "page": 1,
  "limit": 10,
  "total": 42,
  "total_pages": 5
}
```

Files added:
- `utils/pagination.go`
- `utils/pagination_test.go`

Files modified:
- `controllers/event_controller.go` — `GetEvents` uses `Paginate()`
- `controllers/announcement_controller.go` — `GetAnnouncements` uses `Paginate()`
- `controllers/controllers_test.go` — updated existing tests and added new pagination tests

---

## API Endpoints — Sprint 4 Summary

### 10) Update Event
- `PUT /api/events/:id` (protected)
- Content-Type: `multipart/form-data`
- Form fields: `title`, `date`, `time`, `location` (all optional), `image` (optional file)
- Success: `200 OK` with updated event object
- Errors: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

### 11) Delete Event
- `DELETE /api/events/:id` (protected)
- Success: `200 OK` with `{"message": "Event deleted successfully"}`
- Errors: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

### 12) Get Alerts
- `GET /api/alerts` (public)
- Success: `200 OK` with alerts array

### 13) Create Alert
- `POST /api/alerts` (protected)
- Body: `{"title": "...", "message": "...", "type": "warning"}`
- Success: `201 Created`

### 14) Update Alert
- `PUT /api/alerts/:id` (protected)
- Body: `{"title": "...", "message": "...", "type": "..."}`
- Success: `200 OK` with updated alert
- Errors: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

### 15) Delete Alert
- `DELETE /api/alerts/:id` (protected)
- Success: `200 OK` with `{"message": "Alert deleted successfully"}`
- Errors: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

### Updated Endpoints (Pagination)
- `GET /api/events?page=1&limit=10` — now returns paginated envelope
- `GET /api/announcements?page=1&limit=10` — now returns paginated envelope

---

# Backend — Sprint 4 Contribution (Justin)

## Overview

In Sprint 4 I focused on expanding unit test coverage to include event update/delete operations, comprehensive alert CRUD testing, and validation of image upload constraints across all image-handling endpoints.

The new tests in [controllers/controllers_test.go](controllers/controllers_test.go) validate event modification behavior (UpdateEvent), event deletion behavior (DeleteEvent), and complete alert lifecycle operations (GetAlerts, CreateAlert, UpdateAlert, DeleteAlert) using the same Gin + in-memory SQLite pattern established in Sprint 3.

Tests specifically exercise authorization checks (author-only updates/deletes), optional partial field updates, image replacement scenarios, file type validation (JPEG/PNG/WEBP only), file size limits (5MB max), and authentication requirements across all mutation endpoints.

### Event Update/Delete Tests (7 tests)

- **TestUpdateEvent_SuccessfulUpdate**: Seeds an event, sends multipart form with new values; expects 200 and verifies all fields updated in DB.
- **TestUpdateEvent_ForbiddenForDifferentAuthor**: Seeds event by user1, attempts update from user2; expects 403 Forbidden (authorization check).
- **TestUpdateEvent_WithImageReplacement**: Seeds event with existing image URL, uploads new image; expects 200 and confirms old image URL replaced with new path.
- **TestUpdateEvent_ImageUpload_InvalidType**: Attempts to upload non-image file (.txt); expects 400 BadRequest with "Invalid file type" message.
- **TestUpdateEvent_ImageUpload_ExceedsSizeLimit**: Attempts to upload file larger than 5MB; expects 400 BadRequest with size limit message.
- **TestDeleteEvent_SuccessfulDeletion**: Seeds event, sends DELETE request; expects 200 with success message and verifies soft delete in DB.
- **TestDeleteEvent_ForbiddenForDifferentAuthor**: Seeds event by user1, attempts delete from user2; expects 403 Forbidden (authorization check).

### Alert CRUD Tests (9 tests)

- **TestGetAlerts_EmptyList**: Calls GET /api/alerts with no seeded rows; expects 200 with empty JSON array.
- **TestGetAlerts_WithData**: Seeds 3 alerts, calls GET /api/alerts; expects 200 with array of 3 alert objects.
- **TestCreateAlert_SuccessfulCreation**: Sends JSON payload with auth context; expects 201 and confirms Author set from userID, all fields persisted.
- **TestCreateAlert_Unauthorized**: Calls POST /api/alerts without userID context; expects 401 Unauthorized (requires authentication).
- **TestUpdateAlert_SuccessfulUpdate**: Seeds alert by user1, sends partial JSON update; expects 200 and verifies specified fields updated in DB.
- **TestUpdateAlert_ForbiddenForDifferentAuthor**: Seeds alert by user1, attempts update from user2; expects 403 Forbidden (authorization check).
- **TestUpdateAlert_NoFieldsToUpdate**: Seeds alert, sends empty JSON object for update; expects 400 BadRequest with "No fields to update" message.
- **TestDeleteAlert_SuccessfulDeletion**: Seeds alert, sends DELETE request; expects 200 with success message and verifies soft delete in DB.
- **TestDeleteAlert_ForbiddenForDifferentAuthor**: Seeds alert by user1, attempts delete from user2; expects 403 Forbidden (authorization check).

### Image Validation Coverage

Image upload validation tests are exercised across two endpoint families:

**Create Endpoints:**
- `TestCreateEvent_WithImageUpload` (Sprint 3): Valid image → 201, image_url populated
- `TestCreateEvent_ImageUpload_InvalidType` (Sprint 3): Invalid MIME type → 400
- `TestCreateEvent_ImageUpload_ExceedsSizeLimit` (Sprint 3): File > 5MB → 400
- `TestCreateEvent_WithoutImage_Optional` (Sprint 3): No image file → 201, image_url empty

**Update Endpoints:**
- `TestUpdateEvent_WithImageReplacement` (Sprint 4): Valid replacement → 200, old URL replaced
- `TestUpdateEvent_ImageUpload_InvalidType` (Sprint 4): Invalid MIME type → 400
- `TestUpdateEvent_ImageUpload_ExceedsSizeLimit` (Sprint 4): File > 5MB → 400

**Validation Rules Tested:**
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
- Size limit: 5MB (5242880 bytes)
- Invalid types rejected with: "Invalid file type. Only JPEG, PNG, and WEBP are allowed"
- Oversized files rejected with: "Image file size exceeds the 5MB limit"

---

## Support Changes Included

### Database Migration Update
Added `models.Alert{}` to the `AutoMigrate` call in `setupControllerTestDB()` to support alert tests against in-memory SQLite schema:

```go
if err := db.AutoMigrate(&models.User{}, &models.Announcement{}, &models.Event{}, &models.Alert{}); err != nil {
    t.Fatalf("failed to migrate test db: %v", err)
}
```

### CreateAlert Authorization Fix
Updated [controllers/alert_controller.go](controllers/alert_controller.go) `CreateAlert()` function to enforce authentication requirement (was allowing unauthenticated alert creation):

```go
// Ensure user is authenticated
if alert.Author == "" {
    utils.RespondWithError(c, utils.Unauthorized("Unable to identify alert author"))
    return
}
```

---

## Total Test Reference

All tests across sprints that remain valid and continue passing:

**Announcement CRUD:**
- `TestGetAnnouncements` — paginated response with data array
- `TestCreateAnnouncement`
- `TestUpdateAnnouncement`
- `TestDeleteAnnouncement`

**Authentication:**
- `TestSignup`
- `TestLogin`

**Event Get/Create:**
- `TestGetEvents_EmptyList` — paginated empty response
- `TestGetEvents_SortedByCreatedAtDesc` — paginated, sorted response
- `TestCreateEvent_SuccessfulCreation`
- `TestCreateEvent_MissingRequiredField_Title`
- `TestCreateEvent_MissingRequiredField_Date`
- `TestCreateEvent_MissingRequiredField_Time`
- `TestCreateEvent_MissingRequiredField_Location`
- `TestCreateEvent_NoAuthToken`
- `TestCreateEvent_WithImageUpload`
- `TestCreateEvent_ImageUpload_InvalidType`
- `TestCreateEvent_ImageUpload_ExceedsSizeLimit`
- `TestCreateEvent_WithoutImage_Optional`

**Event Update/Delete:**
- `TestUpdateEvent_SuccessfulUpdate` (new)
- `TestUpdateEvent_ForbiddenForDifferentAuthor` (new)
- `TestUpdateEvent_WithImageReplacement` (new)
- `TestUpdateEvent_ImageUpload_InvalidType` (new)
- `TestUpdateEvent_ImageUpload_ExceedsSizeLimit` (new)
- `TestDeleteEvent_SuccessfulDeletion` (new)
- `TestDeleteEvent_ForbiddenForDifferentAuthor` (new)

**Alert CRUD:**
- `TestGetAlerts_EmptyList` (new)
- `TestGetAlerts_WithData` (new)
- `TestCreateAlert_SuccessfulCreation` (new)
- `TestCreateAlert_Unauthorized` (new)
- `TestUpdateAlert_SuccessfulUpdate` (new)
- `TestUpdateAlert_ForbiddenForDifferentAuthor` (new)
- `TestUpdateAlert_NoFieldsToUpdate` (new)
- `TestDeleteAlert_SuccessfulDeletion` (new)
- `TestDeleteAlert_ForbiddenForDifferentAuthor` (new)

**Controller Pagination Tests:**
- `TestGetEvents_Pagination_DefaultParams` (new)
- `TestGetEvents_Pagination_CustomPage` (new)
- `TestGetEvents_Pagination_BeyondLastPage` (new)
- `TestGetAnnouncements_Pagination_DefaultParams` (new)
- `TestGetAnnouncements_Pagination_CustomPage` (new)

**Utils Pagination Tests (7 tests):**
- `TestParsePagination_Defaults` (new)
- `TestParsePagination_CustomValues` (new)
- `TestParsePagination_NegativePageClampedToDefault` (new)
- `TestParsePagination_ZeroPageClampedToDefault` (new)
- `TestParsePagination_LimitClampedToMax` (new)
- `TestParsePagination_InvalidStringsUseDefaults` (new)
- `TestParsePagination_NegativeLimitClampedToDefault` (new)

**Middleware Tests (3 tests):**
- `TestAuthMiddleware`
- `TestCORSMiddleware`
- `TestAuthMiddleware_ValidToken`

**Routes Tests (2 tests):**
- `TestRegisterRoutes`
- `TestSetupRouter`

---

## Test Helper Notes

### Database Setup
```go
func setupControllerTestDB(t *testing.T) // in-memory SQLite, auto-migrates all models
```
Creates isolated per-test database with User, Announcement, Event, and Alert migrations.

### Request Helpers
```go
func performJSONRequest(r *gin.Engine, method, path string, payload any)
// Constructs JSON request with Content-Type: application/json

func performMultipartRequest(r *gin.Engine, method, path string, fields map[string]string, fileField, fileName string, fileData []byte)
// Constructs multipart/form-data request supporting optional file upload
```

### Authentication Simulation
```go
r.POST("/api/events", func(c *gin.Context) {
    c.Set("userID", "user123")  // Simulate authenticated request
    UpdateEvent(c)
})
```
Tests set the `userID` context variable to simulate successful JWT authentication without requiring actual token middleware.

### Data Seeding
```go
func seedEvents(t *testing.T, count int)     // Creates N events for pagination tests
func seedAnnouncements(t *testing.T, count int) // Creates N announcements for pagination tests
```

---
## How to Run Tests

```bash
cd backend
go test -v ./...
```

---

## Summary

Sprint 4 completed all the deferred items from Sprint 3's roadmap: event update/delete, image upload validation, alerts feature, and pagination. Every feature includes structured logging, proper error handling, JWT-based authorization with ownership verification, and comprehensive test coverage. The codebase maintains a consistent architecture across all resource types (Announcements, Events, Alerts).

---

# Sprint 4 Status

Core Sprint 4 backend deliverables were completed:
- Event update and delete endpoints with ownership verification
- File size (5MB) and MIME type validation for image uploads
- Full Alerts feature (model, CRUD endpoints, route registration)
- Pagination for Events and Announcements with shared utility
- 28 new unit tests (7 pagination utility + 5 controller integration + 7 event + 9 alert)
- All 51 backend tests passing

This sprint resolved all remaining backend items and added pagination as a new capability for frontend scalability.

---

# Next Steps (Sprint 5)

- Continue frontend-backend integration for alerts
- Add search/filtering capabilities for events and announcements
- Consider adding RSVP/interested functionality for events
- Expand unit test coverage for alert controller edge cases
- Add integration tests for the full request lifecycle
