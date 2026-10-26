import React, { useState, useEffect } from 'react';
import { useMailStore } from '../../store/useMailStore';
import { RefreshCw, Trash2, Search, Mail, ShieldAlert, KeyRound, Copy, Check } from 'lucide-react';

export default function MessageList() {
  const {
    activeEmail,
    messages,
    selectedMessage,
    fetchMessageDetail,
    fetchMessages,
    isLoadingMessages,
    clearInbox,
    autoRefresh,
    setAutoRefresh,
    refreshInterval
  } = useMailStore();

  const [copiedActive, setCopiedActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [countdown, setCountdown] = useState(refreshInterval);

  // Lấy thư ngay khi đổi activeEmail hoặc vừa mở trang
  useEffect(() => {
    if (activeEmail) {
      fetchMessages(activeEmail);
      setCountdown(refreshInterval);
    }
  }, [activeEmail, fetchMessages, refreshInterval]);

  // Bộ đếm ngược và tự động làm mới theo chu kỳ
  useEffect(() => {
    if (!autoRefresh || !activeEmail) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchMessages(activeEmail);
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefresh, activeEmail, refreshInterval, fetchMessages]);

  const handleManualRefresh = () => {
    if (activeEmail) {
      fetchMessages(activeEmail);
      setCountdown(refreshInterval);
    }
  };

  const handleCopyEmail = () => {
    if (!activeEmail) return;
    navigator.clipboard.writeText(activeEmail);
    setCopiedActive(true);
    setTimeout(() => setCopiedActive(false), 2000);
  };

  const handleClearInbox = () => {
    if (messages.length === 0) return;
    if (window.confirm('Bạn có chắc muốn xóa tất cả email trong hòm thư này?')) {
      clearInbox(activeEmail);
    }
  };

  if (!activeEmail) {
    return (
      <div className="w-80 md:w-96 bg-white border-r border-slate-200 flex flex-col items-center justify-center p-6 text-center text-slate-400">
        <Mail className="w-12 h-12 mb-3 opacity-30 text-indigo-500" />
        <h3 className="font-semibold text-slate-600 text-sm">Chưa chọn hòm thư</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
          Hãy chọn một hòm thư bên trái hoặc tạo mới để xem hộp thư đến.
        </p>
      </div>
    );
  }

  const filteredMessages = messages.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      (m.sender_name && m.sender_name.toLowerCase().includes(q)) ||
      (m.sender && m.sender.toLowerCase().includes(q)) ||
      (m.subject && m.subject.toLowerCase().includes(q)) ||
      (m.otp_code && m.otp_code.toLowerCase().includes(q))
    );
  });

  return (
    <div className="w-80 md:w-96 bg-white border-r border-slate-200 flex flex-col h-[calc(100vh-4rem)] select-none">
      {/* Header Hòm Thư Đang Xem */}
      <div className="p-3.5 border-b border-slate-100 bg-slate-50/70 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
              Đang xem hòm thư
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-bold text-slate-900 truncate max-w-[200px]" title={activeEmail}>
                {activeEmail}
              </span>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                title="Sao chép địa chỉ email này"
              >
                {copiedActive ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isLoadingMessages}
              className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-white border border-slate-200 shadow-2xs transition-all active:scale-95"
              title="Làm mới ngay lập tức"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMessages ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleClearInbox}
              disabled={messages.length === 0}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 shadow-2xs transition-all disabled:opacity-40"
              title="Xóa toàn bộ thư"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Auto-refresh switch & search */}
        <div className="flex items-center justify-between text-xs pt-1">
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
              autoRefresh
                ? 'bg-indigo-100/70 text-indigo-700'
                : 'bg-slate-200/60 text-slate-500'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? 'bg-indigo-600 animate-ping' : 'bg-slate-400'}`} />
            <span>Tự động nhận: {autoRefresh ? `${countdown}s` : 'Tắt'}</span>
          </button>

          <span className="text-[11px] font-semibold text-slate-500">
            {filteredMessages.length} thư
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo người gửi, OTP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
          />
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {isLoadingMessages && messages.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 mx-auto animate-spin text-indigo-500" />
            <p className="text-xs">Đang kiểm tra thư mới...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <Mail className="w-8 h-8 mx-auto opacity-30" />
            <p className="text-xs font-semibold text-slate-500">Hòm thư đang trống</p>
            <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto">
              Chưa có email nào được gửi tới địa chỉ này.
            </p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isSelected = selectedMessage?.id === msg.id;
            const isUnread = !msg.is_read;

            return (
              <div
                key={msg.id}
                onClick={() => fetchMessageDetail(msg.id)}
                className={`p-3.5 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-indigo-50/80 border-l-4 border-l-indigo-600'
                    : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0" />
                    )}
                    <span
                      className={`text-xs truncate ${
                        isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-700'
                      }`}
                    >
                      {msg.sender_name || msg.sender}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>

                <div
                  className={`text-xs truncate mb-1 ${
                    isUnread ? 'font-semibold text-slate-800' : 'text-slate-600'
                  }`}
                >
                  {msg.subject || '(Không có tiêu đề)'}
                </div>

                {/* Đoạn trích & Badge OTP nổi bật */}
                <div className="flex items-center justify-between gap-2 mt-1">
                  <p className="text-[11px] text-slate-400 truncate line-clamp-1 flex-1">
                    {msg.snippet || 'Nhấp để xem nội dung...'}
                  </p>

                  {msg.otp_code && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs whitespace-nowrap">
                      <KeyRound className="w-2.5 h-2.5" />
                      OTP: {msg.otp_code}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
