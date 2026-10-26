# Hướng Dẫn Cấu Hình Cloudflare Worker & D1 Database

Tài liệu này hướng dẫn bạn thiết lập hạ tầng Cloudflare để tự động nhận thư từ tên miền riêng (`*@yourdomain.com`) và phân phối qua REST API cho ứng dụng React.

---

## 1. Yêu cầu tiên quyết
1. Đã có một tên miền riêng (ví dụ: `mybrand.com` hoặc `temp.mybrand.com`).
2. Tên miền đã được thêm vào tài khoản **Cloudflare** và bật proxy DNS.
3. Đã cài đặt Node.js trên máy tính.

---

## 2. Các bước triển khai Cloudflare Worker & Database

### Bước 2.1: Đăng nhập Cloudflare qua Wrangler CLI
Mở terminal tại thư mục này (`cloudflare-worker`) và chạy:
```bash
npm install
npx wrangler login
```
*(Trình duyệt sẽ mở ra để bạn xác nhận đăng nhập vào tài khoản Cloudflare).*

### Bước 2.2: Tạo Cơ sở dữ liệu Cloudflare D1
Chạy lệnh sau để tạo database serverless SQLite:
```bash
npx wrangler d1 create tempmail-db
```
Sau khi chạy xong, terminal sẽ in ra đoạn cấu hình tương tự như sau:
```toml
[[d1_databases]]
binding = "DB"
database_name = "tempmail-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```
👉 Hãy copy `database_id` này và dán đè vào file `wrangler.toml`.

### Bước 2.3: Khởi tạo bảng dữ liệu (Schema)
Chạy lệnh khởi tạo bảng `received_emails` vào D1 trên Cloudflare:
```bash
npx wrangler d1 execute tempmail-db --file=./schema.sql --remote
```

### Bước 2.4: Deploy Worker lên Cloudflare
```bash
npx wrangler deploy
```
Sau khi deploy thành công, terminal sẽ trả về đường dẫn API của bạn:
Ví dụ: `https://custom-mail-worker.your-subdomain.workers.dev`
👉 Lưu lại URL này để dán vào cấu hình của ứng dụng React Frontend!

---

## 3. Cấu hình Cloudflare Email Routing (Bắt buộc)

1. Đăng nhập vào [Cloudflare Dashboard](https://dash.cloudflare.com) -> Chọn Tên miền của bạn.
2. Ở thanh menu bên trái, tìm mục **Email Routing** (Điều hướng email):
   - Nếu chưa bật, bấm **Get started / Enable Email Routing**.
   - Cloudflare sẽ yêu cầu thêm các bản ghi DNS tự động (MX và TXT/SPF) -> Bấm **Add records and enable**.
3. Chuyển sang tab **Routing rules**:
   - Tìm mục **Catch-all rule** (Quy tắc bao quát):
   - Bấm **Edit** (Chỉnh sửa).
   - Chọn Action: **Send to a Worker**.
   - Destination: Chọn worker vừa deploy (`custom-mail-worker`).
   - Bật trạng thái **Active** -> Bấm **Save**.

🎉 **Hoàn tất!** Giờ đây bất kỳ email nào gửi tới `bất_kỳ_tên_gì@yourdomain.com` đều sẽ được tự động lưu vào D1 và có thể đọc qua React!
