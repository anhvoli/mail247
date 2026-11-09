import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  FileText, 
  Send, 
  CheckCircle2, 
  Clock, 
  Users, 
  MessageSquare,
  TrendingUp,
  LayoutDashboard,
  Sparkles,
  Zap
} from 'lucide-react';
import { loadReports, saveReports } from './mockData';
import PerformanceCharts from './components/PerformanceCharts';
import ReportList from './components/ReportList';
import SubmitReport from './components/SubmitReport';
import ApiDocuments from './components/ApiDocuments';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const data = loadReports();
    setReports(data);
  }, []);

  const handleReportAdded = (newReport) => {
    const updated = [newReport, ...reports];
    setReports(updated);
    saveReports(updated);
  };

  const handleAddFeedback = (reportId, adminName, comment) => {
    const updated = reports.map(r => {
      if (r.id === reportId) {
        const newFeedback = {
          id: `fb-${Date.now()}`,
          adminName: adminName || 'Quản trị viên',
          comment,
          createdAt: new Date().toISOString()
        };
        return {
          ...r,
          feedbacks: [...(r.feedbacks || []), newFeedback]
        };
      }
      return r;
    });

    setReports(updated);
    saveReports(updated);
  };

  // Tính toán thống kê
  const totalReports = reports.length;
  const completedCount = reports.filter(r => r.status === 'COMPLETED').length;
  const inProgressCount = reports.filter(r => r.status === 'IN_PROGRESS').length;
  const avgCompletion = totalReports > 0
    ? Math.round(reports.reduce((acc, r) => acc + (r.completionRate || 0), 0) / totalReports)
    : 0;
  const totalHours = reports.reduce((acc, r) => acc + (r.hoursWorked || 0), 0);
  const totalFeedbacks = reports.reduce((acc, r) => acc + (r.feedbacks?.length || 0), 0);

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <header className="navbar">
        <div className="navbar-inner">
          <div className="brand-section">
            <div className="brand-logo">
              <Zap size={22} fill="white" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span className="brand-title">WorkReport Pro</span>
                <span className="brand-badge">2026 Edition</span>
              </div>
              <div className="brand-subtitle">Hệ thống báo cáo & Giám sát hiệu suất công việc thông minh</div>
            </div>
          </div>

          <nav className="nav-links">
            <button
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard size={16} /> Dashboard
            </button>
            <button
              className={`nav-item ${activeTab === 'submit' ? 'active' : ''}`}
              onClick={() => setActiveTab('submit')}
            >
              <Send size={16} /> Nộp Báo Cáo
            </button>
            <button
              className={`nav-item ${activeTab === 'documents' ? 'active' : ''}`}
              onClick={() => setActiveTab('documents')}
            >
              <FileText size={16} /> Tài Liệu API
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in">
            {/* Hero Welcome Banner */}
            <div className="hero-banner">
              <div className="hero-content">
                <div className="hero-tag">
                  <Sparkles size={13} /> Trung tâm điều hành công việc
                </div>
                <h1 className="hero-title">
                  Theo Dõi Tiến Độ & Hiệu Suất Thời Gian Thực
                </h1>
                <p className="hero-desc">
                  Tổng hợp báo cáo tức thì từ các phòng ban, trực quan hóa năng suất lao động bằng biểu đồ và cho phép lãnh đạo tương tác chỉ đạo trực tiếp.
                </p>
              </div>
            </div>

            {/* Stat Cards */}
            <div className="stats-grid">
              <div className="card stat-card">
                <div className="stat-icon" style={{ background: '#e0e7ff', color: '#4338ca' }}>
                  <Users size={26} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Tổng số báo cáo</span>
                  <span className="stat-value">{totalReports}</span>
                  <span className="stat-sub">{completedCount} việc đã hoàn thành · {inProgressCount} đang làm</span>
                </div>
              </div>

              <div className="card stat-card">
                <div className="stat-icon" style={{ background: '#dcfce7', color: '#059669' }}>
                  <TrendingUp size={26} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Hiệu suất trung bình</span>
                  <span className="stat-value">{avgCompletion}%</span>
                  <span className="stat-sub">Tiến độ tổng thể các phòng ban</span>
                </div>
              </div>

              <div className="card stat-card">
                <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                  <Clock size={26} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Tổng giờ làm việc</span>
                  <span className="stat-value">{totalHours}h</span>
                  <span className="stat-sub">Thời gian làm việc ghi nhận thực tế</span>
                </div>
              </div>

              <div className="card stat-card">
                <div className="stat-icon" style={{ background: '#f3e8ff', color: '#7c3aed' }}>
                  <MessageSquare size={26} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Nhận xét Admin</span>
                  <span className="stat-value">{totalFeedbacks}</span>
                  <span className="stat-sub">Chỉ đạo & phản hồi trực tiếp</span>
                </div>
              </div>
            </div>

            {/* Performance Charts */}
            <PerformanceCharts reports={reports} />

            {/* Report Table with Live Admin Feedback */}
            <ReportList reports={reports} onAddFeedback={handleAddFeedback} />
          </div>
        )}

        {activeTab === 'submit' && (
          <div className="animate-fade-in">
            <SubmitReport
              onReportAdded={(rep) => {
                handleReportAdded(rep);
                setActiveTab('dashboard');
              }}
            />
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="animate-fade-in">
            <ApiDocuments />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div>
          <strong>WorkReport Pro</strong> &copy; 2026 — Thiết kế tối ưu cho Vercel & React Single Page Application.
        </div>
      </footer>
    </div>
  );
}
