# Hệ Thống Báo Cáo Công Việc & Dashboard Quản Trị Viên

Hệ thống quản lý báo cáo công việc hàng ngày dành cho nhân viên và bảng điều khiển (Dashboard) dành cho người quản trị theo dõi hiệu suất làm việc trực quan.

## 🚀 Tính năng chính

- **Không cần Database phức tạp (No-DB):** Lưu trữ dữ liệu tự động dưới dạng JSON file (`reports.json`), gọn nhẹ, dễ backup và triển khai ngay lập tức.
- **Không cần cài thư viện ngoài (Zero external dependencies):** Sử dụng 100% module chuẩn của Node.js (`http`, `fs`, `path`, `url`).
- **RESTful API đơn giản:** Nhân viên gửi báo cáo, tra cứu báo cáo và xem phản hồi của admin mà không cần API Key phức tạp.
- **Dashboard Quản trị viên (`/dashboard`):**
  - Thống kê tổng số báo cáo, tỷ lệ hoàn thành, thời gian làm việc.
  - Bộ 3 biểu đồ trực quan (Chart.js):
    1. *Hiệu suất hoàn thành theo nhân viên (%)* (Doughnut/Bar)
    2. *Phân bổ trạng thái công việc* (Pie)
    3. *Tổng số giờ làm việc theo nhân viên* (Bar Chart)
  - Quản trị viên có thể nhập nhận xét / feedback trực tiếp ngay dưới từng báo cáo của nhân viên.
- **Trang tài liệu API (`/documents`):** Giao diện web trực quan tra cứu chi tiết tất cả các endpoint, kèm mẫu JSON Request, Response và cURL.

---

## 🛠️ Hướng dẫn cài đặt & Chạy ứng dụng

Yêu cầu: Đã cài đặt [Node.js](https://nodejs.org/) (phiên bản 16 trở lên).

### 1. Khởi chạy máy chủ

```bash
# Cách 1: Sử dụng npm
npm start

# Cách 2: Chạy trực tiếp qua node
node server.js
```

Máy chủ sẽ khởi động tại cổng **3000** (hoặc cổng được chỉ định qua biến môi trường `PORT`).

### 2. Truy cập các giao diện

- **Dashboard Quản Trị Viên:** [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **Tài liệu API Docs:** [http://localhost:3000/documents](http://localhost:3000/documents)

---

## 📡 Danh sách API Endpoints

### 1. Nhân viên gửi báo cáo công việc
- **Endpoint:** `POST /api/reports`
- **Headers:** `Content-Type: application/json`
- **Request Body mẫu:**
  ```json
  {
    "employeeName": "Nguyễn Văn A",
    "department": "Kỹ thuật",
    "tasksCompleted": [
      "Fix lỗi render biểu đồ",
      "Viết tài liệu API"
    ],
    "tasksInProgress": [
      "Tích hợp thông báo qua email"
    ],
    "blockers": "Chưa có",
    "hoursWorked": 8,
    "completionRate": 90
  }
  ```

### 2. Lấy danh sách tất cả báo cáo
- **Endpoint:** `GET /api/reports`

### 3. Xem chi tiết báo cáo và nhận xét của Admin
- **Endpoint:** `GET /api/reports/:id`
- **Dành cho nhân viên:** Nhân viên gọi endpoint này bằng `id` báo cáo của mình để đọc mảng `feedbacks` nhận xét từ Admin.

### 4. Admin gửi nhận xét cho báo cáo
- **Endpoint:** `POST /api/reports/:id/feedback`
- **Request Body mẫu:**
  ```json
  {
    "adminName": "Trưởng phòng Kỹ thuật",
    "comment": "Làm rất tốt, cần chú ý kiểm tra thêm responsive trên mobile."
  }
  ```
