import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Plus, Trash2 } from 'lucide-react';

export default function SubmitReport({ onReportAdded }) {
  const [employeeName, setEmployeeName] = useState('');
  const [department, setDepartment] = useState('Kỹ thuật / Backend');
  const [title, setTitle] = useState('');
  const [taskDoneInput, setTaskDoneInput] = useState('');
  const [tasksDoneList, setTasksDoneList] = useState([]);
  const [taskProgInput, setTaskProgInput] = useState('');
  const [tasksProgList, setTasksProgList] = useState([]);
  const [blockers, setBlockers] = useState('');
  const [planTomorrow, setPlanTomorrow] = useState('');
  const [hoursWorked, setHoursWorked] = useState(8);
  const [completionRate, setCompletionRate] = useState(90);
  const [status, setStatus] = useState('COMPLETED');
  const [successMsg, setSuccessMsg] = useState(false);

  const handleAddTaskDone = () => {
    if (taskDoneInput.trim()) {
      setTasksDoneList([...tasksDoneList, taskDoneInput.trim()]);
      setTaskDoneInput('');
    }
  };

  const handleAddTaskProg = () => {
    if (taskProgInput.trim()) {
      setTasksProgList([...tasksProgList, taskProgInput.trim()]);
      setTaskProgInput('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!employeeName.trim() || !title.trim()) {
      alert('Vui lòng nhập họ tên nhân viên và tiêu đề báo cáo!');
      return;
    }

    const finalTasksDone = [...tasksDoneList];
    if (taskDoneInput.trim()) finalTasksDone.push(taskDoneInput.trim());

    const finalTasksProg = [...tasksProgList];
    if (taskProgInput.trim()) finalTasksProg.push(taskProgInput.trim());

    const newReport = {
      id: `REP-${Date.now().toString().slice(-4)}`,
      employeeName: employeeName.trim(),
      department,
      title: title.trim(),
      tasksCompleted: finalTasksDone.length > 0 ? finalTasksDone : ['Hoàn thành các công việc được giao'],
      tasksInProgress: finalTasksProg,
      blockers: blockers.trim() || 'Không có',
      planTomorrow: planTomorrow.trim() || 'Tiếp tục triển khai theo kế hoạch tuần',
      hoursWorked: parseFloat(hoursWorked) || 8,
      completionRate: parseInt(completionRate, 10) || 100,
      status,
      createdAt: new Date().toISOString(),
      feedbacks: []
    };

    onReportAdded(newReport);
    setSuccessMsg(true);

    // Reset form
    setTitle('');
    setTasksDoneList([]);
    setTasksProgList([]);
    setBlockers('');
    setPlanTomorrow('');

    setTimeout(() => {
      setSuccessMsg(false);
    }, 4000);
  };

  return (
    <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--slate-200)', paddingBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--slate-900)' }}>
          Gửi Báo Cáo Công Việc Hàng Ngày
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
          Nhân viên cập nhật tiến độ công việc, số giờ làm và các khó khăn cần quản lý hỗ trợ
        </p>
      </div>

      {successMsg && (
        <div style={{
          background: '#dcfce7',
          color: '#15803d',
          padding: '1rem',
          borderRadius: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1.5rem',
          fontWeight: 600
        }}>
          <CheckCircle2 size={20} />
          Báo cáo công việc đã được gửi thành công! Quản trị viên đã có thể theo dõi và nhận xét.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Họ và tên nhân viên *</label>
            <input
              type="text"
              className="form-control"
              placeholder="VD: Nguyễn Văn A"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phòng ban / Bộ phận *</label>
            <select
              className="form-control"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="Kỹ thuật / Backend">Kỹ thuật / Backend</option>
              <option value="Kỹ thuật / Frontend">Kỹ thuật / Frontend</option>
              <option value="Thiết kế UI/UX">Thiết kế UI/UX</option>
              <option value="Kinh doanh & Dự án">Kinh doanh & Dự án</option>
              <option value="Vận hành & Hỗ trợ">Vận hành & Hỗ trợ</option>
              <option value="Marketing & Truyền thông">Marketing & Truyền thông</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Tiêu đề báo cáo công việc *</label>
          <input
            type="text"
            className="form-control"
            placeholder="VD: Tối ưu database và hoàn thiện endpoint xác thực"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Tasks done */}
        <div className="form-group">
          <label className="form-label">Các việc đã hoàn thành hôm nay</label>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Nhập việc đã làm và bấm Thêm..."
              value={taskDoneInput}
              onChange={(e) => setTaskDoneInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTaskDone(); } }}
            />
            <button type="button" className="btn btn-secondary" onClick={handleAddTaskDone}>
              <Plus size={16} /> Thêm
            </button>
          </div>
          {tasksDoneList.length > 0 && (
            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--slate-700)' }}>
              {tasksDoneList.map((item, idx) => (
                <li key={idx} style={{ marginBottom: '0.25rem' }}>
                  {item}
                  <button
                    type="button"
                    onClick={() => setTasksDoneList(tasksDoneList.filter((_, i) => i !== idx))}
                    style={{ background: 'none', border: 'none', color: '#ef4444', marginLeft: '0.5rem', cursor: 'pointer' }}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Tasks in progress */}
        <div className="form-group">
          <label className="form-label">Các việc đang làm dở dang</label>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Nhập việc đang làm..."
              value={taskProgInput}
              onChange={(e) => setTaskProgInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTaskProg(); } }}
            />
            <button type="button" className="btn btn-secondary" onClick={handleAddTaskProg}>
              <Plus size={16} /> Thêm
            </button>
          </div>
          {tasksProgList.length > 0 && (
            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--slate-700)' }}>
              {tasksProgList.map((item, idx) => (
                <li key={idx} style={{ marginBottom: '0.25rem' }}>
                  {item}
                  <button
                    type="button"
                    onClick={() => setTasksProgList(tasksProgList.filter((_, i) => i !== idx))}
                    style={{ background: 'none', border: 'none', color: '#ef4444', marginLeft: '0.5rem', cursor: 'pointer' }}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Thời gian làm việc (giờ)</label>
            <input
              type="number"
              step="0.5"
              min="1"
              max="24"
              className="form-control"
              value={hoursWorked}
              onChange={(e) => setHoursWorked(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tỷ lệ hoàn thành ({completionRate}%)</label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              style={{ width: '100%', marginTop: '0.5rem' }}
              value={completionRate}
              onChange={(e) => setCompletionRate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Trạng thái tổng quan</label>
            <select
              className="form-control"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="COMPLETED">Hoàn thành (Completed)</option>
              <option value="IN_PROGRESS">Đang tiến hành (In Progress)</option>
              <option value="BLOCKED">Tắc nghẽn / Cần trợ giúp (Blocked)</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Khó khăn, vướng mắc (Blockers)</label>
          <input
            type="text"
            className="form-control"
            placeholder="Ghi rõ nếu có vấn đề cần ban quản trị giải quyết"
            value={blockers}
            onChange={(e) => setBlockers(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Kế hoạch ngày mai</label>
          <textarea
            className="form-control"
            placeholder="Dự kiến các đầu mục công việc ngày làm việc kế tiếp..."
            value={planTomorrow}
            onChange={(e) => setPlanTomorrow(e.target.value)}
            rows={2}
          ></textarea>
        </div>

        <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
          <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
            <Send size={18} /> Gửi Báo Cáo
          </button>
        </div>
      </form>
    </div>
  );
}
