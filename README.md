# WorkReport Portal — Hệ Thống Báo Cáo Công Việc & Dashboard Quản Trị

Dự án được xây dựng hoàn toàn bằng **React (Vite) + Chart.js + Vercel Serverless Functions**, sẵn sàng deploy lên **Vercel** chỉ với 1 click!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/anhvoli/mail247)

---

## 🌟 Tính Năng Nổi Bật

1. **Dashboard Quản Trị Viên Hiện Đại:**
   - Thẻ thống kê tổng số báo cáo, hiệu suất trung bình (%), tổng giờ làm việc, số lượng phản hồi.
   - **Bộ 3 biểu đồ trực quan (Chart.js):**
     - *Biểu đồ cột:* Hiệu suất hoàn thành theo từng nhân sự (%)
     - *Biểu đồ Doughnut:* Phân bổ trạng thái công việc (Hoàn thành / Đang xử lý / Vướng mắc)
     - *Biểu đồ cột:* Tổng thời gian cống hiến theo nhân viên
   - **Bộ lọc đa năng:** Tìm kiếm theo tên nhân viên, tiêu đề công việc, lọc theo phòng ban và trạng thái.
   - **Tương tác phản hồi trực tiếp (Admin Feedback):** Quản trị viên nhập nhận xét và chỉ đạo trực tiếp ngay dưới báo cáo.

2. **Giao Diện Nộp Báo Cáo Dành Cho Nhân Viên:**
   - Form nhập thông tin trực quan: Họ tên, phòng ban, tiêu đề.
   - Danh sách động các đầu việc đã xong và việc đang tiến hành.
   - Slider điều chỉnh tiến độ (0% - 100%), số giờ làm việc, khó khăn vướng mắc (blockers), kế hoạch ngày mai.

3. **Cổng Tài Liệu API (`/documents` tab):**
   - Hướng dẫn chi tiết từng endpoint: `POST /api/reports`, `GET /api/reports`, `GET /api/reports/:id`, `POST /api/reports/:id/feedback`.
   - Có sẵn mẫu Request Body, Response Body và nút sao chép lệnh `cURL` dùng ngay.

4. **Tối Ưu Hoàn Hảo Cho Vercel (No-DB & Zero-config):**
   - Frontend: React 18 SPA với Vite.
   - Backend: Vercel Serverless Functions tại thư mục `/api`.
   - Cấu hình file `vercel.json` hỗ trợ SPA Routing + API Rewrites chuẩn chỉnh.

---

## 🚀 Hướng Dẫn Deploy Lên Vercel

### Cách 1: Import trực tiếp từ GitHub (Khuyên dùng)
1. Đăng nhập vào [Vercel](https://vercel.com).
2. Bấm **"Add New..."** ➔ **"Project"**.
3. Chọn kho lưu trữ **`anhvoli/mail247`**.
4. Vercel sẽ tự động phát hiện Framework là **Vite**:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
5. Bấm **Deploy**. Sau ~30 giây, dự án của bạn sẽ live trên internet với tên miền miễn phí `https://mail247-xxx.vercel.app`!

### Cách 2: Chạy thử ở môi trường Local
```bash
git clone https://github.com/anhvoli/mail247.git
cd mail247
npm install
npm run dev
```
Mở trình duyệt truy cập: `http://localhost:5173`
