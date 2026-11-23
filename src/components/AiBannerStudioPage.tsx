import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BookmarkPlus,
  Download,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { BANNER_BACKDROPS } from '../data/seedData';
import { generateAdBannerCopy } from '../services/geminiClient';
import type { AppStore } from '../store/useAppStore';
import type { AdBannerItem, BannerAspectRatio } from '../types/app';

interface AiBannerStudioPageProps {
  store: AppStore;
}

const RATIO_DIMENSIONS: Record<BannerAspectRatio, { w: number; h: number; label: string }> = {
  '1200x628': { w: 1200, h: 628, label: 'Ngang Facebook (1200×628)' },
  '1080x1080': { w: 1080, h: 1080, label: 'Vuông bài viết (1080×1080)' },
  '1080x1350': { w: 1080, h: 1350, label: 'Dọc nổi bật 4:5 (1080×1350)' },
};

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export const AiBannerStudioPage: React.FC<AiBannerStudioPageProps> = ({ store }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [brand, setBrand] = useState('Got It');
  const [purpose, setPurpose] = useState('Thu mua & Trao đổi voucher uy tín');
  const [tone, setTone] = useState('Chuyên nghiệp tin cậy');
  const [extraNote, setExtraNote] = useState('');
  const [aspectRatio, setAspectRatio] = useState<BannerAspectRatio>('1200x628');
  const [backdropUrl, setBackdropUrl] = useState(BANNER_BACKDROPS[0].url);
  const [accentColor, setAccentColor] = useState(BANNER_BACKDROPS[0].accent);
  const [darkOverlay, setDarkOverlay] = useState(false);

  const [headline, setHeadline] = useState('Thu Mua Voucher Got It Minh Bạch');
  const [subheadline, setSubheadline] = useState(
    'Kiểm tra mã nhanh gọn · Hỗ trợ giao dịch an toàn qua trung gian nhóm'
  );
  const [ctaText, setCtaText] = useState('Nhắn tin trao đổi ngay');
  const [highlightsText, setHighlightsText] = useState(
    'Xác thực minh bạch\nTrung gian Admin\nHỗ trợ mỗi ngày'
  );

  const [aiLoading, setAiLoading] = useState(false);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setLoadedImage(img);
    img.onerror = () => setLoadedImage(null);
    img.src = backdropUrl;
  }, [backdropUrl]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dims = RATIO_DIMENSIONS[aspectRatio];
    canvas.width = dims.w;
    canvas.height = dims.h;

    // 1. Background image or gradient fallback
    if (loadedImage) {
      const scale = Math.max(dims.w / loadedImage.width, dims.h / loadedImage.height);
      const drawW = loadedImage.width * scale;
      const drawH = loadedImage.height * scale;
      const offsetX = (dims.w - drawW) / 2;
      const offsetY = (dims.h - drawH) / 2;
      ctx.drawImage(loadedImage, offsetX, offsetY, drawW, drawH);
    } else {
      const grad = ctx.createLinearGradient(0, 0, dims.w, dims.h);
      grad.addColorStop(0, darkOverlay ? '#0F172A' : '#EFF6FF');
      grad.addColorStop(1, accentColor);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, dims.w, dims.h);
    }

    // 2. Contrast Scrim for WCAG AA legibility
    const scrimGrad = ctx.createLinearGradient(0, 0, dims.w, dims.h);
    if (darkOverlay) {
      scrimGrad.addColorStop(0, 'rgba(15, 23, 42, 0.88)');
      scrimGrad.addColorStop(0.6, 'rgba(15, 23, 42, 0.72)');
      scrimGrad.addColorStop(1, 'rgba(15, 23, 42, 0.55)');
    } else {
      scrimGrad.addColorStop(0, 'rgba(255, 255, 255, 0.92)');
      scrimGrad.addColorStop(0.65, 'rgba(248, 250, 252, 0.82)');
      scrimGrad.addColorStop(1, 'rgba(241, 245, 249, 0.55)');
    }
    ctx.fillStyle = scrimGrad;
    ctx.fillRect(0, 0, dims.w, dims.h);

    const padX = Math.round(dims.w * 0.07);
    const padY = Math.round(dims.h * 0.1);
    const maxTextWidth = dims.w - padX * 2;
    const primaryTextColor = darkOverlay ? '#F8FAFC' : '#0F172A';
    const secondaryTextColor = darkOverlay ? '#CBD5E1' : '#334155';

    // 3. Brand Kicker (unboxed editorial text)
    ctx.fillStyle = darkOverlay ? '#93C5FD' : accentColor;
    ctx.font = `700 ${Math.round(dims.w * 0.022)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillText(`${brand.toUpperCase()} · ${store.settings.groupName}`, padX, padY + 24);

    // 4. Headline
    const headlineSize = aspectRatio === '1200x628' ? 62 : 66;
    ctx.fillStyle = primaryTextColor;
    ctx.font = `800 ${headlineSize}px "Plus Jakarta Sans", sans-serif`;
    const headlineLines = wrapCanvasText(ctx, headline || 'Tiêu đề banner', maxTextWidth);
    let cursorY = padY + 96;
    for (const line of headlineLines.slice(0, 3)) {
      ctx.fillText(line, padX, cursorY);
      cursorY += headlineSize * 1.18;
    }

    // 5. Subheadline
    cursorY += 16;
    const subSize = aspectRatio === '1200x628' ? 28 : 30;
    ctx.fillStyle = secondaryTextColor;
    ctx.font = `500 ${subSize}px "DM Sans", sans-serif`;
    const subLines = wrapCanvasText(ctx, subheadline, maxTextWidth * 0.9);
    for (const line of subLines.slice(0, 3)) {
      ctx.fillText(line, padX, cursorY);
      cursorY += subSize * 1.38;
    }

    // 6. Highlights list
    const highlights = highlightsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3);

    if (highlights.length > 0) {
      cursorY += 24;
      ctx.font = `600 24px "DM Sans", sans-serif`;
      let chipX = padX;
      for (const item of highlights) {
        const label = `✓ ${item}`;
        const metrics = ctx.measureText(label);
        const boxW = metrics.width + 32;
        if (chipX + boxW > dims.w - padX) {
          chipX = padX;
          cursorY += 54;
        }
        ctx.fillStyle = darkOverlay ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.06)';
        ctx.beginPath();
        ctx.roundRect(chipX, cursorY - 30, boxW, 42, 8);
        ctx.fill();

        ctx.fillStyle = primaryTextColor;
        ctx.fillText(label, chipX + 16, cursorY);
        chipX += boxW + 14;
      }
    }

    // 7. CTA Button + Footer URL hint
    const ctaY = dims.h - padY - 56;
    ctx.font = `700 26px "Plus Jakarta Sans", sans-serif`;
    const ctaMetrics = ctx.measureText(ctaText || 'Tìm hiểu thêm');
    const ctaW = Math.max(240, ctaMetrics.width + 64);
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.roundRect(padX, ctaY, ctaW, 60, 12);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(ctaText || 'Tìm hiểu thêm', padX + 32, ctaY + 39);

    ctx.fillStyle = secondaryTextColor;
    ctx.font = `500 20px "DM Sans", sans-serif`;
    ctx.fillText('Giao dịch minh bạch · Cộng đồng Facebook', padX, dims.h - padY + 26);
  }, [
    accentColor,
    aspectRatio,
    brand,
    ctaText,
    darkOverlay,
    headline,
    highlightsText,
    loadedImage,
    store.settings.groupName,
    subheadline,
  ]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleGenerateCopy = async () => {
    setAiLoading(true);
    try {
      const res = await generateAdBannerCopy({
        brand,
        purpose,
        tone,
        extraNote,
        model: store.settings.aiModel,
        thinkingLevel: store.settings.thinkingLevel,
      });
      if (res.copy) {
        setHeadline(res.copy.headline || headline);
        setSubheadline(res.copy.subheadline || subheadline);
        setCtaText(res.copy.ctaText || ctaText);
        if (Array.isArray(res.copy.highlights) && res.copy.highlights.length > 0) {
          setHighlightsText(res.copy.highlights.join('\n'));
        }
        store.notify('AI đã đề xuất nội dung mới cho banner.', 'success');
      }
    } catch (err) {
      store.notify(
        err instanceof Error ? err.message : 'Không thể tạo chữ quảng cáo bằng AI.',
        'error'
      );
    } finally {
      setAiLoading(false);
    }
  };

  const handleDownloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `banner-${brand.toLowerCase().replace(/\s+/g, '-')}-${aspectRatio}.png`;
    link.href = dataUrl;
    link.click();
    store.notify('Đã tải xuống hình ảnh banner PNG chất lượng cao.', 'success');
  };

  const handleSaveBanner = () => {
    store.addBanner({
      brand,
      purpose,
      aspectRatio,
      headline,
      subheadline,
      ctaText,
      highlights: highlightsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      backdropUrl,
      accentColor,
      darkOverlay,
    });
  };

  const handleLoadBanner = (item: AdBannerItem) => {
    setBrand(item.brand);
    setPurpose(item.purpose);
    setAspectRatio(item.aspectRatio);
    setHeadline(item.headline);
    setSubheadline(item.subheadline);
    setCtaText(item.ctaText);
    setHighlightsText(item.highlights.join('\n'));
    setBackdropUrl(item.backdropUrl);
    setAccentColor(item.accentColor);
    setDarkOverlay(item.darkOverlay);
    store.notify(`Đã nạp mẫu banner "${item.headline}" lên khung chỉnh sửa.`, 'info');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Controls */}
        <div className="xl:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Studio Banner Quảng Cáo AI
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                AI viết chữ chuẩn tiếng Việt + xuất ảnh PNG chuẩn kích thước Facebook
              </p>
            </div>
          </div>

          {/* AI Copy Generator Block */}
          <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Thương hiệu</label>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                >
                  <option value="Got It">Got It</option>
                  <option value="UrBox">UrBox</option>
                  <option value="Gift Card">Gift Card</option>
                  <option value="Shopee / Grab">Shopee / Grab</option>
                  <option value="Cộng đồng Voucher">Cộng đồng Voucher</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Phong cách</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                >
                  <option value="Chuyên nghiệp tin cậy">Chuyên nghiệp tin cậy</option>
                  <option value="Tối giản hiện đại">Tối giản hiện đại</option>
                  <option value="Nổi bật thu hút">Nổi bật thu hút</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Mục tiêu banner</label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Ghi chú thêm cho AI (tùy chọn)
              </label>
              <input
                type="text"
                value={extraNote}
                onChange={(e) => setExtraNote(e.target.value)}
                placeholder="Ví dụ: Nhấn mạnh giao dịch trung gian an toàn..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
              />
            </div>

            <button
              type="button"
              onClick={handleGenerateCopy}
              disabled={aiLoading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold transition-colors"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI đang viết nội dung banner...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Gợi ý chữ quảng cáo bằng Gemini AI</span>
                </>
              )}
            </button>
          </div>

          {/* Visual Customization */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5">Kích thước Facebook</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(Object.keys(RATIO_DIMENSIONS) as BannerAspectRatio[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setAspectRatio(r)}
                    className={`px-2.5 py-2 rounded-lg border text-xs font-medium transition-colors ${
                      aspectRatio === r
                        ? 'bg-slate-900 dark:bg-blue-600 text-white border-slate-900 dark:border-blue-600'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5">Ảnh nền thiết kế</label>
              <div className="grid grid-cols-3 gap-2">
                {BANNER_BACKDROPS.map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => {
                      setBackdropUrl(bg.url);
                      setAccentColor(bg.accent);
                      setDarkOverlay(bg.id !== 'gotit');
                    }}
                    className={`p-1.5 rounded-lg border text-left transition-colors ${
                      backdropUrl === bg.url
                        ? 'border-blue-600 ring-1 ring-blue-600'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <img
                      src={bg.url}
                      alt={bg.label}
                      referrerPolicy="no-referrer"
                      className="w-full h-12 object-cover rounded"
                    />
                    <span className="block text-[11px] font-medium mt-1 truncate">{bg.brand}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Màu nút nhấn</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="h-9 w-12 rounded border border-slate-200 dark:border-slate-700 bg-transparent cursor-pointer"
                  />
                  <span className="text-xs font-mono-tabular text-slate-500">{accentColor}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Tông lớp phủ chữ</label>
                <button
                  type="button"
                  onClick={() => setDarkOverlay((prev) => !prev)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium bg-white dark:bg-slate-800"
                >
                  {darkOverlay ? 'Nền tối chữ trắng' : 'Nền sáng chữ tối'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Tiêu đề chính</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Mô tả phụ</label>
              <textarea
                rows={2}
                value={subheadline}
                onChange={(e) => setSubheadline(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Nút kêu gọi (CTA)</label>
                <input
                  type="text"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Điểm nhấn (mỗi dòng 1 ý)</label>
                <textarea
                  rows={2}
                  value={highlightsText}
                  onChange={(e) => setHighlightsText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Live Preview & Actions */}
        <div className="xl:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                  Xem trước thực tế ({RATIO_DIMENSIONS[aspectRatio].label})
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveBanner}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium whitespace-nowrap"
                >
                  <BookmarkPlus className="w-4 h-4" />
                  <span>Lưu mẫu</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải ảnh PNG</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-100 dark:bg-slate-950 rounded-xl p-4 flex items-center justify-center border border-slate-200 dark:border-slate-800">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-[520px] w-auto h-auto rounded-lg shadow-sm"
              />
            </div>
          </div>

          {/* Saved Banners Library */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                Thư viện mẫu banner đã lưu ({store.banners.length})
              </h3>
            </div>
            {store.banners.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                <ImageIcon className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                Chưa có mẫu banner nào được lưu.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {store.banners.map((bn) => (
                  <div
                    key={bn.id}
                    className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>{bn.brand}</span>
                        <span className="font-mono-tabular">{bn.aspectRatio}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1 line-clamp-2">
                        {bn.headline}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleLoadBanner(bn)}
                        className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Nạp lên Studio
                      </button>
                      <button
                        type="button"
                        onClick={() => store.deleteBanner(bn.id)}
                        aria-label="Xóa mẫu banner"
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
