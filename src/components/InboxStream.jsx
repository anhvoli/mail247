import React, { useState } from 'react';
import { RefreshCw, Trash2, Search, Inbox } from 'lucide-react';

export default function InboxStream({
  activeEmail,
  messages = [],
  selectedMessage,
  loadingMessages,
  autoRefresh,
  countdown,
  onRefresh,
  onClearInbox,
  onToggleAutoRefresh,
  onSelectMessage
}) {
  const [searchFilter, setSearchFilter] = useState('');

  const filteredMessages = messages.filter((m) => {
    const q = searchFilter.toLowerCase();
    return (
      (m.sender_name && m.sender_name.toLowerCase().includes(q)) ||
      (m.sender && m.sender.toLowerCase().includes(q)) ||
      (m.subject && m.subject.toLowerCase().includes(q)) ||
      (m.otp_code && m.otp_code.toLowerCase().includes(q))
    );
  });

  return (
    <div className="lg:col-span-5 bg-white border-4 border-[#111111] shadow-brutal flex flex-col h-[650px]">
      {/* Window Title Bar */}
      <div className="bg-[#b9b8f2] border-b-4 border-[#111111] px-4 py-2.5 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <span className="font-heading tracking-wide uppercase text-base text-[#111111]">
            DISC-01 — INBOX_STREAM
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
          <span className="w-3.5 h-3.5 bg-[#e63b2e] border-2 border-[#111111] inline-block" />
          <span className="w-3.5 h-3.5 bg-[#ffc900] border-2 border-[#111111] inline-block" />
          <span className="w-3.5 h-3.5 bg-[#33ff66] border-2 border-[#111111] inline-block" />
        </div>
      </div>

      {/* Sub Toolbar */}
      <div className="p-3 border-b-3 border-[#111111] bg-slate-50 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onRefresh}
              disabled={loadingMessages || !activeEmail}
              className="btn-brutal px-3 py-1 bg-white border-2 border-[#111111] shadow-brutal-sm font-heading text-xs tracking-wider uppercase hover:bg-[#ffc900] cursor-pointer flex items-center gap-1.5"
              title="Làm mới hộp thư"
            >
              <RefreshCw className={`w-3.5 h-3.5 stroke-[2.5] ${loadingMessages ? 'animate-spin' : ''}`} />
              <span>LÀM MỚI</span>
            </button>

            <button
              type="button"
              onClick={onClearInbox}
              disabled={messages.length === 0}
              className="btn-brutal px-2.5 py-1 bg-[#e63b2e] text-white border-2 border-[#111111] shadow-brutal-sm font-heading text-xs uppercase hover:bg-red-700 cursor-pointer disabled:opacity-30 flex items-center gap-1"
              title="Xóa toàn bộ thư"
            >
              <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>DỌN SẠCH</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={onToggleAutoRefresh}
              className={`btn-brutal px-2 py-1 border-2 border-[#111111] font-bold uppercase text-[10px] flex items-center gap-1.5 cursor-pointer ${
                autoRefresh ? 'bg-[#33ff66] text-[#111111] shadow-brutal-sm' : 'bg-slate-200 text-slate-500'
              }`}
            >
              <span className={`w-2 h-2 ${autoRefresh ? 'bg-[#111111] animate-ping' : 'bg-slate-400'}`} />
              <span>AUTO: {autoRefresh ? `${countdown}S` : 'OFF'}</span>
            </button>

            <span className="font-mono font-bold text-xs bg-[#0b0b2b] text-white px-2 py-0.5 border border-[#111111]">
              {filteredMessages.length} THƯ
            </span>
          </div>
        </div>

        {/* Tìm kiếm */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Lọc thư, tìm mã OTP..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs font-bold bg-white border-2 border-[#111111] shadow-2xs outline-none font-tech"
          />
        </div>
      </div>

      {/* Danh sách các lá thư */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#f8fafc]">
        {loadingMessages && messages.length === 0 ? (
          <div className="p-8 text-center font-bold text-xs uppercase space-y-2 text-slate-600">
            <RefreshCw className="w-7 h-7 mx-auto animate-spin stroke-[2.5]" />
            <p>ĐANG ĐỌC TỪ CLOUDFLARE D1...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-[#111111] bg-white space-y-2">
            <Inbox className="w-10 h-10 mx-auto opacity-40 stroke-[2]" />
            <p className="font-heading text-base uppercase text-[#111111]">HÒM THƯ TRỐNG</p>
            <p className="text-xs text-slate-500 font-bold max-w-xs mx-auto">
              Chưa có email nào gửi tới {activeEmail}. Khi có thư mới, nó sẽ tự xuất hiện ngay tại đây!
            </p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isSelected = selectedMessage?.id === msg.id;
            const isUnread = !msg.is_read;
            return (
              <div
                key={msg.id}
                onClick={() => onSelectMessage(msg.id)}
                className={`btn-brutal p-3 border-3 border-[#111111] cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#ffc900] shadow-brutal translate-x-1'
                    : isUnread
                    ? 'bg-white shadow-brutal hover:bg-amber-50'
                    : 'bg-white shadow-brutal-sm hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {isUnread && (
                      <span className="w-2.5 h-2.5 bg-[#e63b2e] border border-[#111111] flex-shrink-0" />
                    )}
                    <span className="text-xs font-bold uppercase truncate max-w-[190px]">
                      {msg.sender_name || msg.sender}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>

                <div className="text-xs font-bold truncate mb-1 text-slate-900">
                  {msg.subject || '(KHÔNG CÓ TIÊU ĐỀ)'}
                </div>

                <div className="flex items-center justify-between gap-2 mt-2">
                  <p className="text-[11px] text-slate-600 truncate line-clamp-1 font-medium flex-1">
                    {msg.snippet || 'Nhấp để xem nội dung...'}
                  </p>
                  {msg.otp_code && (
                    <span className="px-2 py-0.5 bg-[#ff8a1e] text-[#111111] border-2 border-[#111111] font-mono text-[11px] font-extrabold shadow-2xs whitespace-nowrap">
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
