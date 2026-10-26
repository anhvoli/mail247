import React, { useState } from 'react';
import { useMailStore } from '../../store/useMailStore';
import { Trash2, KeyRound, Copy, Check, Mail, Code2, FileText, ExternalLink, Calendar, User } from 'lucide-react';
import DOMPurify from 'dompurify';
import { extractOtpCode, extractVerificationLink } from '../../utils/otpExtractor';

export default function MessageDetail() {
  const { selectedMessage, deleteMessage, isLoadingDetail } = useMailStore();
  const [activeTab, setActiveTab] = useState('html'); // 'html' | 'text'
  const [copiedOtp, setCopiedOtp] = useState(false);

  if (isLoadingDetail) {
    return (
      <div className="flex-1 bg-slate-50 flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Đang tải nội dung email...</p>
        </div>
      </div>
    );
  }

  if (!selectedMessage) {
    return (
      <div className="flex-1 bg-slate-50/50 flex flex-col items-center justify-center p-8 text-center text-slate-400 select-none">
        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-200/80 flex items-center justify-center mb-4">
          <Mail className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="font-semibold text-slate-700 text-base">Chưa chọn thư nào</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Chọn một email từ danh sách ở cột giữa để đọc toàn bộ nội dung và lấy mã xác nhận OTP.
        </p>
      </div>
    );
  }

  // Lấy hoặc tự động bóc tách lại mã OTP nếu chưa có
  const otpCode =
    selectedMessage.otp_code ||
    extractOtpCode(selectedMessage.text_content, selectedMessage.html_content);

  const verificationLink = extractVerificationLink(
    selectedMessage.html_content,
    selectedMessage.text_content
  );

  const handleCopyOtp = () => {
    if (!otpCode) return;
    navigator.clipboard.writeText(otpCode);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  const handleDelete = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa email này?')) {
      deleteMessage(selectedMessage.id);
    }
  };

  // Làm sạch mã HTML để ngăn chặn tấn công XSS
  const sanitizedHtml = selectedMessage.html_content
    ? DOMPurify.sanitize(selectedMessage.html_content, {
        ADD_ATTR: ['target'],
        FORBID_TAGS: ['script', 'iframe']
      })
    : '';

  return (
    <div className="flex-1 bg-white flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Header Email */}
      <div className="p-6 border-b border-slate-200 bg-white space-y-4">
        {/* Tiêu đề & Nút Xóa */}
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-900 leading-snug">
            {selectedMessage.subject || '(Không có tiêu đề)'}
          </h2>
          <button
            type="button"
            onClick={handleDelete}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200"
            title="Xóa email này"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Thông tin người gửi & thời gian */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm shadow-2xs">
              {(selectedMessage.sender_name || selectedMessage.sender || '?')[0].toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-slate-800 text-sm">
                {selectedMessage.sender_name || selectedMessage.sender}
              </div>
              <div className="text-slate-400 font-mono text-[11px]">
                {selectedMessage.sender} &rarr; <span className="text-indigo-600 font-semibold">{selectedMessage.recipient}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {selectedMessage.created_at
                ? new Date(selectedMessage.created_at).toLocaleString('vi-VN', {
                    dateStyle: 'medium',
                    timeStyle: 'medium'
                  })
                : 'Vừa xong'}
            </span>
          </div>
        </div>

        {/* THẺ OTP NỔI BẬT (HIGHLIGHT BANNER) */}
        {otpCode && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-2 border-amber-400/60 shadow-sm flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 block">
                  Mã Xác Thực (OTP Code) Phát Hiện Được
                </span>
                <span className="font-mono text-2xl font-black text-amber-950 tracking-wider">
                  {otpCode}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyOtp}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 ${
                copiedOtp
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                  : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30'
              }`}
            >
              {copiedOtp ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Đã Sao Chép!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Sao Chép Mã</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Liên kết xác nhận nếu có */}
        {verificationLink && (
          <div className="p-3 rounded-lg bg-indigo-50/60 border border-indigo-100 flex items-center justify-between gap-2 text-xs">
            <div className="truncate min-w-0">
              <span className="font-semibold text-indigo-900 block">Liên kết xác thực tài khoản:</span>
              <span className="text-indigo-600 truncate block text-[11px]">{verificationLink}</span>
            </div>
            <a
              href={verificationLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs transition-colors flex-shrink-0"
            >
              <span>Mở Link</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* View mode toggle (HTML vs Text) */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('html')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'html'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Giao Diện HTML</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'text'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Văn Bản Thuần (Text)</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-400">
            {activeTab === 'html' ? 'Đã lọc bảo mật XSS' : 'Plain Text'}
          </span>
        </div>
      </div>

      {/* Nội dung thư (Body) */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
        {activeTab === 'html' && sanitizedHtml ? (
          <div
            className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 max-w-3xl mx-auto prose prose-slate max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />
        ) : (
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 max-w-3xl mx-auto font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
            {selectedMessage.text_content || 'Không có nội dung văn bản.'}
          </div>
        )}
      </div>
    </div>
  );
}
