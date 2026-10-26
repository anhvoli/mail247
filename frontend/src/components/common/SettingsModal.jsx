import React, { useState } from 'react';
import { useMailStore } from '../../store/useMailStore';
import { X, Globe, Server, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose }) {
  const {
    workerUrl,
    setWorkerUrl,
    customDomains,
    addCustomDomain,
    removeCustomDomain,
    isDemoMode,
    setDemoMode
  } = useMailStore();

  const [inputUrl, setInputUrl] = useState(workerUrl);
  const [newDomain, setNewDomain] = useState('');
  const [testStatus, setTestStatus] = useState(null); // null | 'testing' | 'success' | 'error'
  const [testMsg, setTestMsg] = useState('');

  if (!isOpen) return null;

  const handleSaveUrl = () => {
    setWorkerUrl(inputUrl);
  };

  const handleTestConnection = async () => {
    if (!inputUrl) {
      setTestStatus('error');
      setTestMsg('Vui lòng nhập Worker API URL');
      return;
    }
    setTestStatus('testing');
    setTestMsg('Đang kiểm tra kết nối...');
    try {
      const cleanUrl = inputUrl.trim().replace(/\/$/, '');
      const res = await fetch(`${cleanUrl}/api/health`, { signal: AbortSignal.timeout(5000) });
      const json = await res.json();
      if (json.status === 'ok') {
        setTestStatus('success');
        setTestMsg('Kết nối thành công tới Cloudflare Worker!');
        setWorkerUrl(cleanUrl);
      } else {
        setTestStatus('error');
        setTestMsg('Server phản hồi nhưng không đúng định dạng.');
      }
    } catch (err) {
      setTestStatus('error');
      setTestMsg('Không thể kết nối. Kiểm tra lại URL hoặc cấu hình CORS của Worker.');
    }
  };

  const handleAddDomain = (e) => {
    e.preventDefault();
    if (!newDomain.trim()) return;
    addCustomDomain(newDomain);
    setNewDomain('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-800">Cấu Hình Kết Nối & Tên Miền</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Chế độ hoạt động */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">Chế Độ Hoạt Động</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDemoMode(true)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isDemoMode
                    ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="font-semibold text-sm">🧪 Chế Độ Thử Nghiệm</div>
                <div className="text-xs text-slate-500 mt-1">Dùng dữ liệu giả lập, test ngay không cần setup Cloudflare</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoMode(false)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  !isDemoMode
                    ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="font-semibold text-sm">🌐 Cloudflare Live API</div>
                <div className="text-xs text-slate-500 mt-1">Nhận thư thật 100% qua Cloudflare Email Routing & D1</div>
              </button>
            </div>
          </div>

          {/* Cloudflare Worker URL */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1">
              Cloudflare Worker URL
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Đường dẫn API sau khi bạn chạy lệnh <code>npx wrangler deploy</code>
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://custom-mail-worker.xxx.workers.dev"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                className="px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors whitespace-nowrap"
              >
                Kiểm tra
              </button>
              <button
                type="button"
                onClick={handleSaveUrl}
                className="px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                Lưu
              </button>
            </div>

            {testStatus && (
              <div
                className={`mt-2 p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  testStatus === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : testStatus === 'error'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-indigo-50 text-indigo-700'
                }`}
              >
                {testStatus === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                {testStatus === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />}
                <span>{testMsg}</span>
              </div>
            )}
          </div>

          {/* Quản lý danh sách tên miền riêng */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1">
              Danh Sách Tên Miền Riêng (Custom Domains)
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Các tên miền bạn đã bật Cloudflare Email Routing để tạo email tùy chỉnh
            </p>

            <form onSubmit={handleAddDomain} className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">@</span>
                <input
                  type="text"
                  placeholder="domain-cua-ban.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1 transition-colors"
              >
                <Plus className="w-4 h-4" /> Thêm
              </button>
            </form>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {customDomains.map((domain) => (
                <div
                  key={domain}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm"
                >
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <Globe className="w-4 h-4 text-indigo-500" />
                    <span>@{domain}</span>
                  </div>
                  {customDomains.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCustomDomain(domain)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="Xóa domain này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
