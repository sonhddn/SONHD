import { useCallback, useEffect, useState } from 'react';
import {
  INITIAL_BANNERS,
  INITIAL_MODERATIONS,
  INITIAL_POSTS,
  INITIAL_REPLY_TEMPLATES,
  INITIAL_SCHEDULES,
  INITIAL_SETTINGS,
} from '../data/seedData';
import type {
  AdBannerItem,
  AppSettings,
  ModerationRecord,
  ModerationStatus,
  PostItem,
  PostStatus,
  SavedReplyTemplate,
  ScheduleItem,
  ScheduleStatus,
  ToastMessage,
} from '../types/app';

const STORAGE_KEYS = {
  posts: 'fgm_ai_v1_posts',
  schedules: 'fgm_ai_v1_schedules',
  moderations: 'fgm_ai_v1_moderations',
  templates: 'fgm_ai_v1_reply_templates',
  banners: 'fgm_ai_v1_banners',
  settings: 'fgm_ai_v1_settings',
  theme: 'fgm_ai_v1_theme',
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota errors gracefully
  }
}

export function computeTextSimilarity(a: string, b: string): number {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1);

  const wordsA = normalize(a);
  const wordsB = normalize(b);
  if (wordsA.length === 0 || wordsB.length === 0) return 0;

  const bigrams = (words: string[]) => {
    const set = new Set<string>();
    for (let i = 0; i < words.length; i++) {
      set.add(words[i]);
      if (i < words.length - 1) set.add(`${words[i]}_${words[i + 1]}`);
    }
    return set;
  };

  const setA = bigrams(wordsA);
  const setB = bigrams(wordsB);
  let intersection = 0;
  setA.forEach((token) => {
    if (setB.has(token)) intersection++;
  });
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : Math.round((intersection / union) * 100);
}

