import React, { createContext, useContext, useState, useEffect, useMemo, useRef, ReactNode } from 'react';
import {
  Candidate,
  Task,
  Subtask,
  Resource,
  ActivityLog,
  StatusType,
  CandidateType,
  ResourceLevel,
  ResourceType,
  ViewTab,
  Note,
  ThemeType,
  EmailModalData,
  WorkspaceAuthUser,
} from '../types';
import {
  testFirestoreConnection,
  subscribeToCandidates,
  saveCandidateToFirestore,
  deleteCandidateFromFirestore,
  syncInitialDatasetToFirestore,
  configInfo,
} from '../lib/firebase';
import {
  initWorkspaceAuth,
  signInWithGoogleWorkspace,
  signOutWorkspace,
  getWorkspaceAccessToken,
  createGoogleCalendarEvent,
  createGoogleTaskItem,
  updateGoogleCalendarAndTaskCompletion,
  dispatch72HourCalendarNotification,
} from '../lib/googleWorkspace';

interface ResourceTarget {
  level: ResourceLevel;
  candidateId: string;
  taskId?: string;
  subtaskId?: string;
  targetName?: string;
}

interface ArgusContextType {
  candidates: Candidate[];
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  selectedCandidateId: string | null;
  setSelectedCandidateId: (id: string | null) => void;
  highlightedTaskId: string | null;
  setHighlightedTaskId: (id: string | null) => void;
  navigateToCandidateTask: (candidateId: string, taskId?: string) => void;

  // Theme support
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;

  // Google Workspace & Calendar Integration
  workspaceUser: WorkspaceAuthUser | null;
  isWorkspaceAuthenticated: boolean;
  isCalendarModalOpen: boolean;
  setIsCalendarModalOpen: (open: boolean) => void;
  autoSyncCalendar: boolean;
  setAutoSyncCalendar: (val: boolean) => void;
  connectGoogleWorkspace: () => Promise<void>;
  disconnectGoogleWorkspace: () => Promise<void>;
  syncTaskToGoogleCalendar: (candidateId: string, taskId: string) => Promise<void>;
  dispatch72HourNotification: (candidateId: string, taskId: string) => Promise<void>;
  simulate72HourInactivity: (taskId: string) => void;
  stagnant72hTasks: Array<{
    task: Task;
    candidate: Candidate;
    hoursStagnant: number;
  }>;

  // Click-to-Email Modal
  isEmailModalOpen: boolean;
  setIsEmailModalOpen: (open: boolean) => void;
  emailModalData: EmailModalData | null;
  openEmailModal: (data: EmailModalData) => void;

  // Google Database / Cloud Persistence Status
  isDatabaseModalOpen: boolean;
  setIsDatabaseModalOpen: (open: boolean) => void;
  databaseStatus: 'local' | 'connecting' | 'connected' | 'error';
  databaseMessage: string;
  checkDatabaseConnection: () => Promise<void>;
  syncToGoogleDatabase: () => Promise<void>;

  // Modals
  isAddCandidateOpen: boolean;
  setIsAddCandidateOpen: (open: boolean) => void;
  candidateToEdit: Candidate | null;
  setCandidateToEdit: (cand: Candidate | null) => void;

  isTaskModalOpen: boolean;
  setIsTaskModalOpen: (open: boolean) => void;
  taskModalData: { candidateId: string; taskToEdit?: Task } | null;
  openCreateTaskModal: (candidateId?: string) => void;
  openEditTaskModal: (candidateId: string, task: Task) => void;

  isResourceModalOpen: boolean;
  setIsResourceModalOpen: (open: boolean) => void;
  resourceTarget: ResourceTarget | null;
  openAddResourceModal: (target: ResourceTarget) => void;

  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;

  // Filters & State
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  typeFilter: 'All' | CandidateType;
  setTypeFilter: (type: 'All' | CandidateType) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Actions
  addCandidate: (data: {
    name: string;
    type: CandidateType;
    email?: string;
    notes?: string;
    startDate?: string;
  }) => Candidate;
  updateCandidate: (
    id: string,
    data: {
      name: string;
      type: CandidateType;
      email?: string;
      notes?: string;
      startDate?: string;
    }
  ) => void;
  deleteCandidate: (id: string) => void;

  addTask: (
    candidateId: string,
    data: {
      name: string;
      description?: string;
      status: StatusType;
      startDate?: string;
      endDate?: string;
      isCollaborative?: boolean;
      collaboratorIds?: string[];
      notesList?: Note[];
      initialNote?: { content: string; authorName: string };
    }
  ) => Task;
  updateTask: (candidateId: string, taskId: string, data: Partial<Task>) => void;
  updateTaskStatus: (candidateId: string, taskId: string, newStatus: StatusType) => void;
  deleteTask: (candidateId: string, taskId: string) => void;

  // Collaborative Subtask & Deadline Actions
  addSubtask: (
    candidateId: string,
    taskId: string,
    data: {
      name: string;
      description?: string;
      status: StatusType;
      startDate?: string;
      endDate: string; // Mandatory deadline
      isCollaborative?: boolean;
      collaboratorIds?: string[];
      notesList?: Note[];
      initialNote?: { content: string; authorName: string };
    }
  ) => void;
  updateSubtaskStatus: (
    candidateId: string,
    taskId: string,
    subtaskId: string,
    newStatus: StatusType
  ) => void;
  updateSubtask: (
    candidateId: string,
    taskId: string,
    subtaskId: string,
    data: Partial<Subtask>
  ) => void;
  deleteSubtask: (candidateId: string, taskId: string, subtaskId: string) => void;

