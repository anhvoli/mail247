import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import EmailControlBar from './components/EmailControlBar';
import InboxStream from './components/InboxStream';
import TerminalViewer from './components/TerminalViewer';
import Footer from './components/Footer';
import { API_BASE, DOMAINS, DEFAULT_EMAIL, STORAGE_KEY } from './constants/config';

export default function App() {
  // Quản lý trạng thái Email duy nhất đang theo dõi
  const [activeEmail, setActiveEmail] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_EMAIL;
  });

  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown] = useState(5);

  // Lưu email hiện tại vào localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, activeEmail);
  }, [activeEmail]);

  // Đổi sang một email khác
  const handleSwitchEmail = useCallback((targetEmail) => {
    setActiveEmail(targetEmail);
    setSelectedMessage(null);
  }, []);

  // Tạo email ngẫu nhiên duy nhất
  const handleRandomize = useCallback(() => {
    const prefixes = ['alpha', 'delta', 'neo', 'cyber', 'user', 'acc', 'fast'];
    const rand = `${prefixes[Math.floor(Math.random() * prefixes.length)]}_${Math.floor(1000 + Math.random() * 9000)}`;
    const full = `${rand}@${DOMAINS[0]}`;
    handleSwitchEmail(full);
  }, [handleSwitchEmail]);

  // Lấy danh sách thư từ Cloudflare Worker API
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
      console.error('Lỗi tải danh sách thư:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Đọc chi tiết thư theo ID
  const fetchDetail = useCallback(async (id) => {
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
  }, []);

  // Xóa một bức thư
  const handleDeleteMessage = useCallback(async (id) => {
    if (!id || !window.confirm('BẠN CÓ CHẮC MUỐN XÓA THƯ NÀY?')) return;
    try {
      await fetch(`${API_BASE}/api/message/${id}`, { method: 'DELETE' });
      setMessages((prev) => prev.filter((m) => m.id !== id));
      setSelectedMessage((current) => (current?.id === id ? null : current));
    } catch (err) {
      console.error('Lỗi xóa thư:', err);
    }
  }, []);

  // Xóa toàn bộ thư trong hòm thư hiện tại
  const handleClearInbox = useCallback(async () => {
    if (!activeEmail || messages.length === 0) return;
    if (!window.confirm(`XÓA TẤT CẢ THƯ TRONG HÒM THƯ ${activeEmail}?`)) return;
    try {
      await fetch(`${API_BASE}/api/inbox?email=${encodeURIComponent(activeEmail)}`, { method: 'DELETE' });
      setMessages([]);
      setSelectedMessage(null);
    } catch (err) {
      console.error('Lỗi dọn hòm thư:', err);
    }
  }, [activeEmail, messages.length]);

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

  return (
    <div className="min-h-screen flex flex-col bg-[#b9b8f2] text-[#111111] font-tech selection:bg-[#ff8a1e] selection:text-[#111111]">
      {/* 1. Header trên cùng */}
      <Header />

      {/* 2. Thanh điều khiển Email (Thẻ hiện tại & Đổi email) */}
      <EmailControlBar
        activeEmail={activeEmail}
        onSwitchEmail={handleSwitchEmail}
        onRandomize={handleRandomize}
        domains={DOMAINS}
      />

      {/* 3. Bố cục 2 Cửa sổ Retro Tech: DISC-01 vs DISC-02 */}
      <main className="max-w-7xl mx-auto w-full px-4 md:px-6 pb-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Cửa sổ DISC-01: Hộp thư đến */}
        <InboxStream
          activeEmail={activeEmail}
          messages={messages}
          selectedMessage={selectedMessage}
          loadingMessages={loadingMessages}
          autoRefresh={autoRefresh}
          countdown={countdown}
          onRefresh={() => fetchMessages(activeEmail)}
          onClearInbox={handleClearInbox}
          onToggleAutoRefresh={() => setAutoRefresh(!autoRefresh)}
          onSelectMessage={fetchDetail}
        />

        {/* Cửa sổ DISC-02: Chi tiết thư & Màn hình Terminal OTP */}
        <TerminalViewer
          selectedMessage={selectedMessage}
          loadingDetail={loadingDetail}
          onDeleteMessage={handleDeleteMessage}
        />
      </main>

      {/* 4. Footer */}
      <Footer />
    </div>
  );
}
