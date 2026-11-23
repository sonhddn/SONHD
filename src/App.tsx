/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AiBannerStudioPage } from './components/AiBannerStudioPage';
import { AiPostStudioPage } from './components/AiPostStudioPage';
import { AnalyticsPage } from './components/AnalyticsPage';
import { CommentAssistantPage } from './components/CommentAssistantPage';
import { DashboardPage } from './components/DashboardPage';
import { Layout } from './components/Layout';
import { ModerationPage } from './components/ModerationPage';
import { PostManagerPage } from './components/PostManagerPage';
import { SchedulePage } from './components/SchedulePage';
import { SettingsPage } from './components/SettingsPage';
import { useAppStore } from './store/useAppStore';
import type { PageId } from './types/app';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const store = useAppStore();

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage store={store} onNavigate={setCurrentPage} />;
      case 'ai-writer':
        return (
          <AiPostStudioPage
            mode="general"
            store={store}
            onGoToPosts={() => setCurrentPage('posts')}
            onGoToSchedule={() => setCurrentPage('schedule')}
          />
        );
      case 'ai-buy':
        return (
          <AiPostStudioPage
            mode="buy"
            store={store}
            onGoToPosts={() => setCurrentPage('posts')}
            onGoToSchedule={() => setCurrentPage('schedule')}
          />
        );
      case 'ai-sell':
        return (
          <AiPostStudioPage
            mode="sell"
            store={store}
            onGoToPosts={() => setCurrentPage('posts')}
            onGoToSchedule={() => setCurrentPage('schedule')}
          />
        );
      case 'ai-banner':
        return <AiBannerStudioPage store={store} />;
      case 'posts':
        return <PostManagerPage store={store} />;
      case 'schedule':
        return <SchedulePage store={store} />;
      case 'moderation':
        return <ModerationPage store={store} />;
      case 'comments':
        return <CommentAssistantPage store={store} />;
      case 'analytics':
        return <AnalyticsPage store={store} />;
      case 'settings':
        return <SettingsPage store={store} />;
      default:
        return <DashboardPage store={store} onNavigate={setCurrentPage} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage} store={store}>
      {renderPage()}
    </Layout>
  );
}
