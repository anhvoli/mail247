import React, { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  RefreshCw,
  Copy,
  Check,
  KeyRound,
  Trash2,
  ExternalLink,
  Code2,
  FileText,
  Calendar,
  Sparkles,
  Search,
  X,
  Inbox,
  ArrowRight,
  ShieldCheck,
  Dices
} from 'lucide-react';
import DOMPurify from 'dompurify';

const API_BASE = 'https://custom-mail-worker.anhvoli826.workers.dev';
const DOMAINS = ['qoder.io.vn', 'anhvoli.id.vn'];

// Trích xuất mã OTP từ text và html
function extractOtp(text = '', html = '') {
  const content = (text || '') + ' ' + (html || '');
  const patterns = [
    /(?:mã(?:\s+xác\s+thực|\s+xác\s+nhận|\s+otp)?|code|otp|verification(?:\s+code)?|security\s+code)[\s:=#\-–]+([0-9A-Za-z]{4,8})\b/i,
    /(?:nhập\s+mã|enter\s+code)[\s:=#\-–]+([0-9A-Za-z]{4,8})\b/i,
    /(?:is|là)[\s:=#\-–]+([0-9]{4,8})\b/i
  ];
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  const standalone6 = content.match(/\b\d{6}\b/);
  if (standalone6) return standalone6[0];
  const standalone = content.match(/\b\d{4,8}\b/);
  if (standalone) return standalone[0];
  return null;
}

// Trích xuất link xác nhận nếu có
function extractLink(html = '', text = '') {
  const urlPattern = /https?:\/\/[^\s"'<>]+(?:verify|confirm|activate|token|auth)[^\s"'<>]+/i;
  const mHtml = html.match(urlPattern);
  if (mHtml) return mHtml[0];
  const mText = text.match(urlPattern);
  if (mText) return mText[0];
  return null;
}

export default function App() {
  const [recentEmails, setRecentEmails] = useState(() => {
    try {
      const saved = localStorage.getItem('mail247_recents');
      return saved ? JSON.parse(saved) : ['admin@qoder.io.vn'];
    } catch {
      return ['admin@qoder.io.vn'];
    }
  });

  const [activeEmail, setActiveEmail] = useState(() => recentEmails[0] || 'admin@qoder.io.vn');
  const [inputEmail, setInputEmail] = useState('');
  const [selectedDomain, setSelectedDomain] = useState(DOMAINS[0]);

  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const [activeTab, setActiveTab] = useState('html');
  const [copiedOtp, setCopiedOtp] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Lưu lịch sử gần đây vào localStorage
  useEffect(() => {
    localStorage.setItem('mail247_recents', JSON.stringify(recentEmails));
  }, [recentEmails]);

  // Thêm một email vào danh sách theo dõi
  const openEmail = useCallback((target) => {
    let email = target.trim().toLowerCase();
    if (!email) return;
    if (!email.includes('@')) {
      email = `${email}@${selectedDomain}`;
    }
    setActiveEmail(email);
    setSelectedMessage(null);

    setRecentEmails((prev) => {
      if (!prev.includes(email)) {
        return [email, ...prev];
      }
      return prev;
    });
  }, [selectedDomain]);

  // Xóa email khỏi danh sách theo dõi
  const removeRecent = (e, email) => {
    e.stopPropagation();
    const updated = recentEmails.filter((item) => item !== email);
    setRecentEmails(updated);
    if (activeEmail === email) {
      const next = updated[0] || null;
      setActiveEmail(next);
      setSelectedMessage(null);
    }
  };

  // Tạo email ngẫu nhiên để đọc ngay
  const handleRandomize = () => {
    const prefixes = ['test', 'dev', 'order', 'vip', 'user', 'fast', 'acc'];
    const rand = `${prefixes[Math.floor(Math.random() * prefixes.length)]}_${Math.floor(1000 + Math.random() * 9000)}`;
    const full = `${rand}@${selectedDomain}`;
    openEmail(full);
  };

  // Lấy danh sách thư của email đang chọn
  const fetchMessages = useCallback(async (email) => {
    if (!email) return;
    setLoadingMessages(true);
    try {
      const res = await fetch(`${API_BASE}/api/inbox?email=${encodeURIComponent(email)}`);
      const json = await res.json();
      if (json.success) {
        setMessages(json.data || []);
      }
    } catch (err) {
      console.error('Lỗi khi tải hộp thư:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Đọc chi tiết nội dung thư
  const fetchDetail = async (id) => {
    if (!id) return;
    setLoadingDetail(true);
    try {
      const res = await fetch(`${API_BASE}/api/message/${id}`);
      const json = await res.json();
      if (json.success) {
        setSelectedMessage(json.data);
        // Đánh dấu đã đọc
        fetch(`${API_BASE}/api/message/${id}/read`, { method: 'PATCH' }).catch(() => {});
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, is_read: 1 } : m))
        );
      }
    } catch (err) {
      console.error('Lỗi khi tải chi tiết thư:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Xóa một thư
  const deleteOneMessage = async (id) => {
    if (!id || !window.confirm('Bạn có chắc chắn muốn xóa thư này?')) return;
    try {
      await fetch(`${API_BASE}/api/message/${id}`, { method: 'DELETE' });
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
    } catch (err) {
      console.error('Lỗi xóa thư:', err);
    }
  };

  // Xóa toàn bộ hòm thư
  const clearCurrentInbox = async () => {
    if (!activeEmail || messages.length === 0) return;
    if (!window.confirm(`Xóa toàn bộ thư trong hòm thư ${activeEmail}?`)) return;
    try {
      await fetch(`${API_BASE}/api/inbox?email=${encodeURIComponent(activeEmail)}`, { method: 'DELETE' });
      setMessages([]);
      setSelectedMessage(null);
    } catch (err) {
      console.error('Lỗi dọn hòm thư:', err);
    }
  };

  // Tải thư ngay khi đổi activeEmail
  useEffect(() => {
    if (activeEmail) {
      fetchMessages(activeEmail);
      setCountdown(5);
    } else {
      setMessages([]);
      setSelectedMessage(null);
    }
  }, [activeEmail, fetchMessages]);

  // Bộ đếm làm mới tự động (Auto-refresh mỗi 5s)
  useEffect(() => {
    if (!autoRefresh || !activeEmail) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchMessages(activeEmail);
          return 5;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [autoRefresh, activeEmail, fetchMessages]);

  const handleCopyOtp = (otp) => {
    if (!otp) return;
    navigator.clipboard.writeText(otp);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  const handleCopyActiveEmail = () => {
    if (!activeEmail) return;
    navigator.clipboard.writeText(activeEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const currentOtp =
    selectedMessage?.otp_code ||
    (selectedMessage ? extractOtp(selectedMessage.text_content, selectedMessage.html_content) : null);

  const verificationLink = selectedMessage
    ? extractLink(selectedMessage.html_content, selectedMessage.text_content)
    : null;

  const sanitizedHtml = selectedMessage?.html_content
    ? DOMPurify.sanitize(selectedMessage.html_content, {
        ADD_ATTR: ['target'],
        FORBID_TAGS: ['script', 'iframe']
      })
    : '';

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
    <div className="min-h-screen flex flex-col bg-slate-100 font-['Inter',sans-serif]">
      {/* TOP HEADER: NHẬP VÀ CHỌN MAIL ĐỌC NGAY */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 sticky top-0 z-20 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-lg tracking-tight">Mail247</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  Live
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Đọc hòm thư & lấy mã OTP tức thì</p>
            </div>
          </div>

          {/* Ô Nhập Email Cần Đọc */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (inputEmail.trim()) {
                openEmail(inputEmail);
                setInputEmail('');
              }
            }}
            className="flex-1 max-w-xl flex items-center gap-1.5"
          >
            <div className="relative flex-1 flex rounded-xl border border-slate-300 bg-slate-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all overflow-hidden shadow-2xs">
              <input
                type="text"
                placeholder="Nhập tiền tố hoặc email đầy đủ (ví dụ: admin hoặc user@qoder.io.vn)..."
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs md:text-sm bg-transparent outline-none font-medium text-slate-800 placeholder-slate-400"
              />
              <div className="flex items-center px-2.5 bg-slate-100/70 border-l border-slate-200">
                <span className="text-slate-400 text-xs font-bold mr-0.5">@</span>
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
                >
                  {DOMAINS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs md:text-sm font-semibold rounded-xl shadow-sm shadow-indigo-600/30 flex items-center gap-1.5 transition-all whitespace-nowrap"
            >
              <span>Đọc Thư</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleRandomize}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 rounded-xl transition-all"
              title="Sinh ngẫu nhiên một email để đọc ngay"
            >
              <Dices className="w-4 h-4 text-indigo-600" />
            </button>
          </form>
        </div>

        {/* DANH SÁCH CÁC HÒM THƯ GẦN ĐÂY (QUẢN LÝ ĐA MAIL SIÊU NHANH) */}
        {recentEmails.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pt-2.5 scrollbar-none text-xs">
            <span className="text-slate-400 text-[11px] font-semibold flex-shrink-0">
              Hòm thư đang theo dõi:
            </span>
            <div className="flex items-center gap-1.5 flex-nowrap">
              {recentEmails.map((email) => {
                const isActive = activeEmail === email;
                return (
                  <div
                    key={email}
                    onClick={() => {
                      setActiveEmail(email);
                      setSelectedMessage(null);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full cursor-pointer text-xs font-semibold transition-all flex-shrink-0 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30 ring-2 ring-indigo-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="max-w-[170px] truncate">{email}</span>
                    <button
                      type="button"
                      onClick={(e) => removeRecent(e, email)}
                      className={`p-0.5 rounded-full transition-colors ${
                        isActive ? 'hover:bg-indigo-700 text-white/80' : 'hover:bg-slate-300 text-slate-400'
                      }`}
                      title="Bỏ theo dõi email này"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* THÂN CHÍNH: 2 CỘT (DANH SÁCH THƯ VÀ NỘI DUNG CHI TIẾT) */}
      <main className="flex-1 flex overflow-hidden h-[calc(100vh-6.5rem)]">
        {/* CỘT TRÁI: HỘP THƯ ĐẾN (INBOX) */}
        <aside className="w-80 md:w-96 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 h-full select-none">
          {/* Header hộp thư */}
          <div className="p-3.5 border-b border-slate-100 bg-slate-50/70 space-y-2">
            <div className="flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                  Đang xem
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs font-bold text-slate-900 truncate max-w-[200px]" title={activeEmail}>
                    {activeEmail || 'Chưa chọn'}
                  </span>
                  {activeEmail && (
                    <button
                      type="button"
                      onClick={handleCopyActiveEmail}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                      title="Sao chép địa chỉ email này"
                    >
                      {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => fetchMessages(activeEmail)}
                  disabled={loadingMessages || !activeEmail}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-white border border-slate-200 shadow-2xs transition-all active:scale-95"
                  title="Làm mới hộp thư"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingMessages ? 'animate-spin text-indigo-600' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={clearCurrentInbox}
                  disabled={messages.length === 0}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 shadow-2xs transition-all disabled:opacity-30"
                  title="Xóa toàn bộ thư"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Auto refresh status & Tìm kiếm */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <button
                type="button"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                  autoRefresh ? 'bg-indigo-100/70 text-indigo-700' : 'bg-slate-200 text-slate-500'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? 'bg-indigo-600 animate-ping' : 'bg-slate-400'}`} />
                <span>Auto: {autoRefresh ? `${countdown}s` : 'Tắt'}</span>
              </button>
              <span className="text-[11px] font-semibold text-slate-500">{filteredMessages.length} thư</span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm người gửi, OTP..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-7 pr-3 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>

          {/* Danh sách các lá thư */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadingMessages && messages.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <RefreshCw className="w-6 h-6 mx-auto animate-spin text-indigo-500" />
                <p className="text-xs">Đang kiểm tra thư mới...</p>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Inbox className="w-8 h-8 mx-auto opacity-30 text-indigo-500" />
                <p className="text-xs font-semibold text-slate-600">Hòm thư đang trống</p>
                <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto">
                  Chưa có email nào gửi tới địa chỉ này. Thư mới sẽ tự nhảy vào đây!
                </p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isSelected = selectedMessage?.id === msg.id;
                const isUnread = !msg.is_read;
                return (
                  <div
                    key={msg.id}
                    onClick={() => fetchDetail(msg.id)}
                    className={`p-3.5 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-50/80 border-l-4 border-l-indigo-600'
                        : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isUnread && <span className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0" />}
                        <span className={`text-xs truncate ${isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                          {msg.sender_name || msg.sender}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>

                    <div className={`text-xs truncate mb-1 ${isUnread ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                      {msg.subject || '(Không có tiêu đề)'}
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p className="text-[11px] text-slate-400 truncate line-clamp-1 flex-1">
                        {msg.snippet || 'Nhấp để xem nội dung...'}
                      </p>
                      {msg.otp_code && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
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
        </aside>

        {/* CỘT PHẢI: CHI TIẾT THƯ & THẺ OTP TO RÕ */}
        <section className="flex-1 bg-white flex flex-col h-full overflow-hidden">
          {loadingDetail ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center space-y-3">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-500 font-medium">Đang tải nội dung thư...</p>
              </div>
            </div>
          ) : !selectedMessage ? (
            <div className="flex-1 bg-slate-50/50 flex flex-col items-center justify-center p-8 text-center text-slate-400 select-none">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-xs border border-slate-200/80 flex items-center justify-center mb-3">
                <Mail className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="font-semibold text-slate-700 text-sm">Chưa chọn email nào</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Bấm vào một email bên cột trái để đọc toàn bộ nội dung và lấy mã xác thực OTP.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Header Thư */}
              <div className="p-5 border-b border-slate-200 bg-white space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-lg md:text-xl font-bold text-slate-900 leading-snug">
                    {selectedMessage.subject || '(Không có tiêu đề)'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => deleteOneMessage(selectedMessage.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200"
                    title="Xóa email này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                      {(selectedMessage.sender_name || selectedMessage.sender || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 text-xs">
                        {selectedMessage.sender_name || selectedMessage.sender}
                      </div>
                      <div className="text-slate-400 font-mono text-[11px]">
                        {selectedMessage.sender} &rarr; <span className="text-indigo-600 font-semibold">{selectedMessage.recipient}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-slate-400 text-xs">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {selectedMessage.created_at
                        ? new Date(selectedMessage.created_at).toLocaleString('vi-VN')
                        : 'Vừa xong'}
                    </span>
                  </div>
                </div>

                {/* THẺ OTP BANNER NỔI BẬT */}
                {currentOtp && (
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-2 border-amber-400/70 flex items-center justify-between gap-3 animate-in fade-in">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30">
                        <KeyRound className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
                          Mã OTP Xác Thực Phát Hiện Được
                        </span>
                        <span className="font-mono text-2xl font-black text-amber-950 tracking-wider">
                          {currentOtp}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyOtp(currentOtp)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 ${
                        copiedOtp ? 'bg-emerald-600 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'
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

                {/* Link kích hoạt nếu có */}
                {verificationLink && (
                  <div className="p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-100 flex items-center justify-between gap-2 text-xs">
                    <span className="text-indigo-900 truncate font-medium">Link xác thực: {verificationLink}</span>
                    <a
                      href={verificationLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md text-xs flex items-center gap-1 flex-shrink-0"
                    >
                      <span>Mở Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* Toggle tab HTML vs Text */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('html')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
                        activeTab === 'html' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-slate-500'
                      }`}
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      <span>Xem HTML</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('text')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
                        activeTab === 'text' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-slate-500'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Văn Bản Thuần</span>
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {activeTab === 'html' ? 'Đã lọc bảo mật XSS' : 'Plain Text'}
                  </span>
                </div>
              </div>

              {/* Nội dung thư */}
              <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50">
                {activeTab === 'html' && sanitizedHtml ? (
                  <div
                    className="bg-white p-5 rounded-xl shadow-2xs border border-slate-200 max-w-3xl mx-auto prose prose-slate max-w-none text-sm"
                    dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                  />
                ) : (
                  <div className="bg-white p-5 rounded-xl shadow-2xs border border-slate-200 max-w-3xl mx-auto font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {selectedMessage.text_content || 'Không có nội dung văn bản.'}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
