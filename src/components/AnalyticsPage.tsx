import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import type { AppStore } from '../store/useAppStore';
import type { PostStatus, PostType } from '../types/app';

interface AnalyticsPageProps {
  store: AppStore;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ store }) => {
  const [range, setRange] = useState<'7d' | '30d' | 'all'>('all');

  const filteredPosts = useMemo(() => {
    if (range === 'all') return store.posts;
    const days = range === '7d' ? 7 : 30;
    const cutoff = Date.now() - days * 24 * 3600 * 1000;
    return store.posts.filter((p) => new Date(p.createdAt).getTime() >= cutoff);
  }, [store.posts, range]);

  const statusBreakdown = useMemo(() => {
    const statuses: PostStatus[] = ['Bản nháp', 'Chờ duyệt', 'Đã duyệt', 'Đã đăng'];
    return statuses.map((s) => ({
      label: s,
      count: filteredPosts.filter((p) => p.status === s).length,
    }));
  }, [filteredPosts]);

  const brandBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    filteredPosts.forEach((p) => {
      map.set(p.brand, (map.get(p.brand) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredPosts]);

  const typeBreakdown = useMemo(() => {
    const types: PostType[] = ['Thu mua', 'Bán voucher', 'Trao đổi', 'Quảng cáo'];
    return types.map((t) => ({
      type: t,
      count: filteredPosts.filter((p) => p.postType === t).length,
    }));
  }, [filteredPosts]);

  const scheduleStats = useMemo(() => {
    const total = store.schedules.length;
    const done = store.schedules.filter((s) => s.status === 'Đã đăng').length;
    const upcoming = total - done;
    const rate = total === 0 ? 0 : Math.round((done / total) * 100);
    return { total, done, upcoming, rate };
  }, [store.schedules]);

  const modStats = useMemo(() => {
    return {
      total: store.moderations.length,
      highRisk: store.moderations.filter((m) => m.riskLevel === 'high_risk').length,
      review: store.moderations.filter((m) => m.riskLevel === 'review').length,
      safe: store.moderations.filter((m) => m.riskLevel === 'safe').length,
    };
  }, [store.moderations]);

  const handleExportCsv = () => {
    const headers = ['ID', 'Tiêu đề', 'Thương hiệu', 'Loại bài', 'Phong cách', 'Trạng thái', 'Ngày tạo'];
    const rows = filteredPosts.map((p) => [
      p.id,
      `"${p.title.replace(/"/g, '""')}"`,
      `"${p.brand}"`,
      p.postType,
      p.writingStyle,
      p.status,
      p.createdAt,
    ]);
    const csv = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bao-cao-bai-viet-${range}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    store.notify('Đã xuất báo cáo CSV danh sách bài viết.', 'success');
  };

  const maxBrandCount = Math.max(1, ...brandBreakdown.map((b) => b.count));
  const maxTypeCount = Math.max(1, ...typeBreakdown.map((t) => t.count));

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
            Báo cáo thống kê vận hành nhóm
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tổng hợp dữ liệu thực từ kho bài viết, lịch đăng thủ công và nhật ký kiểm duyệt
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            {(
              [
                { id: '7d', label: '7 ngày' },
                { id: '30d', label: '30 ngày' },
                { id: 'all', label: 'Toàn bộ' },
              ] as const
            ).map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRange(r.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  range === r.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>Xuất CSV</span>
          </button>
        </div>
      </div>

      {/* Top Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Bài viết trong kỳ</p>
          <p className="font-mono-tabular text-3xl font-bold text-slate-900 dark:text-white mt-2">
            {filteredPosts.length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Đã đăng: {statusBreakdown.find((s) => s.label === 'Đã đăng')?.count || 0} bài
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Tỷ lệ hoàn thành lịch đăng</p>
          <p className="font-mono-tabular text-3xl font-bold text-slate-900 dark:text-white mt-2">
            {scheduleStats.rate}%
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono-tabular">
            {scheduleStats.done}/{scheduleStats.total} lịch đã hoàn tất
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Hồ sơ kiểm duyệt AI</p>
          <p className="font-mono-tabular text-3xl font-bold text-slate-900 dark:text-white mt-2">
            {modStats.total}
          </p>
          <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-mono-tabular">
            {modStats.highRisk} rủi ro cao · {modStats.review} cần xem xét
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Tài nguyên sáng tạo</p>
          <p className="font-mono-tabular text-3xl font-bold text-slate-900 dark:text-white mt-2">
            {store.banners.length + store.replyTemplates.length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono-tabular">
            {store.banners.length} banner · {store.replyTemplates.length} mẫu trả lời
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Brand Breakdown */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div>
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              Phân bổ bài viết theo thương hiệu
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Số lượng bài theo Got It, UrBox, Gift Card và các thương hiệu khác
            </p>
          </div>
          <div className="space-y-3">
            {brandBreakdown.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">Chưa có dữ liệu trong khoảng thời gian này.</p>
            ) : (
              brandBreakdown.map((item) => {
                const pct = Math.round((item.count / maxBrandCount) * 100);
                return (
                  <div key={item.brand} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {item.brand}
                      </span>
                      <span className="font-mono-tabular font-semibold text-slate-900 dark:text-white">
                        {item.count} bài
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Post Type Breakdown */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div>
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              Cơ cấu theo loại bài đăng
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Thu mua, Bán voucher, Trao đổi và Quảng cáo cộng đồng
            </p>
          </div>
          <div className="space-y-3">
            {typeBreakdown.map((item) => {
              const pct = Math.round((item.count / maxTypeCount) * 100);
              return (
                <div key={item.type} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {item.type}
                    </span>
                    <span className="font-mono-tabular font-semibold text-slate-900 dark:text-white">
                      {item.count} bài
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Status Matrix Table */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
          Tổng hợp trạng thái quy trình xuất bản
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {statusBreakdown.map((st) => (
            <div
              key={st.label}
              className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 text-center"
            >
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{st.label}</p>
              <p className="font-mono-tabular text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {st.count}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
