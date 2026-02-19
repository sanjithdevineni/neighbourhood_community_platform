# Sprint 1 Report

## Project Overview

The Neighborhood Community Platform is designed to allow residents to:
- Share announcements
- View and host events
- Receive important neighborhood alerts
- Search content
- Connect within their neighborhood

Sprint 1 established both:
- Foundational frontend structure using static/in-memory mock data.
- Foundational backend architecture for authentication, protected APIs, and persistence setup.

Frontend demo video link - https://youtu.be/tRu94gelh-s?si=UENC51pflmIG9WHd

Backend demo video link - https://youtu.be/uNBItlX_YIY

---

# Full Product User Stories (Overall System Vision)

## Authentication & User Management
1. As a user, I want to register an account so I can join my neighborhood.
2. As a user, I want to log in securely.
3. As a user, I want to log out of my account.
4. As a user, I want my session to persist across page reloads.

## Announcements
5. As a user, I want to view neighborhood announcements.
6. As a user, I want to create a new announcement.
7. As a user, I want to edit or delete my announcements.
8. As a user, I want to search announcements.
9. As a user, I want announcements to be fetched from the backend database.

## Events
10. As a user, I want to view upcoming events.
11. As a user, I want to host/create an event.
12. As a user, I want to upload an image for my event.
13. As a user, I want to see only the events I created.
14. As a user, I want events to be saved and retrieved from the backend.

## Alerts
15. As a user, I want to view important neighborhood alerts (e.g., safety notices, road closures).
16. As a user, I want alerts to be visually distinguishable from regular announcements.
17. As a user, I want alerts to be fetched from the backend in real time.
18. As an admin, I want to create and manage alerts.

## Navigation & Layout
19. As a user, I want clear navigation between pages.
20. As a user, I want active link highlighting in the sidebar.
21. As a user, I want a responsive layout on mobile devices.
22. As a user, I want a consistent navbar and sidebar across pages.

## Future Enhancements
23. As a user, I want notifications for new alerts.
24. As a user, I want to mark interest in events.
25. As a user, I want real-time updates without refreshing the page.

---

# Sprint 1 - Frontend Scope

## Contributors (Frontend)

- Bindhu
- Sanjith

## Sprint Goal (Frontend)

Establish the foundational frontend structure including routing, layout, announcements feed, events UI, alerts page structure, and responsive design using static mock data.

## User Stories Implemented (Frontend)

- As a user, I want to view neighborhood announcements.
- As a user, I want to create a new announcement.
- As a user, I want to search announcements.
- As a user, I want to view upcoming events.
- As a user, I want to host/create an event.
- As a user, I want to upload an image for my event.
- As a user, I want to see only the events I created.
- As a user, I want to view important neighborhood alerts.
- As a user, I want clear navigation between pages.
- As a user, I want active link highlighting in the sidebar.
- As a user, I want a responsive layout on mobile devices.
- As a user, I want a consistent navbar and sidebar across pages.

## Issues Planned for Sprint 1 (Frontend)

- Configure Angular routing:
  - `/` (Home)
  - `/alerts`
  - `/events`
- Create Layout component (Navbar + Sidebar)
- Implement Navbar with search and account button
- Implement Sidebar with active route highlighting
- Create Announcement List component (static mock data)
- Implement Create Post UI
- Add SearchService for filtering announcements
- Create Alerts page (UI structure only)
- Create Events page with static event cards
- Implement Create Event modal UI
- Add image upload preview functionality
- Implement "Your Events" filter (frontend only)
- Add responsive design support (media queries)

## Completed Issues (Frontend)

- Working routes (`/`, `/alerts`, `/events`)
- Stable layout structure with Navbar and Sidebar
- Sidebar navigation with active route highlighting
- Search functionality filtering announcements (frontend only)
- Announcement feed using mock data
- Create Post UI functionality (no backend persistence)
- Events page with styled event cards
- Create Event modal form (UI only)
- Image upload preview for events
- "Your Events" filter logic (frontend state-based)
- Alerts page structure implemented (static content/UI only)
- Responsive layout tested under 768px width

