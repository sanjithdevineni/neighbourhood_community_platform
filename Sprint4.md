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


# Backend – Sprint 4 Completed Work

**Backend:**  
- Parvathi  
- Justin  

---

