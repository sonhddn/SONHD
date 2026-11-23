import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  BookmarkPlus,
  CalendarPlus,
  Check,
  Copy,
  Edit3,
  Loader2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { generateAiPosts, type GeneratedPostVariant } from '../services/geminiClient';
import type { AppStore } from '../store/useAppStore';
import type { PostStatus, PostType, WritingStyle } from '../types/app';
import { toLocalDateTimeInput } from '../utils/formatters';

interface AiPostStudioPageProps {
  mode: 'general' | 'buy' | 'sell';
  store: AppStore;
  onGoToPosts: () => void;
  onGoToSchedule: () => void;
}

const BRAND_OPTIONS = [
  'Got It',
  'UrBox',
  'Gift Card',
  'Shopee',
  'Grab',
  'VinID / OneU',
  'Esteem Gift',
  'CGV / Highlands',
  'Thương hiệu khác',
];

const POST_TYPES: PostType[] = ['Thu mua', 'Bán voucher', 'Trao đổi', 'Quảng cáo'];

const WRITING_STYLES: WritingStyle[] = [
  'Chuyên nghiệp uy tín',
  'Thân thiện gần gũi',
  'Ngắn gọn súc tích',
  'Kêu gọi tương tác cao',
  'Hài hước nhẹ nhàng',
];

