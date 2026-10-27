import React, { useState } from 'react';
import {
  Terminal,
  RefreshCw,
  Mail,
  Trash2,
  KeyRound,
  Check,
  Copy,
  Code2,
  FileText
} from 'lucide-react';
import DOMPurify from 'dompurify';
import { extractOtp } from '../utils/mailHelper';

export default function TerminalViewer({
  selectedMessage,
  loadingDetail,
  onDeleteMessage
}) {
  const [activeTab, setActiveTab] = useState('html');
  const [copiedOtp, setCopiedOtp] = useState(false);

  const currentOtp =
    selectedMessage?.otp_code ||
    (selectedMessage ? extractOtp(selectedMessage.text_content, selectedMessage.html_content) : null);

  const sanitizedHtml = selectedMessage?.html_content
    ? DOMPurify.sanitize(selectedMessage.html_content, {
        ADD_ATTR: ['target'],
        FORBID_TAGS: ['script', 'iframe']
      })
    : '';

  const handleCopyOtp = (otp) => {
    if (!otp) return;
    navigator.clipboard.writeText(otp);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  return (
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
                onClick={() => onDeleteMessage(selectedMessage.id)}
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

            {/* CỤM TERMINAL OTP TO RÕ */}
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
  );
}
