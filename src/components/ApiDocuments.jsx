import React, { useState } from 'react';
import { BookOpen, Copy, Check, Terminal, ExternalLink } from 'lucide-react';

export default function ApiDocuments() {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const endpoints = [
    {
      method: "POST",
      path: "/api/reports",
      title: "1. Nhân viên gửi báo cáo công việc (Submit Report)",
      description: "Nhân viên dùng endpoint này để gửi báo cáo công việc hàng ngày lên hệ thống. Không cần API Key.",
      requestBody: `{
  "employeeName": "Nguyễn Văn A",
  "department": "Kỹ thuật / Backend",
  "title": "Tối ưu database và refactor module thanh toán",
  "tasksCompleted": [
    "Đánh index bổ sung bảng orders",
    "Viết 12 test case cho flow thanh toán"
  ],
  "tasksInProgress": [
    "Tích hợp cổng thanh toán VNPay"
  ],
  "blockers": "Không có",
  "planTomorrow": "Triển khai sandbox test cùng đối tác",
  "hoursWorked": 8,
  "completionRate": 90,
  "status": "COMPLETED"
}`,
      responseBody: `{
  "success": true,
  "message": "Nộp báo cáo thành công",
  "reportId": "REP-2026-9042",
  "createdAt": "2026-11-09T14:30:00.000Z"
}`,
      curl: `curl -X POST https://your-domain.vercel.app/api/reports \\
  -H "Content-Type: application/json" \\
  -d '{"employeeName":"Nguyễn Văn A","department":"Kỹ thuật","title":"Tối ưu DB","tasksCompleted":["Index DB"],"hoursWorked":8,"completionRate":90}'`
    },
    {
      method: "GET",
      path: "/api/reports",
      title: "2. Lấy danh sách tất cả báo cáo (Get All Reports)",
      description: "Lấy toàn bộ danh sách báo cáo cùng nhận xét từ quản trị viên để hiển thị trên dashboard hoặc app nội bộ.",
      requestBody: null,
      responseBody: `[
  {
    "id": "REP-2026-001",
    "employeeName": "Nguyễn Văn An",
    "department": "Kỹ thuật / Backend",
    "title": "Tối ưu hóa API và caching",
    "hoursWorked": 8,
    "completionRate": 95,
    "status": "COMPLETED",
    "feedbacks": [
      {
        "id": "fb-1",
        "adminName": "Trần Trưởng Phòng",
        "comment": "Làm rất tốt em nhé!",
        "createdAt": "2026-11-09T10:15:00.000Z"
      }
    ]
  }
]`,
      curl: `curl -X GET https://your-domain.vercel.app/api/reports`
    },
    {
      method: "GET",
      path: "/api/reports/:id",
      title: "3. Tra cứu báo cáo & Xem nhận xét của Admin (Get Report by ID)",
      description: "Nhân viên truyền `id` báo cáo của mình để kiểm tra xem Admin đã xem và có lời nhắn / nhận xét chỉ đạo nào không.",
      requestBody: null,
      responseBody: `{
  "id": "REP-2026-001",
  "employeeName": "Nguyễn Văn An",
  "title": "Tối ưu hóa API và caching",
  "feedbacks": [
    {
      "adminName": "Trần Trưởng Phòng",
      "comment": "Làm rất tốt em nhé, tốc độ xử lý API cải thiện rõ rệt!",
      "createdAt": "2026-11-09T10:15:00.000Z"
    }
  ]
}`,
      curl: `curl -X GET https://your-domain.vercel.app/api/reports/REP-2026-001`
    },
    {
      method: "POST",
      path: "/api/reports/:id/feedback",
      title: "4. Admin gửi nhận xét cho nhân viên (Admin Feedback)",
      description: "Quản trị viên để lại đánh giá, góp ý hoặc duyệt đề xuất cho từng báo cáo công việc.",
      requestBody: `{
  "adminName": "Trưởng phòng Kỹ thuật",
  "comment": "Tiến độ rất tốt, nhớ viết thêm tài liệu hướng dẫn cho đội QC test nhé!"
}`,
      responseBody: `{
  "success": true,
  "message": "Đã thêm nhận xét cho báo cáo thành công",
  "reportId": "REP-2026-001"
}`,
      curl: `curl -X POST https://your-domain.vercel.app/api/reports/REP-2026-001/feedback \\
  -H "Content-Type: application/json" \\
  -d '{"adminName":"Trần Trưởng Phòng","comment":"Duyệt nhé em!"}'`
    },
    {
      method: "POST",
      path: "/api/reports (Batch)",
      title: "5. Giao việc cho nhiều nhân viên cùng lúc (Batch Task Assignment)",
      description: "Quản lý / Trưởng phòng hoặc Bot phân công cùng một đầu việc hoặc dự án cho danh sách nhiều nhân sự cùng lúc. Hệ thống sẽ tự động tạo các bản ghi tiến độ riêng cho từng nhân viên.",
      requestBody: `{\n  "employees": [\n    { "name": "Nguyễn Văn An", "department": "Kỹ thuật / Backend" },\n    { "name": "Phạm Quốc Bảo", "department": "Kỹ thuật / Frontend" },\n    { "name": "Trần Thị Mai", "department": "Thiết kế UI/UX" }\n  ],\n  "title": "Nâng cấp giao diện Mobile & Caching API",\n  "department": "Kỹ thuật / Backend",\n  "tasksInProgress": [\n    "Thiết kế responsive layout",\n    "Cấu hình Redis cache",\n    "Kiểm thử tải hệ thống"\n  ],\n  "hoursWorked": 8,\n  "adminNote": "Ưu tiên hoàn thành trước thứ Sáu để demo cho khách hàng",\n  "adminName": "Team Lead"\n}`,
      responseBody: `{\n  "success": true,\n  "message": "Đã giao việc thành công cho 3 nhân viên",\n  "count": 3,\n  "reports": [\n    { "id": "REP-8901", "employeeName": "Nguyễn Văn An", "title": "..." },\n    { "id": "REP-8902", "employeeName": "Phạm Quốc Bảo", "title": "..." },\n    { "id": "REP-8903", "employeeName": "Trần Thị Mai", "title": "..." }\n  ]\n}`,
      curl: `curl -X POST https://your-domain.vercel.app/api/reports \\
  -H "Content-Type: application/json" \\
  -d '{"employees":[{"name":"Nguyễn Văn An"},{"name":"Phạm Quốc Bảo"}],"title":"Cập nhật hệ thống","tasksInProgress":["Review code","Deploy staging"],"adminNote":"Lưu ý kiểm tra logs"}'`
    },
    {
      method: "GET",
      path: "/api/tasks",
      title: "6. API Nhân viên nhận danh sách việc được giao (Get Assigned Tasks)",
      description: "Nhân viên hoặc Bot Telegram/Zalo/Mobile gọi endpoint này để nhận danh sách công việc đang được giao, lọc theo tên nhân viên, phòng ban hoặc trạng thái, kèm theo ghi chú và chỉ đạo từ Quản trị viên.",
      requestBody: null,
      responseBody: `{\n  "success": true,\n  "count": 2,\n  "filter": {\n    "employee": "Nguyễn Văn An",\n    "status": "IN_PROGRESS"\n  },\n  "tasks": [\n    {\n      "taskId": "REP-2026-001",\n      "employeeName": "Nguyễn Văn An",\n      "department": "Kỹ thuật / Backend",\n      "title": "Nâng cấp bảo mật OAuth2 & Caching API",\n      "status": "IN_PROGRESS",\n      "completionRate": 30,\n      "hoursWorked": 4,\n      "tasksInProgress": [\n        "Thiết lập token rotation",\n        "Tối ưu Redis TTL"\n      ],\n      "tasksCompleted": [\n        "Phân tích lỗ hổng bảo mật"\n      ],\n      "adminInstructions": [\n        {\n          "adminName": "Team Lead",\n          "instruction": "Ưu tiên hoàn thành trước thứ Sáu để demo",\n          "assignedAt": "2026-11-10T11:00:00.000Z"\n        }\n      ]\n    }\n  ]\n}`,
      curl: `curl -X GET "https://your-domain.vercel.app/api/tasks?employee=Nguyễn+Văn+An&status=IN_PROGRESS"`
    },
    {
      method: "POST",
      path: "/api/tasks",
      title: "7. API Nhân viên cập nhật tiến độ công việc được giao (Update Task Progress)",
      description: "Nhân viên cập nhật tiến độ hoàn thành (%), số giờ đã làm, tích chọn việc đã làm xong, hoặc gửi phản hồi ngược lại cho quản lý khi xử lý công việc được giao.",
      requestBody: `{\n  "taskId": "REP-2026-001",\n  "completionRate": 100,\n  "status": "COMPLETED",\n  "hoursWorked": 8,\n  "taskCompleted": "Hoàn tất kiểm thử và merge code vào main",\n  "employeeNote": "Đã triển khai xong và test đạt 100% test case"\n}`,
      responseBody: `{\n  "success": true,\n  "message": "Cập nhật tiến độ công việc thành công",\n  "taskId": "REP-2026-001"\n}`,
      curl: `curl -X POST https://your-domain.vercel.app/api/tasks \\
  -H "Content-Type: application/json" \\
  -d '{"taskId":"REP-2026-001","completionRate":100,"status":"COMPLETED","employeeNote":"Đã hoàn tất toàn bộ yêu cầu"}'`
    }
  ];

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: '#ffffff', borderColor: '#334155' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <BookOpen color="#38bdf8" size={28} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Tài Liệu Hướng Dẫn Tích Hợp API</h2>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '0.9375rem', lineHeight: '1.6' }}>
          Hệ thống cung cấp chuẩn RESTful JSON API gọn nhẹ, không yêu cầu thiết lập API Key phức tạp. Nhân viên hoặc các ứng dụng bot Telegram, Slack, Zalo OA có thể gọi trực tiếp để nộp báo cáo và nhận phản hồi tức thì.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {endpoints.map((ep, idx) => (
          <div key={idx} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{
                background: ep.method === 'POST' ? '#2563eb' : '#059669',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.75rem',
                padding: '0.25rem 0.625rem',
                borderRadius: '0.375rem'
              }}>
                {ep.method}
              </span>
              <code style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--slate-800)' }}>{ep.path}</code>
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '0.25rem' }}>
              {ep.title}
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--slate-600)', marginBottom: '1rem' }}>
              {ep.description}
            </p>

            {/* Request */}
            {ep.requestBody && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--slate-500)', marginBottom: '0.25rem' }}>
                  Request Body (JSON):
                </div>
                <pre style={{ background: 'var(--slate-900)', color: '#e2e8f0', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.8125rem', overflowX: 'auto' }}>
                  {ep.requestBody}
                </pre>
              </div>
            )}

            {/* Response */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--slate-500)', marginBottom: '0.25rem' }}>
                Response Body Mẫu:
              </div>
              <pre style={{ background: '#f8fafc', border: '1px solid var(--slate-200)', color: 'var(--slate-800)', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.8125rem', overflowX: 'auto' }}>
                {ep.responseBody}
              </pre>
            </div>

            {/* cURL */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--slate-500)' }}>
                  Lệnh cURL mẫu:
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ height: '26px', fontSize: '0.75rem', padding: '0 0.5rem' }}
                  onClick={() => copyToClipboard(ep.curl, idx)}
                >
                  {copiedIndex === idx ? (
                    <><Check size={12} color="#16a34a" /> Đã copy</>
                  ) : (
                    <><Copy size={12} /> Sao chép cURL</>
                  )}
                </button>
              </div>
              <pre style={{ background: '#0f172a', color: '#38bdf8', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.75rem', overflowX: 'auto' }}>
                {ep.curl}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
