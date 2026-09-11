import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import { app } from './firebase';
import { Task, Subtask } from '../types';

export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/calendar.events');
provider.addScope('https://www.googleapis.com/auth/tasks');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initWorkspaceAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
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
    console.error('Google Workspace sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
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
const getValidDateStr = (dateStr?: string): string => {
  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  return new Date().toISOString().split('T')[0];
};

/**
 * Creates an event in Google Calendar with 72-hour reminders
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
  }
): Promise<{ eventId: string; htmlLink: string }> {
  const startDate = getValidDateStr(data.startDate);
  // End date for all-day events in Google Calendar is exclusive, so add 1 day if equal
  const endDate = getValidDateStr(data.endDate || data.startDate);

  const assignees = data.assigneeNames && data.assigneeNames.length > 0
    ? data.assigneeNames.join(', ')
    : data.candidateName;

  const eventPayload = {
    summary: `[GEOMETRA] ${data.title} (${assignees})`,
    description: `Task / Project Assignment in GEOMETRA - ARGUS\nAssignee(s): ${assignees}\nCandidate: ${data.candidateName}\n\n${
      data.description || 'No additional description provided.'
    }\n\n---\nAutomatic 72-Hour Reminders & Tracking enabled.`,
    start: {
      date: startDate,
    },
    end: {
      date: endDate,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 4320 }, // 72 Hours before deadline
        { method: 'popup', minutes: 1440 }, // 24 Hours before deadline
        { method: 'popup', minutes: 60 },   // 1 Hour before deadline
      ],
    },
  };

  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    }
  );

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
 */
export async function dispatch72HourCalendarNotification(
  accessToken: string,
  data: {
    task: Task | Subtask;
    candidateName: string;
    stagnantHours: number;
    recipientEmail?: string;
  }
): Promise<{ eventId: string; htmlLink: string }> {
  const todayStr = new Date().toISOString().split('T')[0];
  const daysStagnant = Math.floor(data.stagnantHours / 24);

  const eventPayload = {
    summary: `⚠️ [72H REMINDER] Status Update: ${data.task.name} (${data.candidateName})`,
    description: `ATTENTION: Status has remained unchanged for ${data.stagnantHours} hours (~${daysStagnant} days).\nCurrent Status: ${data.task.status}\nCandidate: ${data.candidateName}\n${
      data.recipientEmail ? `Contact: ${data.recipientEmail}\n` : ''
    }\nPlease review and update the status in GEOMETRA - ARGUS immediately.`,
    start: {
      date: todayStr,
    },
    end: {
      date: todayStr,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 0 },
        { method: 'popup', minutes: 30 },
      ],
    },
  };

  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    }
  );

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
