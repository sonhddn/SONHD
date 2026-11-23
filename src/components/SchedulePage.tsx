import React, { useMemo, useState } from 'react';
import {
  Bell,
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Trash2,
  X,
} from 'lucide-react';
import type { AppStore } from '../store/useAppStore';
import type { PostType, ScheduleItem } from '../types/app';
import {
  formatDateTimeVi,
  formatTimeVi,
  getScheduleStatusStyle,
  toLocalDateTimeInput,
} from '../utils/formatters';

interface SchedulePageProps {
  store: AppStore;
}

const WEEKDAYS_VI = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function toDateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const SchedulePage: React.FC<SchedulePageProps> = ({ store }) => {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [anchorDate, setAnchorDate] = useState<Date>(() => new Date());
  const [selectedDayKey, setSelectedDayKey] = useState<string>(() => toDateKey(new Date()));

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string>('');
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formBrand, setFormBrand] = useState('Got It');
  const [formType, setFormType] = useState<PostType>('Thu mua');
  const [formDateTime, setFormDateTime] = useState<string>(() => toLocalDateTimeInput(new Date()));
  const [formReminder, setFormReminder] = useState<number>(30);
  const [formNote, setFormNote] = useState('');

  // Compute calendar days for week or month view
  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    if (viewMode === 'week') {
      const start = new Date(anchorDate);
      const dayOfWeek = (start.getDay() + 6) % 7; // Monday = 0
      start.setDate(start.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        days.push(d);
      }
    } else {
      const firstOfMonth = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
      const startOffset = (firstOfMonth.getDay() + 6) % 7;
      const gridStart = new Date(firstOfMonth);
      gridStart.setDate(firstOfMonth.getDate() - startOffset);
      for (let i = 0; i < 42; i++) {
        const d = new Date(gridStart);
        d.setDate(gridStart.getDate() + i);
        days.push(d);
      }
    }
    return days;
  }, [anchorDate, viewMode]);

  const schedulesByDay = useMemo(() => {
    const map = new Map<string, ScheduleItem[]>();
    for (const item of store.schedules) {
      const key = toDateKey(new Date(item.scheduledAt));
      const list = map.get(key) || [];
      list.push(item);
      map.set(key, list);
    }
    return map;
  }, [store.schedules]);

  const selectedDayItems = useMemo(() => {
    return (schedulesByDay.get(selectedDayKey) || []).sort((a, b) =>
      a.scheduledAt.localeCompare(b.scheduledAt)
    );
  }, [schedulesByDay, selectedDayKey]);

  const upcomingList = useMemo(() => {
    return store.schedules
      .filter((s) => s.status !== 'Đã đăng')
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  }, [store.schedules]);

  const shiftPeriod = (dir: -1 | 1) => {
    const next = new Date(anchorDate);
    if (viewMode === 'week') {
      next.setDate(next.getDate() + dir * 7);
    } else {
      next.setMonth(next.getMonth() + dir);
    }
    setAnchorDate(next);
  };

  const openAddModal = (dateKey?: string) => {
    const target = dateKey ? new Date(`${dateKey}T09:30:00`) : new Date(Date.now() + 3600 * 1000);
    setSelectedPostId('');
    setFormTitle('');
    setFormContent('');
    setFormBrand('Got It');
    setFormType('Thu mua');
    setFormDateTime(toLocalDateTimeInput(target));
    setFormReminder(30);
    setFormNote('');
    setModalOpen(true);
  };

  const handleSelectExistingPost = (postId: string) => {
    setSelectedPostId(postId);
    const found = store.posts.find((p) => p.id === postId);
    if (found) {
      setFormTitle(found.title);
      setFormContent(found.content);
      setFormBrand(found.brand);
      setFormType(found.postType);
    }
  };

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      store.notify('Vui lòng nhập tiêu đề và nội dung bài đăng.', 'warning');
      return;
    }
    store.addSchedule({
      postId: selectedPostId || undefined,
      title: formTitle.trim(),
      content: formContent.trim(),
      brand: formBrand,
      postType: formType,
      scheduledAt: new Date(formDateTime).toISOString(),
      status: 'Sắp tới',
      reminderMinutes: formReminder,
      note: formNote.trim() || undefined,
    });
    setSelectedDayKey(toDateKey(new Date(formDateTime)));
    setModalOpen(false);
  };

  const handleEnableNotifications = async () => {
    if (!('Notification' in window)) {
      store.notify('Trình duyệt hiện tại không hỗ trợ thông báo đẩy, hệ thống sẽ nhắc trực tiếp trên đầu trang.', 'info');
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      store.updateSettings({ enableBrowserReminders: true });
      store.notify('Đã bật nhắc lịch đăng bài trên trình duyệt.', 'success');
    } else {
      store.notify('Bạn chưa cấp quyền thông báo trình duyệt; thanh nhắc vẫn hiển thị trên giao diện.', 'info');
    }
  };

  const periodTitle =
    viewMode === 'week'
      ? `Tuần ${calendarDays[0].toLocaleDateString('vi-VN')} – ${calendarDays[6].toLocaleDateString(
          'vi-VN'
        )}`
      : `Tháng ${anchorDate.getMonth() + 1} / ${anchorDate.getFullYear()}`;

  const todayKey = toDateKey(new Date());

  return (
    <div className="space-y-6">
      {/* Compliance Notice & Top Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
            Lịch đăng & Nhắc lịch thủ công trên Facebook
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Hệ thống không tự động đăng bài khi Meta chưa hỗ trợ API nhóm. Khi đến giờ, hãy bấm
            &ldquo;Sao chép bài&rdquo; và dán trực tiếp lên nhóm Facebook.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleEnableNotifications}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium whitespace-nowrap"
          >
            <Bell className="w-3.5 h-3.5 text-amber-500" />
            <span>
              {store.settings.enableBrowserReminders ? 'Đã bật nhắc lịch' : 'Bật nhắc lịch'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => openAddModal(selectedDayKey)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Thêm lịch đăng</span>
          </button>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Calendar Grid */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => shiftPeriod(-1)}
                aria-label="Kỳ trước"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-display text-sm font-semibold text-slate-900 dark:text-white min-w-[170px] text-center">
                {periodTitle}
              </span>
              <button
                type="button"
                onClick={() => shiftPeriod(1)}
                aria-label="Kỳ sau"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  setAnchorDate(now);
                  setSelectedDayKey(toDateKey(now));
                }}
                className="px-2.5 py-1 rounded-md text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
              >
                Hôm nay
              </button>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === 'week'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Lịch tuần
              </button>
              <button
                type="button"
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === 'month'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Lịch tháng
              </button>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40">
            {WEEKDAYS_VI.map((day) => (
              <div
                key={day}
                className="py-2.5 text-center text-xs font-semibold text-slate-500 dark:text-slate-400"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Day Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 dark:divide-slate-800">
            {calendarDays.map((day) => {
              const key = toDateKey(day);
              const items = schedulesByDay.get(key) || [];
              const isSelected = key === selectedDayKey;
              const isToday = key === todayKey;
              const isCurrentMonth = day.getMonth() === anchorDate.getMonth();

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDayKey(key)}
                  className={`text-left p-2 transition-colors flex flex-col justify-between ${
                    viewMode === 'week' ? 'min-h-[150px]' : 'min-h-[96px]'
                  } ${
                    isSelected
                      ? 'bg-blue-50/70 dark:bg-blue-950/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  } ${
                    viewMode === 'month' && !isCurrentMonth
                      ? 'opacity-45'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`font-mono-tabular text-xs font-semibold px-1.5 py-0.5 rounded ${
                        isToday
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {day.getDate()}
                    </span>
                    {items.length > 0 && (
                      <span className="font-mono-tabular text-[11px] font-medium text-slate-400">
                        {items.length} bài
                      </span>
                    )}
                  </div>

                  <div className="mt-1.5 space-y-1 w-full">
                    {items.slice(0, viewMode === 'week' ? 4 : 2).map((ev) => (
                      <div
                        key={ev.id}
                        className={`px-1.5 py-1 rounded text-[11px] font-medium truncate border ${getScheduleStatusStyle(
                          ev.status
                        )}`}
                      >
                        <span className="font-mono-tabular mr-1">{formatTimeVi(ev.scheduledAt)}</span>
                        <span>{ev.brand}</span>
                      </div>
                    ))}
                    {items.length > (viewMode === 'week' ? 4 : 2) && (
                      <span className="block text-[10px] text-slate-500 pl-1">
                        +{items.length - (viewMode === 'week' ? 4 : 2)} lịch khác
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Selected Day Details & Upcoming Queue */}
        <div className="lg:col-span-4 space-y-5">
          {/* Selected Day */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                  Lịch ngày {new Date(`${selectedDayKey}T00:00:00`).toLocaleDateString('vi-VN')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {selectedDayItems.length} bài được lên lịch
                </p>
              </div>
              <button
                type="button"
                onClick={() => openAddModal(selectedDayKey)}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                + Thêm vào ngày này
              </button>
            </div>

            {selectedDayItems.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
                Chưa có bài đăng nào trong ngày đã chọn.
              </p>
            ) : (
              <div className="space-y-3">
                {selectedDayItems.map((item) => (
                  <div
                    key={item.id}
                    className="border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono-tabular text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {formatTimeVi(item.scheduledAt)} · {item.brand}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded border text-[11px] font-medium ${getScheduleStatusStyle(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 whitespace-pre-line">
                      {item.content}
                    </p>
                    {item.note && (
                      <p className="text-[11px] text-amber-700 dark:text-amber-300">
                        Ghi chú: {item.note}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => store.copyText(item.content, 'Nội dung bài đăng')}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Sao chép để đăng</span>
                      </button>
                      <a
                        href={store.settings.groupUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <span>Mở nhóm</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      {item.status !== 'Đã đăng' && (
                        <button
                          type="button"
                          onClick={() => store.markScheduleStatus(item.id, 'Đã đăng')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Xong</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => store.deleteSchedule(item.id)}
                        aria-label="Xóa lịch"
                        className="ml-auto p-1.5 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Summary */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              Hàng chờ sắp tới ({upcomingList.length})
            </h3>
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {upcomingList.slice(0, 5).map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-mono-tabular text-slate-500 dark:text-slate-400">
                      {formatDateTimeVi(item.scheduledAt)} · Nhắc trước {item.reminderMinutes}p
                    </p>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate mt-0.5">
                      {item.title}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => store.copyText(item.content, 'Bài viết')}
                    className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 shrink-0"
                    title="Sao chép"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Schedule Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <form
            onSubmit={handleCreateSchedule}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-xl"
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Thêm lịch đăng bài mới
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Chọn nhanh từ kho bài viết (tùy chọn)
                </label>
                <select
                  value={selectedPostId}
                  onChange={(e) => handleSelectExistingPost(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                >
                  <option value="">-- Nhập nội dung mới trực tiếp --</option>
                  {store.posts.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.status}] {p.brand} · {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Thời gian đăng</label>
                  <input
                    type="datetime-local"
                    required
                    value={formDateTime}
                    onChange={(e) => setFormDateTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Nhắc lịch trước</label>
                  <select
                    value={formReminder}
                    onChange={(e) => setFormReminder(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  >
                    <option value={15}>15 phút trước giờ đăng</option>
                    <option value={30}>30 phút trước giờ đăng</option>
                    <option value={60}>1 giờ trước giờ đăng</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Thương hiệu</label>
                  <input
                    type="text"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Loại bài</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as PostType)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  >
                    <option value="Thu mua">Thu mua</option>
                    <option value="Bán voucher">Bán voucher</option>
                    <option value="Trao đổi">Trao đổi</option>
                    <option value="Quảng cáo">Quảng cáo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Tiêu đề</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Nội dung bài đăng</label>
                <textarea
                  rows={5}
                  required
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Ghi chú nhắc nhở</label>
                <input
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="Ví dụ: Điền tỷ lệ thu mua hôm nay trước khi đăng..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
              >
                Lưu lịch đăng
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
