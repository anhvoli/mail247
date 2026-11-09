# 📖 TÀI LIỆU KỸ THUẬT API — HỆ THỐNG BÁO CÁO CÔNG VIỆC (WORKREPORT API)
*(Phiên bản: **Không cần API Key**, Hỗ trợ **Admin nhận xét sau mỗi báo cáo**, **Nhân viên đọc nhận xét**, Không cần Database)*

Hệ thống cho phép:
1. **Nhân viên:** Nộp báo cáo công việc và **đọc nhận xét / phản hồi của Admin** (qua API hoặc giao diện Web).
2. **Quản trị viên (Admin):** Theo dõi danh sách báo cáo trên Dashboard và **gửi nhận xét/chỉ đạo trực tiếp sau mỗi báo cáo**.

---

## 🌐 1. Thông Tin Chung (General Information)

* **Base URL:** `http://localhost:3000`
* **Định dạng dữ liệu:** `application/json`
* **Mã hóa ký tự:** `UTF-8`
* **Xác thực:** **Không cần (No API Key required)**

---

## 🚀 2. Chi Tiết Các Endpoints

### 2.1. Nộp Báo Cáo Công Việc (Submit Daily Report)

* **Phương thức:** `POST`
* **Đường dẫn:** `/api/reports`
* **Headers:** `Content-Type: application/json`

#### Bảng tham số Body (JSON Payload):

| Trường | Kiểu dữ liệu | Bắt buộc? | Mặc định | Mô tả |
| :--- | :---: | :---: | :---: | :--- |
| `employee_name` | `String` | **Có** | `"Nhân viên"` | Họ và tên nhân viên (VD: `"Nguyễn Văn An"`). |
| `department` | `String` | Không | `"Chung"` | Phòng ban / Bộ phận (VD: `"Kỹ thuật"`, `"Kinh doanh"`). |
| `title` | `String` | Không | `"Báo cáo công việc"` | Tiêu đề báo cáo hoặc mục tiêu chính trong ngày. |
| `tasks_done` | `String` | **Có** | `""` | Chi tiết công việc đã làm xong trong ngày. |
| `tasks_in_progress` | `String` | Không | `""` | Các công việc đang thực hiện dở dang. |
| `blockers` | `String` | Không | `"Không có"` | Khó khăn / vướng mắc cần sếp hỗ trợ. |
| `plan_tomorrow` | `String` | Không | `""` | Kế hoạch ngày mai. |
| `hours_spent` | `Number` | Không | `8` | Số giờ làm việc ghi nhận (VD: `8`, `7.5`). |
| `status` | `String` | Không | `"COMPLETED"` | Trạng thái: `COMPLETED`, `IN_PROGRESS`, hoặc `BLOCKED`. |

#### Ví dụ Request:
```bash
curl -X POST http://localhost:3000/api/reports \
  -H "Content-Type: application/json" \
  -d '{
    "employee_name": "Nguyễn Văn An",
    "department": "Kỹ thuật",
    "title": "Báo cáo ngày 09/11",
    "tasks_done": "Hoàn tất kiểm thử API",
    "hours_spent": 8,
    "status": "COMPLETED"
  }'
```

---

### 2.2. Admin Nhận Xét Báo Cáo (Admin Submit Feedback)

Cho phép Admin gửi lời khen ngợi, nhận xét, chỉ đạo hoặc hướng dẫn xử lý khó khăn trực tiếp cho một báo cáo cụ thể theo `id`.

* **Phương thức:** `POST`
* **Đường dẫn:** `/api/reports/:id/feedback` *(VD: `/api/reports/rep-001/feedback`)*
* **Headers:** `Content-Type: application/json`
* **Body:**
  ```json
  {
    "feedback": "Báo cáo rất chi tiết, làm tốt lắm em! Tiếp tục phát huy nhé.",
    "feedback_by": "Trưởng phòng Kỹ thuật"
  }
  ```

