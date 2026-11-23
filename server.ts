import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const ALLOWED_MODELS = new Set(['gemini-4-hydrogen', 'gemini-3.1-flash-lite']);

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function resolveModel(requested?: string): string {
  if (requested && ALLOWED_MODELS.has(requested)) {
    return requested;
  }
  return 'gemini-4-hydrogen';
}

function resolveThinkingConfig(model: string, level?: string) {
  if (model === 'gemini-3.1-flash-lite') {
    return undefined;
  }
  if (level === 'LOW') return { thinkingLevel: ThinkingLevel.LOW };
  if (level === 'MEDIUM') return { thinkingLevel: ThinkingLevel.MEDIUM };
  return { thinkingLevel: ThinkingLevel.LOW };
}

function handleGeminiError(res: express.Response, err: unknown) {
  const message = err instanceof Error ? err.message : 'Lỗi không xác định khi gọi Gemini API';
  console.error('[Gemini API Error]:', message);

  if (message.includes('API_KEY_INVALID') || message.includes('PERMISSION_DENIED') || message.includes('403')) {
    return res.status(403).json({
      error: 'Khóa Gemini API chưa hợp lệ hoặc chưa được cấp quyền. Vui lòng kiểm tra mục Settings > Secrets trong AI Studio.',
    });
  }
  if (message.includes('RESOURCE_EXHAUSTED') || message.includes('429')) {
    return res.status(429).json({
      error: 'Hệ thống đang chạm giới hạn lượt gọi Gemini API. Vui lòng thử lại sau ít phút.',
    });
  }
  return res.status(500).json({
    error: `Không thể kết nối Gemini AI: ${message}`,
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    const client = getGeminiClient();
    res.json({
      ok: true,
      aiConfigured: Boolean(client),
      modelDefault: 'gemini-4-hydrogen',
      timestamp: new Date().toISOString(),
    });
  });

  app.post('/api/gemini/posts', async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Chưa cấu hình GEMINI_API_KEY trên máy chủ. Vui lòng thiết lập khóa trong Settings > Secrets để sử dụng AI.',
      });
    }

    try {
      const {
        mode = 'general',
        brand = 'Got It',
        postType = 'Thu mua',
        tone = 'Chuyên nghiệp uy tín',
        count = 2,
        customContext = '',
        paymentMethods = '',
        checkConditions = '',
        voucherFormat = '',
        groupName = 'Cộng đồng Giao dịch Voucher Got It - UrBox - Gift Card',
        model,
        thinkingLevel,
        strictNoHallucination = true,
      } = req.body ?? {};

      const safeCount = Math.min(Math.max(Number(count) || 1, 1), 5);
      const selectedModel = resolveModel(model);

      const antiHallucinationRules = strictNoHallucination
        ? `NGUYÊN TẮC BẮT BUỘC CHỐNG BỊA ĐẶT:
- TUYỆT ĐỐI KHÔNG tự bịa ra mệnh giá voucher (ví dụ 100k, 500k, 1 triệu), giá thu mua, giá bán, phần trăm chiết khấu (ví dụ 85%, 90%), số lượng tồn kho, số điện thoại, số tài khoản ngân hàng, hay mã voucher giả nếu người dùng KHÔNG nhập rõ trong phần ghi chú.
- Khi cần nhắc đến mệnh giá, giá tiền, chiết khấu, khu vực hoặc thời hạn mà người dùng chưa cung cấp, BẮT BUỘC dùng chỗ giữ chỗ rõ ràng trong ngoặc vuông như: [Mệnh giá], [Giá / Tỷ lệ], [Hạn sử dụng], [Hình thức giao dịch].
- Không hứa hẹn cam kết tài chính quá mức hoặc dùng ngôn từ dễ khiến Facebook đánh dấu spam/lừa đảo.`
        : 'Giữ thông tin trung thực theo ngữ cảnh người dùng cung cấp.';

      const modeSpecificGuide =
        mode === 'buy'
          ? `Đây là bài ĐĂNG THU MUA VOUCHER. Nhấn mạnh quy trình minh bạch, kiểm tra mã hợp lệ trước khi thanh toán. Phương thức thanh toán ưu tiên: ${paymentMethods || 'Chuyển khoản / Giao dịch trung gian'}. Điều kiện mã: ${checkConditions || 'Còn hạn sử dụng, chưa kích hoạt'}.`
          : mode === 'sell'
          ? `Đây là bài ĐĂNG BÁN / CHUYỂN NHƯỢNG VOUCHER. Định dạng mã: ${voucherFormat || 'E-voucher / Gift Card'}. Nhấn mạnh nguồn gốc rõ ràng, hỗ trợ kiểm tra mã minh bạch hoặc giao dịch qua trung gian uy tín của nhóm.`
          : `Đây là bài viết thuộc nhóm loại "${postType}" cho cộng đồng ${groupName}.`;

      const prompt = `Hãy viết ${safeCount} mẫu bài đăng Facebook khác nhau bằng tiếng Việt tự nhiên, mạch lạc, phù hợp văn hóa cộng đồng giao dịch voucher tại Việt Nam.
Thông số yêu cầu:
- Tên nhóm: ${groupName}
- Thương hiệu voucher: ${brand}
- Loại bài: ${postType}
- Phong cách viết: ${tone}
- Ngữ cảnh bổ sung từ quản trị viên: ${customContext || '(Không có thông tin giá/mệnh giá cụ thể — hãy dùng placeholder [Mệnh giá], [Giá / Tỷ lệ])'}
${modeSpecificGuide}

${antiHallucinationRules}`;

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: prompt,
        config: {
          systemInstruction:
            'Bạn là trợ lý biên tập nội dung chuyên nghiệp cho quản trị viên nhóm Facebook mua bán và trao đổi voucher tại Việt Nam. Luôn viết tiếng Việt tự nhiên, rõ ràng, không dùng từ ngữ giật tít lừa đảo và tuyệt đối không bịa đặt số liệu giá cả hoặc mệnh giá.',
          thinkingConfig: resolveThinkingConfig(selectedModel, thinkingLevel),
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: {
                  type: Type.STRING,
                  description: 'Tiêu đề tóm tắt ngắn gọn để quản trị viên phân biệt trong kho bài viết.',
                },
                content: {
                  type: Type.STRING,
                  description: 'Nội dung bài đăng Facebook hoàn chỉnh bằng tiếng Việt, phân đoạn dễ đọc.',
                },
                safetyNote: {
                  type: Type.STRING,
                  description: 'Lưu ý ngắn cho quản trị viên trước khi đăng (ví dụ: chỗ cần điền mệnh giá thực tế).',
                },
              },
              required: ['title', 'content', 'safetyNote'],
            },
          },
        },
      });

      const raw = (response.text ?? '[]').trim();
      const variants = JSON.parse(raw);
      return res.json({ variants, model: selectedModel });
    } catch (err) {
      return handleGeminiError(res, err);
    }
  });

  app.post('/api/gemini/moderate', async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Chưa cấu hình GEMINI_API_KEY trên máy chủ. Vui lòng thiết lập khóa trong Settings > Secrets.',
      });
    }

    try {
      const {
        content = '',
        authorName = 'Thành viên',
        sensitiveKeywords = [],
        existingPostSnippets = [],
        model,
        thinkingLevel,
      } = req.body ?? {};

      if (!String(content).trim()) {
        return res.status(400).json({ error: 'Vui lòng nhập nội dung bài viết cần kiểm duyệt.' });
      }

      const selectedModel = resolveModel(model);
      const keywordsText = Array.isArray(sensitiveKeywords) && sensitiveKeywords.length > 0
        ? sensitiveKeywords.join(', ')
        : 'cọc trước, ck trước, chuyển khoản trước, thu mua giá cao bất thường, ib telegram, bit.ly, nhận code miễn phí, gửi otp, cho thuê tài khoản';

      const snippetsText = Array.isArray(existingPostSnippets) && existingPostSnippets.length > 0
        ? existingPostSnippets.slice(0, 8).map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')
        : 'Chưa có bài đối chiếu.';

      const prompt = `Phân tích nội dung bài đăng/bình luận sau trong nhóm Facebook mua bán voucher (Got It, UrBox, Gift Card):

Tác giả hiển thị: ${authorName}
Nội dung cần kiểm tra:
"""
${content}
"""

Từ khóa rủi ro cần lưu ý của nhóm: ${keywordsText}

Một số bài viết hiện có trong kho để đối chiếu trùng lặp ý:
${snippetsText}

Yêu cầu phân tích:
1. Đánh giá mức độ rủi ro: "safe" (An toàn), "review" (Cần xem xét), hoặc "high_risk" (Rủi ro cao).
2. Liệt kê các dấu hiệu lừa đảo hoặc vi phạm tiềm ẩn bằng tiếng Việt cụ thể (ví dụ: dụ giao dịch ngoài nhóm không trung gian, yêu cầu cọc trước, chiết khấu phi thực tế, link rút gọn lạ, hỏi OTP/cookie/mật khẩu, spam lặp).
3. Nhận xét về khả năng trùng lặp nội dung với các bài hiện có.
4. Đề xuất hành động thủ công cho quản trị viên (KHÔNG đề xuất xóa tự động hay khóa tự động).
5. Viết sẵn 1 câu phản hồi nhắc nhở lịch sự để quản trị viên sao chép bình luận nhắc thành viên nếu cần.`;

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: prompt,
        config: {
          systemInstruction:
            'Bạn là chuyên gia kiểm duyệt an toàn cộng đồng cho nhóm Facebook giao dịch voucher tại Việt Nam. Hãy phân tích khách quan, thận trọng, bảo vệ thành viên khỏi lừa đảo nhưng không kết luận oan và luôn để quản trị viên tự quyết định thủ công.',
          thinkingConfig: resolveThinkingConfig(selectedModel, thinkingLevel),
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              riskLevel: {
                type: Type.STRING,
                description: 'Một trong 3 giá trị chính xác: safe, review, high_risk',
              },
              summary: {
                type: Type.STRING,
                description: 'Tóm tắt đánh giá tổng quan ngắn gọn bằng tiếng Việt.',
              },
              scamSignals: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Danh sách các dấu hiệu cần lưu ý phát hiện được.',
              },
              duplicateAssessment: {
                type: Type.STRING,
                description: 'Đánh giá mức độ trùng lặp nội dung hoặc mẫu spam.',
              },
              suggestedAction: {
                type: Type.STRING,
                description: 'Gợi ý bước xử lý thủ công dành cho quản trị viên.',
              },
              politeWarningReply: {
                type: Type.STRING,
                description: 'Mẫu câu nhắc nhở lịch sự bằng tiếng Việt để admin gửi cho thành viên.',
              },
            },
            required: [
              'riskLevel',
              'summary',
              'scamSignals',
              'duplicateAssessment',
              'suggestedAction',
              'politeWarningReply',
            ],
          },
        },
      });

      const raw = (response.text ?? '{}').trim();
      const analysis = JSON.parse(raw);
      return res.json({ analysis, model: selectedModel });
    } catch (err) {
      return handleGeminiError(res, err);
    }
  });

  app.post('/api/gemini/replies', async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Chưa cấu hình GEMINI_API_KEY trên máy chủ. Vui lòng thiết lập khóa trong Settings > Secrets.',
      });
    }

    try {
      const {
        commentText = '',
        contextNote = '',
        tone = 'Lịch sự chuyên nghiệp',
        brand = 'Chung',
        model,
        thinkingLevel,
      } = req.body ?? {};

      if (!String(commentText).trim()) {
        return res.status(400).json({ error: 'Vui lòng nhập bình luận cần trả lời.' });
      }

      const selectedModel = resolveModel(model);

      const prompt = `Thành viên nhóm Facebook vừa bình luận:
"${commentText}"

Thương hiệu liên quan: ${brand}
Ghi chú ngữ cảnh từ quản trị viên: ${contextNote || '(Không có)'}
Giọng điệu mong muốn: ${tone}

Hãy tạo 3 phương án trả lời bình luận bằng tiếng Việt tự nhiên, ngắn gọn, thân thiện để quản trị viên chọn và sao chép.
QUY TẮC: Không tự bịa giá thu mua/giá bán, không bịa phần trăm chiết khấu hay thông tin chuyển khoản. Nếu cần nhắc giá hoặc thông tin cụ thể chưa có, dùng chỗ giữ chỗ như [Giá / Tỷ lệ] hoặc mời nhắn tin / xem bài ghim.`;

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: prompt,
        config: {
          systemInstruction:
            'Bạn là trợ lý chăm sóc cộng đồng nhóm Facebook voucher tại Việt Nam. Trả lời tự nhiên như người thật, lịch sự, không máy móc, không bịa thông tin giao dịch.',
          thinkingConfig: resolveThinkingConfig(selectedModel, thinkingLevel),
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                approach: {
                  type: Type.STRING,
                  description: 'Tên hướng tiếp cận ngắn (ví dụ: Trực tiếp rõ ràng, Khuyến khích trung gian, Thân thiện gợi mở).',
                },
                replyText: {
                  type: Type.STRING,
                  description: 'Nội dung câu trả lời bình luận bằng tiếng Việt.',
                },
              },
              required: ['approach', 'replyText'],
            },
          },
        },
      });

      const raw = (response.text ?? '[]').trim();
      const replies = JSON.parse(raw);
      return res.json({ replies, model: selectedModel });
    } catch (err) {
      return handleGeminiError(res, err);
    }
  });

  app.post('/api/gemini/ad-copy', async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Chưa cấu hình GEMINI_API_KEY trên máy chủ. Vui lòng thiết lập khóa trong Settings > Secrets.',
      });
    }

    try {
      const {
        brand = 'Got It',
        purpose = 'Thu mua voucher uy tín',
        tone = 'Chuyên nghiệp tin cậy',
        extraNote = '',
        model,
        thinkingLevel,
      } = req.body ?? {};

      const selectedModel = resolveModel(model);

      const prompt = `Tạo bộ chữ ngắn gọn cho banner quảng cáo đăng trong nhóm Facebook tại Việt Nam.
- Thương hiệu: ${brand}
- Mục tiêu banner: ${purpose}
- Phong cách: ${tone}
- Ghi chú thêm: ${extraNote || '(Không có)'}

YÊU CẦU:
- Headline ngắn (4-8 từ, ấn tượng, tiếng Việt có dấu chuẩn).
- Subheadline súc tích (8-16 từ).
- CTA ngắn (2-5 từ, ví dụ: "Nhắn tin ngay", "Giao dịch trung gian").
- 3 điểm nhấn ngắn (mỗi điểm 3-6 từ).
- TUYỆT ĐỐI không tự bịa phần trăm chiết khấu hay mệnh giá tiền cụ thể nếu ghi chú không cung cấp.`;

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: prompt,
        config: {
          systemInstruction:
            'Bạn là chuyên gia thiết kế nội dung quảng cáo ngắn trên mạng xã hội Việt Nam. Ngắn gọn, sắc nét, không giật tít sai sự thật.',
          thinkingConfig: resolveThinkingConfig(selectedModel, thinkingLevel),
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headline: { type: Type.STRING },
              subheadline: { type: Type.STRING },
              ctaText: { type: Type.STRING },
              highlights: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['headline', 'subheadline', 'ctaText', 'highlights'],
          },
        },
      });

      const raw = (response.text ?? '{}').trim();
      const copy = JSON.parse(raw);
      return res.json({ copy, model: selectedModel });
    } catch (err) {
      return handleGeminiError(res, err);
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('/{*splat}', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FACEBOOK GROUP MANAGER AI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
