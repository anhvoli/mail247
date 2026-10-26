import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SAMPLE_SERVICES } from '../utils/mockData';
import { extractOtpCode } from '../utils/otpExtractor';

export const useMailStore = create(
  persist(
    (set, get) => ({
      // Danh sách các email đã tạo: [{ id, email, prefix, domain, createdAt }]
      accounts: [],
      activeEmail: null,
      messages: [],
      selectedMessage: null,
      isLoadingMessages: false,
      isLoadingDetail: false,

      // Cấu hình kết nối
      isDemoMode: false, // Tự động kết nối Live API Cloudflare đã deploy
      workerUrl: 'https://custom-mail-worker.anhvoli826.workers.dev', // URL của Cloudflare Worker đã deploy
      customDomains: ['qoder.io.vn', 'anhvoli.id.vn'],
      activeDomain: 'qoder.io.vn',

      // Cấu hình làm mới tự động
      autoRefresh: true,
      refreshInterval: 5, // giây

      // Kho thư giả lập cho chế độ Demo Mode: { [email]: [...] }
      mockEmailsMap: {},

      // --- ACTIONS ---

      setDemoMode: (val) => set({ isDemoMode: val }),

      setWorkerUrl: (url) => set({ workerUrl: url.trim().replace(/\/$/, '') }),

      setActiveDomain: (domain) => set({ activeDomain: domain }),

      addCustomDomain: (domain) => {
        const clean = domain.trim().toLowerCase().replace(/^@/, '');
        if (clean && !get().customDomains.includes(clean)) {
          set((state) => ({
            customDomains: [...state.customDomains, clean],
            activeDomain: clean
          }));
        }
      },

      removeCustomDomain: (domain) => {
        set((state) => ({
          customDomains: state.customDomains.filter((d) => d !== domain),
          activeDomain: state.activeDomain === domain ? state.customDomains[0] || '' : state.activeDomain
        }));
      },

      setAutoRefresh: (val) => set({ autoRefresh: val }),

      setRefreshInterval: (interval) => set({ refreshInterval: interval }),

      setActiveEmail: (email) => {
        set({ activeEmail: email, selectedMessage: null });
        get().fetchMessages(email);
      },

      // Tạo email mới
      createAccount: (customPrefix, targetDomain) => {
        const domain = targetDomain || get().activeDomain || 'qoder.io.vn';
        const prefix = (customPrefix || '').trim().toLowerCase() || `user_${Math.random().toString(36).substring(2, 8)}`;
        const email = `${prefix}@${domain}`;

        // Kiểm tra trùng
        if (get().accounts.some((acc) => acc.email === email)) {
          get().setActiveEmail(email);
          return { success: false, message: 'Email này đã tồn tại trong danh sách!' };
        }

        const newAccount = {
          id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
          email,
          prefix,
          domain,
          createdAt: new Date().toISOString()
        };

        set((state) => ({
          accounts: [newAccount, ...state.accounts],
          activeEmail: email,
          selectedMessage: null
        }));

        // Nếu ở Demo Mode, tự động tạo 1 email chào mừng
        if (get().isDemoMode) {
          get().sendSimulatedEmail(email, {
            sender: 'welcome@mailkk.online',
            senderName: 'Hệ Thống MailKK',
            subject: 'Chào mừng bạn! Hòm thư tùy chỉnh đã sẵn sàng',
            text: `Hòm thư ${email} của bạn đã được khởi tạo thành công. Mã test của bạn là: 888999`,
            html: `
              <div style="font-family: sans-serif; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <h3 style="color: #4f46e5;">Khởi tạo hòm thư thành công!</h3>
                <p>Địa chỉ <strong>${email}</strong> của bạn đã sẵn sàng nhận email.</p>
                <div style="background: #eef2ff; padding: 12px; font-size: 22px; font-weight: bold; color: #4338ca; text-align: center; border-radius: 6px;">
                  888999
                </div>
                <p style="color: #64748b; font-size: 13px;">Bấm nút "Gửi Email Mẫu" trên thanh công cụ để thử nghiệm nhận thêm các email OTP khác!</p>
              </div>
            `,
            otp: '888999'
          });
        } else {
          get().fetchMessages(email);
        }

        return { success: true, email };
      },

      // Xóa email
      removeAccount: (email) => {
        set((state) => {
          const newAccounts = state.accounts.filter((a) => a.email !== email);
          const nextActive = state.activeEmail === email ? (newAccounts[0]?.email || null) : state.activeEmail;
          return {
            accounts: newAccounts,
            activeEmail: nextActive,
            selectedMessage: state.activeEmail === email ? null : state.selectedMessage
          };
        });

        const currentActive = get().activeEmail;
        if (currentActive) {
          get().fetchMessages(currentActive);
        } else {
          set({ messages: [] });
        }
      },

      // Lấy danh sách thư của email đang chọn
      fetchMessages: async (targetEmail) => {
        const email = targetEmail || get().activeEmail;
        if (!email) return;

        set({ isLoadingMessages: true });

        // Chế độ DEMO
        if (get().isDemoMode) {
          const mockList = get().mockEmailsMap[email] || [];
          set({ messages: mockList, isLoadingMessages: false });
          return;
        }

        // Chế độ LIVE CLOUDFLARE WORKER
        const workerUrl = get().workerUrl;
        if (!workerUrl) {
          set({ isLoadingMessages: false });
          return;
        }

        try {
          const res = await fetch(`${workerUrl}/api/inbox?email=${encodeURIComponent(email)}`);
          const json = await res.json();
          if (json.success) {
            set({ messages: json.data || [], isLoadingMessages: false });
          } else {
            console.error('Fetch inbox error:', json.message);
            set({ isLoadingMessages: false });
          }
        } catch (err) {
          console.error('Failed to connect to Cloudflare Worker:', err);
          set({ isLoadingMessages: false });
        }
      },

      // Đọc chi tiết thư
      fetchMessageDetail: async (id) => {
        if (!id) return;
        set({ isLoadingDetail: true });

        // Chế độ DEMO
        if (get().isDemoMode) {
          const currentEmail = get().activeEmail;
          const list = get().mockEmailsMap[currentEmail] || [];
          const found = list.find((m) => m.id === id);
          if (found) {
            // Đánh dấu đã đọc
            const updated = list.map((m) => (m.id === id ? { ...m, is_read: 1 } : m));
            set((state) => ({
              selectedMessage: { ...found, is_read: 1 },
              messages: updated,
              mockEmailsMap: { ...state.mockEmailsMap, [currentEmail]: updated },
              isLoadingDetail: false
            }));
          } else {
            set({ isLoadingDetail: false });
          }
          return;
        }

        // Chế độ LIVE CLOUDFLARE
        const workerUrl = get().workerUrl;
        if (!workerUrl) return;

        try {
          const res = await fetch(`${workerUrl}/api/message/${id}`);
          const json = await res.json();
          if (json.success) {
            set({ selectedMessage: json.data, isLoadingDetail: false });
            // Đánh dấu đã đọc trên server
            fetch(`${workerUrl}/api/message/${id}/read`, { method: 'PATCH' }).catch(() => {});
            // Cập nhật state local
            set((state) => ({
              messages: state.messages.map((m) => (m.id === id ? { ...m, is_read: 1 } : m))
            }));
          } else {
            set({ isLoadingDetail: false });
          }
        } catch (err) {
          console.error('Error fetching message detail:', err);
          set({ isLoadingDetail: false });
        }
      },

      // Xóa 1 thư
      deleteMessage: async (id) => {
        const activeEmail = get().activeEmail;
        if (get().isDemoMode) {
          const list = get().mockEmailsMap[activeEmail] || [];
          const updated = list.filter((m) => m.id !== id);
          set((state) => ({
            messages: updated,
            selectedMessage: state.selectedMessage?.id === id ? null : state.selectedMessage,
            mockEmailsMap: { ...state.mockEmailsMap, [activeEmail]: updated }
          }));
          return;
        }

        const workerUrl = get().workerUrl;
        if (!workerUrl) return;

        try {
          await fetch(`${workerUrl}/api/message/${id}`, { method: 'DELETE' });
          set((state) => ({
            messages: state.messages.filter((m) => m.id !== id),
            selectedMessage: state.selectedMessage?.id === id ? null : state.selectedMessage
          }));
        } catch (err) {
          console.error('Failed to delete message:', err);
        }
      },

      // Xóa toàn bộ hòm thư
      clearInbox: async (email) => {
        const target = email || get().activeEmail;
        if (!target) return;

        if (get().isDemoMode) {
          set((state) => ({
            messages: [],
            selectedMessage: null,
            mockEmailsMap: { ...state.mockEmailsMap, [target]: [] }
          }));
          return;
        }

        const workerUrl = get().workerUrl;
        if (!workerUrl) return;

        try {
          await fetch(`${workerUrl}/api/inbox?email=${encodeURIComponent(target)}`, { method: 'DELETE' });
          set({ messages: [], selectedMessage: null });
        } catch (err) {
          console.error('Failed to clear inbox:', err);
        }
      },

      // Giả lập gửi 1 email mới tới hòm thư (Dành cho test nhanh)
      sendSimulatedEmail: (targetEmail, customData) => {
        const email = targetEmail || get().activeEmail;
        if (!email) return;

        const randomService = SAMPLE_SERVICES[Math.floor(Math.random() * SAMPLE_SERVICES.length)];
        const data = customData || randomService;

        const newMsg = {
          id: `demo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          recipient: email,
          sender: data.sender,
          sender_name: data.senderName,
          subject: data.subject,
          snippet: data.text ? data.text.substring(0, 120) : '',
          text_content: data.text,
          html_content: data.html,
          otp_code: data.otp || extractOtpCode(data.text, data.html),
          created_at: new Date().toISOString(),
          is_read: 0
        };

        set((state) => {
          const currentList = state.mockEmailsMap[email] || [];
          const updatedList = [newMsg, ...currentList];
          return {
            mockEmailsMap: { ...state.mockEmailsMap, [email]: updatedList },
            messages: state.activeEmail === email ? updatedList : state.messages
          };
        });
      }
    }),
    {
      name: 'mailkk_storage_live',
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...persistedState,
        workerUrl: persistedState?.workerUrl || 'https://custom-mail-worker.anhvoli826.workers.dev',
        customDomains: persistedState?.customDomains?.length ? persistedState.customDomains : ['qoder.io.vn', 'anhvoli.id.vn'],
        activeDomain: persistedState?.activeDomain || 'qoder.io.vn',
        isDemoMode: persistedState?.isDemoMode !== undefined ? persistedState.isDemoMode : false
      }),
      partialize: (state) => ({
        accounts: state.accounts,
        activeEmail: state.activeEmail,
        isDemoMode: state.isDemoMode,
        workerUrl: state.workerUrl,
        customDomains: state.customDomains,
        activeDomain: state.activeDomain,
        mockEmailsMap: state.mockEmailsMap,
        autoRefresh: state.autoRefresh,
        refreshInterval: state.refreshInterval
      })
    }
  )
);
