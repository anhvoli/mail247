# WorkReport Pro — Hệ Thống Báo Cáo Công Việc & Dashboard Quản Trị

Dự án được xây dựng hoàn toàn bằng **React (Vite) + Chart.js + Vercel Serverless Functions + Vercel KV / Upstash Database**, sẵn sàng deploy lên **Vercel** chỉ với 1 click!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/anhvoli/mail247)

---

## 🌟 Tính Năng Nổi Bật

1. **Dashboard & API Kết Nối 100% Cùng Một Database Thật:**
   - Dashboard gọi trực tiếp `GET /api/reports` để render, không còn tình trạng dùng dữ liệu mẫu cứng.
   - Khi nhân viên nộp báo cáo qua API (cURL, Postman, script, mobile app) hoặc qua giao diện web, dữ liệu sẽ được lưu vào **Database tập trung** và hiển thị ngay trên Dashboard.
   - Thẻ thống kê tổng quan (Tổng báo cáo, Tỷ lệ hoàn thành, Tổng giờ làm việc, Số nhận xét) được tính toán động thời gian thực từ dữ liệu API.
   - Hỗ trợ nút **"Làm mới" (Refresh)** trên thanh điều hướng và cơ chế tự động đồng bộ khi quay lại tab.

2. **Hỗ Trợ Database Vercel KV / Upstash Redis:**
   - Tích hợp sẵn chuẩn REST API của **Vercel KV / Upstash Redis** (được Vercel hỗ trợ 1-click tích hợp).
   - Tự động nhận diện biến môi trường `KV_REST_API_URL` & `KV_REST_API_TOKEN` (hoặc `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`).
   - Có cơ chế file persistent fallback thông minh (tại `/tmp/reports_db.json` trên Vercel hoặc `./reports_db.json` ở local), giúp hệ thống hoạt động ổn định ngay cả khi chưa gắn KV.

3. **Dashboard Quản Trị Viên Hiện Đại (Chuẩn UI 2026):**
   - Font chữ cao cấp **Plus Jakarta Sans**, hiệu ứng kính mờ (Glassmorphism), Pill Navigation và Hero Banner ấn tượng.
   - **Bộ 3 biểu đồ trực quan (Chart.js):**
     - *Biểu đồ cột:* Hiệu suất hoàn thành theo từng nhân sự (%)
     - *Biểu đồ Doughnut:* Phân bổ trạng thái công việc (Hoàn thành / Đang xử lý / Vướng mắc)
     - *Biểu đồ cột:* Tổng thời gian cống hiến theo nhân viên
   - **Tương tác phản hồi trực tiếp (Admin Feedback):** Quản trị viên nhập nhận xét và chỉ đạo trực tiếp ngay dưới từng báo cáo, lưu vĩnh viễn vào Database.

4. **Giao Diện Nộp Báo Cáo & Cổng Tài Liệu API (`/documents`):**
   - Form nộp báo cáo nhanh cho nhân sự.
   - Tài liệu REST API đầy đủ kèm lệnh `cURL` mẫu có thể sao chép nhanh.

---

## 🚀 Hướng Dẫn Deploy Lên Vercel & Kết Nối Database

### Bước 1: Deploy lên Vercel
1. Đăng nhập vào [Vercel](https://vercel.com).
2. Bấm **"Add New..."** ➔ **"Project"** ➔ Chọn repo **`anhvoli/mail247`**.
3. Vercel sẽ tự động phát hiện Framework là **Vite**:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Bấm **Deploy**.

### Bước 2: Kích hoạt Vercel KV / Upstash (Khuyên dùng để lưu trữ vĩnh viễn)
1. Trong trang quản lý Project trên Vercel, chọn tab **Storage**.
2. Bấm **Create Database** ➔ Chọn **KV** (Powered by Upstash).
3. Đặt tên database và bấm **Create**.
4. Chọn **Connect to Project** và liên kết với project `mail247` vừa tạo. Vercel sẽ tự động cấu hình các biến môi trường `KV_REST_API_URL` và `KV_REST_API_TOKEN`.
5. Vào tab **Deployments** ➔ Bấm **Redeploy** để dự án nhận cấu hình database mới nhất.

---

## 💻 Chạy Thử Ở Môi Trường Local (Đầy đủ cả Frontend & API)

```bash
git clone https://github.com/anhvoli/mail247.git
cd mail247
npm install
npm run dev
```

Mở trình duyệt truy cập: `http://localhost:5173`
- Cả giao diện React và toàn bộ các endpoint `/api/reports` đều hoạt động trực tiếp trong Vite dev server và lưu vào file `reports_db.json`.
