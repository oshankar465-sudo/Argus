/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArgusProvider, useArgus } from './context/ArgusContext';
import { Header } from './components/Header';
import { GlobalDashboard } from './components/GlobalDashboard';
import { CandidatesPage } from './components/CandidatesPage';
import { TasksPage } from './components/TasksPage';
import { CandidateProfile } from './components/CandidateProfile';
import { CandidateModal } from './components/CandidateModal';
import { TaskModal } from './components/TaskModal';
import { ResourceModal } from './components/ResourceModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { GoogleDatabaseModal } from './components/GoogleDatabaseModal';
import { GoogleCalendarModal } from './components/GoogleCalendarModal';
import { EmailModal } from './components/EmailModal';

const AppContent: React.FC = () => {
  const { activeTab, selectedCandidateId } = useArgus();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-slate-900 dark:selection:bg-blue-600 selection:text-white transition-colors duration-200">
      {/* Top Application Header */}
      <Header onOpenNotifications={() => setIsNotificationsOpen(true)} />

      {/* Main Workspace Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {selectedCandidateId ? (
          <CandidateProfile />
        ) : activeTab === 'dashboard' ? (
          <GlobalDashboard />
        ) : activeTab === 'candidates' ? (
          <CandidatesPage />
        ) : (
          <TasksPage />
        )}
      </main>

      {/* Subtle Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 py-4 mt-auto transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-200 font-mono tracking-tight">GEOMETRA - ARGUS</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Assignment & Resource Guidance Utility System</span>
          </div>
          <div>
            <span>Internal Candidate & Task Tracking System</span>
          </div>
        </div>
      </footer>

      {/* Global Modals & Drawers */}
      <CandidateModal />
      <TaskModal />
      <ResourceModal />
      <GlobalSearchModal />
      <GoogleDatabaseModal />
      <GoogleCalendarModal />
      <EmailModal />
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ArgusProvider>
      <AppContent />
    </ArgusProvider>
  );
}
