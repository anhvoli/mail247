import fs from 'fs';
import path from 'path';

// Dữ liệu ban đầu chuẩn chung cho cả API và Dashboard
export const SEED_REPORTS = [
  {
    id: "REP-2026-001",
    employeeName: "Nguyễn Văn An",
    department: "Kỹ thuật / Backend",
    title: "Tối ưu hóa API và tích hợp caching Redis",
    tasksCompleted: [
      "Refactor module tổng hợp báo cáo công việc",
      "Sửa lỗi phân trang và lọc theo phòng ban",
      "Thêm middleware xử lý lỗi tập trung"
    ],
    tasksInProgress: [
      "Viết unit test cho endpoint nộp báo cáo (đạt 70%)"
    ],
    blockers: "Không có",
    planTomorrow: "Hoàn thiện unit test và review code cùng team lead",
    hoursWorked: 8,
    completionRate: 95,
    status: "COMPLETED",
    createdAt: "2026-11-09T08:30:00.000Z",
    feedbacks: [
      {
        id: "fb-1",
        adminName: "Trần Trưởng Phòng",
        comment: "Làm rất tốt em nhé, tốc độ xử lý API cải thiện rõ rệt!",
        createdAt: "2026-11-09T10:15:00.000Z"
      }
    ]
  },
  {
    id: "REP-2026-002",
    employeeName: "Trần Thị Mai",
    department: "Thiết kế UI/UX",
    title: "Hoàn thiện wireframe và UI Dashboard",
    tasksCompleted: [
      "Thiết kế xong bộ UI Dashboard phong cách hiện đại",
      "Thống nhất mã màu và icon system trên Figma"
    ],
    tasksInProgress: [
      "Chỉnh sửa phiên bản responsive mobile"
    ],
    blockers: "Chờ duyệt bảng màu từ ban giám đốc",
    planTomorrow: "Xuất file assets và bàn giao thông số cho đội Frontend",
    hoursWorked: 7.5,
    completionRate: 85,
    status: "IN_PROGRESS",
    createdAt: "2026-11-09T09:00:00.000Z",
    feedbacks: [
      {
        id: "fb-2",
        adminName: "Nguyễn Giám Đốc",
        comment: "Giao diện nhìn chuyên nghiệp và thoáng đãng. Bảng màu đã duyệt nhé!",
        createdAt: "2026-11-09T11:00:00.000Z"
      }
    ]
  },
  {
    id: "REP-2026-003",
    employeeName: "Lê Hoàng Dũng",
    department: "Kinh doanh & Dự án",
    title: "Gặp gỡ khách hàng doanh nghiệp và demo giải pháp",
    tasksCompleted: [
      "Demo giải pháp quản lý cho 3 đối tác khu vực miền Bắc",
      "Gửi email báo giá và kế hoạch triển khai"
    ],
    tasksInProgress: [
      "Soạn thảo hợp đồng nguyên tắc đối tác Alpha"
    ],
    blockers: "Không có",
    planTomorrow: "Họp chốt điều khoản thanh toán với khách hàng Alpha",
    hoursWorked: 8.5,
    completionRate: 90,
    status: "COMPLETED",
    createdAt: "2026-11-09T09:45:00.000Z",
    feedbacks: [
      {
        id: "fb-3",
        adminName: "Trần Trưởng Phòng",
        comment: "Tiến độ rất khả quan, cố gắng chốt deal sớm trong tuần này.",
        createdAt: "2026-11-09T13:20:00.000Z"
      }
    ]
  },
  {
    id: "REP-2026-004",
    employeeName: "Phạm Quốc Bảo",
    department: "Kỹ thuật / Frontend",
    title: "Tích hợp biểu đồ Chart.js và tính năng tương tác",
    tasksCompleted: [
      "Dựng biểu đồ hiệu suất nhân viên và phân bổ trạng thái",
      "Gắn tính năng quản trị viên phản hồi trực tiếp"
    ],
    tasksInProgress: [
      "Kiểm thử tính tương thích trên các trình duyệt Safari & Edge"
    ],
    blockers: "Cần thêm dữ liệu mẫu để kiểm tra đồ thị",
    planTomorrow: "Thêm bộ lọc tìm kiếm nâng cao theo thời gian",
    hoursWorked: 8,
    completionRate: 90,
    status: "COMPLETED",
    createdAt: "2026-11-09T10:30:00.000Z",
    feedbacks: []
  },
  {
    id: "REP-2026-005",
    employeeName: "Hoàng Minh Tuấn",
    department: "Vận hành & Hỗ trợ",
    title: "Kiểm tra hệ thống máy chủ và bảo trì định kỳ",
    tasksCompleted: [
      "Kiểm tra dung lượng ổ đĩa và RAM hệ thống",
      "Sao lưu định kỳ cơ sở dữ liệu và cấu hình"
    ],
    tasksInProgress: [
      "Cấu hình cảnh báo tự động qua webhook"
    ],
    blockers: "Đang chờ cấp quyền truy cập server phụ trợ",
    planTomorrow: "Hoàn thiện kịch bản giám sát uptime 24/7",
    hoursWorked: 6.5,
    completionRate: 75,
    status: "BLOCKED",
    createdAt: "2026-11-09T11:15:00.000Z",
    feedbacks: [
      {
        id: "fb-4",
        adminName: "Quản trị viên IT",
        comment: "Đã cấp quyền truy cập server phụ trợ lúc 14:00 rồi nhé Tuấn.",
        createdAt: "2026-11-09T14:05:00.000Z"
      }
    ]
  }
];

