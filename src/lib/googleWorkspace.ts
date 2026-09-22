import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import { app } from './firebase';
import { Task, Subtask, Candidate } from '../types';

export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/calendar');
provider.addScope('https://www.googleapis.com/auth/calendar.events');
provider.addScope('https://www.googleapis.com/auth/tasks');
provider.setCustomParameters({
  prompt: 'select_account',
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const isAuthCancellation = (error: unknown): boolean => {
  if (!error) return false;
  if (typeof error === 'string') {
    return error.includes('popup-closed-by-user') || error.includes('cancelled-popup-request');
  }
  if (typeof error === 'object') {
    const err = error as { code?: string; message?: string };
    if (
      err.code === 'auth/popup-closed-by-user' ||
      err.code === 'auth/cancelled-popup-request'
    ) {
      return true;
    }
    if (typeof err.message === 'string') {
      return (
        err.message.includes('popup-closed-by-user') ||
        err.message.includes('cancelled-popup-request')
      );
    }
  }
  return false;
};

export const isPopupBlocked = (error: unknown): boolean => {
  if (!error) return false;
  const code = (error as { code?: string })?.code;
  const message = (error as { message?: string })?.message || '';
  return code === 'auth/popup-blocked' || message.includes('popup-blocked');
};

export const isUnauthorizedDomainError = (error: unknown): boolean => {
  if (!error) return false;
  const code = (error as { code?: string })?.code;
  const message = (error as { message?: string })?.message || (typeof error === 'string' ? error : '');
  return (
    code === 'auth/unauthorized-domain' ||
    message.includes('unauthorized-domain') ||
    message.includes('authorized domain')
  );
};

export const getCurrentDeploymentDomain = (): string => {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.hostname;
  }
  return 'localhost';
};

export const checkRedirectResult = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    const result = await getRedirectResult(auth);
    if (!result) return null;
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
      return { user: result.user, accessToken: cachedAccessToken };
    }
  } catch (err: unknown) {
    console.warn('Redirect auth check warning:', err);
  }
  return null;
};

export const initWorkspaceAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  // Check redirect result on load first
  checkRedirectResult().then((res) => {
    if (res && onAuthSuccess) {
      onAuthSuccess(res.user, res.accessToken);
    }
  });

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // User logged in to Firebase but OAuth access token needs explicit interactive sign-in
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const signInWithGoogleWorkspace = async (): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google Workspace access token.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: unknown) {
    if (isAuthCancellation(error)) {
      return null;
    }
    if (isUnauthorizedDomainError(error)) {
      const currentHost = getCurrentDeploymentDomain();
      throw new Error(
        `OAuth Domain Unauthorized: "${currentHost}" is not listed under Authorized Domains in Firebase Authentication. Add "${currentHost}" to Firebase Console -> Authentication -> Settings -> Authorized Domains, or use our 1-Click Google Calendar Web Sync which works immediately with zero domain configuration.`
      );
    }
    if (isPopupBlocked(error)) {
      throw new Error(
        'The sign-in popup was blocked by your browser. Please allow popups for this site or use redirect sign-in.'
      );
    }
    console.error('Google Workspace sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const signInWithGoogleWorkspaceRedirect = async (): Promise<void> => {
  await signInWithRedirect(auth, provider);
};

export const getWorkspaceAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const signOutWorkspace = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

// Helper: Ensure standard YYYY-MM-DD format
export const getValidDateStr = (dateStr?: string): string => {
  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  return new Date().toISOString().split('T')[0];
};

/**
 * Computes the day after a given YYYY-MM-DD date in UTC
 */
export const getNextDayStr = (dateStr: string): string => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().split('T')[0];
};

/**
 * Google Calendar API requires all-day event end dates to be EXCLUSIVE.
 * If event is on 2026-09-21, start.date = '2026-09-21' and end.date MUST be '2026-09-22'.
 * When end.date <= start.date, Google Calendar API returns HTTP 400 Bad Request.
 */
