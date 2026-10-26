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
  Dices,
  Terminal,
  Zap,
  Radio
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
      return saved ? JSON.parse(saved) : ['yenbeo@qoder.io.vn', 'admin@qoder.io.vn'];
    } catch {
      return ['yenbeo@qoder.io.vn', 'admin@qoder.io.vn'];
    }
  });

  const [activeEmail, setActiveEmail] = useState(() => recentEmails[0] || 'yenbeo@qoder.io.vn');
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
  const [activeInboxes, setActiveInboxes] = useState([]);

  // Lưu lịch sử gần đây vào localStorage
  useEffect(() => {
    localStorage.setItem('mail247_recents', JSON.stringify(recentEmails));
  }, [recentEmails]);

  // Quét các hòm thư vừa có thư trên hệ thống
  const checkActiveInboxes = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/active-inboxes`);
      const json = await res.json();
      if (json.success && json.data?.length > 0) {
        setActiveInboxes(json.data);
        setRecentEmails((prev) => {
          const incoming = json.data.map((d) => d.email);
          return Array.from(new Set([...incoming, ...prev]));
        });
      }
    } catch (err) {
      console.error('Lỗi kiểm tra hòm thư hoạt động:', err);
    }
  }, []);

  useEffect(() => {
    checkActiveInboxes();
  }, [checkActiveInboxes]);

  // Chọn hoặc thêm một email vào danh sách theo dõi
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

  // Tạo email ngẫu nhiên
  const handleRandomize = () => {
    const prefixes = ['alpha', 'delta', 'neo', 'cyber', 'disc', 'user', 'zero'];
    const rand = `${prefixes[Math.floor(Math.random() * prefixes.length)]}_${Math.floor(1000 + Math.random() * 9000)}`;
    const full = `${rand}@${selectedDomain}`;
    openEmail(full);
  };

  // Lấy danh sách thư
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
      console.error('Lỗi tải hộp thư:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Đọc chi tiết thư
  const fetchDetail = async (id) => {
    if (!id) return;
    setLoadingDetail(true);
    try {
      const res = await fetch(`${API_BASE}/api/message/${id}`);
      const json = await res.json();
      if (json.success) {
        setSelectedMessage(json.data);
        fetch(`${API_BASE}/api/message/${id}/read`, { method: 'PATCH' }).catch(() => {});
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, is_read: 1 } : m))
        );
      }
    } catch (err) {
      console.error('Lỗi chi tiết thư:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Xóa một thư
  const deleteOneMessage = async (id) => {
    if (!id || !window.confirm('BẠN CÓ CHẮC MUỐN XÓA THƯ NÀY?')) return;
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
    if (!window.confirm(`XÓA TẤT CẢ THƯ TRONG HÒM THƯ ${activeEmail}?`)) return;
    try {
      await fetch(`${API_BASE}/api/inbox?email=${encodeURIComponent(activeEmail)}`, { method: 'DELETE' });
      setMessages([]);
      setSelectedMessage(null);
    } catch (err) {
      console.error('Lỗi dọn hòm thư:', err);
    }
  };

  useEffect(() => {
    if (activeEmail) {
      fetchMessages(activeEmail);
      setCountdown(5);
    } else {
      setMessages([]);
      setSelectedMessage(null);
    }
  }, [activeEmail, fetchMessages]);

  useEffect(() => {
    if (!autoRefresh || !activeEmail) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchMessages(activeEmail);
          checkActiveInboxes();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [autoRefresh, activeEmail, fetchMessages, checkActiveInboxes]);

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
    <div className="min-h-screen flex flex-col bg-[#b9b8f2] text-[#111111] font-tech selection:bg-[#ff8a1e] selection:text-[#111111]">
      {/* 1. HEADER CHUẨN NEO-BRUTALISM Y2K: NỀN NAVY + HOẠ TIẾT CHẤM HALFTONE */}
      <header className="dot-pattern border-b-4 border-[#111111] px-4 md:px-6 py-3.5 sticky top-0 z-30 shadow-brutal">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Logo Tag Sticker */}
          <div className="flex items-center gap-3">
            <div className="bg-[#e63b2e] text-white px-3.5 py-1 border-3 border-[#111111] shadow-brutal-sm font-heading text-xl tracking-wider uppercase transform -rotate-1">
              MAIL247 // DISC-01
            </div>
            <div className="hidden sm:block">
              <span className="text-white font-heading text-lg tracking-wide uppercase stroke-title">
                RETRO-TECH OTP CONSOLE
              </span>
            </div>
          </div>

          {/* System status stickers */}
          <div className="flex items-center gap-2">
            <div className="bg-[#ffc900] text-[#111111] px-2.5 py-1 border-2 border-[#111111] shadow-brutal-sm text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-none bg-[#33ff66] border border-[#111111] animate-ping" />
              <span>SYS: ONLINE</span>
            </div>
            <div className="bg-white text-[#111111] px-2.5 py-1 border-2 border-[#111111] shadow-brutal-sm text-xs font-bold uppercase tracking-wider hidden md:block">
              0 Đ PHÍ DUY TRÌ
            </div>
          </div>
        </div>
      </header>

      {/* 2. KHU VỰC ĐIỀU KHIỂN & COMMAND BAR */}
      <section className="max-w-7xl mx-auto w-full px-4 md:px-6 pt-5 pb-3">
        {/* Khung Command Bar */}
        <div className="bg-white border-4 border-[#111111] shadow-brutal p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#111111] pb-2">
            <div className="flex items-center gap-2">
              <span className="bg-[#0b0b2b] text-[#33ff66] px-2 py-0.5 text-xs font-mono font-bold border border-[#111111]">
                TERMINAL_INPUT:
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                NHẬP HÒM THƯ CẦN ĐỌC HOẶC TẠO MỚI
              </span>
            </div>
            <div className="text-xs font-mono text-slate-500 font-bold">
              [PROTO: CLOUDFLARE_D1]
            </div>
          </div>

          {/* Input & CTA Button */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (inputEmail.trim()) {
                openEmail(inputEmail);
                setInputEmail('');
              }
            }}
            className="flex flex-col sm:flex-row items-stretch gap-2.5"
          >
            <div className="flex-1 flex border-3 border-[#111111] bg-white overflow-hidden shadow-brutal-sm focus-within:shadow-brutal-orange transition-all">
              <div className="px-3 bg-[#0b0b2b] text-[#33ff66] flex items-center font-mono font-bold text-sm">
                $
              </div>
              <input
                type="text"
                placeholder="Nhập tên hòm thư (ví dụ: yenbeo, admin, order01)..."
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                className="flex-1 px-3.5 py-2.5 text-sm md:text-base font-bold bg-white text-[#111111] outline-none placeholder-slate-400 font-tech"
              />
              <div className="flex items-center px-3 bg-[#b9b8f2] border-l-3 border-[#111111]">
                <span className="font-heading text-lg mr-1 text-[#111111]">@</span>
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="bg-transparent text-sm font-bold text-[#111111] outline-none cursor-pointer uppercase font-tech"
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
              className="btn-brutal px-6 py-2.5 bg-[#ff8a1e] text-[#111111] font-heading text-lg tracking-wider uppercase border-3 border-[#111111] shadow-brutal flex items-center justify-center gap-2 cursor-pointer hover:bg-[#ff9933]"
            >
              <span>ĐỌC THƯ NGAY</span>
              <ArrowRight className="w-5 h-5 stroke-[3]" />
            </button>

            <button
              type="button"
              onClick={handleRandomize}
              className="btn-brutal px-4 py-2.5 bg-[#ffc900] text-[#111111] font-heading text-lg tracking-wider uppercase border-3 border-[#111111] shadow-brutal flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#ffd633]"
              title="Sinh ngẫu nhiên hòm thư mới"
            >
              <Dices className="w-5 h-5 stroke-[2.5]" />
              <span className="hidden lg:inline">RANDOM</span>
            </button>
          </form>

          {/* DẢI STICKER HÒM THƯ THEO DÕI */}
          {recentEmails.length > 0 && (
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-heading uppercase tracking-wider text-xs px-2 py-1 bg-[#0b0b2b] text-white border-2 border-[#111111]">
                DISC_LABELS:
              </span>
              {recentEmails.map((email) => {
                const isActive = activeEmail === email;
                return (
                  <div
                    key={email}
                    onClick={() => {
                      setActiveEmail(email);
                      setSelectedMessage(null);
                    }}
                    className={`btn-brutal flex items-center gap-2 px-3 py-1 border-2 border-[#111111] cursor-pointer font-bold uppercase tracking-wider text-xs transition-all ${
                      isActive
                        ? 'bg-[#ffc900] text-[#111111] shadow-brutal-sm -translate-y-0.5'
                        : 'bg-white text-slate-800 hover:bg-slate-100 shadow-2xs'
                    }`}
                  >
                    <span>{email}</span>
                    <button
                      type="button"
                      onClick={(e) => removeRecent(e, email)}
                      className="hover:text-[#e63b2e] p-0.5"
                      title="Gỡ nhãn này"
                    >
                      <X className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* BANNER BÁO CÁO HÒM THƯ VỪA NHẬN MAIL TRÊN HỆ THỐNG */}
          {activeInboxes.length > 0 && (
            <div className="p-2.5 bg-[#ffc900] border-3 border-[#111111] shadow-brutal-sm flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[#111111]">
                <Zap className="w-4 h-4 fill-[#111111]" />
                <span>PHÁT HIỆN THƯ MỚI TRÊN HỆ THỐNG:</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {activeInboxes.map((inbox) => (
                  <button
                    key={inbox.email}
                    type="button"
                    onClick={() => {
                      setActiveEmail(inbox.email);
                      setSelectedMessage(null);
                    }}
                    className={`btn-brutal px-3 py-1 border-2 border-[#111111] font-bold text-xs uppercase transition-all flex items-center gap-1.5 ${
                      activeEmail === inbox.email
                        ? 'bg-[#e63b2e] text-white shadow-brutal-sm'
                        : 'bg-white text-[#111111] hover:bg-slate-100'
                    }`}
                  >
                    <span>{inbox.email}</span>
                    <span className="px-1.5 py-0.2 bg-[#0b0b2b] text-[#33ff66] font-mono text-[10px]">
                      {inbox.count} THƯ
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. BỐ CỤC SPLIT-VIEW CHUẨN CỬA SỔ RETRO TECH: DISC-01 vs DISC-02 */}
      <main className="max-w-7xl mx-auto w-full px-4 md:px-6 pb-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* CỘT TRÁI (Lg: 5 Cột): CỬA SỔ HỘP THƯ DISC-01 */}
        <div className="lg:col-span-5 bg-white border-4 border-[#111111] shadow-brutal flex flex-col h-[650px]">
          {/* Window Title Bar */}
          <div className="bg-[#b9b8f2] border-b-4 border-[#111111] px-4 py-2.5 flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <span className="font-heading tracking-wide uppercase text-base text-[#111111]">
                DISC-01 — INBOX_STREAM
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
              <span className="w-3.5 h-3.5 rounded-none bg-[#e63b2e] border-2 border-[#111111] inline-block" />
              <span className="w-3.5 h-3.5 rounded-none bg-[#ffc900] border-2 border-[#111111] inline-block" />
              <span className="w-3.5 h-3.5 rounded-none bg-[#33ff66] border-2 border-[#111111] inline-block" />
            </div>
          </div>

          {/* Sub Toolbar */}
          <div className="p-3 border-b-3 border-[#111111] bg-slate-50 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  ACTIVE_INBOX:
                </span>
                <div className="flex items-center gap-1.5 font-bold text-sm truncate max-w-[200px]">
                  <span className="truncate">{activeEmail || 'CHƯA CHỌN'}</span>
                  {activeEmail && (
                    <button
                      type="button"
                      onClick={handleCopyActiveEmail}
                      className="p-1 hover:text-[#ff8a1e]"
                      title="Sao chép email này"
                    >
                      {copiedEmail ? <Check className="w-4 h-4 text-emerald-600 stroke-[3]" /> : <Copy className="w-4 h-4 stroke-[2.5]" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => fetchMessages(activeEmail)}
                  disabled={loadingMessages || !activeEmail}
                  className="btn-brutal p-1.5 bg-white border-2 border-[#111111] shadow-brutal-sm hover:bg-[#ffc900] cursor-pointer"
                  title="Làm mới"
                >
                  <RefreshCw className={`w-4 h-4 stroke-[2.5] ${loadingMessages ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={clearCurrentInbox}
                  disabled={messages.length === 0}
                  className="btn-brutal p-1.5 bg-[#e63b2e] text-white border-2 border-[#111111] shadow-brutal-sm hover:bg-red-700 cursor-pointer disabled:opacity-30"
                  title="Xóa toàn bộ thư"
                >
                  <Trash2 className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Auto refresh & Search */}
            <div className="flex items-center justify-between gap-2 text-xs pt-1">
              <button
                type="button"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`btn-brutal px-2.5 py-1 border-2 border-[#111111] font-bold uppercase text-[11px] flex items-center gap-1.5 cursor-pointer ${
                  autoRefresh ? 'bg-[#33ff66] text-[#111111] shadow-brutal-sm' : 'bg-slate-200 text-slate-500'
                }`}
              >
                <span className={`w-2 h-2 ${autoRefresh ? 'bg-[#111111] animate-ping' : 'bg-slate-400'}`} />
                <span>POLL: {autoRefresh ? `${countdown}S` : 'OFF'}</span>
              </button>
              <span className="font-mono font-bold text-xs bg-[#0b0b2b] text-white px-2 py-0.5 border border-[#111111]">
                {filteredMessages.length} PACKETS
              </span>
            </div>

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

          {/* Danh sách Message Cards */}
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
                  Chưa có email nào gửi tới địa chỉ này. Khi có thư mới, nó sẽ tự xuất hiện ngay tại đây!
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

        {/* CỘT PHẢI (Lg: 7 Cột): CỬA SỔ VIEWER & TERMINAL OTP DISC-02 */}
        <div className="lg:col-span-7 bg-white border-4 border-[#111111] shadow-brutal flex flex-col h-[650px]">
          {/* Window Title Bar */}
          <div className="bg-[#0b0b2b] text-white border-b-4 border-[#111111] px-4 py-2.5 flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#33ff66]" />
              <span className="font-heading tracking-wide uppercase text-base text-white">
                DISC-02 — TERMINAL_VIEWER
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
              <span className="w-3.5 h-3.5 bg-[#e63b2e] border-2 border-[#111111] inline-block" />
              <span className="w-3.5 h-3.5 bg-[#ffc900] border-2 border-[#111111] inline-block" />
              <span className="w-3.5 h-3.5 bg-[#33ff66] border-2 border-[#111111] inline-block" />
            </div>
          </div>

          {loadingDetail ? (
            <div className="flex-1 flex items-center justify-center p-8 bg-[#0b0b2b] text-[#33ff66] font-mono">
              <div className="text-center space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto stroke-[3]" />
                <p className="text-sm uppercase font-bold tracking-wider">ĐANG GIẢI MÃ NỘI DUNG MIME...</p>
              </div>
            </div>
          ) : !selectedMessage ? (
            <div className="flex-1 bg-[#0b0b2b] dot-pattern flex flex-col items-center justify-center p-8 text-center select-none text-white">
              <div className="p-4 bg-white border-4 border-[#111111] shadow-brutal mb-3 text-[#111111]">
                <Mail className="w-10 h-10 stroke-[2.5]" />
              </div>
              <h3 className="font-heading text-xl uppercase tracking-wider text-white stroke-title">
                CHƯA CHỌN GÓI THƯ NÀO
              </h3>
              <p className="text-xs text-[#33ff66] font-mono mt-1 max-w-sm">
                Bấm vào một email bên cột trái để bóc tách mã xác nhận OTP và đọc toàn bộ nội dung.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Header chi tiết */}
              <div className="p-4 border-b-3 border-[#111111] bg-white space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-heading text-xl md:text-2xl text-[#111111] leading-tight uppercase">
                    {selectedMessage.subject || '(KHÔNG CÓ TIÊU ĐỀ)'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => deleteOneMessage(selectedMessage.id)}
                    className="btn-brutal p-1.5 bg-[#e63b2e] text-white border-2 border-[#111111] shadow-brutal-sm hover:bg-red-700 cursor-pointer"
                    title="Xóa email này"
                  >
                    <Trash2 className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono font-bold bg-slate-100 p-2 border-2 border-[#111111]">
                  <div>
                    <span className="text-slate-500">TỪ: </span>
                    <span className="text-[#111111] font-bold">{selectedMessage.sender_name || selectedMessage.sender}</span>
                    <span className="text-slate-500"> &lt;{selectedMessage.sender}&gt;</span>
                  </div>
                  <div>
                    <span className="text-slate-500">ĐẾN: </span>
                    <span className="text-[#e63b2e] font-bold">{selectedMessage.recipient}</span>
                  </div>
                </div>

                {/* 4. CỤM TERMINAL OTP TO RÕ - ĐIỂM NHẤN Y2K CHÍNH */}
                {currentOtp && (
                  <div className="border-4 border-[#111111] shadow-brutal bg-[#0b0b2b] p-4 text-[#33ff66] space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between border-b-2 border-dashed border-[#33ff66]/40 pb-2">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-[#ffc900]" />
                        <span className="font-heading text-sm text-[#ffc900] tracking-wider uppercase">
                          [SECURITY_SCANNER // OTP_DETECTED]
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-[#33ff66]">EXP: 10 MINS</span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-1">
                      <div>
                        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                          VERIFICATION_CODE:
                        </div>
                        <div className="font-heading text-4xl md:text-5xl text-[#33ff66] tracking-widest drop-shadow-[0_0_10px_rgba(51,255,102,0.6)]">
                          {currentOtp}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyOtp(currentOtp)}
                        className={`btn-brutal px-6 py-3 border-3 border-[#111111] font-heading text-lg uppercase tracking-wider shadow-brutal flex items-center gap-2 cursor-pointer transition-all ${
                          copiedOtp
                            ? 'bg-[#33ff66] text-[#111111]'
                            : 'bg-[#ff8a1e] text-[#111111] hover:bg-[#ff9933]'
                        }`}
                      >
                        {copiedOtp ? (
                          <>
                            <Check className="w-5 h-5 stroke-[3]" />
                            <span>ĐÃ SAO CHÉP!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-5 h-5 stroke-[3]" />
                            <span>SAO CHÉP MÃ</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Link kích hoạt nếu có */}
                {verificationLink && (
                  <div className="p-2.5 bg-[#ffc900] border-2 border-[#111111] shadow-brutal-sm flex items-center justify-between gap-2 text-xs font-bold">
                    <span className="truncate text-[#111111]">LINK: {verificationLink}</span>
                    <a
                      href={verificationLink}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-brutal px-3 py-1 bg-[#111111] text-white border-2 border-[#111111] flex items-center gap-1 flex-shrink-0"
                    >
                      <span>MỞ LINK</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                {/* Folder Tabs chuyển chế độ xem */}
                <div className="flex items-center justify-between pt-1 border-t-2 border-[#111111] text-xs">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('html')}
                      className={`btn-brutal px-3 py-1 border-2 border-[#111111] font-heading uppercase tracking-wider text-xs cursor-pointer ${
                        activeTab === 'html' ? 'bg-[#ffc900] text-[#111111] shadow-brutal-sm' : 'bg-white text-slate-600'
                      }`}
                    >
                      XEM GIAO DIỆN HTML
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('text')}
                      className={`btn-brutal px-3 py-1 border-2 border-[#111111] font-heading uppercase tracking-wider text-xs cursor-pointer ${
                        activeTab === 'text' ? 'bg-[#ffc900] text-[#111111] shadow-brutal-sm' : 'bg-white text-slate-600'
                      }`}
                    >
                      VĂN BẢN THUẦN (PLAIN)
                    </button>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-[#b9b8f2] text-[#111111] px-2 py-0.5 border border-[#111111]">
                    {activeTab === 'html' ? 'DOMPURIFY_SANITIZED' : 'RAW_TEXT'}
                  </span>
                </div>
              </div>

              {/* Khung nội dung Body */}
              <div className="flex-1 overflow-y-auto p-4 bg-[#f1f5f9]">
                {activeTab === 'html' && sanitizedHtml ? (
                  <div
                    className="bg-white p-5 border-3 border-[#111111] shadow-brutal max-w-3xl mx-auto prose prose-slate max-w-none text-sm"
                    dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                  />
                ) : (
                  <div className="bg-[#0b0b2b] text-[#33ff66] p-4 border-3 border-[#111111] shadow-brutal max-w-3xl mx-auto font-mono text-xs whitespace-pre-wrap leading-relaxed">
                    {selectedMessage.text_content || 'KHÔNG CÓ NỘI DUNG VĂN BẢN.'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* FOOTER RETRO Y2K */}
      <footer className="bg-[#0b0b2b] border-t-4 border-[#111111] text-white py-3 px-4 text-xs font-mono">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[#33ff66]">●</span>
            <span>MAIL247 RETRO-TECH v2.0 // NEO-BRUTALISM ENGINE</span>
          </div>
          <div className="text-slate-400">
            CLOUDFLARE_EMAIL_ROUTING + D1_SQLITE
          </div>
        </div>
      </footer>
    </div>
  );
}
