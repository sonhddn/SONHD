import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { analyzeModerationWithAi } from '../services/geminiClient';
import { computeTextSimilarity, type AppStore } from '../store/useAppStore';
import type { ModerationRisk, ModerationStatus } from '../types/app';
import { formatDateTimeVi, getRiskLabel, getRiskStyle } from '../utils/formatters';

interface ModerationPageProps {
  store: AppStore;
}

const SAMPLE_MODERATION_INPUTS = [
  {
    label: 'Thử mẫu nghi ngờ lừa đảo',
    author: 'Tài khoản mới tạo',
    content:
      'Thu mua Got It, UrBox chiết khấu siêu cao 99%, chuyển khoản trong 30 giây. Ai bán gửi trước ảnh mã QR hoặc cọc 100k qua ví rồi nhắn Telegram @vouchervip88, vào link bit.ly/check-code-ngay.',
  },
  {
    label: 'Thử mẫu trùng lặp nội dung',
    author: 'Thành viên A',
    content:
      'Chào cả nhà, mình cần thu mua số lượng voucher Got It điện tử còn hạn sử dụng. Giao dịch kiểm tra mã hợp lệ hoặc qua trung gian Admin nhóm cho thành viên mới yên tâm.',
  },
  {
    label: 'Thử mẫu bài viết hợp lệ',
    author: 'Thành viên Minh Anh',
    content:
      'Mình còn 1 thẻ UrBox được công ty tặng cuối quý nhưng không dùng tới. Muốn nhượng lại trực tiếp tại Quận 1 hoặc giao dịch qua trung gian Admin của nhóm để hai bên yên tâm.',
  },
];

