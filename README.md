# MailKK - Ứng Dụng Quản Lý & Đọc Đa Email Tùy Chỉnh (Custom Domain Multi-Inbox)

Dự án được xây dựng với **React (Vite + TailwindCSS + Zustand)** kết hợp với **Cloudflare Email Routing + Cloudflare Worker + D1 Database** để cung cấp giải pháp tạo và đọc email tạm thời tùy chỉnh tiền tố hoàn toàn miễn phí trên chính **Tên Miền Riêng (Custom Domain)** của bạn.

---

## 📁 Cấu Trúc Dự Án

```text
custom-mail-app/
├── cloudflare-worker/       # Backend Serverless nhận mail qua Cloudflare & API RESTful
│   ├── src/index.js         # Parse MIME (postal-mime), trích xuất OTP & Endpoint API
│   ├── schema.sql           # Cấu trúc bảng SQLite D1 lưu trữ email
│   ├── wrangler.toml        # Cấu hình Cloudflare Worker & D1 binding
│   └── README.md            # Hướng dẫn chi tiết 3 bước triển khai Cloudflare
│
└── frontend/                # Ứng dụng React Single Page Application (SPA)
    ├── src/
    │   ├── components/
    │   │   ├── accounts/    # Quản lý danh sách email, modal tạo tiền tố tùy chỉnh
    │   │   ├── inbox/       # Danh sách thư đến, tự động làm mới (Auto-refresh), tìm kiếm
    │   │   ├── reader/      # Màn hình đọc thư, Thẻ OTP nổi bật, DOMPurify lọc XSS
    │   │   └── common/      # Header, SettingsModal cấu hình Domain & Worker URL
    │   ├── store/           # Zustand Store lưu trữ hòm thư vào LocalStorage
    │   └── utils/           # Thuật toán Regex bắt mã OTP & Mock data thử nghiệm
    └── package.json
```

---

## 🚀 Khởi Động Nhanh Frontend (Trong 1 Phút)

1. Mở terminal tại thư mục `frontend`:
   ```bash
   cd custom-mail-app/frontend
   npm install
   npm run dev
   ```
2. Mở trình duyệt tại: `http://localhost:3000`

---

## ✨ Các Tính Năng Nổi Bật Đã Tích Hợp

1. **Chế độ Thử Nghiệm (Demo Mode) Sẵn Sàng**:
   - Bạn có thể trải nghiệm toàn bộ giao diện, tạo các hòm thư tùy ý và bấm nút **"Gửi Thư Mẫu (OTP)"** trên thanh Header để kiểm tra tính năng nhận email, đọc mã OTP tự động mà **chưa cần phải cấu hình Cloudflare ngay**.
2. **Tùy Chỉnh Tiền Tố (Username) & Tên Miền**:
   - Tự do đặt tên hòm thư: `order.shopee01@yourdomain.com`, `buyer.vip@...` hoặc bấm nút **"Sinh ngẫu nhiên"**.
   - Hỗ trợ thêm nhiều tên miền riêng trong phần Cài đặt.
3. **Quản Lý Đa Hòm Thư (Multi-Inbox)**:
   - Theo dõi không giới hạn số lượng email cùng lúc.
   - Badge hiển thị số lượng thư chưa đọc của từng email.
   - Tự động lưu trữ danh sách vào `localStorage` (F5 không mất dữ liệu).
4. **Trích Xuất Mã OTP Tự Động (1-Click Copy)**:
   - Tự động nhận diện mã xác nhận (4 - 8 chữ số) từ Facebook, Shopee, Telegram, GitHub,... và hiển thị dạng banner to nổi bật kèm nút sao chép 1 chạm.
5. **An Toàn Bảo Mật Tuyệt Đối**:
   - Mọi email định dạng HTML đều được khử trùng mã độc qua **DOMPurify** trước khi hiển thị.
   - Kết nối trực tiếp vào Cloudflare Worker qua HTTPS chuẩn CORS.