## Detailed Work (Frontend)

### 1. Routing and Page Foundation
- Configured Angular routing for Home, Alerts, and Events.
- Created placeholder/feature pages under shared app layout.

### 2. Global Layout, Navbar, and Sidebar
- Built reusable layout wrapper with persistent Navbar and Sidebar.
- Added navbar search input and account button UI.
- Added sidebar links with active route highlighting.

### 3. Announcement Feed and Post UI
- Built announcement list from mock/static data.
- Added create post input flow with in-memory behavior.
- Integrated SearchService to filter displayed announcements.

### 4. Events Experience (UI-Only)
- Built static event card grid.
- Implemented create event modal UI.
- Added image upload preview.
- Implemented "Your Events" frontend-only filtering logic.

### 5. Alerts Experience (UI-Only)
- Created alerts page with static alert cards.
- Styled alerts distinctly from announcements.

### 6. Responsive Behavior
- Added media-query-driven adjustments for layout.
- Ensured readability and usable navigation under 768px.

## Testing Performed (Frontend)

- Verified route navigation for Home, Alerts, and Events.
- Verified sidebar active route state changes across navigation.
- Verified search filtering updates visible announcements.
- Verified create post and events UI interactions in local frontend state.
- Verified image upload preview renders in events flow.
- Verified layout responsiveness and readability under 768px widths.

## Incomplete Issues / Technical Debt (Frontend)

- User registration and login UX integrated with backend authentication.
- Backend API integration for announcements, events, and alerts.
- Persisting created posts/events to database-backed APIs.
- Admin management interface for alerts.
- Real-time updates without refresh.
- Production-level UI polish and advanced animations.

All frontend features currently operate using static or in-memory data.

---

# Sprint 1 - Backend Scope

## Contributors (Backend)

- Parvathi
- Justin

## Sprint Goal (Backend)

Build a secure backend foundation using Go, Gin, SQLite, GORM, and JWT authentication with protected APIs and scalable architecture.

## User Stories Implemented (Backend)

- As a user, I want to create an account so I can use the website.
- As a user, I want to log in to access website content.
- As a user, I want to edit announcements I have posted.
- As a user, I want to delete announcements I have posted.

## Issues Planned for Sprint 1 (Backend)

- Add environment-based configuration management.
- Set up database integration and migration flow.
- Implement signup and login authentication APIs.
- Add JWT middleware for protected routes.
- Implement public/protected announcement APIs.
- Add update/delete announcement APIs.
- Configure CORS for frontend-backend communication.
- Add backend utility support for token and DB verification.

## Completed Issues (Backend)

- Implemented `.env`-based configuration (`PORT`, `DB_NAME`, `JWT_SECRET`).
- Integrated SQLite + GORM with migration setup.
- Implemented `POST /api/signup` with validation and bcrypt hashing.
- Implemented `POST /api/login` with secure verification.
- Added JWT authentication middleware for protected endpoints.
- Implemented `GET /api/announcements` (public).
- Implemented `POST /api/announcements` (protected).
- Implemented announcement update API.
- Implemented announcement delete API.
- Configured CORS for frontend-backend communication.
- Added utility tooling for JWT generation and DB inspection.

## Detailed Work (Backend)

### Parvathi Contribution

#### 1. Environment-Based Configuration

Implemented `.env` based configuration.

Variables used:
- PORT
- DB_NAME
- JWT_SECRET

Benefits:
- No hardcoded secrets
- Secure secret handling
- Environment portability

#### 2. Database Setup (SQLite + GORM)

Integrated SQLite with GORM ORM.

Auto migration:

```go
database.DB.AutoMigrate(&models.User{}, &models.Announcement{})
```

Tables created:
- users
- announcements

#### 3. User Model

Fields:
- ID
- Name
- Email (unique)
- Password (bcrypt hash)
- CreatedAt
- DeletedAt (soft delete)

Security:
Password excluded from JSON responses using `json:"-"`.

