import React from 'react';
import { Mail, Settings, Sparkles, Radio, Check } from 'lucide-react';
import { useMailStore } from '../../store/useMailStore';

export default function Header({ onOpenSettings }) {
  const {
    isDemoMode,
    activeEmail,
    sendSimulatedEmail,
    customDomains,
    activeDomain,
    setActiveDomain
  } = useMailStore();

  const handleSimulate = () => {
    if (!activeEmail) {
      alert('Vui lòng tạo hoặc chọn một email trước khi gửi thử!');
      return;
    }
    sendSimulatedEmail(activeEmail);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between select-none sticky top-0 z-20 shadow-sm">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
          <Mail className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-slate-900 text-lg tracking-tight">MailKK</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-indigo-100 text-indigo-700">
              Multi-Inbox
            </span>
          </div>
          <p className="text-xs text-slate-500">Quản lý & Đọc nhiều email tùy chỉnh thời gian thực</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {/* Domain Selector */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
          <span className="text-slate-500">Tên miền:</span>
          <select
            value={activeDomain}
            onChange={(e) => setActiveDomain(e.target.value)}
            className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
          >
            {customDomains.map((d) => (
              <option key={d} value={d}>
                @{d}
              </option>
            ))}
          </select>
        </div>

        {/* Status Indicator */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
            isDemoMode
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}
        >
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>{isDemoMode ? 'Chế độ Demo' : 'Cloudflare Live'}</span>
        </div>

        {/* Nút giả lập nhận email mới (chỉ hiện khi ở Demo mode) */}
        {isDemoMode && (
          <button
            type="button"
            onClick={handleSimulate}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg text-xs font-semibold shadow-sm shadow-orange-500/20 transition-all active:scale-95"
            title="Tạo giả lập 1 email gửi mã OTP vào hòm thư đang chọn"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gửi Thư Mẫu (OTP)</span>
          </button>
        )}

        {/* Settings button */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
          title="Cấu hình kết nối & Tên miền"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
