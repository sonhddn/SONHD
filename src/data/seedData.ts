import type {
  AdBannerItem,
  AppSettings,
  ModerationRecord,
  PostItem,
  SavedReplyTemplate,
  ScheduleItem,
} from '../types/app';

export const FACEBOOK_GROUP_URL = 'https://www.facebook.com/share/g/1GimWMaS3G/?mibextid=wwXIfr';

export const ADMIN_AVATAR_URL = '/src/assets/images/admin_avatar_1795392783281.jpg';

export const BANNER_BACKDROPS = [
  {
    id: 'gotit',
    label: 'Nền Got It (Xanh Royal)',
    brand: 'Got It',
    url: '/src/assets/images/banner_bg_gotit_1795392783949.jpg',
    accent: '#1D4ED8',
  },
  {
    id: 'urbox',
    label: 'Nền UrBox (Xanh Ngọc Lục)',
    brand: 'UrBox',
    url: '/src/assets/images/banner_bg_urbox_1795392783798.jpg',
    accent: '#0F766E',
  },
  {
    id: 'giftcard',
    label: 'Nền Gift Card (Tối Ánh Kim)',
    brand: 'Gift Card',
    url: '/src/assets/images/banner_bg_giftcard_1795392783939.jpg',
    accent: '#B45309',
  },
];

const now = new Date();
const hoursFromNow = (h: number) => new Date(now.getTime() + h * 3600 * 1000).toISOString();
const daysFromNow = (d: number, hour = 9, minute = 0) => {
  const dt = new Date(now);
  dt.setDate(dt.getDate() + d);
  dt.setHours(hour, minute, 0, 0);
  return dt.toISOString();
};

export const INITIAL_SETTINGS: AppSettings = {
  groupName: 'Cộng đồng Giao dịch Voucher Got It · UrBox · Gift Card',
  groupUrl: FACEBOOK_GROUP_URL,
  groupDescription:
    'Nhóm trao đổi, thu mua và chia sẻ voucher Got It, UrBox, Gift Card minh bạch. Khuyến khích giao dịch qua trung gian ban quản trị để bảo vệ thành viên.',
  aiModel: 'gemini-4-hydrogen',
  thinkingLevel: 'LOW',
  defaultStyle: 'Chuyên nghiệp uy tín',
  strictNoHallucination: true,
  enableBrowserReminders: false,
  sensitiveKeywords: [
    'cọc trước',
    'chuyển khoản trước không trung gian',
    'ib telegram',
    'bit.ly',
    'chiết khấu 50%',
    'tặng code miễn phí',
    'gửi mã otp',
    'cho thuê tài khoản',
  ],
  priorityBrands: ['Got It', 'UrBox', 'Gift Card', 'Shopee', 'Grab', 'VinID / OneU'],
};

