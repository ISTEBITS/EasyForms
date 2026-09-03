# Changelog

All notable changes to this project will be documented in this file.

This project follows **Semantic Versioning (SemVer)**:  
MAJOR.MINOR.PATCH (e.g., 2.5.0)

## [2.5.0] - 2026-09-03

### Added & Enhanced (App & Server)
- **Centralized Mail Service & Multi-Provider Delivery Engine**:
  - Implemented centralized Mail Service (`server/services/mail.service.js`) with dynamic SMTP (Nodemailer) and Mailtrap API/Sandbox transporter resolution.
  - Native pure HTML email template rendering with `{{token}}` variable interpolation.
  - Automatic database-backed template resolution with graceful fallbacks for invitations and receipts.
  - Auto-seeding of default HTML email templates on server startup (`seedDefaultTemplates()`).
- **Admin Mail Templates & Mailer Studio**:
  - Protected admin routes (`/api/admin/mail/*`) with `checkCookies` + `requireAdmin` RBAC enforcement.
  - Interactive Master-Detail Email Template Studio (`app/src/pages/MailTemplatesPage.tsx`) with 2-column layout and mobile dropdown picker.
  - Full HTML code editor with 1-click starter layout presets (*Modern Dark*, *Clean Light*, *Invitation*, *Receipt*).
  - 1-click dynamic variable token pills (`{{name}}`, `{{formTitle}}`, `{{role}}`, `{{accessUrl}}`, `{{submittedAt}}`).
  - Instant 0ms live HTML iframe preview.
  - Live test email dispatcher with customizable sample token values.
  - Added "Email Templates" navigation link to admin sidebar and navigation shell (`ProtectedAppShell.tsx`).
- **Dashboard & Response Navigation UX Overhaul**:
  - Added direct 1-click action buttons on form cards (`Edit`, `Responses`, `Share`) in both Grid and List views (`DashboardWorkspace.tsx`).
  - Added universal segmented mode switcher `[Builder | Responses]` in Form Editor and Responses Header.
  - Improved Back navigation across editor and response views to seamlessly return to the previous route.
- **Landing Page Open-Source Conversion & Community Overhaul**:
  - Refined landing page hero and feature messaging to focus on open-source community contributions and developer empowerment.
  - Added maintained-by avatar pill (`iste-logo.png` & `logo.svg`) highlighting ISTE BITS Sindri.
  - Real-time GitHub community contributors showcase and statistics integration.
  - Strict typography and design system alignment (zero `text-xs`, minimum font size `text-sm`, `font-mono` limited to code blocks).

---

## [2.4.0] - 2026-09-03

### Added & Enhanced (App & Server)
- **Multiple Choice Grid Question Type**:
  - Added Google Forms-style Multiple Choice Grid (`multiple_choice_grid`) supporting custom criteria rows and choice columns.
  - Mobile-responsive matrix layout with fixed criteria headers and smooth horizontal scrolling for overflow columns.
  - Uses accessible radio group components (`app/src/components/ui/radio-group.tsx`) without page-shift regressions.
  - Editor configuration panel for dynamic row/column management and response sheet rendering.
- **Google Sheets-Style Real-Time Collaboration & Cursors**:
  - Server-Sent Events (SSE) live collaboration stream (`/api/forms/:id/collaboration-stream`) and presence heartbeats (`/api/forms/:id/presence`).
  - Active collaborator avatar stack in header with user identity deduplication (1 avatar per user across multiple tabs/windows) and `(You)` tag for self.
  - Real-time colored cell border outlines and floating collaborator name tags on responses and empty placeholder rows.
  - Immediate cursor clearing on cell unfocus, document click-outside, tab switching, and `Escape`.
- **Role-Based Access Control (RBAC) Enforcement**:
  - Strict server and UI permission enforcement for `viewer`, `editor`, and `owner`/`admin` roles across all form and response endpoints.
  - View-only mode for viewers: disables form editing, inline cell editing, row deletion, and collaborator management with a "View only" badge.
  - Editors can modify form fields and responses but cannot delete the form or manage collaborators.
- **Silent Auto-Saving & Sheet Performance Optimization**:
  - Implemented Google Sheets-style silent auto-saving with header status indicators (`Saving...`, `All changes saved to cloud`).
  - Removed disruptive toast notifications for routine cell blur/focus events.
  - Value diffing: updates to backend are skipped if cell content has not changed.
  - Chronological response ordering with natural bottom-stacking.
  - Cell height growth along Y-axis to prevent text truncation.
