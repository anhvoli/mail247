/**
 * Tiện ích trích xuất mã OTP và liên kết xác nhận từ nội dung email
 */
export function extractOtpCode(text = '', html = '') {
  const content = (text || '') + ' ' + (html || '');
  
  // 1. Tìm các mẫu có tiền tố rõ ràng như mã, code, otp, verification, pin, security code...
  const patterns = [
    /(?:mã(?:\s+xác\s+thực|\s+xác\s+nhận|\s+otp)?|code|otp|verification(?:\s+code)?|security\s+code|mã\s+pin)[\s:=#\-–]+([0-9A-Za-z]{4,8})\b/i,
    /(?:nhập\s+mã|enter\s+code)[\s:=#\-–]+([0-9A-Za-z]{4,8})\b/i,
    /(?:is|là)[\s:=#\-–]+([0-9]{4,8})\b/i
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // 2. Tìm chuỗi số 6 chữ số độc lập phổ biến nhất
  const standalone6 = content.match(/\b\d{6}\b/);
  if (standalone6) {
    return standalone6[0];
  }

  // 3. Tìm chuỗi số 4 hoặc 8 chữ số độc lập
  const standaloneOther = content.match(/\b\d{4,8}\b/);
  if (standaloneOther) {
    return standaloneOther[0];
  }

  return null;
}

/**
 * Tìm liên kết xác nhận/kích hoạt tài khoản
 */
export function extractVerificationLink(html = '', text = '') {
  const urlPattern = /https?:\/\/[^\s"'<>]+(?:verify|confirm|activate|token|auth)[^\s"'<>]+/i;
  const matchHtml = html.match(urlPattern);
  if (matchHtml) return matchHtml[0];

  const matchText = text.match(urlPattern);
  if (matchText) return matchText[0];

  return null;
}