export const INITIAL_POSTS: PostItem[] = [
  {
    id: 'post-01',
    title: 'Thu mua voucher Got It điện tử — Giao dịch minh bạch trong ngày',
    content:
      'Chào cả nhà, mình cần thu mua số lượng voucher Got It (link/mã e-voucher còn hạn sử dụng).\n\n• Mệnh giá cần thu: [Mệnh giá]\n• Tỷ lệ / Giá thu mua: [Giá / Tỷ lệ]\n• Hình thức giao dịch: Kiểm tra mã hợp lệ hoặc giao dịch qua trung gian Admin nhóm cho thành viên mới yên tâm.\n\nAnh chị em có nhu cầu thanh lý vui lòng bình luận bên dưới hoặc nhắn tin để trao đổi cụ thể nhé.',
    brand: 'Got It',
    postType: 'Thu mua',
    writingStyle: 'Chuyên nghiệp uy tín',
    status: 'Đã duyệt',
    createdAt: daysFromNow(-4, 10, 15),
    updatedAt: daysFromNow(-2, 14, 20),
    notes: 'Điền tỷ lệ thực tế trước khi sao chép đăng.',
  },
  {
    id: 'post-02',
    title: 'Nhượng lại thẻ quà tặng UrBox chính chủ — Hỗ trợ kiểm tra trực tiếp',
    content:
      'Mình được công ty thưởng ít thẻ quà tặng UrBox nhưng không dùng hết nên muốn nhượng lại cho bạn nào cần.\n\n• Loại voucher: UrBox E-voucher\n• Mệnh giá & hạn dùng: [Mệnh giá] — HSD [Hạn sử dụng]\n• Giá chuyển nhượng: [Giá / Tỷ lệ]\n• Giao dịch trực tiếp hoặc qua trung gian uy tín của nhóm.\n\nAi cần sử dụng siêu thị, ăn uống, mua sắm cứ bình luận nhé!',
    brand: 'UrBox',
    postType: 'Bán voucher',
    writingStyle: 'Thân thiện gần gũi',
    status: 'Chờ duyệt',
    createdAt: daysFromNow(-3, 9, 0),
    updatedAt: daysFromNow(-1, 16, 45),
  },
  {
    id: 'post-03',
    title: 'Nhắc nhở quy tắc giao dịch an toàn Gift Card & E-Voucher',
    content:
      '[THÔNG BÁO BAN QUẢN TRỊ]\nĐể đảm bảo an toàn tài sản cho mọi thành viên khi mua bán Got It, UrBox và Gift Card trong nhóm:\n1. Luôn kiểm tra uy tín tài khoản đối tác và lịch sử hoạt động trong nhóm.\n2. Khuyến khích sử dụng trung gian Admin đối với các giao dịch lần đầu.\n3. Tuyệt đối không chuyển khoản đặt cọc qua link lạ hoặc tài khoản bên ngoài chưa xác minh.\n\nChúc cộng đồng giao dịch thuận lợi và an toàn!',
    brand: 'Gift Card',
    postType: 'Quảng cáo',
    writingStyle: 'Chuyên nghiệp uy tín',
    status: 'Đã đăng',
    createdAt: daysFromNow(-6, 8, 30),
    updatedAt: daysFromNow(-5, 8, 30),
  },
  {
    id: 'post-04',
    title: 'Trao đổi voucher UrBox sang Got It hoặc thẻ siêu thị tương đương',
    content:
      'Hiện mình đang có sẵn voucher UrBox muốn đổi ngang sang Got It để tiện dùng tại một số cửa hàng đối tác.\n• Giá trị trao đổi dự kiến: [Mệnh giá]\n• Điều kiện: Mã còn nguyên chưa kích hoạt, hạn dùng còn từ [Hạn sử dụng].\n• Hỗ trợ kiểm tra chéo minh bạch tại chỗ hoặc qua trung gian nhóm.\nBạn nào có nhu cầu đổi qua lại bình luận giúp mình nhé.',
    brand: 'UrBox',
    postType: 'Trao đổi',
    writingStyle: 'Ngắn gọn súc tích',
    status: 'Đã duyệt',
    createdAt: daysFromNow(-2, 11, 10),
    updatedAt: daysFromNow(-1, 9, 30),
  },
  {
    id: 'post-05',
    title: 'Gom Gift Card mua sắm cuối tuần — Thanh toán nhanh sau khi xác thực mã',
    content:
      'Cuối tuần mình nhận thu gom thêm Gift Card các hệ thống bán lẻ và ăn uống để phục vụ đơn hàng cho khách.\n• Thương hiệu nhận: Gift Card siêu thị, F&B, điện máy\n• Mệnh giá & mức thu: [Mệnh giá] · [Giá / Tỷ lệ]\n• Quy trình: Xác thực tình trạng mã rõ ràng -> thanh toán chuyển khoản ngay hoặc qua trung gian nhóm.\nInbox hoặc để lại bình luận để mình báo lại chi tiết nhé.',
    brand: 'Gift Card',
    postType: 'Thu mua',
    writingStyle: 'Kêu gọi tương tác cao',
    status: 'Bản nháp',
    createdAt: daysFromNow(-1, 15, 0),
    updatedAt: daysFromNow(-1, 15, 0),
  },
  {
    id: 'post-06',
    title: 'Chia sẻ kinh nghiệm sử dụng mã Got It tại quầy không bị lỗi',
    content:
      'Nhiều bạn mới nhận mã Got It lần đầu hay gặp tình trạng chưa mở đúng đường dẫn quà tặng khi ra quầy thanh toán. Mẹo nhỏ:\n- Mở sẵn link Got It trước khi tới quầy để kiểm tra danh sách thương hiệu áp dụng.\n- Không chụp màn hình mã QR gửi công khai trên bình luận.\n- Kiểm tra kỹ điều kiện gộp nhiều mã trên cùng 1 hóa đơn.\nCả nhà còn mẹo nào hay chia sẻ thêm bên dưới nhé!',
    brand: 'Got It',
    postType: 'Quảng cáo',
    writingStyle: 'Thân thiện gần gũi',
    status: 'Đã đăng',
    createdAt: daysFromNow(-5, 19, 0),
    updatedAt: daysFromNow(-4, 20, 0),
  },
  {
    id: 'post-07',
    title: 'Thanh lý nhanh voucher Shopee & Grab từ chương trình ưu đãi doanh nghiệp',
    content:
      'Mình còn dư ít mã ưu đãi Shopee và Grab không có nhu cầu sử dụng trong tháng này.\n• Mệnh giá: [Mệnh giá]\n• Hạn sử dụng: [Hạn sử dụng]\n• Mức chuyển nhượng: [Giá / Tỷ lệ]\nƯu tiên giao dịch gọn nhẹ, kiểm tra mã rõ ràng cho người dùng thật.',
    brand: 'Shopee',
    postType: 'Bán voucher',
    writingStyle: 'Ngắn gọn súc tích',
    status: 'Chờ duyệt',
    createdAt: daysFromNow(-1, 20, 15),
    updatedAt: daysFromNow(-1, 20, 15),
  },
  {
    id: 'post-08',
    title: 'Nhận thu mua UrBox & Got It cuối tháng — Giải ngân linh hoạt',
    content:
      'Cuối tháng anh chị em có voucher thưởng công ty (UrBox, Got It) chưa dùng tới cần đổi sang tiền mặt có thể nhắn mình nhé.\n• Mệnh giá tiếp nhận: [Mệnh giá]\n• Tỷ lệ thu: [Giá / Tỷ lệ]\n• Cam kết giao dịch lịch sự, hỗ trợ trung gian nhóm 100% với tài khoản mới.',
    brand: 'UrBox',
    postType: 'Thu mua',
    writingStyle: 'Chuyên nghiệp uy tín',
    status: 'Đã đăng',
    createdAt: daysFromNow(-7, 13, 0),
    updatedAt: daysFromNow(-6, 13, 0),
  },
];

