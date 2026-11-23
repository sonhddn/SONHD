import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Download,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { checkAiHealth, type HealthResponse } from '../services/geminiClient';
import type { AppStore } from '../store/useAppStore';
import type { WritingStyle } from '../types/app';

interface SettingsPageProps {
  store: AppStore;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ store }) => {
  const [groupName, setGroupName] = useState(store.settings.groupName);
  const [groupUrl, setGroupUrl] = useState(store.settings.groupUrl);
  const [groupDescription, setGroupDescription] = useState(store.settings.groupDescription);
  const [aiModel, setAiModel] = useState(store.settings.aiModel);
  const [thinkingLevel, setThinkingLevel] = useState(store.settings.thinkingLevel);
  const [defaultStyle, setDefaultStyle] = useState<WritingStyle>(store.settings.defaultStyle);
  const [strictNoHallucination, setStrictNoHallucination] = useState(
    store.settings.strictNoHallucination
  );
  const [keywordsText, setKeywordsText] = useState(
    store.settings.sensitiveKeywords.join(', ')
  );

  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const runHealthCheck = async () => {
    setCheckingHealth(true);
    try {
      const data = await checkAiHealth();
      setHealth(data);
    } catch {
      setHealth(null);
    } finally {
      setCheckingHealth(false);
    }
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const keywords = keywordsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    store.updateSettings({
      groupName: groupName.trim() || store.settings.groupName,
      groupUrl: groupUrl.trim() || store.settings.groupUrl,
      groupDescription: groupDescription.trim(),
      aiModel,
      thinkingLevel,
      defaultStyle,
      strictNoHallucination,
      sensitiveKeywords: keywords,
    });
  };

  const handleDownloadBackup = () => {
    const raw = store.exportAllDataJson();
    const blob = new Blob([raw], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `facebook-group-manager-ai-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    store.notify('Đã tải xuống bản sao lưu JSON.', 'success');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        store.importAllDataJson(reader.result);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Server AI Connection Status (No API Key Input UI) */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Kiến trúc bảo mật Gemini API phía máy chủ
            </h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Khóa Gemini API được bảo vệ hoàn toàn trên máy chủ thông qua biến môi trường và proxy{' '}
            <code className="font-mono-tabular">/api/gemini/*</code>, không lưu ở trình duyệt.
            Ứng dụng không yêu cầu mật khẩu, cookie hay token tài khoản Facebook.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-900 dark:text-white">
              {health?.aiConfigured
                ? 'Máy chủ AI sẵn sàng'
                : health
                ? 'Chưa gắn GEMINI_API_KEY'
                : 'Đang kiểm tra...'}
            </p>
            <p className="text-[11px] font-mono-tabular text-slate-500">
              Model mặc định: {health?.modelDefault || 'gemini-4-hydrogen'}
            </p>
          </div>
          <button
            type="button"
            onClick={runHealthCheck}
            disabled={checkingHealth}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            title="Kiểm tra lại kết nối máy chủ"
          >
            <RefreshCw className={`w-4 h-4 ${checkingHealth ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </section>

      {/* Main Settings Form */}
      <form
        onSubmit={handleSave}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-6"
      >
        <div className="space-y-4">
          <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
            Thông tin nhóm Facebook quản trị
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Tên hiển thị nhóm</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Liên kết nhóm Facebook</label>
              <input
                type="url"
                value={groupUrl}
                onChange={(e) => setGroupUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono-tabular"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">
              Mô tả & quy tắc cộng đồng cốt lõi
            </label>
            <textarea
              rows={2}
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
            Hành vi mô hình Gemini AI & Quy tắc an toàn
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Mô hình Gemini</label>
              <select
                value={aiModel}
                onChange={(e) =>
                  setAiModel(e.target.value as 'gemini-4-hydrogen' | 'gemini-3.1-flash-lite')
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              >
                <option value="gemini-4-hydrogen">Gemini 4 Hydrogen (Cân bằng tối ưu)</option>
                <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Siêu tốc)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Mức độ suy luận</label>
              <select
                value={thinkingLevel}
                onChange={(e) => setThinkingLevel(e.target.value as 'LOW' | 'MEDIUM')}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              >
                <option value="LOW">Nhanh gọn (Low)</option>
                <option value="MEDIUM">Phân tích sâu hơn (Medium)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Phong cách viết mặc định</label>
              <select
                value={defaultStyle}
                onChange={(e) => setDefaultStyle(e.target.value as WritingStyle)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              >
                <option value="Chuyên nghiệp uy tín">Chuyên nghiệp uy tín</option>
                <option value="Thân thiện gần gũi">Thân thiện gần gũi</option>
                <option value="Ngắn gọn súc tích">Ngắn gọn súc tích</option>
                <option value="Kêu gọi tương tác cao">Kêu gọi tương tác cao</option>
                <option value="Hài hước nhẹ nhàng">Hài hước nhẹ nhàng</option>
              </select>
            </div>
          </div>

          <label className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
            <input
              type="checkbox"
              checked={strictNoHallucination}
              onChange={(e) => setStrictNoHallucination(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600"
            />
            <div>
              <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                Bắt buộc chống bịa mệnh giá, giá thu mua/bán và thông tin voucher
              </span>
              <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Khi bật, AI sẽ luôn chèn chỗ giữ chỗ [Mệnh giá], [Giá / Tỷ lệ] nếu bạn không nhập
                số liệu thực tế.
              </span>
            </div>
          </label>

          <div>
            <label className="block text-xs font-semibold mb-1">
              Danh sách từ khóa nhạy cảm khi kiểm duyệt (cách nhau bằng dấu phẩy)
            </label>
            <textarea
              rows={2}
              value={keywordsText}
              onChange={(e) => setKeywordsText(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs leading-relaxed"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
          >
            <Save className="w-4 h-4" />
            <span>Lưu cấu hình</span>
          </button>
        </div>
      </form>

      {/* LocalStorage Backup & Reset */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-4">
        <div>
          <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
            Quản lý dữ liệu phiên bản thử nghiệm (localStorage)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Toàn bộ bài viết, lịch đăng, hồ sơ kiểm duyệt và mẫu trả lời được lưu trực tiếp trên
            trình duyệt của bạn.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium"
          >
            <Download className="w-4 h-4" />
            <span>Xuất sao lưu JSON</span>
          </button>

          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Nhập dữ liệu từ JSON</span>
            <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          </label>

          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-rose-200 dark:border-rose-900/70 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Khôi phục dữ liệu mẫu</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  store.resetAllDemoData();
                  setConfirmReset(false);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Xác nhận khôi phục</span>
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
              >
                Hủy
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
