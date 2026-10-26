import React, { useState, useEffect } from 'react';
import { useMailStore } from './store/useMailStore';
import Header from './components/common/Header';
import SettingsModal from './components/common/SettingsModal';
import CreateAccountModal from './components/accounts/CreateAccountModal';
import AccountSidebar from './components/accounts/AccountSidebar';
import MessageList from './components/inbox/MessageList';
import MessageDetail from './components/reader/MessageDetail';

export default function App() {
  const { accounts, createAccount, activeEmail } = useMailStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Khởi tạo một hòm thư mặc định nếu người dùng mới mở lần đầu
  useEffect(() => {
    if (accounts.length === 0) {
      createAccount('admin', 'qoder.io.vn');
    }
  }, [accounts.length, createAccount]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 font-['Inter',sans-serif]">
      {/* Top Navigation */}
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Main 3-Column Split View */}
      <main className="flex-1 flex overflow-hidden">
        {/* Cột 1: Quản lý danh sách Hòm Thư */}
        <AccountSidebar onOpenCreateModal={() => setIsCreateOpen(true)} />

        {/* Cột 2: Hộp thư đến (Inbox) */}
        <MessageList />

        {/* Cột 3: Chi tiết Email & OTP Banner */}
        <MessageDetail />
      </main>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <CreateAccountModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}