Constraints:
- NOT NULL: Name, Email, Password
- UNIQUE: Email
- Email validation

#### 4. Signup API

Endpoint:
`POST /api/signup`

Features:
- Input validation
- Email format validation
- Minimum password length (8+)
- Duplicate email handling (409)
- bcrypt password hashing
- Structured JSON response

#### 5. JWT Authentication Middleware

Responsibilities:
- Extract Bearer token
- Validate signature
- Check expiration
- Attach userID to context

Protected route:
`POST /api/announcements`

Returns 401 if token invalid.

#### 6. Announcement APIs

Public:
`GET /api/announcements`

Protected:
`POST /api/announcements`
- Requires JWT
- Author set from token userID

#### 7. CORS Configuration

Configured secure CORS to allow frontend-backend communication.

#### 8. Utility Tools

- JWT generator CLI
- DB inspection tool (verify hashed passwords and data)

### Justin Contribution

- Implemented `POST /api/login` with secure verification.
- Implemented update announcement API.
- Implemented delete announcement API.
- Identified and documented centralized error handling and logging refactor work for Sprint 2.

## Testing Performed (Backend)

- Valid signup: 201
- Duplicate email: 409
- Invalid input: 400
- Protected route without token: 401
- Valid token on protected route: 201
- Verified bcrypt hashes in DB

## Security Measures (Backend)

- bcrypt hashing
- JWT authentication
- Environment-based secrets
- Unique email constraint
- Structured error responses

## Incomplete Issues / Technical Debt (Backend)

### Database Connection Improvements
- Add centralized error handler
- Prevent raw DB errors from leaking
- Log internal errors properly
- Return clean client-safe messages

### Structured Error Handling & Logging
- Setup GORM with SQLite
- Enable SQL logger in dev mode
- Add AutoMigrate for all models
- Implement graceful shutdown DB close
- Handle DB connection errors properly

Notes:
- Centralized error handling requires refactoring because error messages were implemented incrementally during feature development.
- Some structured logging sub-issues are already completed, but remaining improvements are planned for Sprint 2.

---

# Sprint 1 Status

Frontend status:
- Core frontend deliverables for Sprint 1 were completed and verified using static/in-memory data.

Backend status:
- Core backend deliverables for Sprint 1 were completed, including authentication, protected APIs, database integration, and routing.

Remaining logging and refactoring improvements are planned for Sprint 2.

---

# Not Completed in Sprint 1 (Planned for Future Sprints)

## Frontend and Integration Gaps

- User registration and login system fully integrated with frontend flows.
- Authentication and authorization expansion across all protected frontend/backend features.
- Full backend API integration for all frontend pages.
- Complete database persistence for all create/update/delete frontend actions.
- Fetching real announcements, events, and alerts from backend across all pages.
- Saving created posts and events permanently from frontend to backend.
- Admin functionality for managing alerts.
- Real-time alert updates.
- Production-level UI polish and advanced animations.

## Backend Engineering Gaps

- Centralized backend error handling refactor.
- Structured logging middleware and logging improvements.
- Unit tests.
- Integration tests.
- Additional production readiness hardening.
- Alerts feature enhancements.

These items require additional backend implementation and frontend-backend integration, and are planned for upcoming sprints.

---

# Next Steps (Sprint 2)

## Frontend and Integration

- Integrate frontend auth flow with token-based backend login.
- Connect announcements/events/alerts pages to backend APIs.
- Replace in-memory create flows with persisted backend-backed flows.

## Backend

- Refactor centralized error handling.
- Add structured logging middleware.
- Add unit tests.
- Add integration tests.
- Improve production readiness.
- Expand alerts feature support.

---

# Reflection

Sprint 1 successfully established the core architecture of the application across both frontend and backend.

Frontend now has stable routing, reusable layout patterns, and working UI flows with static/in-memory state.

Backend now has secure authentication foundations, protected APIs, and persistence setup with SQLite + GORM.

While full end-to-end integration, real-time behavior, and production hardening are not yet complete, Sprint 1 provides a strong base for Sprint 2 implementation and integration work.
