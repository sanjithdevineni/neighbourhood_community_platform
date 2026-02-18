# Sprint 1 Report

## Project Overview

The Neighborhood Community Platform is designed to allow residents to:
- Share announcements
- View and host events
- Receive important neighborhood alerts
- Search content
- Connect within their neighborhood

Sprint 1 focused on establishing the foundational frontend structure using static mock data.

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

# Sprint 1 – Frontend Scope

## Sprint Goal

Establish the foundational frontend structure including routing, layout, announcements feed, events UI, alerts page structure, and responsive design using static mock data.

---

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
- Implement “Your Events” filter (frontend only)
- Add responsive design support (media queries)

---

## Successfully Completed in Sprint 1

The following frontend features were successfully implemented:

- Working routes (/ , /alerts, /events)
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

All features currently operate using static or in-memory data.

---

## Not Completed in Sprint 1 (Planned for Future Sprints)

The following features are part of the overall system but were not implemented in Sprint 1:

- User registration and login system
- Authentication and authorization
- Backend API integration
- Database persistence
- Fetching real announcements, events, and alerts from backend
- Saving created posts and events permanently
- Admin functionality for managing alerts
- Real-time alert updates
- Production-level UI polish and advanced animations

These items require backend implementation and frontend-backend integration, which are planned for upcoming sprints.

---

# Reflection

Sprint 1 successfully established the core frontend architecture of the application.  
While authentication, backend integration, and persistent data are not yet implemented, the UI structure and frontend state management provide a strong foundation for future development.
