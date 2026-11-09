const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'reports.json');

// Khởi tạo file dữ liệu mẫu nếu chưa có
if (!fs.existsSync(DATA_FILE)) {
  const initialReports = [
    {
      id: "rep-001",
      employee_name: "Nguyễn Văn An",
      department: "Kỹ thuật / Backend",
      title: "Tối ưu hóa API và tích hợp caching",
      tasks_done: "Xong việc refactor module báo cáo, fix bug phân trang",
      tasks_in_progress: "Đang viết unit test cho endpoint nộp báo cáo (70%)",
      blockers: "Không có",
      plan_tomorrow: "Viết tài liệu API Swagger và review code cùng team",
      hours_spent: 8,
      status: "COMPLETED",
      feedback: "Làm tốt lắm em, tiếp tục đẩy nhanh tiến độ unit test nhé!",
      feedback_by: "Admin / Giám Đốc",
      feedback_at: new Date(Date.now() - 3600000 * 1).toISOString(),
      created_at: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: "rep-002",
      employee_name: "Trần Thị Mai",
      department: "Thiết kế UI/UX",
      title: "Hoàn thiện wireframe Dashboard",
      tasks_done: "Thiết kế xong giao diện bảng điều khiển quản trị",
      tasks_in_progress: "Chỉnh sửa bản mobile responsive",
      blockers: "Chờ duyệt bảng màu từ trưởng phòng",
      plan_tomorrow: "Xuất file Figma component cho đội frontend",
      hours_spent: 7.5,
      status: "IN_PROGRESS",
      feedback: "Bảng màu anh đã approve qua mail rồi, em triển khai tiếp nhé.",
      feedback_by: "Admin",
      feedback_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      created_at: new Date(Date.now() - 3600000 * 5).toISOString()
    }
  ];
  fs.writeFileSync(DATA_FILE, JSON.stringify(initialReports, null, 2), 'utf-8');
}

function getReports() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    return [];
  }
}

function saveReports(reports) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(reports, null, 2), 'utf-8');
}

