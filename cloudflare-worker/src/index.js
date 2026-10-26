import PostalMime from 'postal-mime';

// Cấu hình CORS Headers hỗ trợ React gọi từ bất kỳ domain hoặc localhost
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Hàm tiện ích trích xuất mã OTP từ nội dung thư
function extractOtp(text, html) {
  const content = (text || '') + ' ' + (html || '');
  
  // 1. Tìm các mẫu có từ khóa rõ ràng: mã, code, otp, verification, xác nhận...
  const keywordPattern = /(?:mã(?:\s+xác\s+thực|\s+otp)?|code|otp|verification(?:\s+code)?|security\s+code)[\s:=#\-–]+([0-9A-Za-z]{4,8})\b/i;
  const keywordMatch = content.match(keywordPattern);
  if (keywordMatch && keywordMatch[1]) {
    return keywordMatch[1].trim();
  }

  // 2. Tìm chuỗi 4 - 8 chữ số đứng riêng biệt
  const standaloneDigits = content.match(/\b\d{4,8}\b/);
  if (standaloneDigits) {
    return standaloneDigits[0];
  }

  return null;
}

export default {
  /**
   * 1. EMAIL HANDLER: Xử lý khi Cloudflare Email Routing chuyển tiếp thư tới Worker
   */
  async email(message, env, ctx) {
    try {
      const rawStream = await new Response(message.raw).arrayBuffer();
      const parser = new PostalMime();
      const parsed = await parser.parse(rawStream);

      const id = crypto.randomUUID();
      const recipient = message.to.toLowerCase();
      const sender = message.from;
      const senderName = parsed.from?.name || parsed.from?.address || sender;
      const subject = parsed.subject || '(Không có tiêu đề)';
      const textContent = parsed.text || '';
      const htmlContent = parsed.html || '';
      const otpCode = extractOtp(textContent, htmlContent);

      // Lưu vào Cloudflare D1
      await env.DB.prepare(`
        INSERT INTO received_emails (id, recipient, sender, sender_name, subject, text_content, html_content, otp_code, created_at, is_read)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 0)
      `).bind(id, recipient, sender, senderName, subject, textContent, htmlContent, otpCode).run();

      console.log(`[Email Received] ID: ${id} -> ${recipient} from ${sender}`);
    } catch (err) {
      console.error('[Email Processing Error]', err);
    }
  },

  /**
   * 2. FETCH HANDLER: Cung cấp REST API cho giao diện React
   */
  async fetch(request, env, ctx) {
    // Xử lý Preflight CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const pathname = url.pathname;

    try {
      // Endpoint: GET /api/health
      if (pathname === '/api/health') {
        return Response.json({ status: 'ok', time: new Date().toISOString() }, { headers: corsHeaders });
      }

      // Endpoint: GET /api/inbox?email=user@domain.com
      if (pathname === '/api/inbox' && request.method === 'GET') {
        const email = url.searchParams.get('email');
        if (!email) {
          return Response.json({ success: false, message: 'Thiếu tham số email' }, { status: 400, headers: corsHeaders });
        }

        // Lấy danh sách thư của email đó (rút gọn nội dung để tải nhanh)
        const { results } = await env.DB.prepare(`
          SELECT id, recipient, sender, sender_name, subject, 
                 substr(text_content, 1, 150) as snippet, 
                 otp_code, created_at, is_read
          FROM received_emails
          WHERE lower(recipient) = lower(?)
          ORDER BY created_at DESC
          LIMIT 50
        `).bind(email).all();

        return Response.json({ success: true, data: results || [] }, { headers: corsHeaders });
      }

      // Endpoint: GET /api/message/:id
      if (pathname.startsWith('/api/message/') && request.method === 'GET') {
        const id = pathname.replace('/api/message/', '');
        const message = await env.DB.prepare(`
          SELECT * FROM received_emails WHERE id = ?
        `).bind(id).first();

        if (!message) {
          return Response.json({ success: false, message: 'Không tìm thấy thư' }, { status: 404, headers: corsHeaders });
        }

        return Response.json({ success: true, data: message }, { headers: corsHeaders });
      }

      // Endpoint: PATCH /api/message/:id/read
      if (pathname.startsWith('/api/message/') && pathname.endsWith('/read') && request.method === 'PATCH') {
        const id = pathname.replace('/api/message/', '').replace('/read', '');
        await env.DB.prepare(`
          UPDATE received_emails SET is_read = 1 WHERE id = ?
        `).bind(id).run();

        return Response.json({ success: true, message: 'Đã đánh dấu đã đọc' }, { headers: corsHeaders });
      }

      // Endpoint: DELETE /api/message/:id
      if (pathname.startsWith('/api/message/') && request.method === 'DELETE') {
        const id = pathname.replace('/api/message/', '');
        await env.DB.prepare(`
          DELETE FROM received_emails WHERE id = ?
        `).bind(id).run();

        return Response.json({ success: true, message: 'Đã xóa thư' }, { headers: corsHeaders });
      }

      // Endpoint: DELETE /api/inbox?email=user@domain.com (Xóa toàn bộ hòm thư)
      if (pathname === '/api/inbox' && request.method === 'DELETE') {
        const email = url.searchParams.get('email');
        if (!email) {
          return Response.json({ success: false, message: 'Thiếu tham số email' }, { status: 400, headers: corsHeaders });
        }

        await env.DB.prepare(`
          DELETE FROM received_emails WHERE lower(recipient) = lower(?)
        `).bind(email).run();

        return Response.json({ success: true, message: 'Đã dọn sạch hòm thư' }, { headers: corsHeaders });
      }

      return Response.json({ success: false, message: 'Endpoint không tồn tại' }, { status: 404, headers: corsHeaders });
    } catch (err) {
      return Response.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders });
    }
  }
};
