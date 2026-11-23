export type PageId =
  | 'dashboard'
  | 'ai-writer'
  | 'ai-buy'
  | 'ai-sell'
  | 'ai-banner'
  | 'posts'
  | 'schedule'
  | 'moderation'
  | 'comments'
  | 'analytics'
  | 'settings';

export type VoucherBrand =
  | 'Got It'
  | 'UrBox'
  | 'Gift Card'
  | 'Shopee'
  | 'Grab'
  | 'VinID / OneU'
  | 'Thương hiệu khác';

export type PostType = 'Thu mua' | 'Bán voucher' | 'Trao đổi' | 'Quảng cáo';

export type WritingStyle =
  | 'Chuyên nghiệp uy tín'
  | 'Thân thiện gần gũi'
  | 'Ngắn gọn súc tích'
  | 'Kêu gọi tương tác cao'
  | 'Hài hước nhẹ nhàng';

export type PostStatus = 'Bản nháp' | 'Chờ duyệt' | 'Đã duyệt' | 'Đã đăng';

export interface PostItem {
  id: string;
  title: string;
  content: string;
  brand: string;
  postType: PostType;
  writingStyle: WritingStyle;
  status: PostStatus;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export type ScheduleStatus = 'Sắp tới' | 'Đã nhắc' | 'Đã đăng';

export interface ScheduleItem {
  id: string;
  postId?: string;
  title: string;
  content: string;
  brand: string;
  postType: PostType;
  scheduledAt: string; // ISO datetime
  status: ScheduleStatus;
  reminderMinutes: number;
  note?: string;
}

export type ModerationRisk = 'safe' | 'review' | 'high_risk';
export type ModerationStatus = 'Chờ xử lý' | 'Đã xem xét' | 'Đánh dấu cảnh báo';

export interface ModerationRecord {
  id: string;
  authorName: string;
  content: string;
  riskLevel: ModerationRisk;
  summary: string;
  scamSignals: string[];
  duplicateAssessment: string;
  duplicateScore: number;
  matchedPostTitle?: string;
  suggestedAction: string;
  politeWarningReply: string;
  status: ModerationStatus;
  analyzedAt: string;
}

export interface SavedReplyTemplate {
  id: string;
  title: string;
  category: string;
  tone: string;
  replyText: string;
  updatedAt: string;
}

export type BannerAspectRatio = '1200x628' | '1080x1080' | '1080x1350';

export interface AdBannerItem {
  id: string;
  brand: string;
  purpose: string;
  aspectRatio: BannerAspectRatio;
  headline: string;
  subheadline: string;
  ctaText: string;
  highlights: string[];
  backdropUrl: string;
  accentColor: string;
  darkOverlay: boolean;
  createdAt: string;
}

export interface AppSettings {
  groupName: string;
  groupUrl: string;
  groupDescription: string;
  aiModel: 'gemini-4-hydrogen' | 'gemini-3.1-flash-lite';
  thinkingLevel: 'LOW' | 'MEDIUM';
  defaultStyle: WritingStyle;
  strictNoHallucination: boolean;
  enableBrowserReminders: boolean;
  sensitiveKeywords: string[];
  priorityBrands: string[];
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}
