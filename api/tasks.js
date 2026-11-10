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

    // GET /api/tasks?employee=... &department=... &status=...
    if (req.method === 'GET') {
      const { employee, name, department, status, limit } = req.query || {};

      let filtered = [...reports];

      // Lọc theo tên nhân viên (so khớp gần đúng hoặc chính xác)
      const empSearch = (employee || name)?.trim().toLowerCase();
      if (empSearch) {
        filtered = filtered.filter(r => 
          r.employeeName && r.employeeName.toLowerCase().includes(empSearch)
        );
      }

      // Lọc theo phòng ban nếu có
      if (department) {
        const deptSearch = department.trim().toLowerCase();
        filtered = filtered.filter(r => 
          r.department && r.department.toLowerCase() === deptSearch
        );
      }

      // Lọc theo trạng thái (IN_PROGRESS, COMPLETED, BLOCKED)
      if (status) {
        const statusSearch = status.trim().toUpperCase();
        filtered = filtered.filter(r => 
          (r.status || 'IN_PROGRESS').toUpperCase() === statusSearch
        );
      }

      // Format dữ liệu gọn gàng chuyên biệt cho dạng "Nhiệm vụ được giao"
      const tasks = filtered.map(r => ({
        taskId: r.id,
        employeeName: r.employeeName,
        department: r.department,
        title: r.title,
        status: r.status || 'IN_PROGRESS',
        completionRate: r.completionRate || 0,
        hoursWorked: r.hoursWorked || 0,
        // Danh sách công việc đang cần làm
        tasksInProgress: r.tasksInProgress || [],
        tasksCompleted: r.tasksCompleted || [],
        blockers: r.blockers || 'Không có',
        planTomorrow: r.planTomorrow || '',
        createdAt: r.createdAt,
        // Lấy các chỉ đạo, ghi chú của Quản lý / Admin
        adminInstructions: (r.feedbacks || []).map(fb => ({
          id: fb.id,
          adminName: fb.adminName,
          instruction: fb.comment,
          assignedAt: fb.createdAt
        }))
      }));

      const maxLimit = parseInt(limit, 10);
      const results = !isNaN(maxLimit) && maxLimit > 0 ? tasks.slice(0, maxLimit) : tasks;

      return res.status(200).json({
        success: true,
        count: results.length,
        filter: {
          employee: employee || name || null,
          department: department || null,
          status: status || null
        },
        tasks: results
      });
    }

    // POST /api/tasks - Cập nhật tiến độ hoàn thành công việc của nhân viên
    if (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT') {
      const { id } = req.query || {};
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const targetId = id || body.taskId || body.id;

      if (!targetId) {
        return res.status(400).json({ 
          error: "Thiếu mã công việc (truyền ?id=REP-xxx hoặc body { taskId: 'REP-xxx' })" 
        });
      }

      const targetReport = reports.find(r => r.id === targetId);
      if (!targetReport) {
        return res.status(404).json({ error: `Không tìm thấy công việc với mã ${targetId}` });
      }

      // Cập nhật các trường thông tin tiến độ
      if (body.status) targetReport.status = body.status;
      if (body.completionRate !== undefined) targetReport.completionRate = Number(body.completionRate);
      if (body.hoursWorked !== undefined) targetReport.hoursWorked = Number(body.hoursWorked);
      if (body.blockers !== undefined) targetReport.blockers = body.blockers;
      if (body.planTomorrow !== undefined) targetReport.planTomorrow = body.planTomorrow;

      // Cập nhật hoặc bổ sung đầu việc hoàn thành / đang làm
      if (Array.isArray(body.tasksCompleted)) {
        targetReport.tasksCompleted = body.tasksCompleted;
      } else if (body.taskCompleted) {
        targetReport.tasksCompleted = targetReport.tasksCompleted || [];
        targetReport.tasksCompleted.push(body.taskCompleted);
      }

      if (Array.isArray(body.tasksInProgress)) {
        targetReport.tasksInProgress = body.tasksInProgress;
      }

      // Thêm phản hồi hoặc ghi chú cập nhật từ nhân viên
      if (body.employeeNote) {
        targetReport.feedbacks = targetReport.feedbacks || [];
        targetReport.feedbacks.push({
          id: `note-${Date.now()}`,
          adminName: body.employeeName || targetReport.employeeName || "Nhân viên cập nhật",
          comment: `[Cập nhật tiến độ]: ${body.employeeNote}`,
          createdAt: new Date().toISOString()
        });
      }

      targetReport.updatedAt = new Date().toISOString();
      await saveReports(reports);

      return res.status(200).json({
        success: true,
        message: "Cập nhật tiến độ công việc thành công",
        taskId: targetReport.id,
        task: targetReport
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error('[API /api/tasks Error]:', error);
    return res.status(500).json({ error: "Lỗi máy chủ nội bộ", details: error.message });
  }
}