export const INITIAL_SCHEDULES: ScheduleItem[] = [
  {
    id: 'sch-01',
    postId: 'post-01',
    title: 'Thu mua voucher Got It điện tử — Giao dịch minh bạch',
    content: INITIAL_POSTS[0].content,
    brand: 'Got It',
    postType: 'Thu mua',
    scheduledAt: hoursFromNow(1.5),
    status: 'Sắp tới',
    reminderMinutes: 30,
    note: 'Nhớ cập nhật [Giá / Tỷ lệ] thực tế trước khi dán lên nhóm Facebook.',
  },
  {
    id: 'sch-02',
    postId: 'post-04',
    title: 'Trao đổi voucher UrBox sang Got It',
    content: INITIAL_POSTS[3].content,
    brand: 'UrBox',
    postType: 'Trao đổi',
    scheduledAt: daysFromNow(1, 9, 30),
    status: 'Sắp tới',
    reminderMinutes: 15,
    note: 'Đăng khung giờ sáng để tăng lượt tiếp cận.',
  },
  {
    id: 'sch-03',
    postId: 'post-02',
    title: 'Nhượng lại thẻ quà tặng UrBox chính chủ',
    content: INITIAL_POSTS[1].content,
    brand: 'UrBox',
    postType: 'Bán voucher',
    scheduledAt: daysFromNow(2, 14, 0),
    status: 'Sắp tới',
    reminderMinutes: 30,
  },
  {
    id: 'sch-04',
    postId: 'post-03',
    title: 'Nhắc nhở quy tắc giao dịch an toàn Gift Card',
    content: INITIAL_POSTS[2].content,
    brand: 'Gift Card',
    postType: 'Quảng cáo',
    scheduledAt: daysFromNow(-2, 8, 30),
    status: 'Đã đăng',
    reminderMinutes: 30,
  },
  {
    id: 'sch-05',
    postId: 'post-05',
    title: 'Gom Gift Card mua sắm cuối tuần',
    content: INITIAL_POSTS[4].content,
    brand: 'Gift Card',
    postType: 'Thu mua',
    scheduledAt: daysFromNow(4, 19, 30),
    status: 'Sắp tới',
    reminderMinutes: 30,
  },
];