export const getCalendarEndDateStr = (startDate?: string, endDate?: string): string => {
  const start = getValidDateStr(startDate);
  const end = getValidDateStr(endDate || startDate);
  if (end <= start) {
    return getNextDayStr(start);
  }
  // To make multi-day all-day event inclusive of the ending day in Google Calendar,
  // the exclusive end date must be the subsequent day.
  return getNextDayStr(end);
};

/**
 * Generates an instant 1-click Google Calendar Web URL (works anywhere, no OAuth needed)
 */
export const getGoogleCalendarWebUrl = (data: {
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  candidateName?: string;
  attendeeEmails?: string[];
}): string => {
  const start = getValidDateStr(data.startDate);
  const end = getCalendarEndDateStr(data.startDate, data.endDate);

  const startFormatted = start.replace(/-/g, '');
  const endFormatted = end.replace(/-/g, '');

  const title = `[GEOMETRA] ${data.title}${data.candidateName ? ` - ${data.candidateName}` : ''}`;
  const details = [
    data.description || 'Task assignment in GEOMETRA - ARGUS.',
    data.candidateName ? `Candidate: ${data.candidateName}` : '',
    data.attendeeEmails?.length ? `Alerted Team: ${data.attendeeEmails.join(', ')}` : '',
    '72-Hour Status Tracking & Milestone Notifications enabled in GEOMETRA.',
  ]
    .filter(Boolean)
    .join('\n\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startFormatted}/${endFormatted}`,
    details,
  });

  if (data.attendeeEmails && data.attendeeEmails.length > 0) {
    params.set('add', data.attendeeEmails.join(','));
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Formats date into standard iCalendar YYYYMMDD string
 */
const formatIcsDate = (dateStr: string): string => {
  return dateStr.replace(/-/g, '');
};

/**
 * Generates standard RFC 5545 iCalendar (.ics) string for any candidate schedule
 */
export const generateCandidateIcsCalendar = (candidate: Candidate): string => {
  const nowStr = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const candidateName = candidate.name || 'Candidate';

  const events: string[] = [];

  (candidate.tasks || []).forEach((task) => {
    const start = getValidDateStr(task.startDate);
    const end = getCalendarEndDateStr(task.startDate, task.endDate);
    const uid = `task-${task.id}-${candidate.id}@geometra.app`;
    const summary = `[GEOMETRA] ${task.name} (${candidateName})`;
    const description = `Candidate: ${candidateName}\\nStatus: ${task.status}\\n${
      task.description ? task.description.replace(/\n/g, '\\n') : ''
    }`;

    events.push([
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${nowStr}`,
      `DTSTART;VALUE=DATE:${formatIcsDate(start)}`,
      `DTEND;VALUE=DATE:${formatIcsDate(end)}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT72H',
      'ACTION:DISPLAY',
      `DESCRIPTION:72-Hour Status & Milestone Alert: ${task.name}`,
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-PT24H',
      'ACTION:DISPLAY',
      `DESCRIPTION:24-Hour Deadline Reminder: ${task.name}`,
      'END:VALARM',
      'END:VEVENT',
    ].join('\r\n'));

    // Include subtasks if present
    (task.subtasks || []).forEach((sub) => {
      const subStart = getValidDateStr(sub.startDate || sub.endDate);
      const subEnd = getCalendarEndDateStr(sub.startDate, sub.endDate);
      const subUid = `subtask-${sub.id}-${task.id}@geometra.app`;
      const subSummary = `[GEOMETRA Subtask] ${sub.name} - ${task.name} (${candidateName})`;

      events.push([
        'BEGIN:VEVENT',
        `UID:${subUid}`,
        `DTSTAMP:${nowStr}`,
        `DTSTART;VALUE=DATE:${formatIcsDate(subStart)}`,
        `DTEND;VALUE=DATE:${formatIcsDate(subEnd)}`,
        `SUMMARY:${subSummary}`,
        `DESCRIPTION:Parent Task: ${task.name}\\nStatus: ${sub.status}\\nDeadline Milestone: ${sub.endDate}`,
        'STATUS:CONFIRMED',
        'BEGIN:VALARM',
        'TRIGGER:-PT72H',
        'ACTION:DISPLAY',
        `DESCRIPTION:72-Hour Milestone Alert: ${sub.name}`,
        'END:VALARM',
        'END:VEVENT',
      ].join('\r\n'));
    });
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GEOMETRA//ARGUS Candidate Milestones//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:GEOMETRA Schedule - ${candidateName}`,
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
};

/**
 * Downloads candidate schedule as a .ics file
 */
export const downloadCandidateIcsCalendar = (candidate: Candidate): void => {
  const icsData = generateCandidateIcsCalendar(candidate);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${candidate.name.replace(/\s+/g, '_')}_schedule.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Downloads a single task or subtask as a .ics file
 */
export const downloadSingleTaskIcsCalendar = (
  item: { name: string; description?: string; startDate?: string; endDate?: string; status?: string; priority?: string },
  candidateName: string
): void => {
  const nowStr = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const start = getValidDateStr(item.startDate);
  const end = getCalendarEndDateStr(item.startDate, item.endDate);
  const uid = `single-task-${Date.now()}@geometra.app`;
  const summary = `[GEOMETRA] ${item.name} (${candidateName})`;
  const description = `Candidate: ${candidateName}\\nStatus: ${item.status || 'Active'}\\n${
    item.description ? item.description.replace(/\n/g, '\\n') : ''
  }`;

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GEOMETRA//ARGUS Task//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:GEOMETRA - ${item.name}`,
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowStr}`,
    `DTSTART;VALUE=DATE:${formatIcsDate(start)}`,
    `DTEND;VALUE=DATE:${formatIcsDate(end)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT72H',
    'ACTION:DISPLAY',
    `DESCRIPTION:72-Hour Status Alert: ${item.name}`,
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    `DESCRIPTION:24-Hour Deadline Reminder: ${item.name}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${item.name.replace(/[^a-zA-Z0-9]/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Creates an event in Google Calendar with 72-hour and 24-hour email/popup reminders for candidate and team
 */
export async function createGoogleCalendarEvent(
  accessToken: string,
  data: {
    title: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    candidateName: string;
    assigneeNames?: string[];
    attendeeEmails?: string[];
  }
): Promise<{ eventId: string; htmlLink: string }> {
  const startDate = getValidDateStr(data.startDate);
  const endDate = getCalendarEndDateStr(data.startDate, data.endDate);

  const assignees = data.assigneeNames && data.assigneeNames.length > 0
    ? data.assigneeNames.join(', ')
    : data.candidateName;

  // Filter and format valid attendees for calendar email invitation & reminder alerts
  const validAttendees = (data.attendeeEmails || [])
    .filter((em): em is string => typeof em === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.trim()))
    .map((em) => ({ email: em.trim() }));

  const eventPayload = {
    summary: `[GEOMETRA] ${data.title} (${assignees})`,
    description: `Task / Project Assignment in GEOMETRA - ARGUS\nAssignee(s): ${assignees}\nCandidate: ${data.candidateName}\nAlerted Team/Recipient(s): ${
      validAttendees.length > 0 ? validAttendees.map((a) => a.email).join(', ') : 'Direct Assignee'
    }\n\n${
      data.description || 'No additional description provided.'
    }\n\n---\nAutomatic 72-Hour Reminders & Tracking enabled. All calendar notifications and alerts are routed to the assigned individual or team members.`,
    start: {
      date: startDate,
    },
    end: {
      date: endDate,
    },
    attendees: validAttendees.length > 0 ? validAttendees : undefined,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 4320 }, // 72 Hours email alert before deadline
        { method: 'popup', minutes: 4320 }, // 72 Hours popup alert before deadline
        { method: 'email', minutes: 1440 }, // 24 Hours email alert before deadline
        { method: 'popup', minutes: 1440 }, // 24 Hours popup alert before deadline
        { method: 'popup', minutes: 60 },   // 1 Hour popup alert before deadline
      ],
    },
  };

  let response = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    }
  );

  // If sendUpdates=all failed (e.g. attendee email permissions), retry without sendUpdates
  if (!response.ok && (response.status === 400 || response.status === 403)) {
    response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...eventPayload,
          attendees: undefined,
        }),
      }
    );
  }

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.error?.message || 'Failed to create Google Calendar event');
  }

  const result = await response.json();
  return {
    eventId: result.id,
    htmlLink: result.htmlLink || '',
  };
}

/**
 * Creates an item in Google Tasks
 */
export async function createGoogleTaskItem(
  accessToken: string,
  data: {
    title: string;
    notes?: string;
    dueDate?: string;
  }
): Promise<{ googleTaskId: string }> {
  const taskPayload = {
    title: `[ARGUS] ${data.title}`,
    notes: data.notes || 'Assignment registered in GEOMETRA - ARGUS. 72-hour status check active.',
    due: data.dueDate ? `${getValidDateStr(data.dueDate)}T23:59:59.000Z` : undefined,
  };

  const response = await fetch(
    'https://tasks.googleapis.com/tasks/v1/lists/@default/tasks',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskPayload),
    }
  );

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.error?.message || 'Failed to create Google Task item');
  }

  const result = await response.json();
  return {
    googleTaskId: result.id,
  };
}

/**
 * Updates status in Google Tasks and Calendar when completed
 */
export async function updateGoogleCalendarAndTaskCompletion(
  accessToken: string,
  options: {
    calendarEventId?: string;
    googleTaskId?: string;
    taskTitle: string;
    isCompleted: boolean;
  }
): Promise<void> {
  // Update Google Tasks status if available
  if (options.googleTaskId) {
    try {
      await fetch(
        `https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${options.googleTaskId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: options.isCompleted ? 'completed' : 'needsAction',
          }),
        }
      );
    } catch (e) {
      console.warn('Google Tasks status update warning:', e);
    }
  }

  // Update Google Calendar event title if available
  if (options.calendarEventId) {
    try {
      const getRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${options.calendarEventId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (getRes.ok) {
        const eventData = await getRes.json();
        let summary: string = eventData.summary || options.taskTitle;
        if (options.isCompleted && !summary.startsWith('[COMPLETED]')) {
          summary = `[COMPLETED] ${summary.replace(/^\[GEOMETRA\]\s*/, '')}`;
        } else if (!options.isCompleted && summary.startsWith('[COMPLETED]')) {
          summary = `[GEOMETRA] ${summary.replace(/^\[COMPLETED\]\s*/, '')}`;
        }

        await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${options.calendarEventId}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              summary,
              description: `${eventData.description || ''}\n\n[Status Updated]: ${
                options.isCompleted ? 'Completed' : 'Active'
              } at ${new Date().toLocaleString()}`,
            }),
          }
        );
      }
    } catch (e) {
      console.warn('Google Calendar update warning:', e);
    }
  }
}