  // Notes Management with Author Tracking
  addNoteToTask: (
    candidateId: string,
    taskId: string,
    note: { content: string; authorName: string; authorRole?: string }
  ) => void;
  deleteNoteFromTask: (candidateId: string, taskId: string, noteId: string) => void;

  addNoteToSubtask: (
    candidateId: string,
    taskId: string,
    subtaskId: string,
    note: { content: string; authorName: string; authorRole?: string }
  ) => void;
  deleteNoteFromSubtask: (
    candidateId: string,
    taskId: string,
    subtaskId: string,
    noteId: string
  ) => void;

  // Resources
  addResource: (
    target: ResourceTarget,
    data: {
      name: string;
      type: ResourceType;
      url?: string;
      fileName?: string;
      fileSize?: string;
    }
  ) => void;
  deleteResource: (
    resourceId: string,
    level: ResourceLevel,
    candidateId: string,
    taskId?: string,
    subtaskId?: string
  ) => void;

  clearAllData: () => void;

  // Aggregated stats
  stats: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    notStartedTasks: number;
    startedTasks: number;
    overallCompletionRate: number;
    totalCandidates: number;
    technicalCandidates: number;
    nonTechnicalCandidates: number;
  };

  allTasks: Array<
    Task & {
      candidateName: string;
      candidateType: CandidateType;
      collaboratorNames?: string[];
    }
  >;
  recentActivities: ActivityLog[];
}

const STORAGE_KEY = 'geometra_argus_system_data_v3';

const ArgusContext = createContext<ArgusContextType | undefined>(undefined);

