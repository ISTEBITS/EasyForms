# Changelog

All notable changes to this project will be documented in this file.

This project follows **Semantic Versioning (SemVer)**:  
MAJOR.MINOR.PATCH (e.g., 2.1.0)

## [2.2.0] - 2026-08-23

### Added (App & Server)
- **Single Active Concurrent Admin Session**: Enforced single concurrent login per admin account using session UUID tokens in MongoDB (`currentSessionId`) and JWT payloads; automatically revokes stale sessions upon login from a new device.
- **Input Conditioning & Logic Rules**: Added Google Forms style option branching routing (`gotoQuestionId`) and dynamic question visibility rules (show/hide based on previous answers with `AND`/`OR` match operators).
- **Custom Input Placeholders**: Added editable custom placeholder settings for text, long text, email, number, date, and dropdown questions.
- **API Key Management System**: Added API key creation with selectable expiration periods (7d, 30d, 90d, 1y, Never), scope permissions, hashing, in-memory caching, and 30-day interactive traffic history bar charts (`/api/api-keys`).
- **Geist Typography System & Legibility Enforcement**: Standardized font scales, line heights, and typography tokens across app components with a strict 12px (`text-xs`) minimum text size limit.
- **Form Editor Enhancements**: Integrated live Markdown editor for form descriptions and section titles, theme and banner customization panel, and live React SDK code generator panel.
- **Global Command Search**: Integrated `⌘K` global search modal (`GlobalSearchModal.tsx`) for instant form and page navigation.
- **Security & Performance Hardening**: Locked admin registration behind `ADMIN_REGISTER_SECRET`, added rate limiting across server endpoints, and implemented O(1) in-memory API key validation cache.

### Fixes (App & Server)
- Fixed API key usage aggregation graph rendering and date labeling.
- Enforced HTTP 401 situational error messages in API key middleware (`INVALID_API_KEY`, `API_KEY_EXPIRED`, `API_KEY_REQUIRED`).
- Fixed Markdown rendering inside form cards, preview headers, and workspace list views.

### SDK Integration
- Preserved `@easyforms/react` SDK compatibility: updated `EasyForm` (`FormPlayer`), `QuestionPreview`, and core type definitions to support option go-to routing, input conditioning evaluation, custom placeholders, and situational API key error cards.

---

## [2.1.0] - 2026-02-19
### Added
- Added Signup for test users with google auth.
- Can create only one form per test users
- Can't use file upload inputs and unable to change the banner image and logo.
- Can't use the email service
- Updated Admin Dashboard
- Admin Can view all the activities of test users

### Fixes
- Auto focus brand name on opening settings in mobile

---

---

## [2.0.0] - 2026-02-17

### Added
- Markdown-based form header support  
- Custom form banner image upload  
- Brand name customization for forms  
- Brand logo support  
- Email notifications on form submission  
- Time-based form submission deadline  
- Response submission limit feature  
- Major changes to API to integrate the above features

### Improved
- UI and UX improvements across admin dashboard and form editor  

### Fixed
- Minor UI bugs and layout inconsistencies  

---

## [1.0.0] - 2026-02-12

### Initial Release

### Features
- Admin authentication system with login-only access (no public admin signup)
- Full form management system (Create, Update, Delete, Fetch forms)
- MongoDB-based storage for forms and user responses
- Admin dashboard for managing forms and responses
- Draft and published form states
- QR code generation and download for public form sharing
- Multiple response submission control (restrict multiple submissions)
- Support for all input types, including file uploads
- Cloudinary integration for file storage
- Drag-and-drop question reordering in form builder
- Google authorization required before form submission (OAuth-based access control)

---

## Notes

- Dates follow ISO format: YYYY-MM-DD  
- Major releases may include breaking changes  
- Patch releases include bug fixes and minor improvements  

---

For detailed commit history, see the GitHub commit log.
