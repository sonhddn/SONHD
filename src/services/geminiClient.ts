export interface GeneratedPostVariant {
  title: string;
  content: string;
  safetyNote: string;
}

export interface ModerateResponse {
  riskLevel: 'safe' | 'review' | 'high_risk';
  summary: string;
  scamSignals: string[];
  duplicateAssessment: string;
  suggestedAction: string;
  politeWarningReply: string;
}

export interface ReplyOption {
  approach: string;
  replyText: string;
}

export interface AdCopyResult {
  headline: string;
  subheadline: string;
  ctaText: string;
  highlights: string[];
}

export interface HealthResponse {
  ok: boolean;
  aiConfigured: boolean;
  modelDefault: string;
  timestamp: string;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Lỗi máy chủ (${res.status})`);
  }
  return data as T;
}

export async function checkAiHealth(): Promise<HealthResponse> {
  const res = await fetch('/api/health');
  if (!res.ok) {
    throw new Error('Không thể kiểm tra kết nối máy chủ.');
  }
  return res.json();
}

export async function generateAiPosts(payload: {
  mode: 'general' | 'buy' | 'sell';
  brand: string;
  postType: string;
  tone: string;
  count: number;
  customContext?: string;
  paymentMethods?: string;
  checkConditions?: string;
  voucherFormat?: string;
  groupName?: string;
  model?: string;
  thinkingLevel?: string;
  strictNoHallucination?: boolean;
}): Promise<{ variants: GeneratedPostVariant[]; model: string }> {
  return postJson('/api/gemini/posts', payload);
}

export async function analyzeModerationWithAi(payload: {
  content: string;
  authorName: string;
  sensitiveKeywords: string[];
  existingPostSnippets: string[];
  model?: string;
  thinkingLevel?: string;
}): Promise<{ analysis: ModerateResponse; model: string }> {
  return postJson('/api/gemini/moderate', payload);
}

export async function generateCommentReplies(payload: {
  commentText: string;
  contextNote?: string;
  tone: string;
  brand: string;
  model?: string;
  thinkingLevel?: string;
}): Promise<{ replies: ReplyOption[]; model: string }> {
  return postJson('/api/gemini/replies', payload);
}

export async function generateAdBannerCopy(payload: {
  brand: string;
  purpose: string;
  tone: string;
  extraNote?: string;
  model?: string;
  thinkingLevel?: string;
}): Promise<{ copy: AdCopyResult; model: string }> {
  return postJson('/api/gemini/ad-copy', payload);
}
