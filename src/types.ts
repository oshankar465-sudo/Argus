export type StatusType = 'No Status' | 'Started' | 'In Progress' | 'Completed';

export type CandidateType = 'Technical' | 'Non-Technical';

export type ResourceType = 'pdf' | 'excel' | 'word' | 'image' | 'link' | 'file';

export type ResourceLevel = 'candidate' | 'task' | 'subtask';

export interface Resource {
  id: string;
  name: string; // Human-readable name (Mandatory)
  type: ResourceType;
  url?: string; // For link or file preview/download
  fileName?: string;
  fileSize?: string;
  level: ResourceLevel;
  candidateId: string;
  taskId?: string;
  subtaskId?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string; // ISO string
  action: string;
  candidateId: string;
  taskId?: string;
  subtaskId?: string;
  type?: 'candidate' | 'task' | 'subtask' | 'resource' | 'status';
}

export interface Note {
  id: string;
  content: string;
  authorName: string;
  authorRole?: string;
  createdAt: string;
}

export interface Subtask {
  id: string;
  taskId: string;
  candidateId: string;
  name: string;
  description?: string;
  status: StatusType;
  startDate?: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD (Mandatory Deadline for all subtasks)
  isCollaborative?: boolean; // Can be collaborative even if parent task is single
  collaboratorIds?: string[]; // Collaborating candidate IDs
  notesList?: Note[]; // Author-attributed notes
  resources: Resource[];
  history: ActivityLog[];
  lastStatusUpdate?: string; // ISO string for 72-hour status inactivity tracking
  calendarEventId?: string; // Google Calendar event ID
  calendarHtmlLink?: string; // Direct link to Google Calendar event
  googleTaskId?: string; // Google Tasks item ID
  lastReminderSentAt?: string; // ISO string for last reminder dispatched
  createdAt: string;
}

export interface Task {
  id: string;
  candidateId: string;
  isCollaborative?: boolean;
  collaboratorIds?: string[];
  name: string;
  description?: string;
  status: StatusType;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD (Deadline)
  notesList?: Note[]; // Author-attributed notes
  subtasks: Subtask[];
  resources: Resource[];
  history: ActivityLog[];
  lastStatusUpdate?: string; // ISO string for 72-hour status inactivity tracking
  calendarEventId?: string; // Google Calendar event ID
  calendarHtmlLink?: string; // Direct link to Google Calendar event
  googleTaskId?: string; // Google Tasks item ID
  lastReminderSentAt?: string; // ISO string for last reminder dispatched
  createdAt: string;
}

export interface Candidate {
  id: string;
  name: string;
  type: CandidateType;
  email?: string;
  notes?: string;
  startDate?: string; // YYYY-MM-DD (Candidate start / onboarding date)
  resources: Resource[];
  history: ActivityLog[];
  tasks: Task[];
  createdAt: string;
}

export type ViewTab = 'dashboard' | 'candidates' | 'tasks';

export type ThemeType = 'light' | 'dark';

export interface EmailModalData {
  recipientEmail: string;
  recipientName: string;
  subject: string;
  body: string;
  taskName?: string;
}

export interface WorkspaceAuthUser {
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
}