- **Optional Collaborator Invitation Email**:
  - Added checkbox toggle in the collaborator share modal to send or skip email notification invites.

### Fixed
- Fixed race condition causing duplicate response rows when editing empty placeholder rows.
- Fixed SSE stream connection URL routing to backend `API_BASE_URL`.
- Fixed missing `formId` parameter scoping in collaborator controller.

---

## [2.3.0] - 2026-09-02

### Added & Enhanced (App & Server)
- **Google Sheets-Style Live Responses Grid**:
  - Full-screen height interactive spreadsheet interface (`ResponsesSheetGrid.tsx`) with a continuous minimum of 25 grid rows.
  - Direct in-cell editing: clicking or double-clicking any cell opens an inline editor right in the grid with no modal dialog required.
  - Empty row direct fill: typing into any empty placeholder row automatically constructs and persists a new response record via `formsApi.manualCreateResponse`.
  - Spreadsheet keyboard navigation: `Enter` (save & advance down), `Tab` (save & advance right), `Shift+Tab` (advance left), and `Escape` (cancel).
  - High-contrast 2px active cell selection ring and editable respondent email cell.
- **Dynamic Status Customization & Color Themes**:
  - Replaced icon-based status pills with a minimal, clean dropdown button (no icons) showing the status label and chevron.
  - Status Manager (`StatusManagerModal.tsx`): allows creating new custom status values and editing existing status labels.
  - Custom background color picker for statuses supporting an 11-shade curated palette (`Gray`, `Blue`, `Emerald`, `Amber`, `Red`, `Purple`, `Teal`, `Pink`, `Indigo`, `Orange`, `Cyan`).
  - Removed strict status enum constraints in MongoDB `Response` schema to support custom status labels dynamically.
- **Collaborator Management & Responses Sharing**:
  - Granular collaborator invitations by email with `viewer` and `editor` role permissions.
  - Real-time collaborator count badge in the responses header.
  - Public shared responses token links (`/forms/shared/:token`) with customizable access toggle.
- **Public Form "Having Trouble?" Reporting System**:
  - Clean respondent feedback and trouble reporting module on public forms (`HavingTroubleSection.tsx`).
  - MongoDB `FormIssue` model and REST endpoints (`POST /api/forms/:id/issues`, `GET /api/forms/:id/issues`, `PATCH /api/forms/:id/issues/:issueId`).
  - Dedicated **Reports** view tab in the responses suite to review trouble descriptions, respondent emails, and toggle resolution status.
- **Public Form Custom Slugs & Routing**:
  - Custom human-readable URL slugs for forms (e.g., `/form/:slug`) with lowercase and hyphen enforcement.
  - Uniqueness validation and collision resolution in form settings.
- **Form Section Completion Stepper**:
  - Section indicators now evaluate required field completion dynamically, displaying an emerald checkmark badge upon completion.
  - Interactive section pills enabling direct jumping between multi-page form sections.
- **Branding & Logo Reliability**:
  - Fixed backend test user restriction bug where `TEST_USER_DEFAULT_LOGO_URL` inadvertently overwrote custom user-uploaded logos.
  - Conditional branding display: hides branding header entirely if no logo, brand name, or tagline is provided (no placeholder fallbacks).
- **Design System & Typography Standardization**:
  - Aligned all components with `DESIGN.md` tokens: near-black `#0c0c0c` / `#171717` surfaces, 1px `#262626` hairline borders, and `rounded-sm` geometric radius.
  - Removed default browser blue focus rings, standardizing on neutral monochrome border focus.
  - Removed improper `font-mono` and extra-small font sizes (`text-xs` / `text-[10px]`) in public forms and analytics in favor of standard `font-sans text-sm` and `text-base`.
  - Streamlined Google verification prompt, removing redundant copy.

### Fixed
- Fixed Google OAuth popup cancellation handling (`onNonOAuthError` with `popup_closed`) preventing stuck "Authenticating..." loading state.
- Fixed Form Editor canvas background defaulting to bright white (`#ffffff`) inline style; defaults cleanly to `bg-background`.
- Fixed unused imports (`ArrowLeft`) and variable declarations (`colorDef`) in response components.
- Fixed TypeScript return type mismatch in `ManualResponseModal` submit callback.
- Fixed Radio group tick duplication in `QuestionPreview`.

---

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