/**
 * Dispatches a high-priority 72-Hour Status Inactivity reminder event to Google Calendar
 * and alerts the respective person or team via email invites and reminders
 */
export async function dispatch72HourCalendarNotification(
  accessToken: string,
  data: {
    task: Task | Subtask;
    candidateName: string;
    stagnantHours: number;
    recipientEmail?: string;
    recipientEmails?: string[];
  }
): Promise<{ eventId: string; htmlLink: string }> {
  const todayStr = new Date().toISOString().split('T')[0];
  const nextDayStr = getNextDayStr(todayStr);
  const daysStagnant = Math.floor(data.stagnantHours / 24);

  // Consolidate recipient emails
  const rawEmails = [
    ...(data.recipientEmails || []),
    ...(data.recipientEmail ? [data.recipientEmail] : []),
  ];
  const validAttendees = Array.from(new Set(
    rawEmails
      .filter((em): em is string => typeof em === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.trim()))
      .map((em) => em.trim())
  )).map((email) => ({ email }));

  const eventPayload = {
    summary: `⚠️ [72H ALERT] Status Inactivity: ${data.task.name} (${data.candidateName})`,
    description: `ATTENTION: Status has remained unchanged for ${data.stagnantHours} hours (~${daysStagnant} days).\nCurrent Status: ${data.task.status}\nCandidate/Team: ${data.candidateName}\nAlerted Contact(s): ${
      validAttendees.length > 0 ? validAttendees.map((a) => a.email).join(', ') : 'Assigned Member'
    }\n\nPlease review and update the status in GEOMETRA - ARGUS immediately.`,
    start: {
      date: todayStr,
    },
    end: {
      date: nextDayStr,
    },
    attendees: validAttendees.length > 0 ? validAttendees : undefined,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 0 },
        { method: 'popup', minutes: 0 },
        { method: 'email', minutes: 60 },
        { method: 'popup', minutes: 30 },
      ],
    },
  };

  let response = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    }
  );

  if (!response.ok && (response.status === 400 || response.status === 403)) {
    response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...eventPayload,
          attendees: undefined,
        }),
      }
    );
  }

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.error?.message || 'Failed to dispatch 72-Hour Calendar notification');
  }

  const result = await response.json();
  return {
    eventId: result.id,
    htmlLink: result.htmlLink || '',
  };
}