export const ArgusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [candidates, setCandidates] = useState<Candidate[]>(() => {
    try {
      // Clean up legacy storage keys if present
      localStorage.removeItem('argus_system_data_v1');
      localStorage.removeItem('argus_system_data_v2');

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const defaultDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0];

          return parsed.map((c: Candidate) => ({
            ...c,
            startDate: c.startDate || c.createdAt.split('T')[0] || undefined,
            tasks: (c.tasks || []).map((t: Task) => ({
              ...t,
              startDate: t.startDate || t.createdAt.split('T')[0] || undefined,
              notesList: t.notesList || [],
              subtasks: (t.subtasks || []).map((s: Subtask) => ({
                ...s,
                startDate: s.startDate || s.createdAt.split('T')[0] || undefined,
                endDate: s.endDate || t.endDate || defaultDeadline,
                isCollaborative: !!s.isCollaborative,
                collaboratorIds: s.collaboratorIds || [],
                notesList: s.notesList || [],
              })),
            })),
          }));
        }
      }
    } catch {
      // Fallback
    }
    return [];
  });

  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);

  // Theme support
  const [theme, setTheme] = useState<ThemeType>(() => {
    const saved = localStorage.getItem('argus_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('argus_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Google Workspace & Calendar Integration
  const [workspaceUser, setWorkspaceUser] = useState<WorkspaceAuthUser | null>(null);
  const [isWorkspaceAuthenticated, setIsWorkspaceAuthenticated] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [autoSyncCalendar, setAutoSyncCalendar] = useState(true);

  // Click-to-Email Modal state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailModalData, setEmailModalData] = useState<EmailModalData | null>(null);

  const openEmailModal = (data: EmailModalData) => {
    setEmailModalData(data);
    setIsEmailModalOpen(true);
  };

  // Listen to Google Workspace Authentication
  useEffect(() => {
    const unsubscribe = initWorkspaceAuth(
      (user) => {
        setWorkspaceUser({
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        });
        setIsWorkspaceAuthenticated(true);
      },
      () => {
        setWorkspaceUser(null);
        setIsWorkspaceAuthenticated(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const connectGoogleWorkspace = async () => {
    try {
      const res = await signInWithGoogleWorkspace();
      if (res) {
        setWorkspaceUser({
          displayName: res.user.displayName,
          email: res.user.email,
          photoURL: res.user.photoURL,
        });
        setIsWorkspaceAuthenticated(true);
      }
    } catch (err) {
      console.error('Failed to sign in to Google Workspace:', err);
      throw err;
    }
  };

  const disconnectGoogleWorkspace = async () => {
    await signOutWorkspace();
    setWorkspaceUser(null);
    setIsWorkspaceAuthenticated(false);
  };

  // 72-Hour Inactivity Monitoring & Stagnant Tasks Calculation
  const stagnant72hTasks = useMemo(() => {
    const result: Array<{
      task: Task;
      candidate: Candidate;
      hoursStagnant: number;
    }> = [];

    const now = Date.now();
    candidates.forEach((c) => {
      c.tasks.forEach((t) => {
        if (t.status !== 'Completed') {
          const lastUpdateMs = new Date(t.lastStatusUpdate || t.createdAt).getTime();
          const diffHours = (now - lastUpdateMs) / (1000 * 3600);
          if (diffHours >= 72) {
            result.push({
              task: t,
              candidate: c,
              hoursStagnant: diffHours,
            });
          }
        }
      });
    });

    return result;
  }, [candidates]);

  const simulate72HourInactivity = (taskId: string) => {
    const seventyFourHoursAgo = new Date(Date.now() - 74 * 3600 * 1000).toISOString();
    setCandidates((prev) =>
      prev.map((c) => ({
        ...c,
        tasks: c.tasks.map((t) =>
          t.id === taskId ? { ...t, lastStatusUpdate: seventyFourHoursAgo } : t
        ),
      }))
    );
  };

  // Modals
  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false);
  const [candidateToEdit, setCandidateToEdit] = useState<Candidate | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskModalData, setTaskModalData] = useState<{ candidateId: string; taskToEdit?: Task } | null>(null);

  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [resourceTarget, setResourceTarget] = useState<ResourceTarget | null>(null);

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | CandidateType>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Database Modal & Status
  const [databaseStatus, setDatabaseStatus] = useState<'local' | 'connecting' | 'connected' | 'error'>('connecting');
  const [databaseMessage, setDatabaseMessage] = useState<string>('Connecting to Google Cloud Firestore...');
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);
  const isRemoteUpdateRef = useRef(false);

  // Connection check & real-time Firestore synchronization
  useEffect(() => {
    let isMounted = true;

    testFirestoreConnection()
      .then((res) => {
        if (!isMounted) return;
        if (res.success) {
          setDatabaseStatus('connected');
          setDatabaseMessage(`Connected to Google Cloud Firestore (${configInfo.databaseId})`);
        } else {
          setDatabaseStatus('local');
          setDatabaseMessage(`Local persistence active. (${res.message})`);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setDatabaseStatus('local');
        setDatabaseMessage(`Local persistence active. (${err.message || 'Firestore standby'})`);
      });

    let initialHandled = false;
    const unsubscribe = subscribeToCandidates(
      (firestoreCandidates) => {
        if (!isMounted) return;
        if (firestoreCandidates.length > 0) {
          isRemoteUpdateRef.current = true;
          setCandidates(firestoreCandidates);
          setDatabaseStatus('connected');
          setDatabaseMessage(
            `Connected to Google Cloud Firestore (${configInfo.databaseId}) • ${firestoreCandidates.length} candidate record(s) synced in real-time.`
          );
        } else if (!initialHandled) {
          initialHandled = true;
          // Remote is currently empty - upload local data if available
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            try {
              const localParsed = JSON.parse(saved);
              if (Array.isArray(localParsed) && localParsed.length > 0) {
                syncInitialDatasetToFirestore(localParsed).catch((err) =>
                  console.warn('Initial Firestore seeding notice:', err)
                );
              }
            } catch {}
          }
          setDatabaseStatus('connected');
          setDatabaseMessage(`Connected to Google Cloud Firestore (${configInfo.databaseId}) • Ready`);
        }
      },
      (error) => {
        if (!isMounted) return;
        console.warn('Firestore subscription notice:', error.message);
        setDatabaseStatus('local');
        setDatabaseMessage('Local persistence active. Google Cloud Firestore standby.');
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Sync to localStorage and push local changes to Google Cloud Firestore
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(candidates));
    } catch {
      // Fallback
    }

    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false;
      return;
    }

    // Push local candidate modifications to Firestore
    if (databaseStatus === 'connected' && candidates.length > 0) {
      candidates.forEach((c) => {
        saveCandidateToFirestore(c).catch((err) =>
          console.warn('Firestore sync notice:', err)
        );
      });
    }
  }, [candidates, databaseStatus]);

  const checkDatabaseConnection = async () => {
    setDatabaseStatus('connecting');
    setDatabaseMessage('Testing Google Cloud Firestore connection...');
    try {
      const res = await testFirestoreConnection();
      if (res.success) {
        setDatabaseStatus('connected');
        setDatabaseMessage(`Connected to Google Cloud Firestore (${configInfo.databaseId})`);
      } else {
        setDatabaseStatus('local');
        setDatabaseMessage(`Local persistence active: ${res.message}`);
      }
    } catch (err: unknown) {
      const errorObj = err as Error;
      setDatabaseStatus('error');
      setDatabaseMessage(`Connection check failed: ${errorObj.message || 'Unknown error'}`);
    }
  };

  const syncToGoogleDatabase = async () => {
    try {
      setDatabaseStatus('connecting');
      setDatabaseMessage('Uploading local records to Google Cloud Firestore...');
      await syncInitialDatasetToFirestore(candidates);
      setDatabaseStatus('connected');
      setDatabaseMessage(`Synchronized ${candidates.length} candidate record(s) to Google Cloud Firestore.`);
    } catch (err: unknown) {
      const errorObj = err as Error;
      setDatabaseStatus('error');
      setDatabaseMessage(`Synchronization failed: ${errorObj.message || 'Unknown error'}`);
    }
  };

  // Helper for generating activity logs
  const createLog = (
    action: string,
    candidateId: string,
    taskId?: string,
    subtaskId?: string,
    type?: 'candidate' | 'task' | 'subtask' | 'resource' | 'status'
  ): ActivityLog => ({
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    action,
    candidateId,
    taskId,
    subtaskId,
    type,
  });

  // Candidate Actions
  const addCandidate = (data: {
    name: string;
    type: CandidateType;
    email?: string;
    notes?: string;
    startDate?: string;
  }) => {
    const candidateId = `cand-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const log = createLog(
      `Candidate profile created: ${data.name} (${data.type})`,
      candidateId,
      undefined,
      undefined,
      'candidate'
    );

    const newCandidate: Candidate = {
      id: candidateId,
      name: data.name.trim(),
      type: data.type,
      email: data.email?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      resources: [],
      history: [log],
      tasks: [],
      createdAt: new Date().toISOString(),
    };

    setCandidates((prev) => [newCandidate, ...prev]);
    return newCandidate;
  };

  const updateCandidate = (
    id: string,
    data: {
      name: string;
      type: CandidateType;
      email?: string;
      notes?: string;
      startDate?: string;
    }
  ) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const log = createLog(`Candidate profile updated: ${data.name}`, id, undefined, undefined, 'candidate');
        return {
          ...c,
          name: data.name.trim(),
          type: data.type,
          email: data.email?.trim() || undefined,
          notes: data.notes?.trim() || undefined,
          startDate: data.startDate || c.startDate,
          history: [log, ...c.history],
        };
      })
    );
  };

  const deleteCandidate = (id: string) => {
    setCandidates((prev) => prev.filter((c) => c.id !== id));
    deleteCandidateFromFirestore(id).catch((err) => {
      console.warn('Firestore candidate delete notice:', err);
    });
    if (selectedCandidateId === id) {
      setSelectedCandidateId(null);
    }
  };

  // Task Actions
  const addTask = (
    candidateId: string,
    data: {
      name: string;
      description?: string;
      status: StatusType;
      startDate?: string;
      endDate?: string;
      isCollaborative?: boolean;
      collaboratorIds?: string[];
      notesList?: Note[];
      initialNote?: { content: string; authorName: string };
    }
  ) => {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const isCollaborative = !!data.isCollaborative && (data.collaboratorIds?.length || 0) >= 2;
    const collaboratorIds = isCollaborative ? data.collaboratorIds! : [candidateId];
    const primaryCandidateId = candidateId || collaboratorIds[0];

    const assignedCandidates = candidates.filter((c) => collaboratorIds.includes(c.id));
    const assignedNames = assignedCandidates.map((c) => c.name);

    const taskLog = createLog(
      isCollaborative
        ? `Collaborative task "${data.name}" created (Assignees: ${assignedNames.join(', ')})`
        : `Task "${data.name}" created`,
      primaryCandidateId,
      taskId,
      undefined,
      'task'
    );

    const notes: Note[] = data.notesList ? [...data.notesList] : [];
    if (data.initialNote?.content.trim()) {
      notes.push({
        id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        content: data.initialNote.content.trim(),
        authorName: data.initialNote.authorName.trim() || 'Admin',
        createdAt: new Date().toISOString(),
      });
    }

    const nowIso = new Date().toISOString();
    const newTask: Task = {
      id: taskId,
      candidateId: primaryCandidateId,
      isCollaborative,
      collaboratorIds,
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      status: data.status,
      startDate: data.startDate || nowIso.split('T')[0],
      endDate: data.endDate || undefined,
      notesList: notes,
      subtasks: [],
      resources: [],
      history: [taskLog],
      lastStatusUpdate: nowIso,
      createdAt: nowIso,
    };

    setCandidates((prev) =>
      prev.map((c) => {
        if (!collaboratorIds.includes(c.id)) return c;

        const otherCollaborators = assignedNames.filter((n) => n !== c.name);
        const cLog = isCollaborative
          ? createLog(
              `Assigned to collaborative task "${data.name}" ${otherCollaborators.length > 0 ? `(with ${otherCollaborators.join(', ')})` : ''}`,
              c.id,
              taskId,
              undefined,
              'task'
            )
          : createLog(`Task "${data.name}" created with status ${data.status}`, c.id, taskId, undefined, 'task');

        return {
          ...c,
          tasks: [newTask, ...c.tasks],
          history: [cLog, ...c.history],
        };
      })
    );

    // Auto Google Calendar & Tasks sync on assignment if authenticated and auto-sync is on
    const token = getWorkspaceAccessToken();
    if (token && autoSyncCalendar) {
      createGoogleCalendarEvent(token, {
        title: data.name.trim(),
        description: data.description?.trim(),
        startDate: data.startDate,
        endDate: data.endDate,
        candidateName: assignedNames.join(', ') || 'Candidate',
      })
        .then(async (calRes) => {
          let googleTaskId: string | undefined;
          try {
            const taskRes = await createGoogleTaskItem(token, {
              title: `${data.name.trim()} (${assignedNames.join(', ')})`,
              notes: data.description?.trim(),
              dueDate: data.endDate,
            });
            googleTaskId = taskRes.googleTaskId;
          } catch (te) {
            console.warn('Google Tasks creation notice:', te);
          }

          updateTask(primaryCandidateId, taskId, {
            calendarEventId: calRes.eventId,
            calendarHtmlLink: calRes.htmlLink,
            googleTaskId,
          });
        })
        .catch((ce) => {
          console.warn('Auto Google Calendar creation notice:', ce);
        });
    }

    return newTask;
  };

  const syncTaskToGoogleCalendar = async (candidateId: string, taskId: string) => {
    const token = getWorkspaceAccessToken();
    if (!token) {
      setIsCalendarModalOpen(true);
      return;
    }
    const cand = candidates.find((c) => c.id === candidateId);
    if (!cand) return;
    const targetTask = cand.tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    try {
      const calRes = await createGoogleCalendarEvent(token, {
        title: targetTask.name,
        description: targetTask.description,
        startDate: targetTask.startDate,
        endDate: targetTask.endDate,
        candidateName: cand.name,
      });

      let googleTaskId: string | undefined;
      try {
        const taskRes = await createGoogleTaskItem(token, {
          title: `${targetTask.name} (${cand.name})`,
          notes: targetTask.description,
          dueDate: targetTask.endDate,
        });
        googleTaskId = taskRes.googleTaskId;
      } catch (te) {
        console.warn('Google Tasks creation notice:', te);
      }

      updateTask(candidateId, taskId, {
        calendarEventId: calRes.eventId,
        calendarHtmlLink: calRes.htmlLink,
        googleTaskId,
      });

      const log = createLog(
        `Synced to Google Calendar with 72-hour reminders`,
        candidateId,
        taskId,
        undefined,
        'task'
      );
      setCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, history: [log, ...c.history] } : c))
      );
    } catch (err: unknown) {
      console.error('Google Calendar sync error:', err);
      throw err;
    }
  };

  const dispatch72HourNotification = async (candidateId: string, taskId: string) => {
    const cand = candidates.find((c) => c.id === candidateId);
    if (!cand) return;
    const targetTask = cand.tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const nowIso = new Date().toISOString();
    const token = getWorkspaceAccessToken();
    const hoursStagnant =
      (Date.now() - new Date(targetTask.lastStatusUpdate || targetTask.createdAt).getTime()) /
      (1000 * 3600);

    if (token) {
      try {
        await dispatch72HourCalendarNotification(token, {
          task: targetTask,
          candidateName: cand.name,
          stagnantHours: Math.floor(hoursStagnant),
          recipientEmail: cand.email,
        });
      } catch (e) {
        console.warn('Calendar notification dispatch notice:', e);
      }
    }

    updateTask(candidateId, taskId, {
      lastReminderSentAt: nowIso,
    });

    const log = createLog(
      `72-Hour Status Inactivity reminder sent to Calendar & Task notification queue`,
      candidateId,
      taskId,
      undefined,
      'status'
    );
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, history: [log, ...c.history] } : c))
    );
  };

  const updateTask = (candidateId: string, taskId: string, data: Partial<Task>) => {
    setCandidates((prev) =>
      prev.map((c) => {
        const hasTask = c.tasks.some((t) => t.id === taskId);
        if (!hasTask) return c;

        const updatedTasks = c.tasks.map((t) => {
          if (t.id !== taskId) return t;

          const logAction =
            data.endDate && data.endDate !== t.endDate
              ? `Task deadline changed to ${data.endDate}`
              : data.startDate && data.startDate !== t.startDate
              ? `Task start date changed to ${data.startDate}`
              : `Task "${data.name || t.name}" updated`;
          const tLog = createLog(logAction, c.id, taskId, undefined, 'task');

          return {
            ...t,
            ...data,
            history: [tLog, ...t.history],
          };
        });

        return {
          ...c,
          tasks: updatedTasks,
        };
      })
    );
  };

  const updateTaskStatus = (candidateId: string, taskId: string, newStatus: StatusType) => {
    const nowIso = new Date().toISOString();
    setCandidates((prev) =>
      prev.map((c) => {
        const targetTask = c.tasks.find((t) => t.id === taskId);
        if (!targetTask) return c;

        const updatedTasks = c.tasks.map((t) => {
          if (t.id !== taskId) return t;
          const tLog = createLog(`Task status changed to ${newStatus}`, c.id, taskId, undefined, 'status');
          return {
            ...t,
            status: newStatus,
            lastStatusUpdate: nowIso,
            history: [tLog, ...t.history],
          };
        });

        const cLog = createLog(`${targetTask.name} changed to ${newStatus}`, c.id, taskId, undefined, 'status');

        return {
          ...c,
          tasks: updatedTasks,
          history: [cLog, ...c.history],
        };
      })
    );

    // Sync status change / completion to Google Calendar and Tasks
    const token = getWorkspaceAccessToken();
    if (token) {
      const allMatching = candidates.flatMap((c) => c.tasks).find((t) => t.id === taskId);
      if (allMatching && (allMatching.calendarEventId || allMatching.googleTaskId)) {
        updateGoogleCalendarAndTaskCompletion(token, {
          calendarEventId: allMatching.calendarEventId,
          googleTaskId: allMatching.googleTaskId,
          taskTitle: allMatching.name,
          isCompleted: newStatus === 'Completed',
        }).catch((e) => console.warn('Google Calendar update notice:', e));
      }
    }
  };

  const deleteTask = (candidateId: string, taskId: string) => {
    setCandidates((prev) =>
      prev.map((c) => {
        const targetTask = c.tasks.find((t) => t.id === taskId);
        if (!targetTask) return c;
        const taskName = targetTask.name || 'Task';
        const cLog = createLog(`Task "${taskName}" deleted`, c.id, taskId, undefined, 'task');

        return {
          ...c,
          tasks: c.tasks.filter((t) => t.id !== taskId),
          history: [cLog, ...c.history],
        };
      })
    );
  };

  // Collaborative Subtasks & Deadline Actions
  const addSubtask = (
    candidateId: string,
    taskId: string,
    data: {
      name: string;
      description?: string;
      status: StatusType;
      startDate?: string;
      endDate: string;
      isCollaborative?: boolean;
      collaboratorIds?: string[];
      notesList?: Note[];
      initialNote?: { content: string; authorName: string };
    }
  ) => {
    const subtaskId = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const isCollab = !!data.isCollaborative && (data.collaboratorIds?.length || 0) >= 1;
    const sLog = createLog(
      isCollab
        ? `Collaborative subtask "${data.name}" created with deadline ${data.endDate}`
        : `Subtask "${data.name}" created with deadline ${data.endDate}`,
      candidateId,
      taskId,
      subtaskId,
      'subtask'
    );

    const notes: Note[] = data.notesList ? [...data.notesList] : [];
    if (data.initialNote?.content.trim()) {
      notes.push({
        id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        content: data.initialNote.content.trim(),
        authorName: data.initialNote.authorName.trim() || 'Admin',
        createdAt: new Date().toISOString(),
      });
    }

    const newSubtask: Subtask = {
      id: subtaskId,
      taskId,
      candidateId,
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      status: data.status,
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      endDate: data.endDate,
      isCollaborative: isCollab,
      collaboratorIds: data.collaboratorIds || [],
      notesList: notes,
      resources: [],
      history: [sLog],
      createdAt: new Date().toISOString(),
    };

    setCandidates((prev) =>
      prev.map((c) => {
        const hasTask = c.tasks.some((t) => t.id === taskId);
        if (!hasTask) return c;

        const updatedTasks = c.tasks.map((t) => {
          if (t.id !== taskId) return t;
          const tLog = createLog(`Subtask "${data.name}" added`, c.id, taskId, subtaskId, 'subtask');
          return {
            ...t,
            lastStatusUpdate: new Date().toISOString(),
            subtasks: [...t.subtasks, newSubtask],
            history: [tLog, ...t.history],
          };
        });

        const cLog = createLog(`Subtask "${data.name}" added to task`, c.id, taskId, subtaskId, 'subtask');

        return {
          ...c,
          tasks: updatedTasks,
          history: [cLog, ...c.history],
        };
      })
    );
  };

  const updateSubtaskStatus = (
    candidateId: string,
    taskId: string,
    subtaskId: string,
    newStatus: StatusType
  ) => {
    setCandidates((prev) =>
      prev.map((c) => {
        const hasTask = c.tasks.some((t) => t.id === taskId);
        if (!hasTask) return c;

        let subtaskName = 'Subtask';
        const updatedTasks = c.tasks.map((t) => {
          if (t.id !== taskId) return t;

          const updatedSubtasks = t.subtasks.map((s) => {
            if (s.id !== subtaskId) return s;
            subtaskName = s.name;
            const sLog = createLog(`Status changed to ${newStatus}`, c.id, taskId, subtaskId, 'status');
            return {
              ...s,
              status: newStatus,
              history: [sLog, ...s.history],
            };
          });

          const tLog = createLog(`Subtask "${subtaskName}" status changed to ${newStatus}`, c.id, taskId, subtaskId, 'status');
          return {
            ...t,
            lastStatusUpdate: new Date().toISOString(),
            subtasks: updatedSubtasks,
            history: [tLog, ...t.history],
          };
        });

        const cLog = createLog(`Subtask "${subtaskName}" updated to ${newStatus}`, c.id, taskId, subtaskId, 'status');

        return {
          ...c,
          tasks: updatedTasks,
          history: [cLog, ...c.history],
        };
      })
    );
  };

  const updateSubtask = (
    candidateId: string,
    taskId: string,
    subtaskId: string,
    data: Partial<Subtask>
  ) => {
    setCandidates((prev) =>
      prev.map((c) => {
        const hasTask = c.tasks.some((t) => t.id === taskId);
        if (!hasTask) return c;

        const updatedTasks = c.tasks.map((t) => {
          if (t.id !== taskId) return t;

          const updatedSubtasks = t.subtasks.map((s) => {
            if (s.id !== subtaskId) return s;
            const sLog = createLog(
              data.endDate && data.endDate !== s.endDate
                ? `Subtask deadline changed to ${data.endDate}`
                : `Subtask "${data.name || s.name}" updated`,
              c.id,
              taskId,
              subtaskId,
              'subtask'
            );
            return {
              ...s,
              ...data,
              history: [sLog, ...s.history],
            };
          });

          return {
            ...t,
            subtasks: updatedSubtasks,
          };
        });

        return {
          ...c,
          tasks: updatedTasks,
        };
      })
    );
  };

  const deleteSubtask = (candidateId: string, taskId: string, subtaskId: string) => {
    setCandidates((prev) =>
      prev.map((c) => {
        const hasTask = c.tasks.some((t) => t.id === taskId);
        if (!hasTask) return c;

        let subName = 'Subtask';
        const updatedTasks = c.tasks.map((t) => {
          if (t.id !== taskId) return t;
          const targetSub = t.subtasks.find((s) => s.id === subtaskId);
          if (targetSub) subName = targetSub.name;

          return {
            ...t,
            subtasks: t.subtasks.filter((s) => s.id !== subtaskId),
            history: [createLog(`Subtask "${subName}" deleted`, c.id, taskId, subtaskId, 'subtask'), ...t.history],
          };
        });

        return {
          ...c,
          tasks: updatedTasks,
          history: [createLog(`Subtask "${subName}" deleted`, c.id, taskId, subtaskId, 'subtask'), ...c.history],
        };
      })
    );
  };

  // Notes Management with Author Tracking
  const addNoteToTask = (
    candidateId: string,
    taskId: string,
    note: { content: string; authorName: string; authorRole?: string }
  ) => {
    if (!note.content.trim()) return;
    const newNote: Note = {
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      content: note.content.trim(),
      authorName: note.authorName.trim() || 'Admin',
      authorRole: note.authorRole || 'Reviewer',
      createdAt: new Date().toISOString(),
    };

    setCandidates((prev) =>
      prev.map((c) => {
        const hasTask = c.tasks.some((t) => t.id === taskId);
        if (!hasTask) return c;

        const updatedTasks = c.tasks.map((t) => {
          if (t.id !== taskId) return t;
          const tLog = createLog(
            `Note added by ${newNote.authorName}: "${newNote.content.slice(0, 30)}${newNote.content.length > 30 ? '...' : ''}"`,
            c.id,
            taskId,
            undefined,
            'task'
          );
          return {
            ...t,
            notesList: [...(t.notesList || []), newNote],
            history: [tLog, ...t.history],
          };
        });

        return {
          ...c,
          tasks: updatedTasks,
        };
      })
    );
  };

  const deleteNoteFromTask = (candidateId: string, taskId: string, noteId: string) => {
    setCandidates((prev) =>
      prev.map((c) => {
        const hasTask = c.tasks.some((t) => t.id === taskId);
        if (!hasTask) return c;

        const updatedTasks = c.tasks.map((t) => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            notesList: (t.notesList || []).filter((n) => n.id !== noteId),
          };
        });

        return {
          ...c,
          tasks: updatedTasks,
        };
      })
    );
  };

  const addNoteToSubtask = (
    candidateId: string,
    taskId: string,
    subtaskId: string,
    note: { content: string; authorName: string; authorRole?: string }
  ) => {
    if (!note.content.trim()) return;
    const newNote: Note = {
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      content: note.content.trim(),
      authorName: note.authorName.trim() || 'Admin',
      authorRole: note.authorRole || 'Reviewer',
      createdAt: new Date().toISOString(),
    };

    setCandidates((prev) =>
      prev.map((c) => {
        const hasTask = c.tasks.some((t) => t.id === taskId);
        if (!hasTask) return c;

        const updatedTasks = c.tasks.map((t) => {
          if (t.id !== taskId) return t;

          const updatedSubtasks = t.subtasks.map((s) => {
            if (s.id !== subtaskId) return s;
            const sLog = createLog(
              `Note added by ${newNote.authorName} on subtask: "${newNote.content.slice(0, 30)}${newNote.content.length > 30 ? '...' : ''}"`,
              c.id,
              taskId,
              subtaskId,
              'subtask'
            );
            return {
              ...s,
              notesList: [...(s.notesList || []), newNote],
              history: [sLog, ...s.history],
            };
          });

          return {
            ...t,
            subtasks: updatedSubtasks,
          };
        });

        return {
          ...c,
          tasks: updatedTasks,
        };
      })
    );
  };

  const deleteNoteFromSubtask = (
    candidateId: string,
    taskId: string,
    subtaskId: string,
    noteId: string
  ) => {
    setCandidates((prev) =>
      prev.map((c) => {
        const hasTask = c.tasks.some((t) => t.id === taskId);
        if (!hasTask) return c;

        const updatedTasks = c.tasks.map((t) => {
          if (t.id !== taskId) return t;

          const updatedSubtasks = t.subtasks.map((s) => {
            if (s.id !== subtaskId) return s;
            return {
              ...s,
              notesList: (s.notesList || []).filter((n) => n.id !== noteId),
            };
          });

          return {
            ...t,
            subtasks: updatedSubtasks,
          };
        });

        return {
          ...c,
          tasks: updatedTasks,
        };
      })
    );
  };

  // Resource Actions
  const addResource = (
    target: ResourceTarget,
    data: {
      name: string;
      type: ResourceType;
      url?: string;
      fileName?: string;
      fileSize?: string;
    }
  ) => {
    const resId = `res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newRes: Resource = {
      id: resId,
      name: data.name.trim(),
      type: data.type,
      url: data.url?.trim() || undefined,
      fileName: data.fileName || undefined,
      fileSize: data.fileSize || undefined,
      level: target.level,
      candidateId: target.candidateId,
      taskId: target.taskId,
      subtaskId: target.subtaskId,
      createdAt: new Date().toISOString(),
    };

    const targetDesc =
      target.level === 'candidate'
        ? 'candidate profile'
        : target.level === 'task'
        ? `task "${target.targetName || 'Task'}"`
        : `subtask "${target.targetName || 'Subtask'}"`;

    const rLog = createLog(
      `Resource "${newRes.name}" (${newRes.type.toUpperCase()}) attached to ${targetDesc}`,
      target.candidateId,
      target.taskId,
      target.subtaskId,
      'resource'
    );

    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== target.candidateId) return c;

        if (target.level === 'candidate') {
          return {
            ...c,
            resources: [...c.resources, newRes],
            history: [rLog, ...c.history],
          };
        }

        if (target.level === 'task' && target.taskId) {
          const updatedTasks = c.tasks.map((t) => {
            if (t.id !== target.taskId) return t;
            return {
              ...t,
              resources: [...t.resources, newRes],
              history: [rLog, ...t.history],
            };
          });
          return {
            ...c,
            tasks: updatedTasks,
            history: [rLog, ...c.history],
          };
        }

        if (target.level === 'subtask' && target.taskId && target.subtaskId) {
          const updatedTasks = c.tasks.map((t) => {
            if (t.id !== target.taskId) return t;
            const updatedSubtasks = t.subtasks.map((s) => {
              if (s.id !== target.subtaskId) return s;
              return {
                ...s,
                resources: [...s.resources, newRes],
                history: [rLog, ...s.history],
              };
            });
            return {
              ...t,
              subtasks: updatedSubtasks,
              history: [rLog, ...t.history],
            };
          });
          return {
            ...c,
            tasks: updatedTasks,
            history: [rLog, ...c.history],
          };
        }

        return c;
      })
    );
  };

  const deleteResource = (
    resourceId: string,
    level: ResourceLevel,
    candidateId: string,
    taskId?: string,
    subtaskId?: string
  ) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== candidateId) return c;

        if (level === 'candidate') {
          return {
            ...c,
            resources: c.resources.filter((r) => r.id !== resourceId),
            history: [createLog('Resource deleted', candidateId, undefined, undefined, 'resource'), ...c.history],
          };
        }

        if (level === 'task' && taskId) {
          return {
            ...c,
            tasks: c.tasks.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    resources: t.resources.filter((r) => r.id !== resourceId),
                    history: [createLog('Resource deleted from task', candidateId, taskId, undefined, 'resource'), ...t.history],
                  }
                : t
            ),
          };
        }

        if (level === 'subtask' && taskId && subtaskId) {
          return {
            ...c,
            tasks: c.tasks.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    subtasks: t.subtasks.map((s) =>
                      s.id === subtaskId
                        ? {
                            ...s,
                            resources: s.resources.filter((r) => r.id !== resourceId),
                            history: [createLog('Resource deleted from subtask', candidateId, taskId, subtaskId, 'resource'), ...s.history],
                          }
                        : s
                    ),
                  }
                : t
            ),
          };
        }

        return c;
      })
    );
  };

  const clearAllData = () => {
    candidates.forEach((c) => {
      deleteCandidateFromFirestore(c.id).catch(() => {});
    });
    setCandidates([]);
    setSelectedCandidateId(null);
    setHighlightedTaskId(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Aggregated Stats
  const stats = useMemo(() => {
    let totalTasks = 0;
    let completedTasks = 0;
    let inProgressTasks = 0;
    let notStartedTasks = 0;
    let startedTasks = 0;

    candidates.forEach((c) => {
      c.tasks.forEach((t) => {
        totalTasks += 1;
        if (t.status === 'Completed') completedTasks += 1;
        else if (t.status === 'In Progress') inProgressTasks += 1;
        else if (t.status === 'Started') startedTasks += 1;
        else notStartedTasks += 1;
      });
    });

    const overallCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const technicalCandidates = candidates.filter((c) => c.type === 'Technical').length;
    const nonTechnicalCandidates = candidates.filter((c) => c.type === 'Non-Technical').length;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      notStartedTasks,
      startedTasks,
      overallCompletionRate,
      totalCandidates: candidates.length,
      technicalCandidates,
      nonTechnicalCandidates,
    };
  }, [candidates]);

  // All Tasks Flat Array for cross-candidate views
  const allTasks = useMemo(() => {
    const candidateMap = new Map<string, Candidate>();
    candidates.forEach((c) => candidateMap.set(c.id, c));

    const taskMap = new Map<
      string,
      Task & {
        candidateName: string;
        candidateType: CandidateType;
        collaboratorNames?: string[];
      }
    >();

    candidates.forEach((c) => {
      c.tasks.forEach((t) => {
        if (!taskMap.has(t.id)) {
          const colNames = (t.collaboratorIds || [])
            .map((id) => candidateMap.get(id)?.name)
            .filter((name): name is string => !!name);

          taskMap.set(t.id, {
            ...t,
            candidateName: c.name,
            candidateType: c.type,
            collaboratorNames: colNames.length > 0 ? colNames : [c.name],
          });
        }
      });
    });

    return Array.from(taskMap.values());
  }, [candidates]);

  // Recent Activity Feed
  const recentActivities = useMemo(() => {
    const allLogs: ActivityLog[] = [];
    candidates.forEach((c) => {
      allLogs.push(...c.history);
      c.tasks.forEach((t) => {
        allLogs.push(...t.history);
        t.subtasks.forEach((s) => {
          allLogs.push(...s.history);
        });
      });
    });

    // Deduplicate and sort descending
    const seen = new Set<string>();
    return allLogs
      .filter((log) => {
        if (seen.has(log.id)) return false;
        seen.add(log.id);
        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 40);
  }, [candidates]);

  // Modal helpers
  const openCreateTaskModal = (candidateId?: string) => {
    setTaskModalData({
      candidateId: candidateId || (candidates.length > 0 ? candidates[0].id : ''),
    });
    setIsTaskModalOpen(true);
  };

  const openEditTaskModal = (candidateId: string, task: Task) => {
    setTaskModalData({
      candidateId,
      taskToEdit: task,
    });
    setIsTaskModalOpen(true);
  };

  const openAddResourceModal = (target: ResourceTarget) => {
    setResourceTarget(target);
    setIsResourceModalOpen(true);
  };

  const navigateToCandidateTask = (candidateId: string, taskId?: string) => {
    setSelectedCandidateId(candidateId);
    if (taskId) {
      setHighlightedTaskId(taskId);
    }
  };

  return (
    <ArgusContext.Provider
      value={{
        candidates,
        activeTab,
        setActiveTab,
        selectedCandidateId,
        setSelectedCandidateId,
        highlightedTaskId,
        setHighlightedTaskId,
        navigateToCandidateTask,

        // Theme support
        theme,
        setTheme,
        toggleTheme,

        // Google Workspace & Calendar Integration
        workspaceUser,
        isWorkspaceAuthenticated,
        isCalendarModalOpen,
        setIsCalendarModalOpen,
        autoSyncCalendar,
        setAutoSyncCalendar,
        connectGoogleWorkspace,
        disconnectGoogleWorkspace,
        syncTaskToGoogleCalendar,
        dispatch72HourNotification,
        simulate72HourInactivity,
        stagnant72hTasks,

        // Click-to-Email Modal
        isEmailModalOpen,
        setIsEmailModalOpen,
        emailModalData,
        openEmailModal,

        isDatabaseModalOpen,
        setIsDatabaseModalOpen,
        databaseStatus,
        databaseMessage,
        checkDatabaseConnection,
        syncToGoogleDatabase,

        isAddCandidateOpen,
        setIsAddCandidateOpen,
        candidateToEdit,
        setCandidateToEdit,

        isTaskModalOpen,
        setIsTaskModalOpen,
        taskModalData,
        openCreateTaskModal,
        openEditTaskModal,

        isResourceModalOpen,
        setIsResourceModalOpen,
        resourceTarget,
        openAddResourceModal,

        isSearchOpen,
        setIsSearchOpen,

        statusFilter,
        setStatusFilter,
        typeFilter,
        setTypeFilter,
        searchQuery,
        setSearchQuery,

        addCandidate,
        updateCandidate,
        deleteCandidate,

        addTask,
        updateTask,
        updateTaskStatus,
        deleteTask,

        addSubtask,
        updateSubtaskStatus,
        updateSubtask,
        deleteSubtask,

        addNoteToTask,
        deleteNoteFromTask,
        addNoteToSubtask,
        deleteNoteFromSubtask,

        addResource,
        deleteResource,

        clearAllData,

        stats,
        allTasks,
        recentActivities,
      }}
    >
      {children}
    </ArgusContext.Provider>
  );
};

export const useArgus = () => {
  const context = useContext(ArgusContext);
  if (!context) {
    throw new Error('useArgus must be used within an ArgusProvider');
  }
  return context;
};
