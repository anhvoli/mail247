import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function PerformanceCharts({ reports }) {
  // 1. Tỷ lệ hoàn thành theo nhân viên
  const completionData = useMemo(() => {
    const labels = reports.map(r => r.employeeName);
    const rates = reports.map(r => r.completionRate || 0);

    return {
      labels,
      datasets: [
        {
          label: 'Tỷ lệ hoàn thành (%)',
          data: rates,
          backgroundColor: rates.map(rate => 
            rate >= 90 ? 'rgba(16, 185, 129, 0.85)' : 
            rate >= 70 ? 'rgba(59, 130, 246, 0.85)' : 'rgba(239, 68, 68, 0.85)'
          ),
          borderColor: rates.map(rate => 
            rate >= 90 ? '#059669' : 
            rate >= 70 ? '#2563eb' : '#dc2626'
          ),
          borderWidth: 1.5,
          borderRadius: 6
        }
      ]
    };
  }, [reports]);

  // 2. Phân bổ trạng thái công việc
  const statusData = useMemo(() => {
    let completed = 0;
    let inProgress = 0;
    let blocked = 0;

    reports.forEach(r => {
      if (r.status === 'COMPLETED') completed++;
      else if (r.status === 'IN_PROGRESS') inProgress++;
      else if (r.status === 'BLOCKED') blocked++;
      else completed++;
    });

    return {
      labels: ['Hoàn thành (Completed)', 'Đang xử lý (In Progress)', 'Vướng mắc (Blocked)'],
      datasets: [
        {
          data: [completed, inProgress, blocked],
          backgroundColor: [
            'rgba(16, 185, 129, 0.85)',
            'rgba(245, 158, 11, 0.85)',
            'rgba(239, 68, 68, 0.85)'
          ],
          borderColor: ['#ffffff', '#ffffff', '#ffffff'],
          borderWidth: 2
        }
      ]
    };
  }, [reports]);

  // 3. Giờ làm việc theo nhân viên
  const hoursData = useMemo(() => {
    const labels = reports.map(r => r.employeeName);
    const hours = reports.map(r => r.hoursWorked || 0);

    return {
      labels,
      datasets: [
        {
          label: 'Số giờ làm việc (h)',
          data: hours,
          backgroundColor: 'rgba(99, 102, 241, 0.85)',
          borderColor: '#4f46e5',
          borderWidth: 1.5,
          borderRadius: 6
        }
      ]
    };
  }, [reports]);

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 10,
        cornerRadius: 6
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: '#f1f5f9'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  const hoursOptions = {
    ...barOptions,
    scales: {
      y: {
        beginAtZero: true,
        max: 12,
        grid: {
          color: '#f1f5f9'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 11
          }
        }
      }
    }
  };

  return (
    <div className="charts-grid">
      {/* Chart 1 */}
      <div className="card chart-card">
        <div className="chart-header">
          <h3 className="chart-title">Hiệu Suất Hoàn Thành Công Việc</h3>
          <p className="chart-desc">Đánh giá tiến độ công việc theo từng nhân sự (%)</p>
        </div>
        <div className="chart-wrapper">
          <Bar data={completionData} options={barOptions} />
        </div>
      </div>

      {/* Chart 2 */}
      <div className="card chart-card">
        <div className="chart-header">
          <h3 className="chart-title">Phân Bổ Trạng Thái Công Việc</h3>
          <p className="chart-desc">Tỷ lệ các đầu việc hoàn tất vs đang xử lý vs tắc nghẽn</p>
        </div>
        <div className="chart-wrapper">
          <Doughnut data={statusData} options={pieOptions} />
        </div>
      </div>

      {/* Chart 3 */}
      <div className="card chart-card">
        <div className="chart-header">
          <h3 className="chart-title">Tổng Giờ Làm Việc Ghi Nhận</h3>
          <p className="chart-desc">Số giờ cống hiến thực tế trong ca làm việc (tiêu chuẩn 8h)</p>
        </div>
        <div className="chart-wrapper">
          <Bar data={hoursData} options={hoursOptions} />
        </div>
      </div>
    </div>
  );
}
