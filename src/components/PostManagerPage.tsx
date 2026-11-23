import React, { useMemo, useState } from 'react';
import {
  Copy,
  Edit3,
  Files,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import type { AppStore } from '../store/useAppStore';
import type { PostItem, PostStatus, PostType, WritingStyle } from '../types/app';
import { formatDateTimeVi, getPostStatusStyle } from '../utils/formatters';

interface PostManagerPageProps {
  store: AppStore;
}

const STATUS_TABS: ('Tất cả' | PostStatus)[] = [
  'Tất cả',
  'Bản nháp',
  'Chờ duyệt',
  'Đã duyệt',
  'Đã đăng',
];

const POST_TYPES: PostType[] = ['Thu mua', 'Bán voucher', 'Trao đổi', 'Quảng cáo'];
const STYLES: WritingStyle[] = [
  'Chuyên nghiệp uy tín',
  'Thân thiện gần gũi',
  'Ngắn gọn súc tích',
  'Kêu gọi tương tác cao',
  'Hài hước nhẹ nhàng',
];

export const PostManagerPage: React.FC<PostManagerPageProps> = ({ store }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Tất cả' | PostStatus>('Tất cả');
  const [brandFilter, setBrandFilter] = useState<string>('Tất cả');
  const [typeFilter, setTypeFilter] = useState<string>('Tất cả');

  const [editingPost, setEditingPost] = useState<PostItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state for create / edit modal
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formBrand, setFormBrand] = useState('Got It');
  const [formType, setFormType] = useState<PostType>('Thu mua');
  const [formStyle, setFormStyle] = useState<WritingStyle>('Chuyên nghiệp uy tín');
  const [formStatus, setFormStatus] = useState<PostStatus>('Bản nháp');
  const [formNotes, setFormNotes] = useState('');

  const availableBrands = useMemo(() => {
    const set = new Set<string>(['Got It', 'UrBox', 'Gift Card']);
    store.posts.forEach((p) => set.add(p.brand));
    return ['Tất cả', ...Array.from(set)];
  }, [store.posts]);

  const filteredPosts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return store.posts.filter((p) => {
      if (statusFilter !== 'Tất cả' && p.status !== statusFilter) return false;
      if (brandFilter !== 'Tất cả' && p.brand !== brandFilter) return false;
      if (typeFilter !== 'Tất cả' && p.postType !== typeFilter) return false;
      if (q) {
        const hay = `${p.title} ${p.content} ${p.brand} ${p.postType}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [store.posts, search, statusFilter, brandFilter, typeFilter]);

  const openCreateModal = () => {
    setIsCreating(true);
    setEditingPost(null);
    setFormTitle('');
    setFormContent('');
    setFormBrand('Got It');
    setFormType('Thu mua');
    setFormStyle(store.settings.defaultStyle);
    setFormStatus('Bản nháp');
    setFormNotes('');
  };

  const openEditModal = (post: PostItem) => {
    setIsCreating(false);
    setEditingPost(post);
    setFormTitle(post.title);
    setFormContent(post.content);
    setFormBrand(post.brand);
    setFormType(post.postType);
    setFormStyle(post.writingStyle);
    setFormStatus(post.status);
    setFormNotes(post.notes || '');
  };

  const closeModal = () => {
    setIsCreating(false);
    setEditingPost(null);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      store.notify('Vui lòng nhập đầy đủ tiêu đề và nội dung bài viết.', 'warning');
      return;
    }

    if (isCreating) {
      store.addPost({
        title: formTitle.trim(),
        content: formContent.trim(),
        brand: formBrand.trim() || 'Thương hiệu khác',
        postType: formType,
        writingStyle: formStyle,
        status: formStatus,
        notes: formNotes.trim() || undefined,
      });
    } else if (editingPost) {
      store.updatePost(editingPost.id, {
        title: formTitle.trim(),
        content: formContent.trim(),
        brand: formBrand.trim() || 'Thương hiệu khác',
        postType: formType,
        writingStyle: formStyle,
        status: formStatus,
        notes: formNotes.trim() || undefined,
      });
    }
    closeModal();
  };

  const handleDuplicate = (post: PostItem) => {
    store.addPost({
      title: `${post.title} (Bản sao)`,
      content: post.content,
      brand: post.brand,
      postType: post.postType,
      writingStyle: post.writingStyle,
      status: 'Bản nháp',
      notes: post.notes,
    });
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            {STATUS_TABS.map((tab) => {
              const count =
                tab === 'Tất cả'
                  ? store.posts.length
                  : store.posts.filter((p) => p.status === tab).length;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    statusFilter === tab
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab} (<span className="font-mono-tabular">{count}</span>)
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm bài viết mới</span>
          </button>
        </div>

        {/* Search + Dropdown Filters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tiêu đề, nội dung hoặc thương hiệu..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            >
              {availableBrands.map((b) => (
                <option key={b} value={b}>
                  {b === 'Tất cả' ? 'Tất cả thương hiệu' : b}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            >
              <option value="Tất cả">Tất cả loại bài</option>
              {POST_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Posts Table / List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        {filteredPosts.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Không tìm thấy bài viết nào khớp với bộ lọc hiện tại.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('Tất cả');
                setBrandFilter('Tất cả');
                setTypeFilter('Tất cả');
              }}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-5">Tiêu đề & nội dung</th>
                    <th className="py-3 px-4">Phân loại</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4">Cập nhật</th>
                    <th className="py-3 px-5 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  {filteredPosts.map((post) => (
                    <tr
                      key={post.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-5 max-w-md">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">
                          {post.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {post.content}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-300">
                        <span>{post.brand}</span>
                        <span className="mx-1.5 text-slate-300 dark:text-slate-700">·</span>
                        <span>{post.postType}</span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          aria-label={`Trạng thái bài ${post.title}`}
                          value={post.status}
                          onChange={(e) =>
                            store.updatePostStatus(post.id, e.target.value as PostStatus)
                          }
                          className={`px-2.5 py-1 rounded-md border text-xs font-medium cursor-pointer ${getPostStatusStyle(
                            post.status
                          )}`}
                        >
                          <option value="Bản nháp">Bản nháp</option>
                          <option value="Chờ duyệt">Chờ duyệt</option>
                          <option value="Đã duyệt">Đã duyệt</option>
                          <option value="Đã đăng">Đã đăng</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs font-mono-tabular text-slate-500 dark:text-slate-400">
                        {formatDateTimeVi(post.updatedAt)}
                      </td>
                      <td className="py-3.5 px-5 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => store.copyText(post.content, 'Nội dung bài viết')}
                            title="Sao chép nội dung"
                            className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(post)}
                            title="Chỉnh sửa"
                            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicate(post)}
                            title="Nhân bản"
                            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Files className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => store.deletePost(post.id)}
                            title="Xóa bài"
                            className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-800">
              {filteredPosts.map((post) => (
                <div key={post.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      {post.brand} · {post.postType}
                    </span>
                    <span className="font-mono-tabular">{formatDateTimeVi(post.updatedAt)}</span>
                  </div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                    {post.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {post.content}
                  </p>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <select
                      value={post.status}
                      onChange={(e) =>
                        store.updatePostStatus(post.id, e.target.value as PostStatus)
                      }
                      className={`px-2.5 py-1.5 rounded-md border text-xs font-medium ${getPostStatusStyle(
                        post.status
                      )}`}
                    >
                      <option value="Bản nháp">Bản nháp</option>
                      <option value="Chờ duyệt">Chờ duyệt</option>
                      <option value="Đã duyệt">Đã duyệt</option>
                      <option value="Đã đăng">Đã đăng</option>
                    </select>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => store.copyText(post.content, 'Bài viết')}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(post)}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => store.deletePost(post.id)}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-rose-600 text-xs"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Create / Edit Modal */}
      {(isCreating || editingPost) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <form
            onSubmit={handleSaveModal}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl"
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                {isCreating ? 'Thêm bài viết mới' : 'Chỉnh sửa bài viết'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Tiêu đề tóm tắt</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Nhập tiêu đề dễ nhớ trong kho..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
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
                    {POST_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Phong cách</label>
                  <select
                    value={formStyle}
                    onChange={(e) => setFormStyle(e.target.value as WritingStyle)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  >
                    {STYLES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Trạng thái</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as PostStatus)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  >
                    <option value="Bản nháp">Bản nháp</option>
                    <option value="Chờ duyệt">Chờ duyệt</option>
                    <option value="Đã duyệt">Đã duyệt</option>
                    <option value="Đã đăng">Đã đăng</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Nội dung bài đăng</label>
                <textarea
                  rows={8}
                  required
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Nhập hoặc dán nội dung bài đăng Facebook..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Ghi chú nội bộ (tùy chọn)</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ví dụ: Nhớ điền mệnh giá trước khi đăng..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
              >
                {isCreating ? 'Lưu bài viết' : 'Cập nhật bài viết'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