/**
 * Creates a Google Calendar event for a Subtask milestone with deadline and team alerts
 */
export async function createGoogleSubtaskCalendarEvent(
  accessToken: string,
  data: {
    subtaskName: string;
    parentTaskName: string;
    description?: string;
    startDate?: string;
    endDate: string; // Mandatory deadline
    candidateName: string;
    collaboratorNames?: string[];
    attendeeEmails?: string[];
  }
): Promise<{ eventId: string; htmlLink: string }> {
  const startDate = getValidDateStr(data.startDate || data.endDate);
  const endDate = getCalendarEndDateStr(data.startDate, data.endDate);

  const team = data.collaboratorNames && data.collaboratorNames.length > 0
    ? data.collaboratorNames.join(', ')
    : data.candidateName;

  const validAttendees = (data.attendeeEmails || [])
    .filter((em): em is string => typeof em === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.trim()))
    .map((em) => ({ email: em.trim() }));

  const eventPayload = {
    summary: `[GEOMETRA Subtask] ${data.subtaskName} (${team})`,
    description: `Subtask Milestone in GEOMETRA - ARGUS\nParent Task: ${data.parentTaskName}\nTeam / Assignees: ${team}\nAlerted Member(s): ${
      validAttendees.length > 0 ? validAttendees.map((a) => a.email).join(', ') : 'Assigned Team'
    }\n\n${data.description || 'No description provided.'}\n\n---\nAutomated milestone deadline reminder with 72h/24h alerts for assigned team.`,
    start: {
      date: startDate,
    },
    end: {
      date: endDate,
    },
    attendees: validAttendees.length > 0 ? validAttendees : undefined,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 4320 }, // 72 Hours email alert
        { method: 'popup', minutes: 4320 }, // 72 Hours popup
        { method: 'email', minutes: 1440 }, // 24 Hours email alert
        { method: 'popup', minutes: 1440 }, // 24 Hours popup
        { method: 'popup', minutes: 60 },
      ],
    },
  };

  let response = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    }
  );

  if (!response.ok && (response.status === 400 || response.status === 403)) {
    response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...eventPayload,
          attendees: undefined,
        }),
      }
    );
  }

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.error?.message || 'Failed to create subtask Google Calendar event');
  }

  const result = await response.json();
  return {
    eventId: result.id,
    htmlLink: result.htmlLink || '',
  };
}