// Đường dẫn file lưu trữ cục bộ/fallback
const getFilePath = () => {
  if (process.env.VERCEL) {
    return '/tmp/reports_db.json';
  }
  return path.resolve(process.cwd(), 'reports_db.json');
};

// Cấu hình Vercel KV / Upstash Redis
const getKvConfig = () => {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    return { url: url.replace(/\/$/, ''), token };
  }
  return null;
};

/**
 * Đọc toàn bộ danh sách báo cáo từ Database (Vercel KV hoặc File fallback)
 */
export async function getReports() {
  const kv = getKvConfig();

  // 1. Nếu có cấu hình Vercel KV / Upstash
  if (kv) {
    try {
      const resp = await fetch(`${kv.url}/get/work_reports_data`, {
        headers: {
          Authorization: `Bearer ${kv.token}`
        }
      });
      if (resp.ok) {
        const json = await resp.json();
        if (json.result) {
          const parsed = typeof json.result === 'string' ? JSON.parse(json.result) : json.result;
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      }
      // Chưa có dữ liệu trên KV -> ghi seed data
      await saveReports(SEED_REPORTS);
      return SEED_REPORTS;
    } catch (err) {
      console.error('[DB] Lỗi đọc từ Vercel KV, fallback sang file:', err);
    }
  }

  // 2. Fallback: Đọc từ file JSON persistent
  try {
    const filePath = getFilePath();
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      if (Array.isArray(data)) {
        return data;
      }
    }
    // Tạo file mới với dữ liệu mẫu ban đầu
    fs.writeFileSync(filePath, JSON.stringify(SEED_REPORTS, null, 2), 'utf-8');
    return SEED_REPORTS;
  } catch (err) {
    console.error('[DB] Lỗi đọc từ file fallback:', err);
    return SEED_REPORTS;
  }
}

/**
 * Lưu toàn bộ danh sách báo cáo vào Database (Vercel KV hoặc File fallback)
 */
export async function saveReports(reports) {
  const kv = getKvConfig();

  // 1. Nếu có cấu hình Vercel KV / Upstash
  if (kv) {
    try {
      const resp = await fetch(`${kv.url}/set/work_reports_data`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kv.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reports)
      });
      if (!resp.ok) {
        console.error('[DB] Ghi Vercel KV không thành công:', await resp.text());
      }
    } catch (err) {
      console.error('[DB] Lỗi ghi Vercel KV:', err);
    }
  }

  // 2. Luôn đồng bộ vào file fallback để dự phòng
  try {
    const filePath = getFilePath();
    fs.writeFileSync(filePath, JSON.stringify(reports, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Lỗi ghi file fallback:', err);
  }

  return reports;
}
