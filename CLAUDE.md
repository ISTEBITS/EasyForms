# System Architecture Blueprint & Functional Specification - EasyForms

This document serves as the authoritative blueprint, technical architecture, and system specification of **EasyForms**—an enterprise-grade, high-fidelity, full-stack drag-and-drop form building, publishing, and response collection platform.

---

## 1. Executive Summary & Product Vision

**EasyForms** is designed to allow developers and business users to design, build, distribute, and collect responses from highly customizable forms, surveys, and quizzes. It mirrors the interactive modularity of tools like Typeform, with the visual polish and execution speed of modern, developer-centric platforms like Vercel.

### Core Value Propositions
*   **Intuitive Drag-and-Drop Editor**: Dynamic form compilation supporting multiple question types.
*   **Highly Responsive Player**: Beautifully designed responsive form players for end-user submissions, featuring animations, page transitions, and section breaks.
*   **Theming & Customization Engine**: Complete control over branding assets, logo placements, typography, and color systems per form.
*   **Real-time Analytics & Responses**: Rich data pipelines to record answers, process file uploads, trigger automated confirmation emails, and export submissions.

---

## 2. System Architecture

EasyForms is built as a split-stack architecture, utilizing a decoupled, highly performant React-Vite SPA on the frontend and an Express/Mongoose REST API on the backend.

```
       +---------------------------------------------+
       |             React SPA (Vite)                |
       |  (DndKit, GSAP, Radix UI, React Hook Form)  |
       +--------------------+------------------------+
                            |
                            | JSON API Requests & Multipart Form Uploads
                            v
       +--------------------+------------------------+
       |           Express.js API Gateway            |
       |       (Helmet, Cors, Rate Limiting)         |
       +--------------------+------------------------+
                            |
         +------------------+------------------+
         |                                     |
         v                                     v
+--------+-----------+               +---------+-----------+
|    MongoDB DB      |               | Cloudinary / Local  |
| (Mongoose Schemas) |               |  File Attachment    |
+--------------------+               |       Storage       |
                                     +---------------------+
```

### Frontend Tech Stack (SPA)
*   **Core Library**: React 19 (TypeScript)
*   **Styling**: Tailwind CSS (v3 / Geist Design System Tokens), Radix UI primitives for headless, accessible UI elements.
*   **State & Validation**: React Hook Form with Zod integration for dynamic runtime validation.
*   **Interactivity & DnD**: `@dnd-kit/core`, `@dnd-kit/sortable` for fluid, drag-to-reorder cards.
*   **Animations**: GSAP (GreenSock) for high-performance micro-interactions and smooth page transitions.
*   **Routing**: React Router DOM (v7) managing page hierarchies.

### Backend Tech Stack (REST API)
*   **Runtime & Server**: Node.js, Express.js.
*   **Database Integration**: MongoDB via Mongoose ODM.
*   **Authentication**: JWT-based stateless authentication, stored in secure, HttpOnly cookies/bearer headers, plus Google Auth support.
*   **Security layer**: Helmet headers, express-rate-limit to protect auth/endpoints, mongo-sanitize to prevent NoSQL injections.
*   **File Upload Pipeline**: Multer middleware paired with local storage and Cloudinary integration for scalable file uploads.

---

## 3. Database Schema Blueprint (Mongoose)

### 3.1 Form Schema (`server/models/Form.js`)
Forms contain structural questions, visual styling properties (themes), and collection configuration rules (settings).

```javascript
import mongoose from 'mongoose';

const QuestionOptionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  value: { type: String, required: true },
});

const QuestionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: [
      "short_text",
      "long_text",
      "multiple_choice",
      "checkbox",
      "dropdown",
      "rating",
      "date",
      "email",
      "number",
      "file_upload",
      "section_break",
    ],
  },
  title: { type: String, required: true },
  description: String,
  required: { type: Boolean, default: false },
  options: [QuestionOptionSchema],
  placeholder: String,
  maxLength: Number,
  minRating: { type: Number, default: 1 },
  maxRating: { type: Number, default: 5 },
  allowMultiple: Boolean,
  acceptFileTypes: String,
  maxFileSize: Number, // In Megabytes
});

const FormThemeSchema = new mongoose.Schema({
  primaryColor: { type: String, default: "#000000" },
  backgroundColor: { type: String, default: "#ffffff" },
  fontFamily: { type: String, default: "Geist Sans" },
  logoUrl: { type: String, default: "" },
  bannerUrl: { type: String, default: "" },
  bannerPositionX: { type: Number, default: 50 },
  bannerPositionY: { type: Number, default: 50 },
  brandName: { type: String, default: "" },
  brandTagline: { type: String, default: "" },
});

const FormSettingsSchema = new mongoose.Schema({
  allowMultipleResponses: { type: Boolean, default: false },
  requireLogin: { type: Boolean, default: false },
  showProgressBar: { type: Boolean, default: true },
  confirmationMessage: { type: String, default: "Thank you for your response!" },
  responseDeadlineAt: { type: Date, default: null },
  maxResponses: { type: Number, default: null },
  closedMessage: { type: String, default: "This form is no longer accepting responses." },
  emailNotification: {
    enabled: { type: Boolean, default: false },
    subject: { type: String, default: "Your response to {{formTitle}} was received" },
    message: { type: String, default: 'Hi {{email}},\n\nThank you for completing "{{formTitle}}". We have recorded your submission.' },
  },
  limitOneResponse: { type: Boolean, default: false },
  redirectUrl: String,
  theme: FormThemeSchema,
});

const FormSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: String,
  slug: { type: String, required: true, unique: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  questions: [QuestionSchema],
  settings: { type: FormSettingsSchema, default: () => ({}) },
  responseCount: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("Form", FormSchema);
```

