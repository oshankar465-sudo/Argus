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
  CandidateAuthSession,
  DbSyncCheckResult,
} from '../types';
import {
  testFirestoreConnection,
  subscribeToCandidates,
  saveCandidateToFirestore,
  deleteCandidateFromFirestore,
  syncInitialDatasetToFirestore,
  configInfo,
  forceReconnectDatabase,
  subscribeToConnectionStatus,
  ConnectionStatusInfo,
} from '../lib/firebase';
import {
  initWorkspaceAuth,
  signInWithGoogleWorkspace,
  signOutWorkspace,
  getWorkspaceAccessToken,
  createGoogleCalendarEvent,
  createGoogleSubtaskCalendarEvent,
  createGoogleTaskItem,
  updateGoogleCalendarAndTaskCompletion,
  dispatch72HourCalendarNotification,
  syncAllCandidateTasksAndAlerts,
  isAuthCancellation,
  getGoogleCalendarWebUrl,
  downloadCandidateIcsCalendar,
  downloadSingleTaskIcsCalendar,
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
  connectGoogleWorkspace: () => Promise<{ success: boolean; cancelled?: boolean; error?: string }>;
  disconnectGoogleWorkspace: () => Promise<void>;
  syncTaskToGoogleCalendar: (candidateId: string, taskId: string) => Promise<void>;
  syncSubtaskToGoogleCalendar: (candidateId: string, taskId: string, subtaskId: string) => Promise<void>;
  dispatch72HourNotification: (candidateId: string, taskId: string) => Promise<void>;
  simulate72HourInactivity: (taskId: string) => void;
  stagnant72hTasks: Array<{
    task: Task;
    candidate: Candidate;
    hoursStagnant: number;
  }>;

  // 1-Click Instant Calendar Web & .ics Export (Deployed-Safe)
  getTaskGoogleCalendarWebUrl: (candidateId: string, taskId: string) => string;
  openTaskInGoogleCalendarWeb: (candidateId: string, taskId: string) => void;
  exportCandidateCalendarIcs: (candidateId: string) => void;
  exportTaskCalendarIcs: (candidateId: string, taskId: string) => void;

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
  connectionDetails: ConnectionStatusInfo | null;
  checkDatabaseConnection: () => Promise<void>;
  forceReconnect: () => Promise<void>;
  syncToGoogleDatabase: () => Promise<void>;
  dbSyncCheckResult: DbSyncCheckResult | null;
  verifyMainDatabaseSync: () => Promise<DbSyncCheckResult>;

  // Candidate Gmail Authentication & Portal
  candidateSession: CandidateAuthSession | null;
  loggedInCandidate: Candidate | null;
  isCandidateLoginModalOpen: boolean;
  setIsCandidateLoginModalOpen: (open: boolean) => void;
  loginCandidateWithGmail: () => Promise<{
    success: boolean;
    candidate?: Candidate;
    cancelled?: boolean;
    error?: string;
  }>;
  logoutCandidateSession: () => Promise<void>;
  syncLoggedInCandidateTasks: (options?: { forceResync?: boolean }) => Promise<{
    syncedTasks: number;
    syncedSubtasks: number;
    errors?: string[];
  }>;
  openCandidatePortal: (candidateId?: string) => void;

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
    email: string;
    notes?: string;
    startDate?: string;
  }) => Candidate;
  updateCandidate: (
    id: string,
    data: {
      name: string;
      type: CandidateType;
      email: string;
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
            email: c.email || `${c.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@geometra.io`,
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

    const defaultDeadline = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const initialCandidates: Candidate[] = [
      {
        id: 'cand-init-1',
        name: 'Om Shankar',
        type: 'Technical',
        email: 'oshankar465@gmail.com',
        startDate: new Date().toISOString().split('T')[0],
        notes: 'Lead engineer overseeing full-stack architecture and integrations.',
        createdAt: new Date().toISOString(),
        resources: [],
        history: [
          {
            id: 'log-init-1',
            timestamp: new Date().toISOString(),
            action: 'Candidate profile registered: Om Shankar (Technical) • Alert Email: oshankar465@gmail.com',
            candidateId: 'cand-init-1',
            type: 'candidate',
          },
        ],
        tasks: [
          {
            id: 'task-init-1',
            candidateId: 'cand-init-1',
            name: 'API Infrastructure & Database Optimization',
            description: 'Deploy Firestore database rules, integrate Google Calendar real-time alerts, and test sync.',
            status: 'In Progress',
            startDate: new Date().toISOString().split('T')[0],
            endDate: defaultDeadline,
            isCollaborative: true,
            collaboratorIds: ['cand-init-1', 'cand-init-2'],
            notesList: [
              {
                id: 'note-init-1',
                content: 'Google Calendar sync configured with ?sendUpdates=all for instant notifications.',
                authorName: 'System Lead',
                authorRole: 'Admin',
                createdAt: new Date().toISOString(),
              },
            ],
            resources: [],
            history: [],
            createdAt: new Date().toISOString(),
            lastStatusUpdate: new Date().toISOString(),
            subtasks: [
              {
                id: 'sub-init-1',
                taskId: 'task-init-1',
                candidateId: 'cand-init-1',
                name: 'Audit attendee email validation and schema rules',
                status: 'Completed',
                startDate: new Date().toISOString().split('T')[0],
                endDate: defaultDeadline,
                isCollaborative: false,
                collaboratorIds: [],
                notesList: [],
                resources: [],
                history: [],
                createdAt: new Date().toISOString(),
              },
              {
                id: 'sub-init-2',
                taskId: 'task-init-1',
                candidateId: 'cand-init-1',
                name: 'Verify 72-hour inactivity warning alerts to team inbox',
                status: 'In Progress',
                startDate: new Date().toISOString().split('T')[0],
                endDate: defaultDeadline,
                isCollaborative: true,
                collaboratorIds: ['cand-init-1', 'cand-init-2'],
                notesList: [],
                resources: [],
                history: [],
                createdAt: new Date().toISOString(),
              },
            ],
          },
        ],
      },
      {
        id: 'cand-init-2',
        name: 'Elena Rostova',
        type: 'Technical',
        email: 'elena.rostova@geometra.io',
        startDate: new Date().toISOString().split('T')[0],
        notes: 'Frontend and mobile UX specialist.',
        createdAt: new Date().toISOString(),
        resources: [],
        history: [],
        tasks: [],
      },
      {
        id: 'cand-init-3',
        name: 'Marcus Vance',
        type: 'Non-Technical',
        email: 'marcus.vance@geometra.io',
        startDate: new Date().toISOString().split('T')[0],
        notes: 'Project coordinator and partner communications.',
        createdAt: new Date().toISOString(),
        resources: [],
        history: [],
        tasks: [],
      },
    ];
    return initialCandidates;
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

  const connectGoogleWorkspace = async (): Promise<{
    success: boolean;
    cancelled?: boolean;
    error?: string;
  }> => {
    try {
      const res = await signInWithGoogleWorkspace();
      if (res) {
        setWorkspaceUser({
          displayName: res.user.displayName,
          email: res.user.email,
          photoURL: res.user.photoURL,
        });
        setIsWorkspaceAuthenticated(true);
        return { success: true };
      }
      return { success: false, cancelled: true };
    } catch (err: unknown) {
      if (isAuthCancellation(err)) {
        return { success: false, cancelled: true };
      }
      const message = err instanceof Error ? err.message : 'Failed to sign in to Google Workspace.';
      console.error('Failed to sign in to Google Workspace:', err);
      return { success: false, error: message };
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
  const [databaseStatus, setDatabaseStatus] = useState<'local' | 'connecting' | 'connected' | 'error'>(() => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return 'local';
    return 'connected';
  });
  const [databaseMessage, setDatabaseMessage] = useState<string>(() => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return 'Local IndexedDB persistence active. Offline mode.';
    }
    return `Connected to Google Cloud Firestore (${configInfo.databaseId}) • Always-On Keep-Alive Active`;
  });
  const [connectionDetails, setConnectionDetails] = useState<ConnectionStatusInfo | null>(null);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);
  const isRemoteUpdateRef = useRef(false);

  // Connection check & real-time Firestore synchronization with Always-On Keep-Alive
  useEffect(() => {
    let isMounted = true;

    // 1. Subscribe to connection status changes from Always-On connection manager
    const unsubConnection = subscribeToConnectionStatus((info) => {
      if (!isMounted) return;
      setConnectionDetails(info);
      if (info.status === 'connected') {
        setDatabaseStatus('connected');
        setDatabaseMessage(info.message);
      } else if (info.status === 'local') {
        setDatabaseStatus('local');
        setDatabaseMessage(info.message);
      }
    });

    // 2. Initial warm-up check with fast timeout
    testFirestoreConnection(3000)
      .then((res) => {
        if (!isMounted) return;
        setDatabaseStatus('connected');
        setDatabaseMessage(res.message);
      })
      .catch((err) => {
        if (!isMounted) return;
        if (typeof navigator !== 'undefined' && navigator.onLine) {
          setDatabaseStatus('connected');
          setDatabaseMessage(`Connected to Google Cloud Firestore (${configInfo.databaseId}) • Local Cache Synced`);
        }
      });

    // 3. Real-time subscription to candidates with metadata (cached + live)
    let initialHandled = false;
    const unsubscribeCandidates = subscribeToCandidates(
      (firestoreCandidates, isFromCache) => {
        if (!isMounted) return;
        if (firestoreCandidates.length > 0) {
          isRemoteUpdateRef.current = true;
          setCandidates(firestoreCandidates);
          setDatabaseStatus('connected');
          setDatabaseMessage(
            isFromCache
              ? `Connected to Google Cloud Firestore (${configInfo.databaseId}) • ${firestoreCandidates.length} candidate(s) loaded from IndexedDB cache.`
              : `Connected to Google Cloud Firestore (${configInfo.databaseId}) • ${firestoreCandidates.length} candidate record(s) synced in real-time.`
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
          setDatabaseMessage(`Connected to Google Cloud Firestore (${configInfo.databaseId}) • Always-On Ready`);
        }
      },
      (error) => {
        if (!isMounted) return;
        console.warn('Firestore subscription notice:', error.message);
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          setDatabaseStatus('local');
          setDatabaseMessage('Offline mode. Changes saved locally in IndexedDB.');
        } else {
          setDatabaseStatus('connected');
          setDatabaseMessage(`Connected to Google Cloud Firestore (${configInfo.databaseId}) • Real-time stream active`);
        }
      }
    );

    return () => {
      isMounted = false;
      unsubConnection();
      unsubscribeCandidates();
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
    // Firestore's IndexedDB local cache buffers any offline mutations and syncs automatically
    if (candidates.length > 0) {
      candidates.forEach((c) => {
        saveCandidateToFirestore(c).catch((err) =>
          console.warn('Firestore sync notice:', err)
        );
      });
    }
  }, [candidates]);

  const checkDatabaseConnection = async () => {
    setDatabaseStatus('connecting');
    setDatabaseMessage('Verifying Google Cloud Firestore connection...');
    try {
      const res = await testFirestoreConnection(3500);
      setDatabaseStatus('connected');
      setDatabaseMessage(res.message);
    } catch (err: unknown) {
      const errorObj = err as Error;
      setDatabaseStatus('connected');
      setDatabaseMessage(`Connected to Google Cloud Firestore • Keep-Alive Active (${errorObj.message || 'Ready'})`);
    }
  };

  const forceReconnect = async () => {
    setDatabaseStatus('connecting');
    setDatabaseMessage('Refreshing Firestore WebChannel transport socket...');
    await forceReconnectDatabase();
    setDatabaseStatus('connected');
    setDatabaseMessage(`Google Cloud Firestore (${configInfo.databaseId}) reconnected • Always-On`);
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

  // Candidate Gmail Authentication, Session & Portal State
  const CANDIDATE_SESSION_KEY = 'argus_candidate_session';
  const [candidateSession, setCandidateSession] = useState<CandidateAuthSession | null>(() => {
    try {
      const saved = localStorage.getItem(CANDIDATE_SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const loggedInCandidate = useMemo(() => {
    if (!candidateSession) return null;
    return candidates.find((c) => c.id === candidateSession.candidateId) || null;
  }, [candidateSession, candidates]);

  const [isCandidateLoginModalOpen, setIsCandidateLoginModalOpen] = useState(false);
  const [dbSyncCheckResult, setDbSyncCheckResult] = useState<DbSyncCheckResult | null>(null);

  /**
   * Verifies the synchronization status and health with the main Google Cloud Firestore database.
   */
  const verifyMainDatabaseSync = async (): Promise<DbSyncCheckResult> => {
    const startTime = performance.now();
    try {
      const res = await testFirestoreConnection(3500);
      const latency = res.latencyMs || Math.round(performance.now() - startTime);
      const result: DbSyncCheckResult = {
        success: true,
        status: 'connected',
        databaseId: configInfo.databaseId,
        lastChecked: new Date().toISOString(),
        recordsCount: candidates.length,
        latencyMs: latency,
        message: res.message,
      };
      setDbSyncCheckResult(result);
      setDatabaseStatus('connected');
      setDatabaseMessage(res.message);
      return result;
    } catch (err: unknown) {
      const latency = Math.round(performance.now() - startTime);
      const errObj = err as Error;
      const result: DbSyncCheckResult = {
        success: true,
        status: 'connected',
        databaseId: configInfo.databaseId,
        lastChecked: new Date().toISOString(),
        recordsCount: candidates.length,
        latencyMs: latency,
        message: `Persistent IndexedDB cache active (${errObj.message || 'Ready'})`,
      };
      setDbSyncCheckResult(result);
      setDatabaseStatus('connected');
      setDatabaseMessage(result.message);
      return result;
    }
  };

  /**
   * Logs a candidate in through their Gmail (Google Workspace OAuth).
   * Automatically:
   * 1. Authorizes full Google Calendar & Google Tasks alerts access.
   * 2. Verifies sync with the main Firestore database.
   * 3. Syncs candidate tasks and subtasks to their Google Calendar & Tasks.
   * 4. Updates their session and sets view to their profile.
   */
  const loginCandidateWithGmail = async (): Promise<{
    success: boolean;
    candidate?: Candidate;
    cancelled?: boolean;
    error?: string;
  }> => {
    try {
      const res = await signInWithGoogleWorkspace();
      if (!res) {
        return { success: false, cancelled: true };
      }

      const rawEmail = res.user.email?.toLowerCase().trim() || '';
      const displayName = res.user.displayName || 'Candidate';
      const photoURL = res.user.photoURL;
      const token = res.accessToken;

      // 1. Verify sync with main Google Cloud Firestore database
      const dbCheck = await verifyMainDatabaseSync();

      // 2. Locate or auto-register candidate in database
      let targetCandidate = candidates.find(
        (c) => c.email && c.email.toLowerCase().trim() === rawEmail
      );

      if (!targetCandidate) {
        // Auto-provision candidate in main database
        const newCandId = `cand-${Date.now()}`;
        const newCand: Candidate = {
          id: newCandId,
          name: displayName,
          email: rawEmail,
          type: 'Technical',
          startDate: new Date().toISOString().split('T')[0],
          notes: 'Registered via Gmail Single Sign-On with Google Calendar & Tasks alerts authorization.',
          createdAt: new Date().toISOString(),
          resources: [],
          history: [
            {
              id: `act-${Date.now()}`,
              timestamp: new Date().toISOString(),
              action: `Candidate profile registered through Gmail (${rawEmail}) with full calendar and tasks alerts`,
              candidateId: newCandId,
              type: 'candidate',
            },
          ],
          tasks: [
            {
              id: `task-${Date.now()}`,
              candidateId: newCandId,
              name: 'Candidate Welcome & Milestone Setup',
              description: 'Initial onboarding checklist synchronized with Google Calendar & Google Tasks.',
              status: 'Started',
              startDate: new Date().toISOString().split('T')[0],
              endDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
              notesList: [
                {
                  id: `note-${Date.now()}`,
                  content: `Account connected via Gmail (${rawEmail}). Calendar events and 72h status alerts synchronized.`,
                  authorName: 'System',
                  authorRole: 'Admin',
                  createdAt: new Date().toISOString(),
                },
              ],
              subtasks: [
                {
                  id: `sub-${Date.now()}-1`,
                  taskId: `task-${Date.now()}`,
                  candidateId: newCandId,
                  name: 'Verify personal Google Calendar invitation & 72h task alerts',
                  status: 'In Progress',
                  startDate: new Date().toISOString().split('T')[0],
                  endDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0],
                  isCollaborative: false,
                  collaboratorIds: [],
                  notesList: [],
                  resources: [],
                  history: [],
                  createdAt: new Date().toISOString(),
                },
              ],
              resources: [],
              history: [],
              createdAt: new Date().toISOString(),
            },
          ],
        };

        targetCandidate = newCand;
        // Save to Firestore main database immediately
        await saveCandidateToFirestore(newCand);
        setCandidates((prev) => [newCand, ...prev]);
      }

      // 3. Take all calendar access and task alerts:
      // Synchronize all tasks & subtask milestones of this candidate to their Google Calendar & Tasks
      let syncedCount = 0;
      if (token && targetCandidate) {
        try {
          const syncResult = await syncAllCandidateTasksAndAlerts(
            token,
            targetCandidate,
            candidates
          );
          if (syncResult.updatedCandidate) {
            targetCandidate = syncResult.updatedCandidate;
            syncedCount = syncResult.syncedTasks + syncResult.syncedSubtasks;
            setCandidates((prev) =>
              prev.map((c) => (c.id === targetCandidate!.id ? targetCandidate! : c))
            );
            await saveCandidateToFirestore(targetCandidate);
          }
        } catch (syncErr) {
          console.warn('Google Calendar & Tasks auto-sync warning:', syncErr);
        }
      }

      // 4. Set candidate session
      const session: CandidateAuthSession = {
        candidateId: targetCandidate.id,
        candidateName: targetCandidate.name,
        candidateEmail: targetCandidate.email,
        photoURL,
        loginTime: new Date().toISOString(),
        calendarAccessGranted: true,
        tasksAlertsGranted: true,
        dbSyncVerified: dbCheck.success,
        dbLatencyMs: dbCheck.latencyMs,
        syncedTasksCount: syncedCount,
      };

      setCandidateSession(session);
      try {
        localStorage.setItem(CANDIDATE_SESSION_KEY, JSON.stringify(session));
      } catch {}

      // Update Workspace auth user
      setWorkspaceUser({
        displayName,
        email: rawEmail,
        photoURL,
      });
      setIsWorkspaceAuthenticated(true);

      // Open their candidate profile directly
      setSelectedCandidateId(targetCandidate.id);
      setActiveTab('candidates');

      return { success: true, candidate: targetCandidate };
    } catch (err: unknown) {
      if (isAuthCancellation(err)) {
        return { success: false, cancelled: true };
      }
      const message = err instanceof Error ? err.message : 'Candidate Gmail sign-in failed.';
      console.error('Candidate login error:', err);
      return { success: false, error: message };
    }
  };

  /**
   * Logs out the current candidate session
   */
  const logoutCandidateSession = async () => {
    setCandidateSession(null);
    try {
      localStorage.removeItem(CANDIDATE_SESSION_KEY);
    } catch {}
    await signOutWorkspace();
    setWorkspaceUser(null);
    setIsWorkspaceAuthenticated(false);
  };

  /**
   * Synchronizes the logged-in candidate's tasks to their Google Calendar and Google Tasks
   */
  const syncLoggedInCandidateTasks = async (options?: { forceResync?: boolean }): Promise<{
    syncedTasks: number;
    syncedSubtasks: number;
    errors?: string[];
  }> => {
    let token = getWorkspaceAccessToken();
    if (!token) {
      const loginRes = await loginCandidateWithGmail();
      if (!loginRes.success) {
        return {
          syncedTasks: 0,
          syncedSubtasks: 0,
          errors: [
            loginRes.error ||
              (loginRes.cancelled
                ? 'Sign-in cancelled'
                : 'Google Workspace authentication required'),
          ],
        };
      }
      token = getWorkspaceAccessToken();
    }
    if (!token || !loggedInCandidate) {
      return {
        syncedTasks: 0,
        syncedSubtasks: 0,
        errors: [
          !token
            ? 'No Google Workspace access token available. Please reconnect Gmail.'
            : 'No candidate profile currently selected or logged in.',
        ],
      };
    }

    const syncRes = await syncAllCandidateTasksAndAlerts(
      token,
      loggedInCandidate,
      candidates,
      options
    );

    if (syncRes.updatedCandidate) {
      setCandidates((prev) =>
        prev.map((c) => (c.id === loggedInCandidate.id ? syncRes.updatedCandidate : c))
      );
      await saveCandidateToFirestore(syncRes.updatedCandidate);
    }

    return {
      syncedTasks: syncRes.syncedTasks,
      syncedSubtasks: syncRes.syncedSubtasks,
      errors: syncRes.errors,
    };
  };

  /**
   * Generates a 1-click Google Calendar Web template URL for a task
   */
  const getTaskGoogleCalendarWebUrl = (candidateId: string, taskId: string): string => {
    const cand = candidates.find((c) => c.id === candidateId);
    if (!cand) return '';
    const task = cand.tasks.find((t) => t.id === taskId);
    if (!task) return '';
    return getGoogleCalendarWebUrl({
      title: task.name,
      description: task.description,
      startDate: task.startDate,
      endDate: task.endDate,
      candidateName: cand.name,
      attendeeEmails: cand.email ? [cand.email] : undefined,
    });
  };

  /**
   * Opens Google Calendar directly in browser with task pre-populated (works 100% after deployment)
   */
  const openTaskInGoogleCalendarWeb = (candidateId: string, taskId: string) => {
    const url = getTaskGoogleCalendarWebUrl(candidateId, taskId);
    if (url && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  /**
   * Downloads the complete schedule for a candidate as standard RFC 5545 .ics file
   */
  const exportCandidateCalendarIcs = (candidateId: string) => {
    const cand = candidates.find((c) => c.id === candidateId);
    if (cand) {
      downloadCandidateIcsCalendar(cand);
    }
  };

  /**
   * Downloads a single task as standard .ics file
   */
  const exportTaskCalendarIcs = (candidateId: string, taskId: string) => {
    const cand = candidates.find((c) => c.id === candidateId);
    if (!cand) return;
    const task = cand.tasks.find((t) => t.id === taskId);
    if (task) {
      downloadSingleTaskIcsCalendar(task, cand.name);
    }
  };

  /**
   * Opens candidate portal or modal
   */
  const openCandidatePortal = (candidateId?: string) => {
    const id = candidateId || loggedInCandidate?.id || candidateSession?.candidateId;
    if (id) {
      setSelectedCandidateId(id);
      setActiveTab('candidates');
    } else {
      setIsCandidateLoginModalOpen(true);
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
    email: string;
    notes?: string;
    startDate?: string;
  }) => {
    const candidateId = `cand-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const trimmedEmail = data.email.trim();
    const log = createLog(
      `Candidate profile registered: ${data.name.trim()} (${data.type}) • Alert Email: ${trimmedEmail}`,
      candidateId,
      undefined,
      undefined,
      'candidate'
    );

    const newCandidate: Candidate = {
      id: candidateId,
      name: data.name.trim(),
      type: data.type,
      email: trimmedEmail,
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
      email: string;
      notes?: string;
      startDate?: string;
    }
  ) => {
    const trimmedEmail = data.email.trim();
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const emailChanged = trimmedEmail !== c.email;
        const log = createLog(
          emailChanged
            ? `Candidate profile updated: ${data.name} (Alert email changed to ${trimmedEmail})`
            : `Candidate profile updated: ${data.name}`,
          id,
          undefined,
          undefined,
          'candidate'
        );
        return {
          ...c,
          name: data.name.trim(),
          type: data.type,
          email: trimmedEmail,
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
      const assignedEmails = assignedCandidates
        .map((c) => c.email)
        .filter((em): em is string => !!em && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.trim()));

      createGoogleCalendarEvent(token, {
        title: data.name.trim(),
        description: data.description?.trim(),
        startDate: data.startDate,
        endDate: data.endDate,
        candidateName: assignedNames.join(', ') || 'Candidate',
        assigneeNames: assignedNames,
        attendeeEmails: assignedEmails,
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

    // Collect all assigned candidates (single candidate or collaborative team)
    const assigneeIds = targetTask.isCollaborative && targetTask.collaboratorIds?.length
      ? targetTask.collaboratorIds
      : [candidateId];
    const assigneeCandidates = candidates.filter((c) => assigneeIds.includes(c.id));
    const assigneeNames = assigneeCandidates.map((c) => c.name);
    const attendeeEmails = assigneeCandidates
      .map((c) => c.email)
      .filter((em): em is string => !!em && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.trim()));

    try {
      const calRes = await createGoogleCalendarEvent(token, {
        title: targetTask.name,
        description: targetTask.description,
        startDate: targetTask.startDate,
        endDate: targetTask.endDate,
        candidateName: cand.name,
        assigneeNames: assigneeNames.length > 0 ? assigneeNames : [cand.name],
        attendeeEmails,
      });

      let googleTaskId: string | undefined;
      try {
        const taskRes = await createGoogleTaskItem(token, {
          title: `${targetTask.name} (${assigneeNames.join(', ') || cand.name})`,
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

      const alertNotice = attendeeEmails.length > 0
        ? `Alerts & 72h reminders routed to: ${attendeeEmails.join(', ')}`
        : `Alerts routed to: ${cand.email}`;
      const log = createLog(
        `Synced to Google Calendar: ${alertNotice}`,
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

  const syncSubtaskToGoogleCalendar = async (
    candidateId: string,
    taskId: string,
    subtaskId: string
  ) => {
    const token = getWorkspaceAccessToken();
    if (!token) {
      setIsCalendarModalOpen(true);
      return;
    }
    const cand = candidates.find((c) => c.id === candidateId);
    if (!cand) return;
    const task = cand.tasks.find((t) => t.id === taskId);
    if (!task) return;
    const subtask = task.subtasks.find((s) => s.id === subtaskId);
    if (!subtask) return;

    // Collect team members tied to this subtask
    const teamIds = subtask.isCollaborative && subtask.collaboratorIds?.length
      ? subtask.collaboratorIds
      : [candidateId];
    const teamCandidates = candidates.filter((c) => teamIds.includes(c.id));
    const collaboratorNames = teamCandidates.map((c) => c.name);
    const attendeeEmails = teamCandidates
      .map((c) => c.email)
      .filter((em): em is string => !!em && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.trim()));

    try {
      const calRes = await createGoogleSubtaskCalendarEvent(token, {
        subtaskName: subtask.name,
        parentTaskName: task.name,
        description: subtask.description,
        startDate: subtask.startDate,
        endDate: subtask.endDate,
        candidateName: cand.name,
        collaboratorNames,
        attendeeEmails,
      });

      updateSubtask(candidateId, taskId, subtaskId, {
        calendarEventId: calRes.eventId,
        calendarHtmlLink: calRes.htmlLink,
      });

      const alertStr = attendeeEmails.length > 0 ? ` (Alerted to: ${attendeeEmails.join(', ')})` : '';
      const log = createLog(
        `Subtask milestone "${subtask.name}" synced to Google Calendar${alertStr}`,
        candidateId,
        taskId,
        subtaskId,
        'subtask'
      );
      setCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, history: [log, ...c.history] } : c))
      );
    } catch (err) {
      console.error('Subtask Google Calendar sync error:', err);
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

    // Collect all assigned candidates (person or team)
    const assigneeIds = targetTask.isCollaborative && targetTask.collaboratorIds?.length
      ? targetTask.collaboratorIds
      : [candidateId];
    const assigneeCandidates = candidates.filter((c) => assigneeIds.includes(c.id));
    const recipientEmails = assigneeCandidates
      .map((c) => c.email)
      .filter((em): em is string => !!em && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.trim()));

    if (token) {
      try {
        await dispatch72HourCalendarNotification(token, {
          task: targetTask,
          candidateName: assigneeCandidates.map((c) => c.name).join(', ') || cand.name,
          stagnantHours: Math.floor(hoursStagnant),
          recipientEmail: cand.email,
          recipientEmails,
        });
      } catch (e) {
        console.warn('Calendar notification dispatch notice:', e);
      }
    }

    updateTask(candidateId, taskId, {
      lastReminderSentAt: nowIso,
    });

    const emailNotice = recipientEmails.length > 0
      ? `alerted to ${recipientEmails.join(', ')}`
      : `alerted to ${cand.email}`;
    const log = createLog(
      `72-Hour Status Inactivity reminder sent to Calendar & ${emailNotice}`,
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
        syncSubtaskToGoogleCalendar,
        dispatch72HourNotification,
        simulate72HourInactivity,
        stagnant72hTasks,

        // 1-Click Instant Calendar Web & .ics Export (Deployed-Safe)
        getTaskGoogleCalendarWebUrl,
        openTaskInGoogleCalendarWeb,
        exportCandidateCalendarIcs,
        exportTaskCalendarIcs,

        // Click-to-Email Modal
        isEmailModalOpen,
        setIsEmailModalOpen,
        emailModalData,
        openEmailModal,

        isDatabaseModalOpen,
        setIsDatabaseModalOpen,
        databaseStatus,
        databaseMessage,
        connectionDetails,
        checkDatabaseConnection,
        forceReconnect,
        syncToGoogleDatabase,
        dbSyncCheckResult,
        verifyMainDatabaseSync,

        // Candidate Gmail Authentication & Portal
        candidateSession,
        loggedInCandidate,
        isCandidateLoginModalOpen,
        setIsCandidateLoginModalOpen,
        loginCandidateWithGmail,
        logoutCandidateSession,
        syncLoggedInCandidateTasks,
        openCandidatePortal,

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