export const INITIAL_MODERATIONS: ModerationRecord[] = [
  {
    id: 'mod-01',
    authorName: 'Tài khoản mới (Minh Quân)',
    content:
      'Mình thu mua Got It và UrBox chiết khấu 98%, giải ngân trong 1 phút. Yêu cầu gửi mã trước hoặc cọc 200k giữ suất rồi mới nhắn qua Telegram @giaodichnhanh99, bấm link bit.ly/xac-nhan-voucher để nhận tiền.',
    riskLevel: 'high_risk',
    summary:
      'Nội dung chứa nhiều dấu hiệu rủi ro lừa đảo điển hình: tỷ lệ thu mua cao bất thường, yêu cầu cọc trước/gửi mã không qua trung gian, dẫn link rút gọn lạ và kéo giao dịch sang Telegram.',
    scamSignals: [
      'Đề xuất tỷ lệ thu mua cao bất thường dễ gây bẫy lòng tin',
      'Yêu cầu đặt cọc hoặc gửi mã trước không có trung gian nhóm',
      'Dẫn liên kết rút gọn bên ngoài (bit.ly) và chuyển hướng sang Telegram',
    ],
    duplicateAssessment: 'Không trùng lặp với kho bài hợp lệ, nhưng khớp mẫu spam lừa đảo phổ biến.',
    duplicateScore: 12,
    suggestedAction:
      'Từ chối duyệt bài thủ công trên Facebook, không kích hoạt link ngoài và ghi chú theo dõi tài khoản nếu tái phạm.',
    politeWarningReply:
      'Chào bạn, bài viết có chứa liên kết rút gọn bên ngoài và đề nghị giao dịch ngoài luồng không qua trung gian nên Ban Quản Trị tạm thời chưa thể phê duyệt. Vui lòng tuân thủ nội quy giao dịch an toàn của nhóm nhé!',
    status: 'Đánh dấu cảnh báo',
    analyzedAt: daysFromNow(-1, 11, 20),
  },
  {
    id: 'mod-02',
    authorName: 'Ngọc Lan',
    content:
      'Chào cả nhà, mình cần thu mua số lượng voucher Got It điện tử còn hạn sử dụng. Giao dịch kiểm tra mã hợp lệ hoặc qua trung gian Admin nhóm cho yên tâm nhé.',
    riskLevel: 'review',
    summary:
      'Nội dung có ngữ khí bình thường và đề xuất trung gian, tuy nhiên độ trùng lặp cấu trúc câu với bài đã lưu khá cao — cần xem lại để tránh đăng lặp spam trong ngày.',
    scamSignals: ['Chưa phát hiện dấu hiệu lừa đảo trực tiếp'],
    duplicateAssessment: 'Tương đồng 74% với bài "Thu mua voucher Got It điện tử — Giao dịch minh bạch trong ngày".',
    duplicateScore: 74,
    matchedPostTitle: 'Thu mua voucher Got It điện tử — Giao dịch minh bạch trong ngày',
    suggestedAction:
      'Xem xét giãn thời gian đăng hoặc yêu cầu bổ sung ngữ cảnh riêng để tránh bị Facebook đánh dấu trùng lặp nội dung.',
    politeWarningReply:
      'Chào bạn, nội dung bài này khá giống bài đã đăng gần đây trong nhóm. Bạn có thể cập nhật thêm thông tin cụ thể hơn hoặc chờ đủ giãn cách trước khi đăng lại nhé.',
    status: 'Chờ xử lý',
    analyzedAt: daysFromNow(-1, 16, 10),
  },
  {
    id: 'mod-03',
    authorName: 'Hoàng Dũng',
    content:
      'Mình có 2 thẻ UrBox được công ty tặng dịp sinh nhật muốn nhượng lại cho bạn nào hay đi siêu thị. Giao dịch trực tiếp tại khu vực Cầu Giấy hoặc nhờ Admin trung gian giúp mình ạ.',
    riskLevel: 'safe',
    summary:
      'Bài đăng minh bạch, rõ nguồn gốc quà tặng, sẵn sàng giao dịch trực tiếp hoặc qua trung gian Ban Quản Trị, không chứa link lạ.',
    scamSignals: ['Không phát hiện dấu hiệu rủi ro'],
    duplicateAssessment: 'Nội dung mới, không trùng lặp với bài viết gần đây.',
    duplicateScore: 18,
    suggestedAction: 'Đủ điều kiện xem xét duyệt đăng lên nhóm theo quy trình thông thường.',
    politeWarningReply:
      'Cảm ơn bạn đã chia sẻ thông tin rõ ràng và ưu tiên giao dịch qua trung gian nhóm. Chúc bạn sớm giao dịch thuận lợi!',
    status: 'Đã xem xét',
    analyzedAt: daysFromNow(-2, 9, 45),
  },
];

