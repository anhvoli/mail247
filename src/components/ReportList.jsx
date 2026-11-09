import React, { useState } from 'react';
import { MessageSquare, Clock, User, CheckCircle2, AlertTriangle, XCircle, Send, ChevronDown, ChevronUp } from 'lucide-react';

export default function ReportList({ reports, onAddFeedback }) {
  const [filterDept, setFilterDept] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [feedbackInput, setFeedbackInput] = useState({});
  const [adminNameInput, setAdminNameInput] = useState({});
  const [expandedReportId, setExpandedReportId] = useState(null);

  const filteredReports = reports.filter(r => {
    const matchDept = filterDept === 'ALL' || r.department === filterDept;
    const matchStatus = filterStatus === 'ALL' || r.status === filterStatus;
    const matchSearch = searchTerm === '' || 
      r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchDept && matchStatus && matchSearch;
  });

  const handleFeedbackSubmit = async (reportId) => {
    const comment = feedbackInput[reportId]?.trim();
    const adminName = adminNameInput[reportId]?.trim() || 'Quản trị viên';

    if (!comment) {
      alert('Vui lòng nhập nội dung nhận xét!');
      return;
    }

    await onAddFeedback(reportId, adminName, comment);
    setFeedbackInput(prev => ({ ...prev, [reportId]: '' }));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="badge badge-completed"><CheckCircle2 size={12} /> Hoàn thành</span>;
      case 'IN_PROGRESS':
        return <span className="badge badge-in_progress"><Clock size={12} /> Đang xử lý</span>;
      case 'BLOCKED':
        return <span className="badge badge-blocked"><AlertTriangle size={12} /> Vướng mắc</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--slate-900)' }}>
            Danh Sách Báo Cáo Công Việc & Nhận Xét
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--slate-500)' }}>
            Theo dõi chi tiết báo cáo từng nhân viên và để lại phản hồi, hướng dẫn trực tiếp
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="form-control"
            style={{ width: '200px', fontSize: '0.8125rem' }}
            placeholder="Tìm theo tên/tiêu đề..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="form-control"
            style={{ width: '160px', fontSize: '0.8125rem' }}
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
          >
            <option value="ALL">Tất cả phòng ban</option>
            <option value="Kỹ thuật / Backend">Kỹ thuật / Backend</option>
            <option value="Kỹ thuật / Frontend">Kỹ thuật / Frontend</option>
            <option value="Thiết kế UI/UX">Thiết kế UI/UX</option>
            <option value="Kinh doanh & Dự án">Kinh doanh & Dự án</option>
            <option value="Vận hành & Hỗ trợ">Vận hành & Hỗ trợ</option>
          </select>

          <select
            className="form-control"
            style={{ width: '150px', fontSize: '0.8125rem' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="IN_PROGRESS">Đang xử lý</option>
            <option value="BLOCKED">Vướng mắc</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="report-table">
          <thead>
            <tr>
              <th style={{ width: '22%' }}>Nhân sự & Thời gian</th>
              <th style={{ width: '38%' }}>Nội dung công việc & Kế hoạch</th>
              <th style={{ width: '15%' }}>Tiến độ & Giờ</th>
              <th style={{ width: '25%' }}>Nhận xét Quản trị viên ({reports.reduce((acc, r) => acc + (r.feedbacks?.length || 0), 0)})</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--slate-500)' }}>
                  Không tìm thấy báo cáo nào phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              filteredReports.map((report) => (
                <tr key={report.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{report.employeeName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginBottom: '0.25rem' }}>{report.department}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                      Mã: <code>{report.id}</code>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                      {new Date(report.createdAt).toLocaleString('vi-VN')}
                    </div>
                    <div style={{ marginTop: '0.5rem' }}>
                      {getStatusBadge(report.status)}
                    </div>
                  </td>

                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--slate-900)', marginBottom: '0.5rem' }}>
                      {report.title}
                    </div>

                    {/* Tasks completed */}
                    {report.tasksCompleted && report.tasksCompleted.length > 0 && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#15803d' }}>✓ Việc đã xong:</span>
                        <ul style={{ paddingLeft: '1.25rem', fontSize: '0.8125rem', color: 'var(--slate-700)', marginTop: '0.2rem' }}>
                          {report.tasksCompleted.map((t, idx) => (
                            <li key={idx}>{t}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Tasks in progress */}
                    {report.tasksInProgress && report.tasksInProgress.length > 0 && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#b45309' }}>⏳ Đang thực hiện:</span>
                        <ul style={{ paddingLeft: '1.25rem', fontSize: '0.8125rem', color: 'var(--slate-700)', marginTop: '0.2rem' }}>
                          {report.tasksInProgress.map((t, idx) => (
                            <li key={idx}>{t}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Blockers */}
                    {report.blockers && report.blockers !== 'Không có' && (
                      <div style={{ background: '#fef2f2', padding: '0.35rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.8125rem', color: '#b91c1c', marginBottom: '0.5rem' }}>
                        <strong>⚠️ Vướng mắc:</strong> {report.blockers}
                      </div>
                    )}

                    {/* Plan tomorrow */}
                    {report.planTomorrow && (
                      <div style={{ fontSize: '0.8125rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
                        <strong>Kế hoạch tiếp:</strong> {report.planTomorrow}
                      </div>
                    )}
                  </td>

                  <td>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                        <span>Tiến độ:</span>
                        <span>{report.completionRate}%</span>
                      </div>
                      <div style={{ height: '6px', background: 'var(--slate-200)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${report.completionRate}%`,
                          background: report.completionRate >= 90 ? '#10b981' : report.completionRate >= 70 ? '#3b82f6' : '#ef4444'
                        }} />
                      </div>
                    </div>

                    <div style={{ fontSize: '0.8125rem', color: 'var(--slate-700)' }}>
                      ⏱️ <strong>{report.hoursWorked} giờ</strong> làm việc
                    </div>
                  </td>

                  <td>
                    {/* Danh sách Feedback hiện có */}
                    {report.feedbacks && report.feedbacks.length > 0 ? (
                      <div style={{ marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {report.feedbacks.map((fb, idx) => (
                          <div key={idx} className="feedback-box">
                            <div className="feedback-meta">
                              <span className="feedback-author">💬 {fb.adminName}</span>
                              <span>{new Date(fb.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="feedback-text">{fb.comment}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8125rem', color: 'var(--slate-400)', fontStyle: 'italic', marginBottom: '0.5rem' }}>
                        Chưa có nhận xét nào từ admin.
                      </div>
                    )}

                    {/* Form gửi Feedback nhanh cho Admin */}
                    <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '0.5rem', border: '1px dashed var(--slate-300)' }}>
                      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.35rem' }}>
                        <input
                          type="text"
                          placeholder="Tên Admin (mặc định Quản trị viên)"
                          className="form-control"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', height: '28px' }}
                          value={adminNameInput[report.id] || ''}
                          onChange={(e) => setAdminNameInput({ ...adminNameInput, [report.id]: e.target.value })}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <input
                          type="text"
                          placeholder="Viết nhận xét / chỉ đạo..."
                          className="form-control"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', height: '28px' }}
                          value={feedbackInput[report.id] || ''}
                          onChange={(e) => setFeedbackInput({ ...feedbackInput, [report.id]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleFeedbackSubmit(report.id);
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{ height: '28px', padding: '0 0.5rem' }}
                          onClick={() => handleFeedbackSubmit(report.id)}
                          title="Gửi phản hồi"
                        >
                          <Send size={12} />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