export const AiPostStudioPage: React.FC<AiPostStudioPageProps> = ({
  mode,
  store,
  onGoToPosts,
  onGoToSchedule,
}) => {
  const defaultPostType: PostType =
    mode === 'buy' ? 'Thu mua' : mode === 'sell' ? 'Bán voucher' : 'Thu mua';

  const [brand, setBrand] = useState<string>('Got It');
  const [customBrand, setCustomBrand] = useState<string>('');
  const [postType, setPostType] = useState<PostType>(defaultPostType);
  const [writingStyle, setWritingStyle] = useState<WritingStyle>(store.settings.defaultStyle);
  const [count, setCount] = useState<number>(2);
  const [customContext, setCustomContext] = useState<string>('');

  // Specialized fields for Buy / Sell modes
  const [paymentMethods, setPaymentMethods] = useState<string>(
    'Chuyển khoản ngân hàng sau kiểm tra mã · Hỗ trợ trung gian Admin nhóm'
  );
  const [checkConditions, setCheckConditions] = useState<string>(
    'Mã còn hạn sử dụng, chưa kích hoạt hoặc chưa đổi điểm sang đối tác'
  );
  const [voucherFormat, setVoucherFormat] = useState<string>(
    'E-voucher (link / mã điện tử)'
  );

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [variants, setVariants] = useState<
    (GeneratedPostVariant & { id: string; savedStatus?: PostStatus })[]
  >([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Quick schedule modal state
  const [schedulingVariant, setSchedulingVariant] = useState<{
    title: string;
    content: string;
  } | null>(null);
  const [scheduleDateTime, setScheduleDateTime] = useState<string>(() => {
    const next = new Date(Date.now() + 2 * 3600 * 1000);
    return toLocalDateTimeInput(next);
  });

  useEffect(() => {
    if (mode === 'buy') setPostType('Thu mua');
    else if (mode === 'sell') setPostType('Bán voucher');
    setVariants([]);
    setErrorMsg(null);
  }, [mode]);

  const effectiveBrand =
    brand === 'Thương hiệu khác' && customBrand.trim() ? customBrand.trim() : brand;

  const pageHeading =
    mode === 'buy'
      ? 'Xưởng AI tạo nội dung Thu mua Voucher'
      : mode === 'sell'
      ? 'Xưởng AI tạo nội dung Bán & Chuyển nhượng Voucher'
      : 'Xưởng AI viết bài nhóm Facebook';

  const pageSubtitle =
    mode === 'buy'
      ? 'Tạo mẫu bài thu mua Got It, UrBox, Gift Card rõ ràng quy trình kiểm tra mã và phương thức thanh toán.'
      : mode === 'sell'
      ? 'Soạn thảo bài bán/thanh lý voucher tự nhiên, minh bạch nguồn gốc và khuyến khích kiểm tra trực tiếp hoặc trung gian.'
      : 'Chọn thương hiệu, loại bài, phong cách và số lượng để AI viết nhiều biến thể bài đăng tiếng Việt tự nhiên.';

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await generateAiPosts({
        mode,
        brand: effectiveBrand,
        postType,
        tone: writingStyle,
        count,
        customContext: customContext.trim(),
        paymentMethods: mode === 'buy' ? paymentMethods : undefined,
        checkConditions: mode === 'buy' ? checkConditions : undefined,
        voucherFormat: mode === 'sell' ? voucherFormat : undefined,
        groupName: store.settings.groupName,
        model: store.settings.aiModel,
        thinkingLevel: store.settings.thinkingLevel,
        strictNoHallucination: store.settings.strictNoHallucination,
      });

      const mapped = (res.variants || []).map((v, idx) => ({
        ...v,
        id: `gen-${Date.now()}-${idx}`,
      }));
      setVariants(mapped);
      if (mapped.length > 0) {
        store.notify(`AI đã tạo ${mapped.length} mẫu bài viết tiếng Việt.`, 'success');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tạo nội dung bài viết.';
      setErrorMsg(message);
      store.notify(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVariant = (id: string, field: 'title' | 'content', value: string) => {
    setVariants((prev) => prev.map((v) => (v.id === id ? { ...v, [field]: value } : v)));
  };

  const handleSaveVariant = (
    variant: GeneratedPostVariant & { id: string },
    status: PostStatus
  ) => {
    store.addPost({
      title: variant.title.trim() || `Bài ${postType} ${effectiveBrand}`,
      content: variant.content,
      brand: effectiveBrand,
      postType,
      writingStyle,
      status,
      notes: variant.safetyNote,
    });
    setVariants((prev) =>
      prev.map((v) => (v.id === variant.id ? { ...v, savedStatus: status } : v))
    );
  };

  const handleConfirmSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingVariant) return;
    const saved = store.addPost({
      title: schedulingVariant.title,
      content: schedulingVariant.content,
      brand: effectiveBrand,
      postType,
      writingStyle,
      status: 'Đã duyệt',
    });
    store.addSchedule({
      postId: saved.id,
      title: schedulingVariant.title,
      content: schedulingVariant.content,
      brand: effectiveBrand,
      postType,
      scheduledAt: new Date(scheduleDateTime).toISOString(),
      status: 'Sắp tới',
      reminderMinutes: 30,
    });
    setSchedulingVariant(null);
    onGoToSchedule();
  };

  return (
    <div className="space-y-6">
      {/* Intro & Anti-Hallucination Notice */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            {pageHeading}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{pageSubtitle}</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 px-3 py-2 rounded-lg shrink-0">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>
            {store.settings.strictNoHallucination
              ? 'Đang bật chế độ chống bịa mệnh giá & giá bán'
              : 'Đang dùng ngữ cảnh tự do'}
          </span>
        </div>
      </div>

      {/* Main Split: Form Controls (Left) + Generated Output (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form */}
        <form
          onSubmit={handleGenerate}
          className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-5"
        >
          {/* Brand Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
              Thương hiệu voucher
            </label>
            <div className="grid grid-cols-3 gap-2">
              {BRAND_OPTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setBrand(item)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors truncate ${
                    brand === item
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            {brand === 'Thương hiệu khác' && (
              <input
                type="text"
                value={customBrand}
                onChange={(e) => setCustomBrand(e.target.value)}
                placeholder="Nhập tên thương hiệu cụ thể (ví dụ: Tiki, PNJ, Lotte)..."
                className="w-full mt-2 px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            )}
          </div>

          {/* Post Type */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
              Loại bài viết
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2">
              {POST_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPostType(type)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                    postType === type
                      ? 'bg-slate-900 dark:bg-blue-600 text-white border-slate-900 dark:border-blue-600'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Specialized Buy Mode Fields */}
          {mode === 'buy' && (
            <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Phương thức thanh toán ưu tiên
                </label>
                <input
                  type="text"
                  value={paymentMethods}
                  onChange={(e) => setPaymentMethods(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Điều kiện kiểm tra mã thu mua
                </label>
                <input
                  type="text"
                  value={checkConditions}
                  onChange={(e) => setCheckConditions(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
            </div>
          )}

          {/* Specialized Sell Mode Fields */}
          {mode === 'sell' && (
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Định dạng voucher cần bán
              </label>
              <select
                value={voucherFormat}
                onChange={(e) => setVoucherFormat(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              >
                <option value="E-voucher (link / mã điện tử)">E-voucher (link / mã điện tử)</option>
                <option value="Thẻ giấy nguyên seal">Thẻ giấy nguyên seal</option>
                <option value="Gift Card điện tử hoặc thẻ cứng">Gift Card điện tử hoặc thẻ cứng</option>
              </select>
            </div>
          )}

          {/* Style & Count */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                Phong cách viết
              </label>
              <select
                value={writingStyle}
                onChange={(e) => setWritingStyle(e.target.value as WritingStyle)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              >
                {WRITING_STYLES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                Số lượng bài
              </label>
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono-tabular"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} bài
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Context */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
              Thông tin thực tế bổ sung (không bắt buộc)
            </label>
            <textarea
              rows={3}
              value={customContext}
              onChange={(e) => setCustomContext(e.target.value)}
              placeholder="Ví dụ: Khu vực Hà Nội, giao dịch khung giờ 9h-21h, ưu tiên trung gian Admin. Nếu bỏ trống giá/mệnh giá, AI sẽ để [Mệnh giá] và [Giá / Tỷ lệ] để tránh tự bịa số liệu."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AI đang biên soạn {count} mẫu bài...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Tạo nội dung bằng Gemini AI</span>
              </>
            )}
          </button>
        </form>

        {/* Results Column */}
        <div className="lg:col-span-7 space-y-4">
          {errorMsg && (
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl p-4 flex items-start gap-3 text-sm text-rose-800 dark:text-rose-200">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Không thể tạo nội dung</p>
                <p>{errorMsg}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: count }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3 animate-pulse"
                >
                  <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-800/60 rounded" />
                  <div className="h-3 w-5/6 bg-slate-100 dark:bg-slate-800/60 rounded" />
                  <div className="h-3 w-2/3 bg-slate-100 dark:bg-slate-800/60 rounded" />
                </div>
              ))}
            </div>
          ) : variants.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-blue-600 mx-auto" />
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Sẵn sàng tạo bài viết chuẩn cộng đồng Voucher
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Chọn thương hiệu, loại bài và phong cách ở bảng bên trái rồi nhấn nút tạo nội dung.
                Bạn có thể chỉnh sửa trực tiếp từng phiên bản, sao chép hoặc lưu vào kho bài viết.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {variants.map((variant, index) => {
                const isEditing = editingId === variant.id;
                return (
                  <article
                    key={variant.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-mono-tabular font-semibold text-slate-700 dark:text-slate-200">
                          Phương án {index + 1}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{effectiveBrand}</span>
                        <span aria-hidden="true">·</span>
                        <span>{postType}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-tabular">{variant.content.length} ký tự</span>
                      </div>
                      {variant.savedStatus && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          <Check className="w-3.5 h-3.5" />
                          <span>Đã lưu ({variant.savedStatus})</span>
                        </span>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={variant.title}
                          onChange={(e) => handleUpdateVariant(variant.id, 'title', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
                        />
                        <textarea
                          rows={7}
                          value={variant.content}
                          onChange={(e) =>
                            handleUpdateVariant(variant.id, 'content', e.target.value)
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm leading-relaxed"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <h4 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                          {variant.title}
                        </h4>
                        <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                          {variant.content}
                        </p>
                      </div>
                    )}

                    {variant.safetyNote && (
                      <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 px-3 py-2 rounded-lg">
                        Lưu ý trước khi đăng: {variant.safetyNote}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => store.copyText(variant.content, 'Nội dung bài viết')}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium whitespace-nowrap shrink-0"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingId(isEditing ? null : variant.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium whitespace-nowrap shrink-0"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{isEditing ? 'Xong chỉnh sửa' : 'Chỉnh sửa'}</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveVariant(variant, 'Bản nháp')}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium whitespace-nowrap shrink-0"
                        >
                          <BookmarkPlus className="w-3.5 h-3.5" />
                          <span>Lưu nháp</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveVariant(variant, 'Chờ duyệt')}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium whitespace-nowrap shrink-0"
                        >
                          <span>Lưu chờ duyệt</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setSchedulingVariant({
                              title: variant.title,
                              content: variant.content,
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-medium whitespace-nowrap shrink-0"
                        >
                          <CalendarPlus className="w-3.5 h-3.5" />
                          <span>Lên lịch</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onGoToPosts}
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Đi tới Quản lý bài viết →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Schedule Modal */}
      {schedulingVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <form
            onSubmit={handleConfirmSchedule}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl"
          >
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Đặt lịch đăng bài thủ công
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bài viết sẽ được lưu với trạng thái Đã duyệt và đưa vào Lịch đăng để nhắc bạn đúng giờ.
            </p>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Thời gian dự kiến đăng
              </label>
              <input
                type="datetime-local"
                required
                value={scheduleDateTime}
                onChange={(e) => setScheduleDateTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono-tabular"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSchedulingVariant(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium"
              >
                Xác nhận lên lịch
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
