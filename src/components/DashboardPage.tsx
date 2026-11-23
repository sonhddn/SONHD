import React from 'react';
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  MessageSquareReply,
  PenSquare,
  ShieldAlert,
  ShoppingBag,
  Tag,
} from 'lucide-react';
import type { AppStore } from '../store/useAppStore';
import type { PageId } from '../types/app';
import {
  formatDateTimeVi,
  getPostStatusStyle,
  getRiskLabel,
  getRiskStyle,
} from '../utils/formatters';

interface DashboardPageProps {
  store: AppStore;
  onNavigate: (page: PageId) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ store, onNavigate }) => {
  const { posts, schedules, moderations, settings } = store;

  const pendingReviewCount = posts.filter((p) => p.status === 'Chờ duyệt').length;
  const approvedOrPostedCount = posts.filter(
    (p) => p.status === 'Đã duyệt' || p.status === 'Đã đăng'
  ).length;
  const upcomingSchedules = schedules
    .filter((s) => s.status !== 'Đã đăng')
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const pendingModerations = moderations.filter(
    (m) => m.status === 'Chờ xử lý' || m.riskLevel === 'high_risk'
  );

  const handleCopyAndOpen = async (content: string) => {
    await store.copyText(content, 'Nội dung bài viết');
  };

  return (
    <div className="space-y-6">
      {/* Group Overview Banner */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Nhóm Facebook mục tiêu</span>
              <span aria-hidden="true">·</span>
              <span>Vận hành thủ công tuân thủ chính sách Meta</span>
              <span aria-hidden="true">·</span>
              <span>Dữ liệu lưu cục bộ trên trình duyệt</span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {settings.groupName}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {settings.groupDescription}
            </p>
            <p className="text-xs font-mono-tabular text-slate-500 dark:text-slate-400 break-all">
              {settings.groupUrl}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('ai-writer')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0"
            >
              <PenSquare className="w-4 h-4 shrink-0" />
              <span>Tạo bài mới bằng AI</span>
            </button>
            <a
              href={settings.groupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm font-medium transition-colors whitespace-nowrap shrink-0"
            >
              <span>Truy cập nhóm</span>
              <ExternalLink className="w-4 h-4 shrink-0" />
            </a>
          </div>
        </div>
      </section>

      {/* 4 KPI Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Tổng bài viết trong kho</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono-tabular text-3xl font-bold text-slate-900 dark:text-white">
              {posts.length}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              bài ({approvedOrPostedCount} sẵn sàng / đã đăng)
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Bài đang chờ duyệt</span>
            <CheckCircle2 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono-tabular text-3xl font-bold text-slate-900 dark:text-white">
              {pendingReviewCount}
            </span>
            <span className="text-xs text-amber-700 dark:text-amber-400">
              cần rà soát trước khi đăng
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Lịch đăng sắp tới</span>
            <CalendarClock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono-tabular text-3xl font-bold text-slate-900 dark:text-white">
              {upcomingSchedules.length}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              lịch hẹn đăng thủ công
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Hồ sơ kiểm duyệt chú ý</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono-tabular text-3xl font-bold text-slate-900 dark:text-white">
              {pendingModerations.length}
            </span>
            <span className="text-xs text-rose-600 dark:text-rose-400">
              cần xem xét thủ công
            </span>
          </div>
        </div>
      </section>

      {/* Quick AI Studio Shortcuts */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            id: 'ai-buy' as PageId,
            title: 'AI tạo nội dung mua voucher',
            desc: 'Soạn tin thu mua Got It, UrBox, Gift Card minh bạch, giữ chỗ giá rõ ràng.',
            icon: ShoppingBag,
          },
          {
            id: 'ai-sell' as PageId,
            title: 'AI tạo nội dung bán voucher',
            desc: 'Tạo bài nhượng lại e-voucher hoặc thẻ quà tặng kèm hướng dẫn check mã.',
            icon: Tag,
          },
          {
            id: 'ai-banner' as PageId,
            title: 'AI tạo hình ảnh quảng cáo',
            desc: 'Thiết kế banner theo chuẩn kích thước Facebook và tải ảnh PNG ngay.',
            icon: ImageIcon,
          },
          {
            id: 'comments' as PageId,
            title: 'Trợ lý trả lời bình luận',
            desc: 'Gợi ý 3 phương án phản hồi tự nhiên cho bình luận hỏi giá hoặc trung gian.',
            icon: MessageSquareReply,
          },
        ].map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => onNavigate(tool.id)}
              className="text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 rounded-xl p-5 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <h3 className="mt-3 font-display text-sm font-semibold text-slate-900 dark:text-white">
                {tool.title}
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {tool.desc}
              </p>
            </button>
          );
        })}
      </section>

      {/* Two-Column Split: Upcoming Schedule + Moderation Alerts */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Upcoming Schedule Queue */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Lịch đăng sắp tới
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Sao chép nội dung để đăng thủ công trực tiếp trên nhóm Facebook
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('schedule')}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap shrink-0"
            >
              Xem toàn bộ lịch
            </button>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {upcomingSchedules.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Hiện chưa có lịch đăng bài nào sắp tới.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('schedule')}
                  className="mt-3 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
                >
                  Thêm lịch đăng đầu tiên
                </button>
              </div>
            ) : (
              upcomingSchedules.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-mono-tabular font-medium text-slate-700 dark:text-slate-300">
                        {formatDateTimeVi(item.scheduledAt)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{item.brand}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.postType}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {item.title}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyAndOpen(item.content)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép bài</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => store.markScheduleStatus(item.id, 'Đã đăng')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium whitespace-nowrap shrink-0"
                    >
                      <span>Đã đăng</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Moderation Insights */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Gợi ý kiểm duyệt gần đây
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Chỉ phân tích & gợi ý xem xét — không tự động xóa bài
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('moderation')}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap shrink-0"
            >
              Mở kiểm duyệt
            </button>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {moderations.slice(0, 3).map((rec) => (
              <div key={rec.id} className="p-4 sm:px-5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate">
                    {rec.authorName}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium whitespace-nowrap shrink-0 ${getRiskStyle(
                      rec.riskLevel
                    )}`}
                  >
                    {getRiskLabel(rec.riskLevel)}
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {rec.summary}
                </p>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="tabular-nums">Trùng lặp: {rec.duplicateScore}%</span>
                  <span>{rec.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Posts Table */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            Kho bài viết gần đây
          </h3>
          <button
            type="button"
            onClick={() => onNavigate('posts')}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap shrink-0"
          >
            Quản lý tất cả ({posts.length})
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-800/40">
                <th className="py-3 px-5">Tiêu đề & tóm tắt</th>
                <th className="py-3 px-4">Thương hiệu</th>
                <th className="py-3 px-4">Loại bài</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {posts.slice(0, 5).map((post) => (
                <tr
                  key={post.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-5 max-w-md">
                    <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                      {post.title}
                    </p>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {post.brand}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {post.postType}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium ${getPostStatusStyle(
                        post.status
                      )}`}
                    >
                      {post.status}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => store.copyText(post.content, 'Bài viết')}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
