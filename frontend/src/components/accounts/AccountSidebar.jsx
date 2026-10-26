import React, { useState } from 'react';
import { useMailStore } from '../../store/useMailStore';
import { Plus, Mail, Copy, Check, Trash2, Search, Inbox, ShieldCheck } from 'lucide-react';

export default function AccountSidebar({ onOpenCreateModal }) {
  const {
    accounts,
    activeEmail,
    setActiveEmail,
    removeAccount,
    mockEmailsMap,
    isDemoMode,
    messages
  } = useMailStore();

  const [copiedEmail, setCopiedEmail] = useState(null);
  const [filterText, setFilterText] = useState('');

  const handleCopy = (e, email) => {
    e.stopPropagation();
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleRemove = (e, email) => {
    e.stopPropagation();
    if (window.confirm(`Bạn có chắc chắn muốn xóa hòm thư ${email}?`)) {
      removeAccount(email);
    }
  };

  // Tính số lượng thư chưa đọc của từng tài khoản
  const getUnreadCount = (email) => {
    if (isDemoMode) {
      const list = mockEmailsMap[email] || [];
      return list.filter((m) => !m.is_read).length;
    }
    if (email === activeEmail) {
      return messages.filter((m) => !m.is_read).length;
    }
    return 0;
  };

  const filteredAccounts = accounts.filter((a) =>
    a.email.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col h-[calc(100vh-4rem)] select-none">
      {/* Top Action */}
      <div className="p-4 border-b border-slate-100 space-y-3">
        <button
          type="button"
          onClick={onOpenCreateModal}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-sm font-semibold rounded-xl shadow-sm shadow-indigo-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Email Mới</span>
        </button>

        {/* Tìm kiếm email nếu có từ 4 tài khoản trở lên */}
        {accounts.length >= 3 && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Lọc hòm thư..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            />
          </div>
        )}
      </div>

      {/* Account List Header */}
      <div className="px-4 py-2 flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
        <span>Hòm Thư Của Bạn ({accounts.length})</span>
      </div>

      {/* Account Items */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {filteredAccounts.length === 0 ? (
          <div className="p-6 text-center text-slate-400">
            <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-medium">Chưa có hòm thư nào.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Bấm nút phía trên để tạo ngay!</p>
          </div>
        ) : (
          filteredAccounts.map((account) => {
            const isActive = activeEmail === account.email;
            const unread = getUnreadCount(account.email);
            const isJustCopied = copiedEmail === account.email;

            return (
              <div
                key={account.id || account.email}
                onClick={() => setActiveEmail(account.email)}
                className={`group relative flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-950 font-semibold shadow-sm ring-1 ring-indigo-200'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                        : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'
                    }`}
                  >
                    {account.prefix ? account.prefix[0].toUpperCase() : '@'}
                  </div>

                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate max-w-[145px]" title={account.email}>
                      {account.email}
                    </div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      @{account.domain}
                    </div>
                  </div>
                </div>

                {/* Badges & Actions */}
                <div className="flex items-center gap-1">
                  {unread > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white min-w-[18px] text-center shadow-sm shadow-rose-500/30">
                      {unread}
                    </span>
                  )}

                  {/* Copy button */}
                  <button
                    type="button"
                    onClick={(e) => handleCopy(e, account.email)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isJustCopied
                        ? 'text-emerald-600 bg-emerald-50'
                        : 'text-slate-400 hover:text-indigo-600 hover:bg-white/80'
                    }`}
                    title="Sao chép địa chỉ email"
                  >
                    {isJustCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  {/* Delete button (Chỉ hiện khi hover hoặc có từ 2 mail) */}
                  {accounts.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => handleRemove(e, account.email)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                      title="Xóa hòm thư này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1 text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
          <span>Lưu trữ trình duyệt</span>
        </div>
        <span className="font-semibold text-slate-600">{accounts.length} hòm thư</span>
      </div>
    </aside>
  );
}
