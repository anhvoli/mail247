import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  Briefcase, 
  CheckSquare, 
  Clock, 
  Send, 
  Plus, 
  Trash2, 
  Sparkles, 
  AlertCircle,
  Filter,
  CheckCircle2,
  Calendar,
  MessageSquare
} from 'lucide-react';

const DEFAULT_EMPLOYEES = [
  { name: 'Nguyễn Văn An', department: 'Kỹ thuật / Backend' },
  { name: 'Phạm Quốc Bảo', department: 'Kỹ thuật / Frontend' },
  { name: 'Trần Thị Mai', department: 'Thiết kế UI/UX' },
  { name: 'Lê Hoàng Dũng', department: 'Kinh doanh & Dự án' },
  { name: 'Hoàng Minh Tuấn', department: 'Vận hành & Hỗ trợ' }
];

const DEPARTMENTS = [
  'Tất cả phòng ban',
  'Kỹ thuật / Backend',
  'Kỹ thuật / Frontend',
  'Thiết kế UI/UX',
  'Kinh doanh & Dự án',
  'Vận hành & Hỗ trợ'
];

export default function BatchAssignTask({ reports = [], onAssignTasks }) {
  // 1. Danh sách nhân sự: gộp từ danh sách mặc định + các nhân viên đã có báo cáo
  const [customEmployees, setCustomEmployees] = useState([]);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpDept, setNewEmpDept] = useState('Kỹ thuật / Backend');

  // Tổng hợp danh sách nhân viên duy nhất
  const allEmployees = useMemo(() => {
    const map = new Map();
    DEFAULT_EMPLOYEES.forEach(e => map.set(e.name, e));
    reports.forEach(r => {
      if (r.employeeName && !map.has(r.employeeName)) {
        map.set(r.employeeName, { name: r.employeeName, department: r.department || 'Kỹ thuật' });
      }
    });
    customEmployees.forEach(e => map.set(e.name, e));
    return Array.from(map.values());
  }, [reports, customEmployees]);

  // Bộ lọc danh sách nhân viên
  const [filterDept, setFilterDept] = useState('Tất cả phòng ban');
  const [searchEmployee, setSearchEmployee] = useState('');

  // Danh sách nhân sự được chọn để giao việc (Set of names)
  const [selectedEmployees, setSelectedEmployees] = useState(new Set());

  // Thông tin công việc cần giao
  const [title, setTitle] = useState('');
  const [targetDept, setTargetDept] = useState('Kỹ thuật / Backend');
  const [priority, setPriority] = useState('NORMAL'); // NORMAL, HIGH, URGENT
  const [taskInput, setTaskInput] = useState('');
  const [tasksList, setTasksList] = useState([]);
  const [estimatedHours, setEstimatedHours] = useState(8);
  const [deadline, setDeadline] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [adminName, setAdminName] = useState('Quản trị viên / Team Lead');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Lọc danh sách nhân viên hiển thị
  const filteredEmployees = allEmployees.filter(emp => {
    const matchDept = filterDept === 'Tất cả phòng ban' || emp.department === filterDept;
    const matchSearch = !searchEmployee.trim() || emp.name.toLowerCase().includes(searchEmployee.toLowerCase());
    return matchDept && matchSearch;
  });

  // Toggle chọn 1 nhân viên
  const toggleSelectEmployee = (name) => {
    setSelectedEmployees(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  // Chọn toàn bộ nhân viên đang hiển thị
  const handleSelectAllFiltered = () => {
    setSelectedEmployees(prev => {
      const next = new Set(prev);
      filteredEmployees.forEach(emp => next.add(emp.name));
      return next;
    });
  };

  // Bỏ chọn tất cả
  const handleDeselectAll = () => {
    setSelectedEmployees(new Set());
  };

  // Thêm nhân viên mới thủ công
  const handleAddNewEmployee = (e) => {
    e.preventDefault();
    const trimmed = newEmpName.trim();
    if (!trimmed) return;
    if (allEmployees.some(emp => emp.name.toLowerCase() === trimmed.toLowerCase())) {
      alert('Nhân viên này đã có trong danh sách!');
      return;
    }
    const newEmp = { name: trimmed, department: newEmpDept };
    setCustomEmployees(prev => [...prev, newEmp]);
    setSelectedEmployees(prev => new Set(prev).add(trimmed));
    setNewEmpName('');
  };

  // Thêm đầu việc vào danh sách
  const handleAddTaskItem = () => {
    const trimmed = taskInput.trim();
    if (trimmed) {
      setTasksList(prev => [...prev, trimmed]);
      setTaskInput('');
    }
  };

  // Xóa 1 đầu việc
  const handleRemoveTaskItem = (idx) => {
    setTasksList(prev => prev.filter((_, i) => i !== idx));
  };

  // Xử lý gửi giao việc hàng loạt
  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (selectedEmployees.size === 0) {
      setErrorMessage('Vui lòng chọn ít nhất 1 nhân viên để giao việc!');
      return;
    }

    if (!title.trim()) {
      setErrorMessage('Vui lòng nhập tiêu đề công việc / dự án cần giao!');
      return;
    }

    const finalTasks = [...tasksList];
    if (taskInput.trim()) {
      finalTasks.push(taskInput.trim());
    }

    if (finalTasks.length === 0) {
      setErrorMessage('Vui lòng nhập ít nhất 1 đầu mục công việc cụ thể!');
      return;
    }

    // Chuẩn bị danh sách nhân sự được phân công kèm thông tin phòng ban của họ
    const assignedEmployees = Array.from(selectedEmployees).map(empName => {
      const found = allEmployees.find(e => e.name === empName);
      return {
        name: empName,
        department: found ? found.department : targetDept
      };
    });

    const payload = {
      employees: assignedEmployees,
      title: title.trim(),
      department: targetDept,
      priority,
      tasksInProgress: finalTasks,
      tasksCompleted: [],
      hoursWorked: Number(estimatedHours) || 8,
      completionRate: 0,
      status: 'IN_PROGRESS',
      adminNote: adminNote.trim() ? `[Phân công việc - Hạn chót: ${deadline || 'Trong tuần'}]: ${adminNote.trim()}` : `[Phân công công việc mới] Hạn chót: ${deadline || 'Theo tiến độ dự án'}`,
      adminName: adminName.trim() || 'Quản trị viên / Team Lead'
    };

    setIsSubmitting(true);
    try {
      const ok = await onAssignTasks(payload);
      if (ok !== false) {
        setSuccessMessage(`Đã giao việc thành công cho ${assignedEmployees.length} nhân viên!`);
        // Reset form
        setTitle('');
        setTasksList([]);
        setTaskInput('');
        setAdminNote('');
        setDeadline('');
        setSelectedEmployees(new Set());
      }
    } catch (err) {
      setErrorMessage(`Lỗi khi giao việc: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Banner Giới Thiệu */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', color: 'white', border: 'none', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.15)', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            <Sparkles size={14} /> Tính Năng Mới Dành Cho Quản Trị Viên
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
            Phân Công & Giao Việc Cho Nhiều Nhân Viên
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#c7d2fe', maxWidth: '700px' }}>
            Nhanh chóng giao một công việc hoặc dự án cho nhiều nhân sự cùng lúc. Hệ thống sẽ tự động tạo các tiến độ tương ứng và hiển thị trực tiếp trên Dashboard để toàn bộ đội ngũ theo dõi.
          </p>
        </div>
      </div>

      {/* Thông báo Thành công / Thất bại */}
      {successMessage && (
        <div style={{
          background: '#dcfce7',
          border: '1px solid #86efac',
          color: '#15803d',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontWeight: 600
        }}>
          <CheckCircle2 size={20} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#b91c1c',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontWeight: 600
        }}>
          <AlertCircle size={20} />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmitAssignment}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
          
          {/* CỘT 1: CHỌN DANH SÁCH NHÂN VIÊN */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--slate-100)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={18} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-800)' }}>
                  1. Chọn Nhân Viên Nhận Việc
                </h3>
              </div>
              <span className="badge" style={{ background: selectedEmployees.size > 0 ? '#e0e7ff' : 'var(--slate-100)', color: selectedEmployees.size > 0 ? 'var(--primary)' : 'var(--slate-500)', fontWeight: 700 }}>
                Đã chọn: {selectedEmployees.size}
              </span>
            </div>

            {/* Filter & Search */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Tìm nhân viên theo tên..."
                value={searchEmployee}
                onChange={(e) => setSearchEmployee(e.target.value)}
                style={{ fontSize: '0.85rem' }}
              />

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <select
                  className="form-control"
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem', height: '34px' }}
                >
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleSelectAllFiltered}
                  style={{ fontSize: '0.75rem', height: '34px', whiteSpace: 'nowrap' }}
                >
                  Chọn tất cả
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleDeselectAll}
                  style={{ fontSize: '0.75rem', height: '34px', whiteSpace: 'nowrap' }}
                >
                  Bỏ chọn
                </button>
              </div>
            </div>

            {/* Danh sách checkbox nhân sự */}
            <div style={{ 
              maxHeight: '280px', 
              overflowY: 'auto', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.45rem',
              paddingRight: '0.25rem',
              marginBottom: '1.25rem'
            }}>
              {filteredEmployees.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--slate-400)', fontSize: '0.85rem' }}>
                  Không tìm thấy nhân viên phù hợp
                </div>
              ) : (
                filteredEmployees.map(emp => {
                  const isSelected = selectedEmployees.has(emp.name);
                  const initials = emp.name.split(' ').map(n => n[0]).slice(-2).join('').toUpperCase();
                  return (
                    <div
                      key={emp.name}
                      onClick={() => toggleSelectEmployee(emp.name)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.6rem 0.75rem',
                        borderRadius: '10px',
                        border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--slate-200)',
                        background: isSelected ? '#f5f3ff' : 'var(--surface)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: isSelected ? 'var(--primary)' : 'var(--slate-200)',
                          color: isSelected ? 'white' : 'var(--slate-600)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}>
                          {initials}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-800)' }}>
                            {emp.name}
                          </div>
                          <div style={{ fontSize: '0.725rem', color: 'var(--slate-500)' }}>
                            {emp.department}
                          </div>
                        </div>
                      </div>

                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '6px',
                        border: isSelected ? 'none' : '2px solid var(--slate-300)',
                        background: isSelected ? 'var(--primary)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}>
                        {isSelected && <CheckCircle2 size={16} />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Form thêm nhân viên mới nhanh */}
            <div style={{ borderTop: '1px solid var(--slate-100)', paddingTop: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-600)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <UserPlus size={13} /> Thêm nhân viên mới vào danh sách:
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  className="form-control"
                  style={{ flex: 1, minWidth: '130px', fontSize: '0.8rem', height: '34px' }}
                  placeholder="Họ tên nhân viên..."
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                />
                <select
                  className="form-control"
                  style={{ width: '130px', fontSize: '0.75rem', height: '34px' }}
                  value={newEmpDept}
                  onChange={(e) => setNewEmpDept(e.target.value)}
                >
                  <option value="Kỹ thuật / Backend">Kỹ thuật / Backend</option>
                  <option value="Kỹ thuật / Frontend">Kỹ thuật / Frontend</option>
                  <option value="Thiết kế UI/UX">Thiết kế UI/UX</option>
                  <option value="Kinh doanh & Dự án">Kinh doanh & Dự án</option>
                  <option value="Vận hành & Hỗ trợ">Vận hành & Hỗ trợ</option>
                </select>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleAddNewEmployee}
                  style={{ height: '34px', fontSize: '0.75rem', padding: '0 0.65rem' }}
                >
                  + Thêm
                </button>
              </div>
            </div>
          </div>

          {/* CỘT 2: CHI TIẾT CÔNG VIỆC PHÂN CÔNG */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--slate-100)', paddingBottom: '0.75rem' }}>
              <Briefcase size={18} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-800)' }}>
                2. Nội Dung Công Việc & Yêu Cầu
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Tiêu đề */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Tiêu đề công việc / Nhiệm vụ <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="VD: Nâng cấp bảo mật API và tối ưu database caching"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Hàng: Phòng ban & Mức độ ưu tiên */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Phòng ban phụ trách</label>
                  <select
                    className="form-control"
                    value={targetDept}
                    onChange={(e) => setTargetDept(e.target.value)}
                  >
                    <option value="Kỹ thuật / Backend">Kỹ thuật / Backend</option>
                    <option value="Kỹ thuật / Frontend">Kỹ thuật / Frontend</option>
                    <option value="Thiết kế UI/UX">Thiết kế UI/UX</option>
                    <option value="Kinh doanh & Dự án">Kinh doanh & Dự án</option>
                    <option value="Vận hành & Hỗ trợ">Vận hành & Hỗ trợ</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Mức độ ưu tiên</label>
                  <select
                    className="form-control"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="NORMAL">Bình thường</option>
                    <option value="HIGH">Quan trọng ⭐</option>
                    <option value="URGENT">Khẩn cấp 🚨</option>
                  </select>
                </div>
              </div>

              {/* Hàng: Thời hạn & Số giờ dự kiến */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Hạn hoàn thành (Deadline)</label>
                  <input
                    type="date"
                    className="form-control"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Dự kiến giờ làm (giờ)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="0.5"
                    className="form-control"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                  />
                </div>
              </div>

              {/* Danh sách đầu việc cụ thể cần làm */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Các đầu việc cụ thể cần làm <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nhập 1 đầu việc cụ thể và bấm Thêm..."
                    value={taskInput}
                    onChange={(e) => setTaskInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTaskItem();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleAddTaskItem}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    <Plus size={16} /> Thêm việc
                  </button>
                </div>

                {/* Danh sách task chips */}
                {tasksList.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.5rem' }}>
                    {tasksList.map((task, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'var(--slate-50)',
                          border: '1px solid var(--slate-200)',
                          padding: '0.45rem 0.65rem',
                          borderRadius: '8px',
                          fontSize: '0.85rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <CheckSquare size={14} style={{ color: 'var(--primary)' }} />
                          <span>{task}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveTaskItem(idx)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--slate-400)', cursor: 'pointer', padding: '0.2rem' }}
                          title="Xóa đầu việc"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Lời dặn / Nhận xét của Admin */}
              <div className="form-group">
                <label className="form-label">
                  Chỉ đạo / Ghi chú từ Quản lý (Gắn kèm vào báo cáo)
                </label>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="VD: Lưu ý kiểm tra kỹ hiệu năng trước khi release, báo cáo lại vào cuối ngày..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                />
              </div>

              {/* Tên Quản trị viên */}
              <div className="form-group">
                <label className="form-label">Người giao việc</label>
                <input
                  type="text"
                  className="form-control"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="Quản trị viên / Team Lead"
                />
              </div>

            </div>
          </div>
        </div>

        {/* TỔNG KẾT & NÚT GIAO VIỆC */}
        <div className="card" style={{ marginTop: '1.5rem', background: '#f8fafc', border: '1.5px solid var(--slate-200)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--slate-800)' }}>
                Xác Nhận Phân Công Công Việc
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--slate-500)', marginTop: '0.15rem' }}>
                Hệ thống sẽ tạo <strong>{selectedEmployees.size}</strong> công việc tiến độ cho {selectedEmployees.size > 0 ? Array.from(selectedEmployees).join(', ') : 'những nhân viên được chọn'}.
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || selectedEmployees.size === 0}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                borderRadius: '9999px',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
                cursor: (isSubmitting || selectedEmployees.size === 0) ? 'not-allowed' : 'pointer'
              }}
            >
              <Send size={16} />
              <span>
                {isSubmitting 
                  ? 'Đang phân công...' 
                  : `Giao việc cho ${selectedEmployees.size} nhân viên đã chọn`}
              </span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
