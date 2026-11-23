import React, { useState } from 'react';
import {
  BookmarkPlus,
  Copy,
  Loader2,
  MessageSquareReply,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { generateCommentReplies, type ReplyOption } from '../services/geminiClient';
import type { AppStore } from '../store/useAppStore';

interface CommentAssistantPageProps {
  store: AppStore;
}

const SAMPLE_COMMENTS = [
  'Got It 500k bên mình thu lại tỷ lệ bao nhiêu ạ? Có hỗ trợ trung gian không?',
  'Em lần đầu bán voucher UrBox, gửi mã trước hay nhận tiền trước vậy ad?',
  'Sao mã Gift Card của mình nhập báo lỗi đã sử dụng dù mới nhận từ công ty?',
];

export const CommentAssistantPage: React.FC<CommentAssistantPageProps> = ({ store }) => {
  const [commentText, setCommentText] = useState('');
  const [brand, setBrand] = useState('Got It');
  const [tone, setTone] = useState('Lịch sự chuyên nghiệp');
  const [contextNote, setContextNote] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [replies, setReplies] = useState<(ReplyOption & { id: string })[]>([]);

  // New template form
  const [newTplTitle, setNewTplTitle] = useState('');
  const [newTplCategory, setNewTplCategory] = useState('Hỗ trợ chung');
  const [newTplText, setNewTplText] = useState('');
  const [showAddTpl, setShowAddTpl] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) {
      store.notify('Vui lòng nhập bình luận của thành viên cần trả lời.', 'warning');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await generateCommentReplies({
        commentText: commentText.trim(),
        brand,
        tone,
        contextNote: contextNote.trim(),
        model: store.settings.aiModel,
        thinkingLevel: store.settings.thinkingLevel,
      });

      const list = (res.replies || []).map((r, idx) => ({
        ...r,
        id: `rep-${Date.now()}-${idx}`,
      }));
      setReplies(list);
      store.notify(`AI đã gợi ý ${list.length} phương án trả lời bình luận.`, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể tạo câu trả lời.';
      setErrorMsg(msg);
      store.notify(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsTemplate = (reply: ReplyOption) => {
    store.addReplyTemplate({
      title: `Mẫu: ${reply.approach}`,
      category: brand,
      tone,
      replyText: reply.replyText,
    });
  };

  const handleAddCustomTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTplTitle.trim() || !newTplText.trim()) return;
    store.addReplyTemplate({
      title: newTplTitle.trim(),
      category: newTplCategory.trim() || 'Hỗ trợ chung',
      tone: 'Tùy chỉnh',
      replyText: newTplText.trim(),
    });
    setNewTplTitle('');
    setNewTplText('');
    setShowAddTpl(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Generator Form */}
        <form
          onSubmit={handleGenerate}
          className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4"
        >
          <div>
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              AI gợi ý trả lời bình luận
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tạo câu trả lời tiếng Việt tự nhiên, không tự bịa giá thu mua hay chính sách ngoài ý muốn.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_COMMENTS.map((sample, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCommentText(sample)}
                className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-slate-600 dark:text-slate-300"
              >
                Mẫu bình luận {i + 1}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Bình luận của thành viên</label>
            <textarea
              rows={4}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Dán bình luận trên Facebook vào đây..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Chủ đề / Thương hiệu</label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              >
                <option value="Got It">Got It</option>
                <option value="UrBox">UrBox</option>
                <option value="Gift Card">Gift Card</option>
                <option value="Trung gian Admin">Trung gian Admin</option>
                <option value="Chung">Chung</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Giọng điệu</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              >
                <option value="Lịch sự chuyên nghiệp">Lịch sự chuyên nghiệp</option>
                <option value="Thân thiện gần gũi">Thân thiện gần gũi</option>
                <option value="Nhanh gọn súc tích">Nhanh gọn súc tích</option>
                <option value="Cảnh báo an toàn giao dịch">Cảnh báo an toàn giao dịch</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">
              Ghi chú cho AI (tùy chọn)
            </label>
            <input
              type="text"
              value={contextNote}
              onChange={(e) => setContextNote(e.target.value)}
              placeholder="Ví dụ: Mời nhắn tin riêng để kiểm tra mã trực tiếp..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
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
                <span>Đang tạo 3 gợi ý trả lời...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Tạo gợi ý trả lời</span>
              </>
            )}
          </button>
        </form>

        {/* Right: AI Reply Suggestions + Saved Templates */}
        <div className="lg:col-span-7 space-y-6">
          {/* Generated Suggestions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              Phương án gợi ý từ AI
            </h3>
            {replies.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                <MessageSquareReply className="w-7 h-7 mx-auto mb-2 text-slate-400" />
                Nhập bình luận của thành viên ở cột bên trái để nhận 3 gợi ý trả lời tự nhiên.
              </div>
            ) : (
              <div className="space-y-3">
                {replies.map((rep) => (
                  <div
                    key={rep.id}
                    className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {rep.approach}
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={rep.replyText}
                      onChange={(e) =>
                        setReplies((prev) =>
                          prev.map((item) =>
                            item.id === rep.id ? { ...item, replyText: e.target.value } : item
                          )
                        )
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm leading-relaxed"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => store.copyText(rep.replyText, 'Câu trả lời')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Sao chép</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveAsTemplate(rep)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium"
                      >
                        <BookmarkPlus className="w-3.5 h-3.5" />
                        <span>Lưu vào thư viện mẫu</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Saved Templates Library */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                  Thư viện mẫu trả lời nhanh ({store.replyTemplates.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Sao chép tức thì khi hỗ trợ thành viên trên nhóm Facebook
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddTpl((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm mẫu mới</span>
              </button>
            </div>

            {showAddTpl && (
              <form
                onSubmit={handleAddCustomTemplate}
                className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    value={newTplTitle}
                    onChange={(e) => setNewTplTitle(e.target.value)}
                    placeholder="Tên mẫu (vd: Hướng dẫn trung gian)"
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                  <input
                    type="text"
                    value={newTplCategory}
                    onChange={(e) => setNewTplCategory(e.target.value)}
                    placeholder="Nhóm chủ đề"
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
                <textarea
                  rows={3}
                  required
                  value={newTplText}
                  onChange={(e) => setNewTplText(e.target.value)}
                  placeholder="Nội dung mẫu trả lời..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddTpl(false)}
                    className="px-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg text-xs bg-blue-600 text-white font-medium"
                  >
                    Lưu mẫu
                  </button>
                </div>
              </form>
            )}

            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {store.replyTemplates.map((tpl) => (
                <div key={tpl.id} className="py-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {tpl.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {tpl.category} · {tpl.tone}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => store.copyText(tpl.replyText, 'Mẫu trả lời')}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Sao chép</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => store.deleteReplyTemplate(tpl.id)}
                        aria-label="Xóa mẫu"
                        className="p-1.5 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {tpl.replyText}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
