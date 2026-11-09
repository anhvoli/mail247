import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  FileText, 
  Send, 
  CheckCircle, 
  Clock, 
  Users, 
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  LayoutDashboard
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
              <BarChart3 size={22} />
            </div>
            <div>
              <div className="brand-title">WorkReport Portal</div>
              <div className="brand-subtitle">Hệ thống báo cáo & Giám sát hiệu suất công việc</div>
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
          <div>
            {/* Stat Cards */}
            <div className="stats-grid">
              <div className="card stat-card">
                <div className="stat-icon" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                  <Users size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Tổng số báo cáo</span>
                  <span className="stat-value">{totalReports}</span>
                  <span className="stat-sub">{completedCount} công việc đã hoàn thành</span>
                </div>
              </div>

              <div className="card stat-card">
                <div className="stat-icon" style={{ background: '#dcfce7', color: '#15803d' }}>
                  <TrendingUp size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Hiệu suất trung bình</span>
                  <span className="stat-value">{avgCompletion}%</span>
                  <span className="stat-sub">Tiến độ tổng thể các bộ phận</span>
                </div>
              </div>

              <div className="card stat-card">
                <div className="stat-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
                  <Clock size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Tổng giờ làm việc</span>
                  <span className="stat-value">{totalHours}h</span>
                  <span className="stat-sub">Ghi nhận trong kỳ báo cáo</span>
                </div>
              </div>

              <div className="card stat-card">
                <div className="stat-icon" style={{ background: '#f3e8ff', color: '#7e22ce' }}>
                  <MessageSquare size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Nhận xét Admin</span>
                  <span className="stat-value">{totalFeedbacks}</span>
                  <span className="stat-sub">Góp ý & chỉ đạo trực tiếp</span>
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
          <SubmitReport
            onReportAdded={(rep) => {
              handleReportAdded(rep);
              setActiveTab('dashboard');
            }}
          />
        )}

        {activeTab === 'documents' && (
          <ApiDocuments />
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div>
          <strong>WorkReport Portal</strong> &copy; 2026 — Thiết kế tối ưu cho Vercel & React SPA. Không cần cấu hình database phức tạp.
        </div>
      </footer>
    </div>
  );
}
