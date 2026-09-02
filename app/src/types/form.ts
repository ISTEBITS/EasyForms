export type QuestionType = 
  | 'short_text'
  | 'long_text'
  | 'multiple_choice'
  | 'checkbox'
  | 'dropdown'
  | 'rating'
  | 'date'
  | 'email'
  | 'number'
  | 'file_upload'
  | 'section_break'
  | 'multiple_choice_grid';

export interface QuestionOption {
  id: string;
  label: string;
  value: string;
  gotoQuestionId?: string;
}

export type ConditionOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "greater_than"
  | "less_than"
  | "is_filled"
  | "is_empty";

export interface QuestionCondition {
  id: string;
  fieldId: string;
  operator: ConditionOperator;
  value?: string;
  action: "show" | "hide";
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  options?: QuestionOption[];
  gridRows?: string[];
  placeholder?: string;
  conditions?: QuestionCondition[];
  logicOperator?: "AND" | "OR";
  maxLength?: number;
  minRating?: number;
  maxRating?: number;
  allowMultiple?: boolean;
  acceptFileTypes?: string;
  maxFileSize?: number;
}

export type ResponseStatus =
  | 'unreviewed'
  | 'reviewed'
  | 'approved'
  | 'flagged'
  | 'rejected';

export interface ResponseNote {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export type CollaboratorRole = 'viewer' | 'editor' | 'admin';

export interface UserFormAccess {
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  isOwner: boolean;
  canEdit: boolean;
  canManageCollaborators: boolean;
}

export interface CollaboratorPresence {
  clientId: string;
  userId: string;
  name: string;
  email?: string;
  role: CollaboratorRole | 'owner' | 'admin';
  color: string;
  activeCell?: {
    rowKey: string;
    rowIndex: number;
    colIndex: number;
    questionId?: string;
  } | null;
}

export interface Collaborator {
  _id?: string;
  email: string;
  role: CollaboratorRole;
  addedAt: string;
}

export interface ShareSettings {
  isPublicShareEnabled: boolean;
  shareToken?: string | null;
  publicPermission: 'viewer' | 'editor';
}

export interface Form {
  _id?: string;
  id: string;
  title: string;
  description: string;
  slug?: string;
  createdAt: string;
  updatedAt: string;
  questions: Question[];
  settings: FormSettings;
  isPublished: boolean;
  responseCount: number;
  isTestUserForm?: boolean;
  collaborators?: Collaborator[];
  shareSettings?: ShareSettings;
  currentUserAccess?: UserFormAccess;
  owner?: {
    role?: "admin" | "test_user" | string;
    adminUsername?: string | null;
    testUserId?: string | null;
    email?: string | null;
  };
}

export interface FormSettings {
  allowMultipleResponses: boolean;
  requireLogin: boolean;
  showProgressBar: boolean;
  confirmationMessage: string;
  responseDeadlineAt?: string | null;
  maxResponses?: number | null;
  closedMessage?: string;
  emailNotification: FormEmailNotification;
  redirectUrl?: string;
  theme: FormTheme;
  limitOneResponse: boolean;
}

export interface FormEmailNotification {
  enabled: boolean;
  subject: string;
  message: string;
}

export interface FormTheme {
  primaryColor: string;
  backgroundColor: string;
  fontFamily: string;
  logoUrl?: string;
  bannerUrl?: string;
  backgroundImageUrl?: string;
  bannerPositionX?: number;
  bannerPositionY?: number;
  brandName?: string;
  brandTagline?: string;
}

export interface FormResponse {
  _id?: string;
  id: string;
  formId: string;
  submittedAt: string;
  updatedAt?: string;
  status?: ResponseStatus;
  tags?: string[];
  notes?: ResponseNote[];
  editedBy?: string | null;
  answers: Answer[];
  googleToken?: string;
  respondentEmail?: string;
  respondent?: {
    name?: string;
    email?: string;
  };
}

export interface Answer {
  questionId: string;
  value: string | string[] | number | Record<string, string> | File | null;
}

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail?: string;
  questions: Question[];
}

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  short_text: 'Short Text',
  long_text: 'Paragraph',
  multiple_choice: 'Multiple Choice',
  checkbox: 'Checkboxes',
  dropdown: 'Dropdown',
  rating: 'Rating',
  date: 'Date',
  email: 'Email',
  number: 'Number',
  file_upload: 'File Upload',
  section_break: 'Section Break',
  multiple_choice_grid: 'Multiple Choice Grid',
};

export const QUESTION_TYPE_ICONS: Record<QuestionType, string> = {
  short_text: 'Type',
  long_text: 'AlignLeft',
  multiple_choice: 'CircleDot',
  checkbox: 'CheckSquare',
  dropdown: 'List',
  rating: 'Star',
  date: 'Calendar',
  email: 'Mail',
  number: 'Hash',
  file_upload: 'Upload',
  section_break: 'SeparatorHorizontal',
  multiple_choice_grid: 'Grid3X3',
};

export const DEFAULT_QUESTION: Question = {
  id: '',
  type: 'short_text',
  title: 'Untitled Question',
  description: '',
  required: false,
  options: [
    { id: '1', label: 'Option 1', value: 'option_1' },
    { id: '2', label: 'Option 2', value: 'option_2' },
  ],
  placeholder: '',
  maxRating: 5,
};

export const DEFAULT_FORM: Form = {
  id: '',
  title: 'Untitled Form',
  description: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  questions: [],
  settings: {
    allowMultipleResponses: false,
    requireLogin: false,
    showProgressBar: true,
    limitOneResponse: true,
    responseDeadlineAt: null,
    maxResponses: null,
    closedMessage: "This form is no longer accepting responses.",
    confirmationMessage: 'Thank you for your response!',
    emailNotification: {
      enabled: false,
      subject: 'Your response to {{formTitle}} was received',
      message:
        'Hi {{name}},\n\nThank you for completing "{{formTitle}}". We have recorded your submission on {{submittedAt}}.',
    },
    theme: {
      primaryColor: '#0070f3',
      backgroundColor: '',
      fontFamily: 'Geist Sans',
      logoUrl: '',
      bannerUrl: '',
      backgroundImageUrl: '',
      bannerPositionX: 50,
      bannerPositionY: 50,
      brandName: '',
      brandTagline: '',
    },
  },
  isPublished: false,
  responseCount: 0,
};