export const INITIAL_REPLY_TEMPLATES: SavedReplyTemplate[] = [
  {
    id: 'tpl-01',
    title: 'Mời giao dịch qua trung gian Admin',
    category: 'An toàn giao dịch',
    tone: 'Lịch sự chuyên nghiệp',
    replyText:
      'Chào bạn, để đảm bảo an toàn cho cả hai bên, nhóm khuyến khích giao dịch qua trung gian Ban Quản Trị đối với lần hợp tác đầu tiên. Bạn nhắn tin cho Admin để được hỗ trợ mở phòng check mã minh bạch nhé!',
    updatedAt: daysFromNow(-3, 10, 0),
  },
  {
    id: 'tpl-02',
    title: 'Phản hồi thành viên hỏi giá thu mua',
    category: 'Thu mua voucher',
    tone: 'Thân thiện gần gũi',
    replyText:
      'Chào bạn, bạn đang có mã Got It / UrBox thuộc mệnh giá nào và hạn dùng tới bao giờ ạ? Bạn nhắn tin trực tiếp hoặc bình luận tình trạng mã để mình báo mức thu [Giá / Tỷ lệ] cụ thể cho bạn nhé.',
    updatedAt: daysFromNow(-2, 15, 30),
  },
  {
    id: 'tpl-03',
    title: 'Hướng dẫn kiểm tra điều kiện voucher trước khi bán',
    category: 'Hỗ trợ kỹ thuật',
    tone: 'Lịch sự chuyên nghiệp',
    replyText:
      'Bạn giúp mình kiểm tra lại 3 thông tin trước khi giao dịch nhé: (1) Mã còn hạn sử dụng, (2) Chưa bấm sử dụng/đổi điểm sang nhãn hàng con, và (3) Không gửi công khai ảnh mã QR lên phần bình luận để tránh người khác quét mất ạ.',
    updatedAt: daysFromNow(-4, 14, 0),
  },
  {
    id: 'tpl-04',
    title: 'Cảnh báo tránh cọc trước ngoài luồng',
    category: 'Cảnh báo rủi ro',
    tone: 'Cảnh báo an toàn giao dịch',
    replyText:
      'Lưu ý cho cả nhà: Tuyệt đối không chuyển khoản đặt cọc hoặc gửi mã voucher trước cho tài khoản lạ nhắn riêng qua Telegram/Zalo chưa xác minh. Mọi giao dịch nên thực hiện minh bạch qua trung gian chính thức của nhóm.',
    updatedAt: daysFromNow(-1, 18, 0),
  },
];

export const INITIAL_BANNERS: AdBannerItem[] = [
  {
    id: 'bn-01',
    brand: 'Got It',
    purpose: 'Thu mua voucher uy tín',
    aspectRatio: '1200x628',
    headline: 'Thu Mua Voucher Got It Minh Bạch',
    subheadline: 'Hỗ trợ kiểm tra mã nhanh gọn · Giao dịch an toàn qua trung gian nhóm',
    ctaText: 'Nhắn tin báo giá ngay',
    highlights: ['Xác thực nhanh', 'Trung gian Admin', 'Thanh toán linh hoạt'],
    backdropUrl: '/src/assets/images/banner_bg_gotit_1795392783949.jpg',
    accentColor: '#1D4ED8',
    darkOverlay: false,
    createdAt: daysFromNow(-3, 10, 0),
  },
  {
    id: 'bn-02',
    brand: 'UrBox',
    purpose: 'Chuyển nhượng & Trao đổi UrBox',
    aspectRatio: '1080x1080',
    headline: 'Giao Dịch Thẻ Quà UrBox An Toàn',
    subheadline: 'Kết nối cộng đồng mua bán và trao đổi voucher chính chủ mỗi ngày',
    ctaText: 'Xem bài ghim nhóm',
    highlights: ['Kiểm tra chính chủ', 'Đổi mã linh hoạt', 'Cộng đồng uy tín'],
    backdropUrl: '/src/assets/images/banner_bg_urbox_1795392783798.jpg',
    accentColor: '#0F766E',
    darkOverlay: true,
    createdAt: daysFromNow(-2, 16, 0),
  },
  {
    id: 'bn-03',
    brand: 'Gift Card',
    purpose: 'Cẩm nang giao dịch an toàn',
    aspectRatio: '1200x628',
    headline: 'Quy Tắc Giao Dịch Gift Card Chuẩn',
    subheadline: 'Luôn xác minh tài khoản và ưu tiên trung gian trước khi chuyển khoản',
    ctaText: 'Tham gia thảo luận',
    highlights: ['Không cọc mù', 'Không link lạ', 'Minh bạch 100%'],
    backdropUrl: '/src/assets/images/banner_bg_giftcard_1795392783939.jpg',
    accentColor: '#B45309',
    darkOverlay: true,
    createdAt: daysFromNow(-1, 9, 0),
  },
];
