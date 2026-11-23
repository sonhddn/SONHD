import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Bell,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  Menu,
  MessageSquareReply,
  Moon,
  PenSquare,
  Settings,
  ShieldAlert,
  ShoppingBag,
  Sun,
  Tag,
  X,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { ADMIN_AVATAR_URL } from '../data/seedData';
import type { AppStore } from '../store/useAppStore';
import type { PageId } from '../types/app';
import { formatTimeVi } from '../utils/formatters';

interface NavGroup {
  label: string;
  items: { id: PageId; label: string; icon: React.ComponentType<{ className?: string }> }[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Tổng quan',
    items: [{ id: 'dashboard', label: 'Dashboard tổng quan', icon: LayoutDashboard }],
  },
  {
    label: 'Xưởng nội dung AI',
    items: [
      { id: 'ai-writer', label: 'AI viết bài', icon: PenSquare },
      { id: 'ai-buy', label: 'AI tạo nội dung mua voucher', icon: ShoppingBag },
      { id: 'ai-sell', label: 'AI tạo nội dung bán voucher', icon: Tag },
      { id: 'ai-banner', label: 'AI tạo hình ảnh quảng cáo', icon: ImageIcon },
    ],
  },
  {
    label: 'Vận hành & Lịch',
    items: [
      { id: 'posts', label: 'Quản lý bài viết', icon: FileText },
      { id: 'schedule', label: 'Lịch đăng bài', icon: CalendarClock },
    ],
  },
  {
    label: 'Kiểm duyệt & Hệ thống',
    items: [
      { id: 'moderation', label: 'Kiểm duyệt nội dung', icon: ShieldAlert },
      { id: 'comments', label: 'Trợ lý trả lời bình luận', icon: MessageSquareReply },
      { id: 'analytics', label: 'Báo cáo thống kê', icon: BarChart3 },
      { id: 'settings', label: 'Cấu hình AI', icon: Settings },
    ],
  },
];

export const PAGE_TITLES: Record<PageId, string> = {
  dashboard: 'Dashboard tổng quan',
  'ai-writer': 'AI viết bài',
  'ai-buy': 'AI tạo nội dung mua voucher',
  'ai-sell': 'AI tạo nội dung bán voucher',
  'ai-banner': 'AI tạo hình ảnh quảng cáo',
  posts: 'Quản lý bài viết',
  schedule: 'Lịch đăng bài',
  moderation: 'Kiểm duyệt nội dung',
  comments: 'Trợ lý trả lời bình luận',
  analytics: 'Báo cáo thống kê',
  settings: 'Cấu hình AI',
};

interface LayoutProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  store: AppStore;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentPage,
  onNavigate,
  store,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const upcomingSoon = useMemo(() => {
    const now = Date.now();
    return store.schedules.filter((item) => {
      if (item.status === 'Đã đăng') return false;
      const diff = new Date(item.scheduledAt).getTime() - now;
      return diff >= -15 * 60 * 1000 && diff <= 2 * 60 * 60 * 1000;
    });
  }, [store.schedules]);

  const handleSelectPage = (page: PageId) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  const renderSidebarContent = () => (
    <div className="flex h-full flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      <div className="px-5 py-5 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => handleSelectPage('dashboard')}
          className="text-left focus-visible:outline-2 focus-visible:outline-blue-600 rounded-md w-full"
        >
          <span className="font-display text-sm font-bold tracking-tight text-slate-900 dark:text-white block truncate">
            FACEBOOK GROUP MANAGER AI
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5 truncate">
            Điều hành cộng đồng Voucher
          </span>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6" aria-label="Điều hướng chính">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="px-3 mb-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
              {group.label}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectPage(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap min-h-[40px] ${
                      active
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-400 dark:text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          {!avatarError ? (
            <img
              src={ADMIN_AVATAR_URL}
              alt="Ảnh đại diện quản trị viên"
              referrerPolicy="no-referrer"
              onError={() => setAvatarError(true)}
              className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
              QT
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              Quản trị viên
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              Chế độ vận hành thủ công
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-68 shrink-0 sticky top-0 h-screen">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Đóng menu"
              className="absolute top-3 right-3 p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            {renderSidebarContent()}
          </div>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Contract: 3 clean zones */}
        <header className="sticky top-0 z-30 h-16 px-4 sm:px-6 lg:px-8 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 sm:gap-8">
          {/* Zone 1: Mobile Menu Trigger + Contextual Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Mở thanh điều hướng"
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="hidden sm:inline text-slate-400 dark:text-slate-500 whitespace-nowrap">
                Nhóm Voucher
              </span>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">/</span>
              <h1 className="font-display text-base sm:text-lg font-semibold text-slate-900 dark:text-white truncate">
                {PAGE_TITLES[currentPage]}
              </h1>
            </div>
          </div>

          {/* Zone 2: Quick Workspace Utility Actions (Theme + Schedule Reminder) */}
          <div className="flex items-center gap-2 shrink-0">
            {upcomingSoon.length > 0 && (
              <button
                type="button"
                onClick={() => onNavigate('schedule')}
                className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors whitespace-nowrap shrink-0"
              >
                <Bell className="w-3.5 h-3.5 shrink-0" />
                <span className="tabular-nums">
                  {upcomingSoon.length} lịch nhắc lúc {formatTimeVi(upcomingSoon[0].scheduledAt)}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={store.toggleTheme}
              aria-label={store.theme === 'light' ? 'Chuyển giao diện tối' : 'Chuyển giao diện sáng'}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center shrink-0"
            >
              {store.theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Zone 3: Single Primary Action */}
            <a
              href={store.settings.groupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
            >
              <span>Mở nhóm Facebook</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Toast Notifications */}
      {store.toasts.length > 0 && (
        <div
          className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-[calc(100%-2rem)] sm:w-auto"
          aria-live="polite"
        >
          {store.toasts.map((toast) => {
            const toneClasses =
              toast.type === 'error'
                ? 'bg-rose-600 text-white border-rose-700'
                : toast.type === 'warning'
                ? 'bg-amber-600 text-white border-amber-700'
                : toast.type === 'info'
                ? 'bg-slate-900 dark:bg-slate-800 text-white border-slate-700'
                : 'bg-emerald-600 text-white border-emerald-700';

            const ToastIcon =
              toast.type === 'error' || toast.type === 'warning'
                ? AlertTriangle
                : toast.type === 'info'
                ? Info
                : CheckCircle2;

            return (
              <div
                key={toast.id}
                className={`flex items-start gap-2.5 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium ${toneClasses}`}
              >
                <ToastIcon className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="flex-1">{toast.message}</span>
                <button
                  type="button"
                  onClick={() => store.dismissToast(toast.id)}
                  aria-label="Đóng thông báo"
                  className="opacity-80 hover:opacity-100 shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