---

### 2.3. Nhân Viên Đọc Nhận Xét Của Báo Cáo (Get Feedback by Report ID)

Nhân viên sử dụng `id` của báo cáo (nhận được khi nộp thành công) để tra cứu xem Admin đã nhận xét hay chưa.

* **Phương thức:** `GET`
* **Đường dẫn:** `/api/reports/:id` *(VD: `/api/reports/rep-001`)*
* **Headers:** Không yêu cầu

#### Phản hồi thành công (HTTP 200 OK):
```json
{
  "success": true,
  "has_feedback": true,
  "report": {
    "id": "rep-001",
    "employee_name": "Nguyễn Văn An",
    "department": "Kỹ thuật / Backend",
    "title": "Tối ưu hóa API và tích hợp caching",
    "tasks_done": "Xong việc refactor module báo cáo",
    "status": "COMPLETED",
    "feedback": "Báo cáo rất chi tiết, anh đồng ý giải pháp này nhé!",
    "feedback_by": "Admin / Giám Đốc Kỹ Thuật",
    "feedback_at": "2026-11-09T13:56:21.505Z",
    "created_at": "2026-11-09T11:33:19.469Z"
  }
}
```

> 💡 *Nhân viên kiểm tra trường `has_feedback: true` và lấy nội dung tại `report.feedback`.*

---

### 2.4. Nhân Viên Xem Tất Cả Báo Cáo Của Mình (Filter by Employee Name)

Nhân viên có thể lọc toàn bộ danh sách các báo cáo kèm nhận xét của riêng mình bằng cách truyền query parameter `?employee_name=...`:

* **Phương thức:** `GET`
* **Đường dẫn:** `/api/reports?employee_name=Nguyễn Văn An`

#### Phản hồi (HTTP 200 OK):
Mảng chứa danh sách các báo cáo của riêng nhân viên đó, kèm đầy đủ nhận xét từ Admin.

---

## 💻 3. Code Mẫu Cho Nhân Viên Đọc Nhận Xét

### 3.1. Bằng cURL:
```bash
# Xem nhận xét của 1 báo cáo cụ thể theo ID:
curl -X GET http://localhost:3000/api/reports/rep-001

# Hoặc xem toàn bộ báo cáo & nhận xét của bản thân:
curl -X GET "http://localhost:3000/api/reports?employee_name=Nguy%E1%BB%85n%20V%C4%83n%20An"
```

### 3.2. Bằng Python:
```python
import requests

report_id = "rep-001"
res = requests.get(f"http://localhost:3000/api/reports/{report_id}").json()

if res.get("has_feedback"):
    rep = res["report"]
    print(f"💬 Nhận xét từ {rep['feedback_by']}:")
    print(f"👉 {rep['feedback']}")
else:
    print("⏳ Admin chưa gửi nhận xét cho báo cáo này.")
```

### 3.3. Bằng JavaScript:
```javascript
async function checkFeedback(reportId) {
  const res = await fetch(`http://localhost:3000/api/reports/${reportId}`);
  const data = await res.json();
  if (data.has_feedback) {
    console.log(`Nhận xét từ ${data.report.feedback_by}: ${data.report.feedback}`);
  } else {
    console.log("Chưa có nhận xét.");
  }
}
checkFeedback('rep-001');
```

---

## 🖥️ 4. Xem Nhận Xét Trực Tiếp Trên Trình Duyệt Web

Nhân viên cũng có thể mở trực tiếp:
1. **Admin Dashboard:** [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
   * Nhập tên mình vào ô tìm kiếm `🔍 Tìm kiếm nhân viên...`.
   * Cột **"Nhận xét của Admin"** sẽ hiển thị ngay hộp thoại màu tím chứa nhận xét của sếp.
2. **Trang Tài Liệu API Tương Tác:** [http://localhost:3000/documents](http://localhost:3000/documents)