### 3.2 Response Schema (`server/models/Response.js`)
Captures data submitted by respondents, mapping back to specific question structures.

```javascript
import mongoose from 'mongoose';

const AnswerSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  value: mongoose.Schema.Types.Mixed, // String, array of strings, or file descriptor metadata
});

const RespondentSchema = new mongoose.Schema({
  name: String,
  email: String,
});

const ResponseSchema = new mongoose.Schema({
  formId: { type: mongoose.Schema.Types.ObjectId, ref: "Form", required: true },
  submittedAt: { type: Date, default: Date.now },
  respondentEmail: { type: String, default: null },
  answers: [AnswerSchema],
  respondent: RespondentSchema,
});

export default mongoose.model("Response", ResponseSchema);
```

---

## 4. Key Architectural Flows

### 4.1 Dynamic Drag-and-Drop Building
1.  **Context Establishment**: The UI initializes the `@dnd-kit/core` `DndContext`.
2.  **Sortable Boundaries**: `SortableContext` tracks the IDs of the active question items.
3.  **Sensor Triggers**: Mouse, Touch, and Keyboard sensors detect active drag interactions.
4.  **Local Schema Update**: On drop (`onDragEnd`), the system calculates indices and applies `arrayMove(questions, oldIndex, newIndex)`.
5.  **State Synchronization**: The updated state triggers a throttled API `PUT /api/forms/:id` request to save progress.

```
[UI Card Drag] --> [Sensor Detection] --> [arrayMove Calculations] --> [Local React State Update] --> [Throttled PUT API Sync]
```

### 4.2 Form Player Submission & Validation Flow
1.  **Configuration Hydration**: The public Form Player queries `GET /api/forms/public/:id`.
2.  **Validation Generation**: Standard validation objects are mapped from question structures. For example, if `question.required === true`, Zod validation rules are attached to that dynamic key.
3.  **Visual Render (Wizard/Standard)**: Sections are displayed sequentially (if section breaks are present) or in a flat list.
4.  **File Management**: Uploading file attachments submits the file to `/api/upload` ahead of general response submit, receiving a payload (URL, filename, format).
5.  **Submission payload validation**: The server checks:
    *   Form is active/published.
    *   Submission limits/deadlines are not breached.
    *   Answers comply with schema requirements (e.g., matching options, range constraints).
6.  **Transactional Commit**: Increment `responseCount` atomically in the `Form` document, save the `Response` document, and trigger confirmation/notification email hooks.

---

## 5. Directory Mapping

### Frontend Structure `/app`
```
/app/src
├── api                 # Stateless HTTP adapters for backend endpoints
│   ├── auth.api.ts
│   ├── client.ts       # Configured Axios/Fetch client with interceptors
│   └── forms.api.ts
├── components          # Reusable UI Architecture
│   ├── app             # Entry routing boundaries and Shell wrappers
│   ├── dashboard       # Workspace widgets, headers, form templates
│   ├── form-builder    # Specialized modular building components
│   ├── form-editor     # Form Editor sidebar, question panels
│   ├── form-preview    # Player wrapper, dynamic question render cards
│   └── ui              # Atomic UI elements (Input, Button, Dropdown)
├── context             # Global context states (Theme state, Auth state)
├── pages               # Page Views
│   ├── Dashboard.tsx
│   ├── LandingPage.tsx
│   ├── LoginPage.tsx
│   └── PublicForm.tsx
├── types               # Unified global TypeScript models
└── utils               # Helper libraries (parsing, calculations)
```

### Backend Structure `/server`
```
/server
├── config              # MongoDB/Mongoose connection configurations
├── controllers         # Route controller layers (Form handler, Auth logic)
├── middlewares         # Route Guards, Helmet, CORS configs, Multer setups
├── models              # Mongoose collection schemas (Form, Response, Admin)
├── routes              # REST Endpoint bindings (auth.js, forms.js, uploads.js)
└── utils               # Token handlers, cloud storage connections, mail client
```

---

## 6. Enterprise-Grade Security Controls

1.  **Rate Limiting**: Applied via `express-rate-limit` targeting login/signup attempts and responses endpoints. Prevents DDoS, brute-forcing, and response spam.
2.  **NoSQL Injection Defense**: Every dynamic query input is sanitized via `mongo-sanitize` before query parsing in mongoose.
3.  **Strict CORS Policy**: Handled by Express CORS middleware, validating origins against authorized whitelist variables.
4.  **Content Security Policy**: Powered by `helmet` headers to avoid clickjacking, iframe embedding attacks, and unauthorized inline script executions.
5.  **Secure JWT Cookies**: User authentication tokens are stored using `HttpOnly`, `SameSite=Strict`, `Secure` cookies, removing exposure of session assets to browser-based XSS attacks.
