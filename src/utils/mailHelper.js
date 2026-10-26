/**
 * Tiện ích bóc tách mã OTP từ nội dung Text và HTML của email
 */
export function extractOtp(text = '', html = '') {
  const content = (text || '') + ' ' + (html || '');
  const patterns = [
    /(?:mã(?:\s+xác\s+thực|\s+xác\s+nhận|\s+otp)?|code|otp|verification(?:\s+code)?|security\s+code)[\s:=#\-–]+([0-9A-Za-z]{4,8})\b/i,
    /(?:nhập\s+mã|enter\s+code)[\s:=#\-–]+([0-9A-Za-z]{4,8})\b/i,
    /(?:is|là)[\s:=#\-–]+([0-9]{4,8})\b/i,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) return match[1].trim();
  }

  const standalone6 = content.match(/\b\d{6}\b/);
  if (standalone6) return standalone6[0];

  const standalone = content.match(/\b\d{4,8}\b/);
  if (standalone) return standalone[0];

  return null;
}

/**
 * Trích xuất liên kết xác nhận tài khoản
 */
export function extractLink(html = '', text = '') {
  const urlPattern = /https?:\/\/[^\s"'<>]+(?:verify|confirm|activate|token|auth)[^\s"'<>]+/i;
  const mHtml = html.match(urlPattern);
  if (mHtml) return mHtml[0];

  const mText = text.match(urlPattern);
  if (mText) return mText[0];

  return null;
}
