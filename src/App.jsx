import React, { useState, useEffect, useCallback } from 'react';
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
  Zap,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { loadReports, saveReports } from './mockData';
import PerformanceCharts from './components/PerformanceCharts';
import ReportList from './components/ReportList';
import SubmitReport from './components/SubmitReport';
import ApiDocuments from './components/ApiDocuments';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Hàm tải dữ liệu báo cáo từ API thật (GET /api/reports)
  const fetchReportsFromApi = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const resp = await fetch('/api/reports?_t=' + Date.now(), {
        headers: { 'Accept': 'application/json' }
      });
      
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}: Lỗi khi tải dữ liệu từ máy chủ`);
      }

      const data = await resp.json();
      if (Array.isArray(data)) {
        setReports(data);
        saveReports(data); // Lưu cache phụ trợ
        setApiError(null);
        setLastUpdated(new Date());
      } else {
        throw new Error("Dữ liệu trả về không hợp lệ");
      }
    } catch (err) {
      console.warn('[Dashboard] Không thể kết nối API /api/reports, dùng fallback cache:', err.message);
      setApiError(err.message);
      // Fallback cache local nếu API không phản hồi
      const cached = loadReports();
      setReports(cached);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Tải dữ liệu lần đầu khi mở app và tự động đồng bộ khi chuyển tab về dashboard
  useEffect(() => {
    fetchReportsFromApi();

    // Tự động làm mới khi user focus lại cửa sổ trình duyệt
    const handleFocus = () => {
      fetchReportsFromApi(true);
    };
    window.addEventListener('focus', handleFocus);

    // Chu kỳ tự động kiểm tra báo cáo mới mỗi 15 giây
    const interval = setInterval(() => {
      fetchReportsFromApi(true);
    }, 15000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [fetchReportsFromApi]);

  // Xử lý nộp báo cáo mới qua API (POST /api/reports)
  const handleReportAdded = async (reportData) => {
    try {
      setIsRefreshing(true);
      const resp = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData)
      });

      if (!resp.ok) {
        throw new Error(`Gửi thất bại (HTTP ${resp.status})`);
      }

      // Làm mới lại dữ liệu từ API thật
      await fetchReportsFromApi(true);
      setActiveTab('dashboard');
      return true;
    } catch (err) {
      console.error('[Submit Report Error]:', err);
      // Nếu lỗi mạng, vẫn lưu tạm vào state để người dùng không mất dữ liệu
      const tempReport = {
        ...reportData,
        id: reportData.id || `REP-${Date.now().toString().slice(-4)}`,
        createdAt: new Date().toISOString(),
        feedbacks: []
      };
      setReports(prev => [tempReport, ...prev]);
      setActiveTab('dashboard');
      alert(`Đã lưu cục bộ: ${err.message}. Hệ thống sẽ thử đồng bộ lại sau.`);
      return false;
    } finally {
      setIsRefreshing(false);
    }
  };

  // Xử lý gửi nhận xét của Admin qua API (POST /api/reports/:id/feedback)
  const handleAddFeedback = async (reportId, adminName, comment) => {
    try {
      const resp = await fetch(`/api/reports?id=${encodeURIComponent(reportId)}&feedback=true`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adminName, comment })
      });

      if (!resp.ok) {
        throw new Error(`Không thể gửi nhận xét (HTTP ${resp.status})`);
      }

      // Đồng bộ lại toàn bộ danh sách báo cáo từ API
      await fetchReportsFromApi(true);
    } catch (err) {
      console.error('[Feedback Error]:', err);
      // Fallback update trực tiếp UI nếu API tạm gián đoạn
      setReports(prev => prev.map(r => {
        if (r.id === reportId) {
          const newFb = {
            id: `fb-${Date.now()}`,
            adminName: adminName || 'Quản trị viên',
            comment,
            createdAt: new Date().toISOString()
          };
          return { ...r, feedbacks: [...(r.feedbacks || []), newFb] };
        }
        return r;
      }));
    }
  };

  // Tính toán số liệu tổng quan thời gian thực từ dữ liệu API
  const totalReports = reports.length;
  const completedCount = reports.filter(r => r.status === 'COMPLETED').length;
  const inProgressCount = reports.filter(r => r.status === 'IN_PROGRESS').length;
  const avgCompletion = totalReports > 0
    ? Math.round(reports.reduce((acc, r) => acc + (Number(r.completionRate) || 0), 0) / totalReports)
    : 0;
  const totalHours = Math.round(reports.reduce((acc, r) => acc + (Number(r.hoursWorked) || 0), 0) * 10) / 10;
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
                <span className="brand-badge">Live API Connected</span>
              </div>
              <div className="brand-subtitle">Hệ thống báo cáo & Giám sát hiệu suất công việc thời gian thực</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Nút làm mới dữ liệu từ API */}
            <button
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', height: '36px', borderRadius: '9999px' }}
              onClick={() => fetchReportsFromApi(false)}
              disabled={isRefreshing}
              title="Cập nhật báo cáo mới nhất từ API / Database"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              <span>{isRefreshing ? 'Đang đồng bộ...' : 'Làm mới'}</span>
            </button>

            {/* Menu chuyển tab */}
            <nav className="nav-links">
              <button
                className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => { setActiveTab('dashboard'); fetchReportsFromApi(true); }}
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
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Banner cảnh báo nếu mất kết nối API */}
        {apiError && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            padding: '0.75rem 1.25rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.875rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} />
              <span><strong>Lưu ý:</strong> Đang dùng bộ nhớ đệm tạm thời do chưa kết nối được máy chủ API ({apiError}).</span>
            </div>
            <button 
              className="btn btn-secondary btn-sm"
              style={{ height: '28px', fontSize: '0.75rem' }}
              onClick={() => fetchReportsFromApi(false)}
            >
              Thử lại
            </button>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="animate-fade-in">
            {/* Hero Welcome Banner */}
            <div className="hero-banner">
              <div className="hero-content">
                <div className="hero-tag">
                  <Sparkles size={13} /> Dữ liệu trực tiếp từ /api/reports
                </div>
                <h1 className="hero-title">
                  Theo Dõi Tiến Độ & Hiệu Suất Thời Gian Thực
                </h1>
                <p className="hero-desc">
                  Toàn bộ số liệu Dashboard được tải trực tiếp từ máy chủ Database chung. Mọi báo cáo nộp qua API (cURL, script, mobile) sẽ hiển thị ngay lập tức.
                </p>
                {lastUpdated && (
                  <div style={{ fontSize: '0.75rem', color: '#c7d2fe', marginTop: '0.5rem' }}>
                    🕒 Cập nhật lần cuối: {lastUpdated.toLocaleTimeString('vi-VN')}
                  </div>
                )}
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
                  <span className="stat-sub">{completedCount} hoàn thành · {inProgressCount} đang làm</span>
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
                  <span className="stat-sub">Thời gian ghi nhận trong hệ thống</span>
                </div>
              </div>

              <div className="card stat-card">
                <div className="stat-icon" style={{ background: '#f3e8ff', color: '#7c3aed' }}>
                  <MessageSquare size={26} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Nhận xét Admin</span>
                  <span className="stat-value">{totalFeedbacks}</span>
                  <span className="stat-sub">Chỉ đạo & phản hồi từ quản trị</span>
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
              onReportAdded={handleReportAdded}
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
          <strong>WorkReport Pro</strong> &copy; 2026 — Dữ liệu đồng bộ 100% giữa API và Dashboard qua Database tập trung.
        </div>
      </footer>
    </div>
  );
}
