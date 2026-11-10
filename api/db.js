import fs from 'fs';
import path from 'path';
import { MongoClient } from 'mongodb';

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

// ----------------- ONLINE PERSISTENT JSON STORAGE (Lưu file JSON trực tuyến vĩnh viễn) -----------------
const DEFAULT_JSON_STORAGE_URL = 'https://superjsonblob.com/api/jsonBlob/3c9213d8-0cde-4f54-956c-bf3c5a1f0fc7';

const getJsonStorageUrl = () => {
  return process.env.JSON_STORAGE_URL || DEFAULT_JSON_STORAGE_URL;
};

// ----------------- MONGODB CONNECTION CACHING (Dành cho Vercel Serverless) -----------------
let cachedClient = null;
let cachedDb = null;

const getMongoUri = () => {
  return process.env.MONGODB_URI || process.env.MONGO_URL || process.env.DATABASE_URL;
};

async function connectToMongo() {
  const uri = getMongoUri();
  if (!uri) return null;

  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    await client.connect();
    const dbName = process.env.MONGODB_DB || 'workreport';
    const db = client.db(dbName);
    cachedClient = client;
    cachedDb = db;
    return { client, db };
  } catch (err) {
    console.error('[DB] Lỗi kết nối MongoDB:', err.message);
    return null;
  }
}

// ----------------- VERCEL KV / UPSTASH CONFIG -----------------
const getKvConfig = () => {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    return { url: url.replace(/\/$/, ''), token };
  }
  return null;
};

// Đường dẫn file lưu trữ cục bộ / fallback
const getFilePath = () => {
  if (process.env.VERCEL) {
    return '/tmp/reports_db.json';
  }
  return path.resolve(process.cwd(), 'reports_db.json');
};

/**
 * Đọc toàn bộ danh sách báo cáo từ Database (MongoDB -> Persistent JSON Storage -> Vercel KV -> File fallback)
 */
export async function getReports() {
  // 1. Ưu tiên MongoDB nếu có cấu hình MONGODB_URI
  const mongoConn = await connectToMongo();
  if (mongoConn) {
    try {
      const collection = mongoConn.db.collection('reports');
      const docs = await collection.find({}).sort({ createdAt: -1 }).toArray();
      if (docs && docs.length > 0) {
        return docs.map(({ _id, ...rest }) => rest);
      }
    } catch (err) {
      console.error('[DB] Lỗi đọc từ MongoDB:', err.message);
    }
  }

  // 2. Đọc từ Online Persistent JSON Storage (Lưu file JSON trực tuyến vĩnh viễn)
  const jsonUrl = getJsonStorageUrl();
  if (jsonUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);
      const resp = await fetch(jsonUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'mail247-portal/1.0'
        }
      });
      clearTimeout(timeoutId);

      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data) && data.length > 0) {
          // Ghi đồng bộ bản sao vào file fallback
          try {
            const filePath = getFilePath();
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
          } catch {}
          return data;
        }
      }
    } catch (err) {
      console.warn('[DB] Lỗi đọc từ Online JSON Storage, fallback sang file:', err.message);
    }
  }

  // 3. Nếu có cấu hình Vercel KV / Upstash
  const kv = getKvConfig();
  if (kv) {
    try {
      const resp = await fetch(`${kv.url}/get/work_reports_data`, {
        headers: { Authorization: `Bearer ${kv.token}` }
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
    } catch (err) {
      console.error('[DB] Lỗi đọc từ Vercel KV:', err.message);
    }
  }

  // 4. Fallback: Đọc từ file JSON (file repo gốc hoặc /tmp)
  try {
    const rootPath = path.resolve(process.cwd(), 'reports_db.json');
    if (fs.existsSync(rootPath)) {
      const content = fs.readFileSync(rootPath, 'utf-8');
      const data = JSON.parse(content);
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }

    const tmpPath = '/tmp/reports_db.json';
    if (fs.existsSync(tmpPath)) {
      const content = fs.readFileSync(tmpPath, 'utf-8');
      const data = JSON.parse(content);
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }

    return SEED_REPORTS;
  } catch (err) {
    console.error('[DB] Lỗi đọc từ file fallback:', err.message);
    return SEED_REPORTS;
  }
}

/**
 * Lưu toàn bộ danh sách báo cáo vào Database (MongoDB -> Persistent JSON Storage -> Vercel KV -> File fallback)
 */
export async function saveReports(reports) {
  // 1. Lưu vào MongoDB nếu có
  const mongoConn = await connectToMongo();
  if (mongoConn) {
    try {
      const collection = mongoConn.db.collection('reports');
      if (Array.isArray(reports) && reports.length > 0) {
        const operations = reports.map(report => ({
          updateOne: {
            filter: { id: report.id },
            update: { $set: report },
            upsert: true
          }
        }));
        await collection.bulkWrite(operations);
      }
    } catch (err) {
      console.error('[DB] Lỗi ghi MongoDB:', err.message);
    }
  }

  // 2. Lưu vào Online Persistent JSON Storage (Lưu file JSON trực tuyến)
  const jsonUrl = getJsonStorageUrl();
  if (jsonUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);
      await fetch(jsonUrl, {
        method: 'PUT',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'mail247-portal/1.0'
        },
        body: JSON.stringify(reports)
      });
      clearTimeout(timeoutId);
    } catch (err) {
      console.warn('[DB] Lỗi ghi Online JSON Storage:', err.message);
    }
  }

  // 3. Đồng bộ Vercel KV nếu có
  const kv = getKvConfig();
  if (kv) {
    try {
      await fetch(`${kv.url}/set/work_reports_data`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kv.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reports)
      });
    } catch (err) {
      console.error('[DB] Lỗi ghi Vercel KV:', err.message);
    }
  }

  // 4. Luôn đồng bộ file fallback cục bộ
  try {
    const rootPath = path.resolve(process.cwd(), 'reports_db.json');
    try {
      fs.writeFileSync(rootPath, JSON.stringify(reports, null, 2), 'utf-8');
    } catch {}

    if (process.env.VERCEL) {
      fs.writeFileSync('/tmp/reports_db.json', JSON.stringify(reports, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('[DB] Lỗi ghi file fallback:', err.message);
  }

  return reports;
}
