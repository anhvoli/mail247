import React, { useState } from 'react';
import { useMailStore } from '../../store/useMailStore';
import { X, Dices, MailPlus, Check } from 'lucide-react';

export default function CreateAccountModal({ isOpen, onClose }) {
  const { customDomains, activeDomain, createAccount } = useMailStore();
  const [prefix, setPrefix] = useState('');
  const [selectedDomain, setSelectedDomain] = useState(activeDomain);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const currentDomain = selectedDomain || customDomains[0] || 'qoder.io.vn';
  const fullEmail = `${prefix.trim().toLowerCase() || '...' }@${currentDomain}`;

  const handleRandomize = () => {
    const randomAdjectives = ['star', 'fast', 'pro', 'lucky', 'moon', 'sky', 'code', 'order', 'dev', 'user'];
    const randAdj = randomAdjectives[Math.floor(Math.random() * randomAdjectives.length)];
    const randNum = Math.floor(1000 + Math.random() * 9000);
    setPrefix(`${randAdj}_${randNum}`);
    setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const res = createAccount(prefix, currentDomain);
    if (!res.success) {
      setErrorMsg(res.message);
      return;
    }
    setPrefix('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <MailPlus className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-800">Tạo Hòm Thư Tùy Chỉnh Mới</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Tiền tố tùy chỉnh */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Tiền Tố (Username) Tùy Chọn
              </label>
              <button
                type="button"
                onClick={handleRandomize}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 hover:underline"
              >
                <Dices className="w-3.5 h-3.5" />
                <span>Sinh Ngẫu Nhiên</span>
              </button>
            </div>

            <div className="flex rounded-xl border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all bg-white shadow-sm">
              <input
                type="text"
                placeholder="ví dụ: order.shopee01, dev_test..."
                value={prefix}
                onChange={(e) => {
                  setPrefix(e.target.value.replace(/[^a-zA-Z0-9._-]/g, ''));
                  setErrorMsg('');
                }}
                className="flex-1 px-3.5 py-2.5 text-sm outline-none font-medium text-slate-800 placeholder-slate-400"
                autoFocus
              />
              <div className="flex items-center px-3 bg-slate-50 border-l border-slate-200">
                <span className="text-slate-500 text-sm font-semibold">@</span>
                <select
                  value={currentDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer pl-1"
                >
                  {customDomains.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Chỉ dùng chữ cái không dấu, số, dấu chấm (.), gạch dưới (_) và gạch ngang (-).
            </p>
          </div>

          {/* Xem trước email */}
          <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
            <span className="text-xs font-medium text-indigo-700">Xem trước:</span>
            <span className="font-mono text-sm font-bold text-indigo-950 truncate max-w-[260px]">
              {fullEmail}
            </span>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm shadow-indigo-600/30 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Tạo Hòm Thư
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