export function useAppStore() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.theme);
    return saved === 'dark' ? 'dark' : 'light';
  });

  const [posts, setPosts] = useState<PostItem[]>(() => readStorage(STORAGE_KEYS.posts, INITIAL_POSTS));
  const [schedules, setSchedules] = useState<ScheduleItem[]>(() =>
    readStorage(STORAGE_KEYS.schedules, INITIAL_SCHEDULES)
  );
  const [moderations, setModerations] = useState<ModerationRecord[]>(() =>
    readStorage(STORAGE_KEYS.moderations, INITIAL_MODERATIONS)
  );
  const [replyTemplates, setReplyTemplates] = useState<SavedReplyTemplate[]>(() =>
    readStorage(STORAGE_KEYS.templates, INITIAL_REPLY_TEMPLATES)
  );
  const [banners, setBanners] = useState<AdBannerItem[]>(() =>
    readStorage(STORAGE_KEYS.banners, INITIAL_BANNERS)
  );
  const [settings, setSettings] = useState<AppSettings>(() =>
    readStorage(STORAGE_KEYS.settings, INITIAL_SETTINGS)
  );
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  }, [theme]);

  useEffect(() => writeStorage(STORAGE_KEYS.posts, posts), [posts]);
  useEffect(() => writeStorage(STORAGE_KEYS.schedules, schedules), [schedules]);
  useEffect(() => writeStorage(STORAGE_KEYS.moderations, moderations), [moderations]);
  useEffect(() => writeStorage(STORAGE_KEYS.templates, replyTemplates), [replyTemplates]);
  useEffect(() => writeStorage(STORAGE_KEYS.banners, banners), [banners]);
  useEffect(() => writeStorage(STORAGE_KEYS.settings, settings), [settings]);

  const notify = useCallback((message: string, type: ToastMessage['type'] = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3400);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const copyText = useCallback(
    async (text: string, label = 'Nội dung') => {
      try {
        await navigator.clipboard.writeText(text);
        notify(`Đã sao chép ${label.toLowerCase()} vào bộ nhớ tạm.`, 'success');
        return true;
      } catch {
        notify('Trình duyệt không cho phép tự động sao chép, vui lòng sao chép thủ công.', 'warning');
        return false;
      }
    },
    [notify]
  );

  // Posts CRUD
  const addPost = useCallback(
    (input: Omit<PostItem, 'id' | 'createdAt' | 'updatedAt'>) => {
      const nowIso = new Date().toISOString();
      const newPost: PostItem = {
        ...input,
        id: `post-${Date.now().toString(36)}`,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      setPosts((prev) => [newPost, ...prev]);
      notify('Đã lưu bài viết vào kho quản lý.', 'success');
      return newPost;
    },
    [notify]
  );

  const updatePost = useCallback(
    (id: string, patch: Partial<PostItem>) => {
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p))
      );
      notify('Đã cập nhật bài viết.', 'success');
    },
    [notify]
  );

  const updatePostStatus = useCallback(
    (id: string, status: PostStatus) => {
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p))
      );
      notify(`Đã chuyển trạng thái bài viết sang "${status}".`, 'info');
    },
    [notify]
  );

  const deletePost = useCallback(
    (id: string) => {
      setPosts((prev) => prev.filter((p) => p.id !== id));
      notify('Đã xóa bài viết.', 'info');
    },
    [notify]
  );

  // Schedules CRUD
  const addSchedule = useCallback(
    (input: Omit<ScheduleItem, 'id'>) => {
      const item: ScheduleItem = {
        ...input,
        id: `sch-${Date.now().toString(36)}`,
      };
      setSchedules((prev) =>
        [...prev, item].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
      );
      notify('Đã thêm lịch đăng bài mới.', 'success');
      return item;
    },
    [notify]
  );

  const updateSchedule = useCallback(
    (id: string, patch: Partial<ScheduleItem>) => {
      setSchedules((prev) =>
        prev
          .map((s) => (s.id === id ? { ...s, ...patch } : s))
          .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
      );
      notify('Đã cập nhật lịch đăng.', 'success');
    },
    [notify]
  );

  const markScheduleStatus = useCallback(
    (id: string, status: ScheduleStatus) => {
      let linkedPostId: string | undefined;
      setSchedules((prev) =>
        prev.map((s) => {
          if (s.id === id) {
            linkedPostId = s.postId;
            return { ...s, status };
          }
          return s;
        })
      );
      if (status === 'Đã đăng' && linkedPostId) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === linkedPostId
              ? { ...p, status: 'Đã đăng', updatedAt: new Date().toISOString() }
              : p
          )
        );
      }
      notify(`Đã cập nhật lịch sang "${status}".`, 'success');
    },
    [notify]
  );

  const deleteSchedule = useCallback(
    (id: string) => {
      setSchedules((prev) => prev.filter((s) => s.id !== id));
      notify('Đã xóa lịch đăng.', 'info');
    },
    [notify]
  );

  // Moderations CRUD
  const addModeration = useCallback(
    (record: Omit<ModerationRecord, 'id' | 'analyzedAt'>) => {
      const newRecord: ModerationRecord = {
        ...record,
        id: `mod-${Date.now().toString(36)}`,
        analyzedAt: new Date().toISOString(),
      };
      setModerations((prev) => [newRecord, ...prev]);
      return newRecord;
    },
    []
  );

  const updateModerationStatus = useCallback(
    (id: string, status: ModerationStatus) => {
      setModerations((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
      notify(`Đã đánh dấu hồ sơ kiểm duyệt: ${status}.`, 'info');
    },
    [notify]
  );

  const deleteModeration = useCallback(
    (id: string) => {
      setModerations((prev) => prev.filter((m) => m.id !== id));
      notify('Đã xóa bản ghi kiểm duyệt.', 'info');
    },
    [notify]
  );

  // Comment Reply Templates CRUD
  const addReplyTemplate = useCallback(
    (input: Omit<SavedReplyTemplate, 'id' | 'updatedAt'>) => {
      const item: SavedReplyTemplate = {
        ...input,
        id: `tpl-${Date.now().toString(36)}`,
        updatedAt: new Date().toISOString(),
      };
      setReplyTemplates((prev) => [item, ...prev]);
      notify('Đã lưu mẫu trả lời bình luận.', 'success');
      return item;
    },
    [notify]
  );

  const deleteReplyTemplate = useCallback(
    (id: string) => {
      setReplyTemplates((prev) => prev.filter((t) => t.id !== id));
      notify('Đã xóa mẫu trả lời.', 'info');
    },
    [notify]
  );

  // Banners CRUD
  const addBanner = useCallback(
    (input: Omit<AdBannerItem, 'id' | 'createdAt'>) => {
      const item: AdBannerItem = {
        ...input,
        id: `bn-${Date.now().toString(36)}`,
        createdAt: new Date().toISOString(),
      };
      setBanners((prev) => [item, ...prev]);
      notify('Đã lưu thiết kế banner vào thư viện.', 'success');
      return item;
    },
    [notify]
  );

  const deleteBanner = useCallback(
    (id: string) => {
      setBanners((prev) => prev.filter((b) => b.id !== id));
      notify('Đã xóa mẫu banner.', 'info');
    },
    [notify]
  );

  // Settings & Backup
  const updateSettings = useCallback(
    (patch: Partial<AppSettings>) => {
      setSettings((prev) => ({ ...prev, ...patch }));
      notify('Đã lưu cấu hình AI & thông tin nhóm.', 'success');
    },
    [notify]
  );

  const resetAllDemoData = useCallback(() => {
    setPosts(INITIAL_POSTS);
    setSchedules(INITIAL_SCHEDULES);
    setModerations(INITIAL_MODERATIONS);
    setReplyTemplates(INITIAL_REPLY_TEMPLATES);
    setBanners(INITIAL_BANNERS);
    setSettings(INITIAL_SETTINGS);
    notify('Đã khôi phục toàn bộ dữ liệu mẫu ban đầu.', 'info');
  }, [notify]);

  const exportAllDataJson = useCallback(() => {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        app: 'FACEBOOK GROUP MANAGER AI',
        posts,
        schedules,
        moderations,
        replyTemplates,
        banners,
        settings,
      },
      null,
      2
    );
  }, [posts, schedules, moderations, replyTemplates, banners, settings]);

  const importAllDataJson = useCallback(
    (rawJson: string) => {
      try {
        const parsed = JSON.parse(rawJson);
        if (Array.isArray(parsed.posts)) setPosts(parsed.posts);
        if (Array.isArray(parsed.schedules)) setSchedules(parsed.schedules);
        if (Array.isArray(parsed.moderations)) setModerations(parsed.moderations);
        if (Array.isArray(parsed.replyTemplates)) setReplyTemplates(parsed.replyTemplates);
        if (Array.isArray(parsed.banners)) setBanners(parsed.banners);
        if (parsed.settings && typeof parsed.settings === 'object') {
          setSettings({ ...INITIAL_SETTINGS, ...parsed.settings });
        }
        notify('Đã khôi phục dữ liệu từ bản sao lưu thành công.', 'success');
        return true;
      } catch {
        notify('Tệp JSON sao lưu không đúng định dạng.', 'error');
        return false;
      }
    },
    [notify]
  );

  return {
    theme,
    toggleTheme: () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light')),
    posts,
    schedules,
    moderations,
    replyTemplates,
    banners,
    settings,
    toasts,
    notify,
    dismissToast,
    copyText,
    addPost,
    updatePost,
    updatePostStatus,
    deletePost,
    addSchedule,
    updateSchedule,
    markScheduleStatus,
    deleteSchedule,
    addModeration,
    updateModerationStatus,
    deleteModeration,
    addReplyTemplate,
    deleteReplyTemplate,
    addBanner,
    deleteBanner,
    updateSettings,
    resetAllDemoData,
    exportAllDataJson,
    importAllDataJson,
  };
}

export type AppStore = ReturnType<typeof useAppStore>;