// HTML Dashboard Quản trị viên
function getDashboardHtml() {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Dashboard - Giám Sát, Nhận Xét & Biểu Đồ Hiệu Suất</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    :root {
      --bg: #0f172a;
      --card: #1e293b;
      --card-border: #334155;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #3b82f6;
      --primary-hover: #2563eb;
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
      --purple: #a855f7;
      --radius: 10px;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
    body { background-color: var(--bg); color: var(--text); padding: 24px; min-height: 100vh; }
    .container { max-width: 1360px; margin: 0 auto; }
    
    header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .title-group h1 { font-size: 24px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 10px; }
    .title-group p { font-size: 14px; color: var(--text-muted); margin-top: 4px; }
    
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: var(--card); border: 1px solid var(--card-border); border-radius: var(--radius); padding: 18px 20px; }
    .stat-label { font-size: 13px; color: var(--text-muted); font-weight: 500; }
    .stat-value { font-size: 28px; font-weight: 700; margin-top: 6px; color: #fff; }

    /* Performance Charts Section */
    .charts-section { margin-bottom: 28px; }
    .section-header { font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
    .charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 18px; }
    .chart-card { background: var(--card); border: 1px solid var(--card-border); border-radius: var(--radius); padding: 18px 20px; }
    .chart-card-title { font-size: 14px; font-weight: 600; color: var(--text-muted); margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
    .chart-container { position: relative; height: 240px; width: 100%; }

    .action-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
    .search-input { background: var(--card); border: 1px solid var(--card-border); color: #fff; padding: 10px 16px; border-radius: 8px; width: 340px; outline: none; }
    .btn { background: var(--primary); color: #fff; border: none; padding: 10px 18px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; text-decoration: none; }
    .btn:hover { background: var(--primary-hover); }
    .btn-secondary { background: #334155; }
    .btn-secondary:hover { background: #475569; }
    .btn-comment { background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.4); padding: 6px 12px; font-size: 12px; border-radius: 6px; cursor: pointer; }
    .btn-comment:hover { background: rgba(168, 85, 247, 0.35); color: #fff; }

    .table-container { background: var(--card); border: 1px solid var(--card-border); border-radius: var(--radius); overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { padding: 14px 18px; font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--text-muted); border-bottom: 1px solid var(--card-border); background: rgba(0,0,0,0.15); white-space: nowrap; }
    td { padding: 16px 18px; font-size: 13.5px; border-bottom: 1px solid var(--card-border); vertical-align: top; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: rgba(255,255,255,0.02); }

    .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .badge-success { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .badge-warning { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
    .badge-danger { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }

    .feedback-box { background: rgba(168, 85, 247, 0.1); border-left: 3px solid var(--purple); padding: 8px 12px; border-radius: 4px; margin-top: 8px; font-size: 12.5px; }
    .feedback-author { font-weight: 600; color: #c084fc; font-size: 11px; margin-bottom: 3px; display: flex; justify-content: space-between; }
    .feedback-text { color: #f3e8ff; line-height: 1.4; }

    .modal { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); align-items: center; justify-content: center; z-index: 100; padding: 20px; }
    .modal.active { display: flex; }
    .modal-content { background: var(--card); border: 1px solid var(--card-border); border-radius: var(--radius); max-width: 650px; width: 100%; padding: 24px; position: relative; max-height: 90vh; overflow-y: auto; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; border-bottom: 1px solid var(--card-border); padding-bottom: 12px; }
    .modal-close { background: none; border: none; color: var(--text-muted); font-size: 22px; cursor: pointer; }
    .form-group { margin-bottom: 14px; }
    .form-group label { display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; }
    .form-control { width: 100%; background: #0f172a; border: 1px solid var(--card-border); color: #fff; padding: 10px 14px; border-radius: 6px; font-size: 13px; }
    textarea.form-control { resize: vertical; min-height: 80px; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="title-group">
        <h1>📊 WorkReport Admin Dashboard</h1>
        <p>Hệ thống giám sát, phân tích hiệu suất & gửi nhận xét trực tiếp sau mỗi báo cáo công việc</p>
      </div>
      <div style="display: flex; gap: 8px;">
        <a href="/documents" class="btn btn-secondary" target="_blank">📑 Mở Trang /documents</a>
        <button class="btn" onclick="openSubmitModal()">➕ Giả Lập Nộp Báo Cáo</button>
      </div>
    </header>

    <!-- Top Summary Stat Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Tổng số báo cáo</div>
        <div class="stat-value" id="stat-total">0</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Báo cáo hoàn thành (Tỷ lệ)</div>
        <div class="stat-value" style="color: #34d399;" id="stat-completed">0</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Đã được Admin nhận xét</div>
        <div class="stat-value" style="color: #c084fc;" id="stat-feedback">0</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Tổng giờ làm việc ghi nhận</div>
        <div class="stat-value" style="color: #60a5fa;" id="stat-hours">0h</div>
      </div>
    </div>

    <!-- Performance Charts Section -->
    <div class="charts-section">
      <div class="section-header">
        <span>📈 Biểu Đồ Phân Tích Hiệu Suất Làm Việc (Performance Analytics)</span>
      </div>
      <div class="charts-grid">
        <!-- Chart 1: Hours by Employee -->
        <div class="chart-card">
          <div class="chart-card-title">
            <span>⏱️ Tổng giờ làm việc theo nhân viên</span>
            <span style="font-size: 11px; color: var(--primary);">Giờ công</span>
          </div>
          <div class="chart-container">
            <canvas id="hoursChart"></canvas>
          </div>
        </div>

        <!-- Chart 2: Status Breakdown Doughnut -->
        <div class="chart-card">
          <div class="chart-card-title">
            <span>🎯 Tỷ lệ trạng thái công việc</span>
            <span style="font-size: 11px; color: var(--success);">Tiến độ</span>
          </div>
          <div class="chart-container">
            <canvas id="statusChart"></canvas>
          </div>
        </div>

        <!-- Chart 3: Department Workload Bar -->
        <div class="chart-card">
          <div class="chart-card-title">
            <span>🏢 Phân bổ số giờ theo phòng ban</span>
            <span style="font-size: 11px; color: var(--purple);">Khối lượng</span>
          </div>
          <div class="chart-container">
            <canvas id="deptChart"></canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- Table Action Bar -->
    <div class="action-bar">
      <input type="text" class="search-input" id="search-input" placeholder="🔍 Tìm kiếm nhân viên, phòng ban, nội dung..." oninput="filterReports()">
      <button class="btn btn-secondary" onclick="loadReports()">🔄 Làm mới dữ liệu</button>
    </div>

    <!-- Reports Table -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Thời gian</th>
            <th>Nhân viên</th>
            <th>Phòng ban</th>
            <th>Nội dung công việc</th>
            <th>Khó khăn (Blockers)</th>
            <th>Số giờ</th>
            <th>Trạng thái</th>
            <th style="min-width: 240px;">Nhận xét của Admin</th>
          </tr>
        </thead>
        <tbody id="reports-table-body">
          <tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 30px;">Đang tải dữ liệu...</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Modal Admin Nhận Xét Báo Cáo -->
  <div class="modal" id="feedback-modal">
    <div class="modal-content">
      <div class="modal-header">
        <h2>💬 Nhận Xét Báo Cáo Công Việc</h2>
        <button class="modal-close" onclick="closeModal('feedback-modal')">&times;</button>
      </div>
      <div id="feedback-report-info" style="background: rgba(0,0,0,0.25); padding: 12px 14px; border-radius: 6px; margin-bottom: 16px; font-size: 13px;">
      </div>
      <form id="feedback-form" onsubmit="submitFeedback(event)">
        <input type="hidden" id="feedback-report-id">
        <div class="form-group">
          <label>Người nhận xét (Admin / Quản lý)</label>
          <input type="text" class="form-control" id="feedback-by" value="Admin / Trưởng phòng" required>
        </div>
        <div class="form-group">
          <label>Nội dung nhận xét / Chỉ đạo / Phản hồi</label>
          <textarea class="form-control" id="feedback-text" placeholder="Nhập lời khen ngợi, hướng giải quyết blockers hoặc giao thêm việc..." required style="min-height: 100px;"></textarea>
        </div>
        <div style="margin-top: 18px; text-align: right; display: flex; justify-content: flex-end; gap: 10px;">
          <button type="button" class="btn btn-secondary" onclick="closeModal('feedback-modal')">Hủy</button>
          <button type="submit" class="btn" style="background: var(--purple);">💾 Lưu Nhận Xét</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal Nộp Báo Cáo Demo -->
  <div class="modal" id="submit-modal">
    <div class="modal-content">
      <div class="modal-header">
        <h2>📝 Giả Lập Nộp Báo Cáo (Test Form)</h2>
        <button class="modal-close" onclick="closeModal('submit-modal')">&times;</button>
      </div>
      <form id="report-form" onsubmit="submitReport(event)">
        <div class="form-group" style="display: flex; gap: 12px;">
          <div style="flex: 1;">
            <label>Tên nhân viên</label>
            <input type="text" class="form-control" id="form-name" placeholder="VD: Nguyễn Văn An" required>
          </div>
          <div style="flex: 1;">
            <label>Phòng ban</label>
            <input type="text" class="form-control" id="form-dept" placeholder="VD: Kỹ thuật" value="Kỹ thuật">
          </div>
        </div>
        <div class="form-group">
          <label>Tiêu đề báo cáo / Mục tiêu chính</label>
          <input type="text" class="form-control" id="form-title" placeholder="VD: Báo cáo công việc ngày hôm nay" required>
        </div>
        <div class="form-group">
          <label>Công việc đã hoàn thành</label>
          <textarea class="form-control" id="form-done" placeholder="Ghi rõ các việc đã làm xong..." required></textarea>
        </div>
        <div class="form-group">
          <label>Công việc đang làm dở dang (nếu có)</label>
          <textarea class="form-control" id="form-in-progress" placeholder="Các task đang làm tiếp..."></textarea>
        </div>
        <div class="form-group">
          <label>Khó khăn / Vướng mắc cần hỗ trợ (Blockers)</label>
          <input type="text" class="form-control" id="form-blockers" placeholder="Không có hoặc cần hỗ trợ...">
        </div>
        <div class="form-group" style="display: flex; gap: 12px;">
          <div style="flex: 1;">
            <label>Số giờ làm (giờ)</label>
            <input type="number" step="0.5" class="form-control" id="form-hours" value="8" required>
          </div>
          <div style="flex: 1;">
            <label>Trạng thái</label>
            <select class="form-control" id="form-status">
              <option value="COMPLETED">Hoàn thành (COMPLETED)</option>
              <option value="IN_PROGRESS">Đang làm (IN_PROGRESS)</option>
              <option value="BLOCKED">Bị nghẽn (BLOCKED)</option>
            </select>
          </div>
        </div>
        <div style="margin-top: 18px; text-align: right; display: flex; justify-content: flex-end; gap: 10px;">
          <button type="button" class="btn btn-secondary" onclick="closeModal('submit-modal')">Hủy</button>
          <button type="submit" class="btn">Gửi Báo Cáo Ngay</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    let allReports = [];
    let hoursChartInstance = null;
    let statusChartInstance = null;
    let deptChartInstance = null;

    async function loadReports() {
      try {
        const res = await fetch('/api/reports');
        allReports = await res.json();
        renderTable(allReports);
        updateStats(allReports);
        renderCharts(allReports);
      } catch (err) {
        console.error('Lỗi tải báo cáo:', err);
      }
    }

    function renderTable(reports) {
      const tbody = document.getElementById('reports-table-body');
      if (!reports.length) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 30px;">Chưa có báo cáo nào.</td></tr>';
        return;
      }

      tbody.innerHTML = reports.map(r => {
        let badgeClass = 'badge-success';
        let statusText = 'Hoàn thành';
        if (r.status === 'IN_PROGRESS') { badgeClass = 'badge-warning'; statusText = 'Đang làm'; }
        if (r.status === 'BLOCKED') { badgeClass = 'badge-danger'; statusText = 'Vướng mắc'; }

        const dateStr = new Date(r.created_at).toLocaleString('vi-VN', {
          hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
        });

        let feedbackHtml = '';
        if (r.feedback) {
          const fbTime = r.feedback_at ? new Date(r.feedback_at).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'}) : '';
          feedbackHtml = \`
            <div class="feedback-box">
              <div class="feedback-author">
                <span>💬 \${escapeHtml(r.feedback_by || 'Admin')}</span>
                <span style="font-size: 10px; color: var(--text-muted);">\${fbTime}</span>
              </div>
              <div class="feedback-text">\${escapeHtml(r.feedback)}</div>
            </div>
            <button class="btn-comment" style="margin-top: 6px; font-size: 11px;" onclick="openFeedbackModal('\${r.id}')">✏️ Sửa nhận xét</button>
          \`;
        } else {
          feedbackHtml = \`
            <button class="btn-comment" onclick="openFeedbackModal('\${r.id}')">💬 Viết nhận xét</button>
          \`;
        }

        return \`<tr>
          <td style="color: var(--text-muted); font-size: 12.5px; white-space: nowrap;">\${dateStr}</td>
          <td style="font-weight: 600; color: #fff;">\${escapeHtml(r.employee_name || 'Nhân viên')}</td>
          <td style="font-size: 12.5px; color: var(--text-muted);">\${escapeHtml(r.department || 'Chung')}</td>
          <td style="max-width: 260px;">
            <div style="font-weight: 500; color: #60a5fa; margin-bottom: 3px;">\${escapeHtml(r.title || 'Báo cáo ngày')}</div>
            <div style="font-size: 12.5px; line-height: 1.4;">\${escapeHtml(r.tasks_done || '-')}</div>
          </td>
          <td style="color: \${r.blockers && r.blockers !== 'Không có' ? '#f87171' : 'var(--text-muted)'};">\${escapeHtml(r.blockers || 'Không có')}</td>
          <td style="white-space: nowrap; font-weight: 600;">\${r.hours_spent || 8}h</td>
          <td><span class="badge \${badgeClass}">\${statusText}</span></td>
          <td>\${feedbackHtml}</td>
        </tr>\`;
      }).join('');
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function updateStats(reports) {
      document.getElementById('stat-total').innerText = reports.length;
      const completedCount = reports.filter(r => r.status === 'COMPLETED').length;
      const pct = reports.length ? Math.round((completedCount / reports.length) * 100) : 0;
      document.getElementById('stat-completed').innerText = \`\${completedCount} (\${pct}%)\`;
      document.getElementById('stat-feedback').innerText = reports.filter(r => r.feedback && r.feedback.trim() !== '').length;
      const totalHours = reports.reduce((sum, r) => sum + (parseFloat(r.hours_spent) || 0), 0);
      document.getElementById('stat-hours').innerText = totalHours + 'h';
    }

    function renderCharts(reports) {
      // 1. Hours by Employee
      const empMap = {};
      reports.forEach(r => {
        const name = r.employee_name || 'Khác';
        empMap[name] = (empMap[name] || 0) + (parseFloat(r.hours_spent) || 0);
      });
      const empLabels = Object.keys(empMap);
      const empData = Object.values(empMap);

      const ctxHours = document.getElementById('hoursChart').getContext('2d');
      if (hoursChartInstance) hoursChartInstance.destroy();
      hoursChartInstance = new Chart(ctxHours, {
        type: 'bar',
        data: {
          labels: empLabels,
          datasets: [{
            label: 'Số giờ làm',
            data: empData,
            backgroundColor: 'rgba(59, 130, 246, 0.75)',
            borderColor: '#3b82f6',
            borderWidth: 1.5,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(255, 255, 255, 0.06)' },
              ticks: { color: '#94a3b8', callback: v => v + 'h' }
            },
            x: {
              grid: { display: false },
              ticks: { color: '#cbd5e1', font: { size: 11 } }
            }
          }
        }
      });

      // 2. Status Breakdown Doughnut
      const statusCounts = {
        COMPLETED: reports.filter(r => r.status === 'COMPLETED').length,
        IN_PROGRESS: reports.filter(r => r.status === 'IN_PROGRESS').length,
        BLOCKED: reports.filter(r => r.status === 'BLOCKED').length
      };

      const ctxStatus = document.getElementById('statusChart').getContext('2d');
      if (statusChartInstance) statusChartInstance.destroy();
      statusChartInstance = new Chart(ctxStatus, {
        type: 'doughnut',
        data: {
          labels: ['Hoàn thành', 'Đang thực hiện', 'Vướng mắc'],
          datasets: [{
            data: [statusCounts.COMPLETED, statusCounts.IN_PROGRESS, statusCounts.BLOCKED],
            backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
            borderColor: '#1e293b',
            borderWidth: 3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '68%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#cbd5e1', boxWidth: 12, font: { size: 11.5 } }
            }
          }
        }
      });

      // 3. Department Workload
      const deptMap = {};
      reports.forEach(r => {
        const dept = r.department || 'Chung';
        deptMap[dept] = (deptMap[dept] || 0) + (parseFloat(r.hours_spent) || 0);
      });
      const deptLabels = Object.keys(deptMap);
      const deptData = Object.values(deptMap);

      const ctxDept = document.getElementById('deptChart').getContext('2d');
      if (deptChartInstance) deptChartInstance.destroy();
      deptChartInstance = new Chart(ctxDept, {
        type: 'bar',
        data: {
          labels: deptLabels,
          datasets: [{
            label: 'Tổng giờ phòng ban',
            data: deptData,
            backgroundColor: 'rgba(168, 85, 247, 0.75)',
            borderColor: '#a855f7',
            borderWidth: 1.5,
            borderRadius: 6
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              beginAtZero: true,
              grid: { color: 'rgba(255, 255, 255, 0.06)' },
              ticks: { color: '#94a3b8', callback: v => v + 'h' }
            },
            y: {
              grid: { display: false },
              ticks: { color: '#cbd5e1', font: { size: 11 } }
            }
          }
        }
      });
    }

    function filterReports() {
      const q = document.getElementById('search-input').value.toLowerCase();
      const filtered = allReports.filter(r => 
        (r.employee_name && r.employee_name.toLowerCase().includes(q)) ||
        (r.department && r.department.toLowerCase().includes(q)) ||
        (r.title && r.title.toLowerCase().includes(q)) ||
        (r.tasks_done && r.tasks_done.toLowerCase().includes(q)) ||
        (r.feedback && r.feedback.toLowerCase().includes(q))
      );
      renderTable(filtered);
      renderCharts(filtered);
    }

    function openFeedbackModal(reportId) {
      const rep = allReports.find(x => x.id === reportId);
      if (!rep) return;
      document.getElementById('feedback-report-id').value = reportId;
      document.getElementById('feedback-report-info').innerHTML = \`
        <div><b>Nhân viên:</b> \${escapeHtml(rep.employee_name)} (\${escapeHtml(rep.department)})</div>
        <div style="margin-top: 3px;"><b>Nội dung:</b> \${escapeHtml(rep.title)} - \${escapeHtml(rep.tasks_done)}</div>
      \`;
      document.getElementById('feedback-text').value = rep.feedback || '';
      document.getElementById('feedback-modal').classList.add('active');
    }

    async function submitFeedback(e) {
      e.preventDefault();
      const reportId = document.getElementById('feedback-report-id').value;
      const payload = {
        feedback: document.getElementById('feedback-text').value,
        feedback_by: document.getElementById('feedback-by').value || 'Admin'
      };

      try {
        const res = await fetch(\`/api/reports/\${reportId}/feedback\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          closeModal('feedback-modal');
          loadReports();
        } else {
          alert('Lỗi lưu nhận xét!');
        }
      } catch (err) {
        alert('Lỗi kết nối: ' + err.message);
      }
    }

    async function submitReport(e) {
      e.preventDefault();
      const payload = {
        employee_name: document.getElementById('form-name').value,
        department: document.getElementById('form-dept').value || 'Chung',
        title: document.getElementById('form-title').value,
        tasks_done: document.getElementById('form-done').value,
        tasks_in_progress: document.getElementById('form-in-progress').value,
        blockers: document.getElementById('form-blockers').value || 'Không có',
        hours_spent: parseFloat(document.getElementById('form-hours').value) || 8,
        status: document.getElementById('form-status').value
      };

      try {
        const res = await fetch('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          closeModal('submit-modal');
          document.getElementById('report-form').reset();
          loadReports();
        } else {
          alert('Lỗi gửi báo cáo!');
        }
      } catch (err) {
        alert('Lỗi kết nối API: ' + err.message);
      }
    }

    function openSubmitModal() { document.getElementById('submit-modal').classList.add('active'); }
    function closeModal(id) { document.getElementById(id).classList.remove('active'); }

    // Tải ban đầu và tự động làm mới mỗi 15 giây
    loadReports();
    setInterval(loadReports, 15000);
  </script>
</body>
</html>`;
}

// HTML Giao diện Documentation chuyên nghiệp cho /documents
function getDocumentsHtml() {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Documentation - WorkReport API</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0f19;
      --sidebar-bg: #111827;
      --card: #1f2937;
      --border: #374151;
      --text: #f9fafb;
      --muted: #9ca3af;
      --primary: #3b82f6;
      --primary-hover: #2563eb;
      --accent: #10b981;
      --post-color: #10b981;
      --get-color: #3b82f6;
      --purple: #a855f7;
      --radius: 8px;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background-color: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; display: flex; min-height: 100vh; line-height: 1.6; }
    
    /* Sidebar */
    aside {
      width: 280px;
      background: var(--sidebar-bg);
      border-right: 1px solid var(--border);
      padding: 24px 18px;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
      flex-shrink: 0;
    }
    .brand { font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; }
    .brand-sub { font-size: 12px; color: var(--muted); margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
    .nav-group-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--muted); margin: 18px 0 8px 8px; letter-spacing: 0.5px; }
    .nav-link { display: block; padding: 8px 12px; color: #d1d5db; text-decoration: none; font-size: 13.5px; border-radius: 6px; margin-bottom: 4px; transition: all 0.2s; }
    .nav-link:hover { background: rgba(255,255,255,0.06); color: #fff; }
    .nav-link.active { background: rgba(59, 130, 246, 0.15); color: var(--primary); font-weight: 600; }
    
    /* Main Content */
    main { flex: 1; padding: 40px 48px; max-width: 980px; overflow-y: auto; }
    h1 { font-size: 28px; font-weight: 800; color: #fff; margin-bottom: 8px; }
    .doc-intro { font-size: 15px; color: var(--muted); margin-bottom: 32px; border-bottom: 1px solid var(--border); padding-bottom: 20px; }
    
    section { margin-bottom: 48px; scroll-margin-top: 30px; }
    h2 { font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 14px; display: flex; align-items: center; gap: 10px; }
    h3 { font-size: 15px; font-weight: 600; color: #e5e7eb; margin: 20px 0 10px; }
    p { font-size: 14px; color: #d1d5db; margin-bottom: 12px; }

    /* Endpoint Card */
    .endpoint-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; margin-bottom: 24px; }
    .endpoint-header { display: flex; align-items: center; gap: 12px; padding: 14px 18px; background: rgba(0,0,0,0.2); border-bottom: 1px solid var(--border); }
    .method-badge { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; }
    .method-post { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .method-get { background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }
    .method-feedback { background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3); }
    .endpoint-url { font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 600; color: #fff; }
    .endpoint-desc { font-size: 13px; color: var(--muted); margin-left: auto; }
    .endpoint-body { padding: 18px; }

    /* Tables */
    table { width: 100%; border-collapse: collapse; margin: 12px 0 20px; font-size: 13px; }
    th { text-align: left; padding: 10px 14px; background: rgba(0,0,0,0.25); color: var(--muted); font-size: 11px; text-transform: uppercase; border-bottom: 1px solid var(--border); }
    td { padding: 12px 14px; border-bottom: 1px solid rgba(255,255,255,0.06); vertical-align: top; }
    tr:last-child td { border-bottom: none; }
    .field-name { font-family: 'JetBrains Mono', monospace; color: #38bdf8; font-weight: 600; }
    .field-type { font-family: 'JetBrains Mono', monospace; color: #f472b6; font-size: 12px; }
    .field-required { color: #f87171; font-weight: 600; font-size: 11px; }
    .field-optional { color: var(--muted); font-size: 11px; }

    /* Code Blocks */
    .code-block { background: #070a13; border: 1px solid #1e293b; border-radius: 6px; padding: 14px; font-family: 'JetBrains Mono', monospace; font-size: 12.5px; color: #e2e8f0; overflow-x: auto; margin: 10px 0 16px; position: relative; }

    .quick-link-btn { display: inline-flex; align-items: center; gap: 6px; background: var(--primary); color: #fff; padding: 10px 16px; border-radius: 6px; text-decoration: none; font-size: 13.5px; font-weight: 600; margin-top: 12px; }
    .quick-link-btn:hover { background: var(--primary-hover); }
  </style>
</head>
<body>
  <aside>
    <div class="brand">📖 WorkReport API</div>
    <div class="brand-sub">Tài liệu API Báo Cáo & Nhận Xét</div>
    
    <div class="nav-group-title">Khái Quát</div>
    <a href="#overview" class="nav-link active">Giới Thiệu Chung</a>
    <a href="#base-url" class="nav-link">Base URL & Kết Nối</a>
    
    <div class="nav-group-title">API Endpoints</div>
    <a href="#endpoint-submit" class="nav-link">POST /api/reports (Nộp)</a>
    <a href="#endpoint-list" class="nav-link">GET /api/reports (Danh sách)</a>
    <a href="#endpoint-single" class="nav-link">GET /api/reports/:id (Xem nhận xét)</a>
    <a href="#endpoint-feedback" class="nav-link">POST /api/reports/:id/feedback (Nhận xét)</a>
    
    <div class="nav-group-title">Tích Hợp Code</div>
    <a href="#code-curl" class="nav-link">cURL / Terminal</a>
    <a href="#code-powershell" class="nav-link">PowerShell</a>
    <a href="#code-python" class="nav-link">Python Script</a>
    <a href="#code-js" class="nav-link">JavaScript / Fetch</a>

    <div class="nav-group-title">Giao Diện</div>
    <a href="/dashboard" class="nav-link" style="color: #60a5fa;" target="_blank">↗ Mở Admin Dashboard</a>
  </aside>

  <main>
    <h1>Tài Liệu Hướng Dẫn Tích Hợp API</h1>
    <div class="doc-intro">
      Hệ thống báo cáo công việc siêu tối giản: <b>Không cần API Key</b>, <b>Không cần Database</b> (lưu trực tiếp tệp JSON cục bộ). Hỗ trợ nhân viên nộp báo cáo, <b>Admin nhận xét trực tiếp</b>, và <b>biểu đồ phân tích hiệu suất</b> trên Dashboard.
    </div>

    <!-- Section: Overview -->
    <section id="overview">
      <h2>1. Tổng Quan Hệ Thống</h2>
      <p>Cung cấp REST API đầy đủ cho 3 tác vụ chính: Nộp báo cáo, Lấy danh sách tổng hợp, và Gửi nhận xét/chỉ đạo từ Admin.</p>
      <div style="display: flex; gap: 12px; margin-top: 14px; flex-wrap: wrap;">
        <div style="background: var(--card); border: 1px solid var(--border); padding: 14px 18px; border-radius: 8px; flex: 1; min-width: 180px;">
          <div style="font-size: 12px; color: var(--muted);">Trạng thái máy chủ</div>
          <div style="font-size: 16px; font-weight: 700; color: #34d399; margin-top: 4px;">● Đang hoạt động</div>
        </div>
        <div style="background: var(--card); border: 1px solid var(--border); padding: 14px 18px; border-radius: 8px; flex: 1; min-width: 180px;">
          <div style="font-size: 12px; color: var(--muted);">Phân tích hiệu suất</div>
          <div style="font-size: 16px; font-weight: 700; color: #38bdf8; margin-top: 4px;">Biểu đồ Chart.js</div>
        </div>
        <div style="background: var(--card); border: 1px solid var(--border); padding: 14px 18px; border-radius: 8px; flex: 1; min-width: 180px;">
          <div style="font-size: 12px; color: var(--muted);">Nhận xét 2 chiều</div>
          <div style="font-size: 16px; font-weight: 700; color: #c084fc; margin-top: 4px;">Admin Feedback Live</div>
        </div>
        <div style="background: var(--card); border: 1px solid var(--border); padding: 14px 18px; border-radius: 8px; flex: 1; min-width: 180px;">
          <div style="font-size: 12px; color: var(--muted);">Lưu trữ</div>
          <div style="font-size: 16px; font-weight: 700; color: #fbbf24; margin-top: 4px;">JSON File (Cực nhẹ)</div>
        </div>
      </div>
    </section>

    <!-- Section: Base URL -->
    <section id="base-url">
      <h2>2. Thông Tin Kết Nối</h2>
      <table>
        <tr><th>Thông số</th><th>Giá trị</th></tr>
        <tr><td><b>Base URL</b></td><td><code style="color: #38bdf8;">http://localhost:3000</code></td></tr>
        <tr><td><b>Content-Type</b></td><td><code>application/json; charset=utf-8</code></td></tr>
        <tr><td><b>Xác thực (Auth)</b></td><td>Không cần (Public endpoint nội bộ)</td></tr>
      </table>
    </section>

    <!-- Section: Endpoint Submit -->
    <section id="endpoint-submit">
      <h2>3. Endpoint Nộp Báo Cáo</h2>
      <div class="endpoint-card">
        <div class="endpoint-header">
          <span class="method-badge method-post">POST</span>
          <span class="endpoint-url">/api/reports</span>
          <span class="endpoint-desc">Nhân viên gửi báo cáo công việc</span>
        </div>
        <div class="endpoint-body">
          <p>Gửi dữ liệu báo cáo dạng JSON trong Request Body.</p>
          
          <h3>Tham Số Body JSON</h3>
          <table>
            <thead>
              <tr>
                <th>Trường (Field)</th>
                <th>Kiểu dữ liệu</th>
                <th>Bắt buộc?</th>
                <th>Mặc định</th>
                <th>Mô tả chi tiết</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="field-name">employee_name</td>
                <td class="field-type">String</td>
                <td><span class="field-required">BẮT BUỘC</span></td>
                <td>-</td>
                <td>Họ và tên nhân viên (VD: "Nguyễn Văn An")</td>
              </tr>
              <tr>
                <td class="field-name">department</td>
                <td class="field-type">String</td>
                <td><span class="field-optional">Tùy chọn</span></td>
                <td>"Chung"</td>
                <td>Phòng ban / Bộ phận (VD: "Kỹ thuật", "Kinh doanh")</td>
              </tr>
              <tr>
                <td class="field-name">title</td>
                <td class="field-type">String</td>
                <td><span class="field-optional">Tùy chọn</span></td>
                <td>"Báo cáo công việc"</td>
                <td>Tiêu đề báo cáo hoặc mục tiêu chính trong ngày</td>
              </tr>
              <tr>
                <td class="field-name">tasks_done</td>
                <td class="field-type">String</td>
                <td><span class="field-required">BẮT BUỘC</span></td>
                <td>""</td>
                <td>Chi tiết công việc đã hoàn thành</td>
              </tr>
              <tr>
                <td class="field-name">tasks_in_progress</td>
                <td class="field-type">String</td>
                <td><span class="field-optional">Tùy chọn</span></td>
                <td>""</td>
                <td>Công việc đang thực hiện dở dang</td>
              </tr>
              <tr>
                <td class="field-name">blockers</td>
                <td class="field-type">String</td>
                <td><span class="field-optional">Tùy chọn</span></td>
                <td>"Không có"</td>
                <td>Vướng mắc, khó khăn cần sếp hỗ trợ</td>
              </tr>
              <tr>
                <td class="field-name">hours_spent</td>
                <td class="field-type">Number</td>
                <td><span class="field-optional">Tùy chọn</span></td>
                <td>8</td>
                <td>Số giờ làm việc thực tế ghi nhận (VD: 8, 7.5)</td>
              </tr>
              <tr>
                <td class="field-name">status</td>
                <td class="field-type">String</td>
                <td><span class="field-optional">Tùy chọn</span></td>
                <td>"COMPLETED"</td>
                <td>Trạng thái: <code>COMPLETED</code>, <code>IN_PROGRESS</code>, hoặc <code>BLOCKED</code></td>
              </tr>
            </tbody>
          </table>

          <h3>Ví Dụ Request Body Chuẩn:</h3>
          <div class="code-block">{
  "employee_name": "Nguyễn Văn An",
  "department": "Kỹ thuật / Backend",
  "title": "Báo cáo ngày 09/11",
  "tasks_done": "Hoàn thành kiểm thử API và refactor code",
  "tasks_in_progress": "Đang viết unit test",
  "blockers": "Không có",
  "hours_spent": 8,
  "status": "COMPLETED"
}</div>
        </div>
      </div>
    </section>

    <!-- Section: Endpoint Feedback -->
    <section id="endpoint-feedback">
      <h2>4. Endpoint Admin Nhận Xét Báo Cáo</h2>
      <div class="endpoint-card">
        <div class="endpoint-header">
          <span class="method-badge method-feedback">POST</span>
          <span class="endpoint-url">/api/reports/:id/feedback</span>
          <span class="endpoint-desc">Admin gửi nhận xét cho một báo cáo</span>
        </div>
        <div class="endpoint-body">
          <p>Cho phép Admin hoặc Quản lý đính kèm lời nhận xét, chỉ đạo hoặc hướng giải quyết vướng mắc cho một báo cáo theo <code>id</code>.</p>
          
          <h3>Tham Số Body JSON:</h3>
          <table>
            <thead>
              <tr>
                <th>Trường</th>
                <th>Kiểu dữ liệu</th>
                <th>Bắt buộc?</th>
                <th>Mô tả</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="field-name">feedback</td>
                <td class="field-type">String</td>
                <td><span class="field-required">BẮT BUỘC</span></td>
                <td>Nội dung nhận xét, phản hồi hoặc chỉ đạo công việc</td>
              </tr>
              <tr>
                <td class="field-name">feedback_by</td>
                <td class="field-type">String</td>
                <td><span class="field-optional">Tùy chọn</span></td>
                <td>Tên người nhận xét (mặc định là "Admin")</td>
              </tr>
            </tbody>
          </table>

          <h3>Ví Dụ Request:</h3>
          <div class="code-block">POST /api/reports/rep-001/feedback
Content-Type: application/json

{
  "feedback": "Làm tốt lắm em! Chú ý bổ sung thêm test case cho edge case nhé.",
  "feedback_by": "Trưởng phòng Kỹ thuật"
}</div>
        </div>
      </div>
    </section>

    <!-- Section: Endpoint List & Single -->
    <section id="endpoint-list">
      <h2>5. Endpoint Tra Cứu & Đọc Nhận Xét</h2>
      
      <div class="endpoint-card">
        <div class="endpoint-header">
          <span class="method-badge method-get">GET</span>
          <span class="endpoint-url">/api/reports/:id</span>
          <span class="endpoint-desc">Nhân viên đọc nhận xét báo cáo theo ID</span>
        </div>
        <div class="endpoint-body">
          <p>Kiểm tra xem Admin đã nhận xét hay chưa qua cờ <code>has_feedback</code> và trường <code>report.feedback</code>.</p>
          <div class="code-block">GET /api/reports/rep-001

// Phản hồi:
{
  "success": true,
  "has_feedback": true,
  "report": {
    "id": "rep-001",
    "employee_name": "Nguyễn Văn An",
    "feedback": "Làm tốt lắm em, tiếp tục đẩy nhanh tiến độ nhé!",
    "feedback_by": "Admin / Giám Đốc"
  }
}</div>
        </div>
      </div>

      <div class="endpoint-card">
        <div class="endpoint-header">
          <span class="method-badge method-get">GET</span>
          <span class="endpoint-url">/api/reports?employee_name=...</span>
          <span class="endpoint-desc">Lọc báo cáo theo tên nhân viên</span>
        </div>
        <div class="endpoint-body">
          <p>Trả về danh sách tất cả các báo cáo kèm nhận xét của một nhân viên cụ thể.</p>
        </div>
      </div>
    </section>

    <!-- Section: Code Snippets -->
    <section id="code-examples">
      <h2>6. Code Mẫu Gửi Nhanh</h2>
      
      <div id="code-curl">
        <h3>Lệnh cURL (Terminal / Command Prompt)</h3>
        <div class="code-block">curl -X POST http://localhost:3000/api/reports \
  -H "Content-Type: application/json" \
  -d '{
    "employee_name": "Nguyễn Văn An",
    "department": "Kỹ thuật",
    "title": "Báo cáo ngày",
    "tasks_done": "Xong việc phân tích dữ liệu",
    "hours_spent": 8
  }'</div>
      </div>

      <div id="code-powershell">
        <h3>PowerShell (Windows)</h3>
        <div class="code-block">$body = @{
  employee_name = "Trần Thị Mai"
  department    = "Thiết kế"
  title         = "Báo cáo tiến độ UI"
  tasks_done    = "Xong wireframe Dashboard"
  hours_spent   = 7.5
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/reports" \`
  -Method Post \`
  -Body $body \`
  -ContentType "application/json; charset=utf-8"</div>
      </div>

      <div id="code-python">
        <h3>Python (requests)</h3>
        <div class="code-block">import requests

payload = {
    "employee_name": "Lê Hoàng Dũng",
    "department": "Kinh doanh",
    "title": "Báo cáo ngày",
    "tasks_done": "Gặp gỡ và tư vấn 5 khách hàng",
    "blockers": "Không có",
    "hours_spent": 8
}

res = requests.post("http://localhost:3000/api/reports", json=payload)
print(res.json())</div>
      </div>

      <div id="code-js">
        <h3>JavaScript (Fetch API)</h3>
        <div class="code-block">fetch('http://localhost:3000/api/reports', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    employee_name: "Nguyễn Văn An",
    department: "Kỹ thuật",
    tasks_done: "Xong tối ưu hóa hiệu năng",
    hours_spent: 8
  })
})
.then(res => res.json())
.then(data => console.log('Thành công:', data));</div>
      </div>
    </section>

    <!-- Section: Quick Link to Dashboard -->
    <section>
      <h2>7. Bảng Điều Khiển & Biểu Đồ Hiệu Suất</h2>
      <p>Quản trị viên có thể xem trực quan toàn bộ biểu đồ hiệu suất và nhận xét báo cáo tại:</p>
      <a href="/dashboard" class="quick-link-btn" target="_blank">📊 Truy Cập Dashboard Quản Trị Viên</a>
    </section>
  </main>
</body>
</html>`;
}

// HTTP Server
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Route 1: Dashboard UI cho Admin
  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/dashboard')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(getDashboardHtml());
    return;
  }

  // Route 2: /documents - Trang Tài Liệu API Tương Tác
  if (req.method === 'GET' && url.pathname === '/documents') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(getDocumentsHtml());
    return;
  }

  // Route 3: GET /api/reports - Lấy danh sách báo cáo (có thể lọc theo ?employee_name=...)
  if (req.method === 'GET' && url.pathname === '/api/reports') {
    let reports = getReports();
    const filterName = url.searchParams.get('employee_name');
    if (filterName) {
      reports = reports.filter(r => r.employee_name && r.employee_name.toLowerCase().includes(filterName.toLowerCase()));
    }
    // Sắp xếp báo cáo mới nhất lên đầu
    reports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(reports));
    return;
  }

  // Route 3b: GET /api/reports/:id - Xem chi tiết 1 báo cáo (kèm nhận xét của Admin)
  const singleReportMatch = url.pathname.match(/^\/api\/reports\/([a-zA-Z0-9_-]+)$/);
  if (req.method === 'GET' && singleReportMatch && url.pathname !== '/api/reports') {
    const reportId = singleReportMatch[1];
    const reports = getReports();
    const report = reports.find(r => r.id === reportId);
    if (!report) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: "Không tìm thấy báo cáo: " + reportId }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      report: report,
      has_feedback: Boolean(report.feedback && report.feedback.trim() !== '')
    }));
    return;
  }

  // Route 4: POST /api/reports - Nhân viên nộp báo cáo qua API (Không cần API Key)
  if (req.method === 'POST' && url.pathname === '/api/reports') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');

        const newReport = {
          id: 'rep-' + Date.now().toString(36),
          employee_name: data.employee_name || "Nhân viên chưa đặt tên",
          department: data.department || "Chung",
          title: data.title || "Báo cáo công việc",
          tasks_done: data.tasks_done || "",
          tasks_in_progress: data.tasks_in_progress || "",
          blockers: data.blockers || "Không có",
          plan_tomorrow: data.plan_tomorrow || "",
          hours_spent: parseFloat(data.hours_spent) || 8,
          status: data.status || "COMPLETED",
          feedback: "",
          feedback_by: "",
          feedback_at: null,
          created_at: new Date().toISOString()
        };

        const reports = getReports();
        reports.push(newReport);
        saveReports(reports);

        res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: true,
          message: "Nộp báo cáo thành công!",
          report: newReport
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: "Dữ liệu JSON không hợp lệ" }));
      }
    });
    return;
  }

  // Route 5: POST /api/reports/:id/feedback - Admin gửi nhận xét cho báo cáo
  const feedbackMatch = url.pathname.match(/^\/api\/reports\/([a-zA-Z0-9_-]+)\/feedback$/);
  if (req.method === 'POST' && feedbackMatch) {
    const reportId = feedbackMatch[1];
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const reports = getReports();
        const report = reports.find(r => r.id === reportId);

        if (!report) {
          res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: "Không tìm thấy báo cáo với ID: " + reportId }));
          return;
        }

        report.feedback = data.feedback || "";
        report.feedback_by = data.feedback_by || "Admin";
        report.feedback_at = new Date().toISOString();

        saveReports(reports);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: true,
          message: "Đã lưu nhận xét của Admin!",
          report: report
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: "Dữ liệu JSON không hợp lệ" }));
      }
    });
    return;
  }

  // 404 Not Found
  res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: "Endpoint not found" }));
});

server.listen(PORT, () => {
  console.log(`Server WorkReport running at http://localhost:${PORT}`);
  console.log(`- Dashboard Admin: http://localhost:${PORT}/dashboard`);
  console.log(`- API Documentation: http://localhost:${PORT}/documents`);
  console.log(`- Submit API: POST http://localhost:${PORT}/api/reports`);
  console.log(`- Feedback API: POST http://localhost:${PORT}/api/reports/:id/feedback`);
});
