let reportsMemory = [
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
  }
];

export default function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    const { id } = req.query;
    if (id) {
      const found = reportsMemory.find(r => r.id === id);
      if (found) {
        return res.status(200).json(found);
      }
      return res.status(404).json({ error: "Không tìm thấy báo cáo với ID: " + id });
    }
    return res.status(200).json(reportsMemory);
  }

  if (req.method === 'POST') {
    const { id, feedback } = req.query;

    // POST /api/reports?id=...&feedback=true
    if (id && feedback) {
      const found = reportsMemory.find(r => r.id === id);
      if (!found) {
        return res.status(404).json({ error: "Không tìm thấy báo cáo để nhận xét" });
      }
      const newFeedback = {
        id: `fb-${Date.now()}`,
        adminName: req.body.adminName || "Quản trị viên",
        comment: req.body.comment || "",
        createdAt: new Date().toISOString()
      };
      found.feedbacks = found.feedbacks || [];
      found.feedbacks.push(newFeedback);
      return res.status(201).json({ success: true, message: "Đã thêm nhận xét", feedback: newFeedback });
    }

    // Normal POST new report
    const body = req.body || {};
    const newReport = {
      id: `REP-${Date.now().toString().slice(-4)}`,
      employeeName: body.employeeName || "Nhân viên mới",
      department: body.department || "Kỹ thuật",
      title: body.title || "Báo cáo công việc",
      tasksCompleted: body.tasksCompleted || [],
      tasksInProgress: body.tasksInProgress || [],
      blockers: body.blockers || "Không có",
      planTomorrow: body.planTomorrow || "",
      hoursWorked: parseFloat(body.hoursWorked) || 8,
      completionRate: parseInt(body.completionRate, 10) || 100,
      status: body.status || "COMPLETED",
      createdAt: new Date().toISOString(),
      feedbacks: []
    };

    reportsMemory.unshift(newReport);
    return res.status(201).json({ success: true, message: "Gửi báo cáo thành công", report: newReport });
  }

  res.status(405).json({ error: "Method not allowed" });
}
