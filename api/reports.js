import { getReports, saveReports } from './db.js';

export default async function handler(req, res) {
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

  try {
    const reports = await getReports();

    // 1. GET Request
    if (req.method === 'GET') {
      const { id } = req.query || {};
      if (id) {
        const found = reports.find(r => r.id === id);
        if (found) {
          return res.status(200).json(found);
        }
        return res.status(404).json({ error: `Không tìm thấy báo cáo với ID: ${id}` });
      }
      return res.status(200).json(reports);
    }

    // 2. POST Request
    if (req.method === 'POST') {
      const { id, feedback } = req.query || {};

      // Xử lý gửi feedback: POST /api/reports?id=REP-xxx&feedback=true
      if (id && (feedback === 'true' || feedback === true)) {
        const found = reports.find(r => r.id === id);
        if (!found) {
          return res.status(404).json({ error: `Không tìm thấy báo cáo ${id} để nhận xét` });
        }

        const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
        const newFeedback = {
          id: `fb-${Date.now()}`,
          adminName: body.adminName?.trim() || "Quản trị viên",
          comment: body.comment?.trim() || "",
          createdAt: new Date().toISOString()
        };

        if (!newFeedback.comment) {
          return res.status(400).json({ error: "Nội dung nhận xét không được để trống" });
        }

        found.feedbacks = found.feedbacks || [];
        found.feedbacks.push(newFeedback);

        await saveReports(reports);
        return res.status(201).json({
          success: true,
          message: "Đã thêm nhận xét cho báo cáo thành công",
          reportId: id,
          feedback: newFeedback
        });
      }

      // Xử lý gửi báo cáo mới: POST /api/reports
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      
      const newReport = {
        id: body.id || `REP-${Date.now().toString().slice(-4)}`,
        employeeName: body.employeeName?.trim() || "Nhân viên mới",
        department: body.department || "Kỹ thuật",
        title: body.title?.trim() || "Báo cáo công việc",
        tasksCompleted: Array.isArray(body.tasksCompleted) ? body.tasksCompleted : (body.tasksCompleted ? [body.tasksCompleted] : []),
        tasksInProgress: Array.isArray(body.tasksInProgress) ? body.tasksInProgress : (body.tasksInProgress ? [body.tasksInProgress] : []),
        blockers: body.blockers?.trim() || "Không có",
        planTomorrow: body.planTomorrow?.trim() || "",
        hoursWorked: Number(body.hoursWorked) || 8,
        completionRate: Number(body.completionRate) || 100,
        status: body.status || "COMPLETED",
        createdAt: new Date().toISOString(),
        feedbacks: []
      };

      // Đưa báo cáo mới lên đầu danh sách và lưu vào Database
      reports.unshift(newReport);
      await saveReports(reports);

      return res.status(201).json({
        success: true,
        message: "Nộp báo cáo thành công",
        reportId: newReport.id,
        createdAt: newReport.createdAt,
        report: newReport
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error('[API /api/reports Error]:', error);
    return res.status(500).json({ error: "Lỗi máy chủ nội bộ", details: error.message });
  }
}