/**
 * Automatically synchronizes all active tasks and subtasks of a candidate with Google Calendar & Google Tasks,
 * scheduling 72-hour and 24-hour reminder alerts directly in their personal Google account.
 */
export async function syncAllCandidateTasksAndAlerts(
  accessToken: string,
  candidate: Task['candidateId'] extends string ? import('../types').Candidate : any,
  allCandidates: import('../types').Candidate[],
  options?: { forceResync?: boolean }
): Promise<{
  updatedCandidate: import('../types').Candidate;
  syncedTasks: number;
  syncedSubtasks: number;
  errors: string[];
}> {
  let syncedTasks = 0;
  let syncedSubtasks = 0;
  const errors: string[] = [];
  const forceResync = Boolean(options?.forceResync);

  const candidateMap = new Map<string, import('../types').Candidate>(
    allCandidates.map((c) => [c.id, c])
  );

  const updatedTasks = await Promise.all(
    candidate.tasks.map(async (task) => {
      let updatedTask = { ...task };

      // Collect attendee emails for parent task
      const attendeeEmails: string[] = [];
      if (candidate.email) attendeeEmails.push(candidate.email);
      if (task.isCollaborative && task.collaboratorIds) {
        task.collaboratorIds.forEach((id) => {
          const c = candidateMap.get(id);
          if (c?.email) attendeeEmails.push(c.email);
        });
      }

      // 1. Sync parent task to Google Calendar if not yet synced or forceResync requested
      if (!updatedTask.calendarEventId || forceResync) {
        try {
          const calRes = await createGoogleCalendarEvent(accessToken, {
            title: task.name,
            description: task.description,
            startDate: task.startDate,
            endDate: task.endDate,
            candidateName: candidate.name,
            assigneeNames: task.isCollaborative && task.collaboratorIds
              ? task.collaboratorIds.map((id) => candidateMap.get(id)?.name || 'Collaborator')
              : [candidate.name],
            attendeeEmails,
          });
          updatedTask.calendarEventId = calRes.eventId;
          updatedTask.calendarHtmlLink = calRes.htmlLink;
          syncedTasks++;
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Unknown calendar sync error';
          errors.push(`Calendar for "${task.name}": ${msg}`);
        }
      }

      // 2. Sync parent task to Google Tasks if not yet synced
      if (!updatedTask.googleTaskId || forceResync) {
        try {
          const taskRes = await createGoogleTaskItem(accessToken, {
            title: task.name,
            notes: task.description,
            dueDate: task.endDate,
          });
          updatedTask.googleTaskId = taskRes.googleTaskId;
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Unknown Google Task sync error';
          errors.push(`Tasks for "${task.name}": ${msg}`);
        }
      }

      // 3. Sync subtasks
      const updatedSubtasks = await Promise.all(
        (task.subtasks || []).map(async (sub) => {
          let updatedSub = { ...sub };
          if ((!updatedSub.calendarEventId || forceResync) && sub.endDate) {
            try {
              const subEmails: string[] = [];
              if (candidate.email) subEmails.push(candidate.email);
              if (sub.isCollaborative && sub.collaboratorIds) {
                sub.collaboratorIds.forEach((id) => {
                  const c = candidateMap.get(id);
                  if (c?.email) subEmails.push(c.email);
                });
              }

              const subCalRes = await createGoogleSubtaskCalendarEvent(accessToken, {
                subtaskName: sub.name,
                parentTaskName: task.name,
                description: sub.description,
                startDate: sub.startDate,
                endDate: sub.endDate,
                candidateName: candidate.name,
                collaboratorNames: sub.isCollaborative && sub.collaboratorIds
                  ? sub.collaboratorIds.map((id) => candidateMap.get(id)?.name || 'Collaborator')
                  : undefined,
                attendeeEmails: subEmails,
              });
              updatedSub.calendarEventId = subCalRes.eventId;
              updatedSub.calendarHtmlLink = subCalRes.htmlLink;
              syncedSubtasks++;
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : 'Unknown subtask calendar error';
              errors.push(`Subtask "${sub.name}": ${msg}`);
            }
          }
          return updatedSub;
        })
      );

      updatedTask.subtasks = updatedSubtasks;
      return updatedTask;
    })
  );

  return {
    updatedCandidate: {
      ...candidate,
      tasks: updatedTasks,
    },
    syncedTasks,
    syncedSubtasks,
    errors,
  };
}