export const ModerationPage: React.FC<ModerationPageProps> = ({ store }) => {
  const [authorName, setAuthorName] = useState('Thành viên nhóm');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [riskFilter, setRiskFilter] = useState<'all' | ModerationRisk>('all');

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      store.notify('Vui lòng nhập hoặc dán nội dung bài đăng cần kiểm duyệt.', 'warning');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Local duplicate check against stored posts
      let maxSimilarity = 0;
      let matchedTitle: string | undefined;
      for (const p of store.posts) {
        const sim = computeTextSimilarity(content, p.content);
        if (sim > maxSimilarity) {
          maxSimilarity = sim;
          matchedTitle = p.title;
        }
      }

      // 2. Server-side Gemini scam & policy analysis
      const snippets = store.posts.slice(0, 6).map((p) => `[${p.title}]: ${p.content.slice(0, 160)}`);
      const res = await analyzeModerationWithAi({
        content: content.trim(),
        authorName: authorName.trim() || 'Thành viên',
        sensitiveKeywords: store.settings.sensitiveKeywords,
        existingPostSnippets: snippets,
        model: store.settings.aiModel,
        thinkingLevel: store.settings.thinkingLevel,
      });

      const a = res.analysis;
      const normalizedRisk: ModerationRisk =
        a.riskLevel === 'high_risk' || a.riskLevel === 'review' || a.riskLevel === 'safe'
          ? a.riskLevel
          : maxSimilarity >= 65
          ? 'review'
          : 'safe';

      // Elevate to review if high duplicate detected locally
      const finalRisk: ModerationRisk =
        normalizedRisk === 'safe' && maxSimilarity >= 65 ? 'review' : normalizedRisk;

      store.addModeration({
        authorName: authorName.trim() || 'Thành viên',
        content: content.trim(),
        riskLevel: finalRisk,
        summary: a.summary,
        scamSignals: Array.isArray(a.scamSignals) ? a.scamSignals : [],
        duplicateAssessment:
          maxSimilarity >= 50 && matchedTitle
            ? `Độ tương đồng ${maxSimilarity}% với bài "${matchedTitle}". ${a.duplicateAssessment}`
            : a.duplicateAssessment,
        duplicateScore: maxSimilarity,
        matchedPostTitle: maxSimilarity >= 50 ? matchedTitle : undefined,
        suggestedAction: a.suggestedAction,
        politeWarningReply: a.politeWarningReply,
        status: finalRisk === 'high_risk' ? 'Đánh dấu cảnh báo' : 'Chờ xử lý',
      });

      store.notify('Đã hoàn tất phân tích kiểm duyệt nội dung.', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể phân tích kiểm duyệt.';
      setErrorMsg(msg);
      store.notify(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = useMemo(() => {
    if (riskFilter === 'all') return store.moderations;
    return store.moderations.filter((m) => m.riskLevel === riskFilter);
  }, [store.moderations, riskFilter]);

  return (
    <div className="space-y-6">
      {/* Safety Rule Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
            Trợ lý Kiểm duyệt An toàn & Chống trùng lặp
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Phát hiện dấu hiệu lừa đảo, link rút gọn lạ, dụ giao dịch ngoài luồng và đối chiếu trùng
            lặp với kho bài viết. Hệ thống chỉ gợi ý xem xét — tuyệt đối không tự động xóa bài hay
            khóa thành viên.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Admin quyết định thủ công 100%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Input Analyzer */}
        <form
          onSubmit={handleAnalyze}
          className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4"
        >
          <div className="flex flex-wrap gap-2">
            {SAMPLE_MODERATION_INPUTS.map((sample) => (
              <button
                key={sample.label}
                type="button"
                onClick={() => {
                  setAuthorName(sample.author);
                  setContent(sample.content);
                }}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200"
              >
                {sample.label}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Tên thành viên đăng bài</label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">
              Nội dung bài đăng / bình luận cần kiểm tra
            </label>
            <textarea
              rows={7}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Dán nội dung bài đăng từ nhóm Facebook vào đây để phân tích dấu hiệu lừa đảo và trùng lặp..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm leading-relaxed"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-3 rounded-lg">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang phân tích rủi ro & trùng lặp...</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4" />
                <span>Phân tích nội dung</span>
              </>
            )}
          </button>
        </form>

        {/* Moderation Results List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
              {(
                [
                  { id: 'all', label: 'Tất cả' },
                  { id: 'high_risk', label: 'Rủi ro cao' },
                  { id: 'review', label: 'Cần xem xét' },
                  { id: 'safe', label: 'An toàn' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRiskFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    riskFilter === tab.id
                      ? 'bg-slate-900 dark:bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <span className="text-xs font-mono-tabular text-slate-500 dark:text-slate-400">
              {filteredRecords.length} hồ sơ kiểm duyệt
            </span>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center text-sm text-slate-500">
              Không có hồ sơ kiểm duyệt nào ở mục này.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecords.map((rec) => (
                <article
                  key={rec.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {rec.authorName}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">{formatDateTimeVi(rec.analyzedAt)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">Trùng lặp {rec.duplicateScore}%</span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-semibold ${getRiskStyle(
                        rec.riskLevel
                      )}`}
                    >
                      {rec.riskLevel === 'high_risk' ? (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      ) : rec.riskLevel === 'safe' ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <ShieldAlert className="w-3.5 h-3.5" />
                      )}
                      <span>{getRiskLabel(rec.riskLevel)}</span>
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-xs text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                    {rec.content}
                  </div>

                  <div className="space-y-2 text-sm">
                    <p className="text-slate-800 dark:text-slate-100 font-medium">{rec.summary}</p>

                    {rec.scamSignals.length > 0 && (
                      <ul className="list-disc pl-5 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                        {rec.scamSignals.map((sig, i) => (
                          <li key={i}>{sig}</li>
                        ))}
                      </ul>
                    )}

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      <strong className="text-slate-700 dark:text-slate-200">Đối chiếu trùng lặp:</strong>{' '}
                      {rec.duplicateAssessment}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      <strong className="text-slate-700 dark:text-slate-200">Gợi ý cho Admin:</strong>{' '}
                      {rec.suggestedAction}
                    </p>
                  </div>

                  {rec.politeWarningReply && (
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <p className="text-xs text-slate-600 dark:text-slate-300 italic flex-1">
                        Mẫu nhắc nhở: &ldquo;{rec.politeWarningReply}&rdquo;
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          store.copyText(rec.politeWarningReply, 'Mẫu câu nhắc nhở')
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium whitespace-nowrap shrink-0"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Sao chép câu nhắc</span>
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Trạng thái xử lý:</span>
                      <select
                        value={rec.status}
                        onChange={(e) =>
                          store.updateModerationStatus(
                            rec.id,
                            e.target.value as ModerationStatus
                          )
                        }
                        className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                      >
                        <option value="Chờ xử lý">Chờ xử lý</option>
                        <option value="Đã xem xét">Đã xem xét</option>
                        <option value="Đánh dấu cảnh báo">Đánh dấu cảnh báo</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => store.deleteModeration(rec.id)}
                      className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa hồ sơ</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
