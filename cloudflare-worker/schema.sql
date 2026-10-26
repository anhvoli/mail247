-- Bảng lưu trữ email nhận được từ Cloudflare Email Routing
CREATE TABLE IF NOT EXISTS received_emails (
    id TEXT PRIMARY KEY,
    recipient TEXT NOT NULL,
    sender TEXT NOT NULL,
    sender_name TEXT,
    subject TEXT,
    text_content TEXT,
    html_content TEXT,
    otp_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_recipient ON received_emails(recipient);
CREATE INDEX IF NOT EXISTS idx_created_at ON received_emails(created_at);
